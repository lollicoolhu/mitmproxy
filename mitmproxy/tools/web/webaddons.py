from __future__ import annotations

import hmac
import json
import logging
import re
import secrets
import webbrowser
from collections.abc import Sequence
from dataclasses import asdict, dataclass, field
from typing import TYPE_CHECKING
from urllib.parse import parse_qsl

import argon2

from mitmproxy import ctx
from mitmproxy import exceptions
from mitmproxy import http
from mitmproxy.tools.web.web_columns import AVAILABLE_WEB_COLUMNS

if TYPE_CHECKING:
    from mitmproxy.tools.web.master import WebMaster

logger = logging.getLogger(__name__)


@dataclass
class MatchCriterion:
    key: str  # 或 JSON 路径
    operator: str  # eq, neq, contains, exists
    value: str
    logic: str = "and"  # and, or


@dataclass
class InterceptRule:
    id: str
    method: str
    path: str
    response_code: int
    response_content: str
    enabled: bool
    query: list[dict] = field(default_factory=list)
    cookies: list[dict] = field(default_factory=list)
    headers: list[dict] = field(default_factory=list)
    body: list[dict] = field(default_factory=list)
    response_headers: list[dict] = field(default_factory=list)
    # 新增参考信息，用于展示原始请求，包含 headers, body, query, path 等
    reference_info: dict = field(default_factory=dict)


class InterceptConfig:
    rules: dict[str, InterceptRule]

    def __init__(self):
        self.rules = {}

    def request(self, flow: http.HTTPFlow):
        for rule in self.rules.values():
            if not rule.enabled:
                continue

            # 1. 基础匹配 (Method & Path)
            if rule.method != "ANY" and flow.request.method != rule.method:
                continue
            if flow.request.path.split("?")[0] != rule.path:
                continue

            # 2. Query 匹配
            if not self._match_criteria(rule.query, flow.request.query):
                continue

            # 3. Cookie 匹配
            if not self._match_criteria(rule.cookies, flow.request.cookies):
                continue

            # 4. Header 匹配
            if not self._match_criteria(rule.headers, flow.request.headers, case_sensitive=False):
                continue

            # 5. Body 匹配 (JSON)
            if rule.body:
                try:
                    body_json = json.loads(flow.request.content or b"{}")
                    if not self._match_body_criteria(rule.body, body_json):
                        continue
                except (json.JSONDecodeError, Exception):
                    continue

            # 匹配成功，构造响应
            headers = []
            for h in rule.response_headers:
                k = h.get('key', '')
                v = h.get('value', '')
                if k:
                    headers.append((
                        k.encode("utf-8") if isinstance(k, str) else k,
                        v.encode("utf-8") if isinstance(v, str) else v
                    ))

            flow.response = http.Response.make(
                rule.response_code,
                rule.response_content.encode("utf-8"),
                headers
            )
            flow.metadata["is_mocked"] = True
            break

    def _match_criteria(self, criteria: list[dict], data_map, case_sensitive=True) -> bool:
        if not criteria:
            return True

        # 处理大小写敏感性（针对 Header）
        if not case_sensitive:
            normalized_map = {k.lower(): v for k, v in data_map.items()}
        else:
            normalized_map = data_map

        result = True  # 初始值为 True，因为第一个通常是 AND
        for i, c in enumerate(criteria):
            key = c['key'].lower() if not case_sensitive else c['key']
            op = c['operator']
            val = c['value']
            logic = c.get('logic', 'and')

            current_match = False
            if op == "exists":
                current_match = key in normalized_map
            elif key in normalized_map:
                actual_val = normalized_map[key]
                if op == "eq":
                    current_match = actual_val == val
                elif op == "neq":
                    current_match = actual_val != val
                elif op == "contains":
                    current_match = val in actual_val

            if i == 0:
                result = current_match
            else:
                if logic == "or":
                    result = result or current_match
                else:
                    result = result and current_match
        return result

    def _match_body_criteria(self, criteria: list[dict], body_json) -> bool:
        result = True
        for i, c in enumerate(criteria):
            path = c['key']
            op = c['operator']
            expected_val = c['value']
            logic = c.get('logic', 'and')

            actual_values = self._get_json_path(body_json, path)
            current_match = False

            if op == "exists":
                current_match = len(actual_values) > 0 and actual_values[0] is not None
            else:
                for actual in actual_values:
                    # 类型转换比较
                    str_actual = str(actual)
                    if op == "eq":
                        if str_actual == expected_val:
                            current_match = True
                            break
                        # 尝试数字比较
                        try:
                            if float(actual) == float(expected_val):
                                current_match = True
                                break
                        except (ValueError, TypeError):
                            pass
                    elif op == "contains":
                        if expected_val in str_actual:
                            current_match = True
                            break

            if i == 0:
                result = current_match
            else:
                if logic == "or":
                    result = result or current_match
                else:
                    result = result and current_match
        return result

    def _get_json_path(self, data, path: str) -> list:
        # 极简版 JSON Path 解析: 支持 a.b, a[0], a[*].b
        parts = re.split(r'\.|(\[\d+\])|(\[\*\])', path)
        parts = [p for p in parts if p and p != '.']

        current_level = [data]
        for part in parts:
            next_level = []
            for item in current_level:
                if part == '[*]':
                    if isinstance(item, list):
                        next_level.extend(item)
                elif part.startswith('[') and part.endswith(']'):
                    idx = int(part[1:-1])
                    if isinstance(item, list) and idx < len(item):
                        next_level.append(item[idx])
                elif isinstance(item, dict) and part in item:
                    next_level.append(item[part])
            current_level = next_level
            if not current_level:
                break
        return current_level

    def find_duplicate(self, rule: InterceptRule) -> InterceptRule | None:
        for r in self.rules.values():
            if r.id != rule.id and r.method == rule.method and r.path == rule.path and r.query == rule.query:
                return r
        return None


class WebAuth:
    _password: str
    _hasher: argon2.PasswordHasher

    def __init__(self):
        self._password = secrets.token_hex(16)
        self._hasher = argon2.PasswordHasher()

    def load(self, loader):
        loader.add_option(
            "web_password",
            str,
            "",
            "Password to protect the mitmweb user interface. "
            "Values starting with `$` are interpreted as an argon2 hash, "
            "everything else is considered a plaintext password. "
            "If no password is provided, a random token is generated on startup."
            "For automated calls, you can pass the password as token query parameter"
            "or as `Authorization: Bearer ...` header.",
        )

    def configure(self, updated) -> None:
        if "web_password" in updated:
            if ctx.options.web_password.startswith("$"):
                try:
                    argon2.extract_parameters(ctx.options.web_password)
                except argon2.exceptions.InvalidHashError:
                    raise exceptions.OptionsError(
                        "`web_password` starts with `$`, but it's not a valid argon2 hash."
                    )
            elif ctx.options.web_password:
                logger.warning(
                    "Using a plaintext password to protect the mitmweb user interface. "
                    "Consider using an argon2 hash for `web_password`  instead."
                )
            self._password = ctx.options.web_password or secrets.token_hex(16)

    @property
    def web_url(self) -> str:
        if ctx.options.web_password:
            auth = ""  # We don't want to print plaintext passwords (and it doesn't work for argon2 anyhow).
        else:
            auth = f"?token={self._password}"
        web_host = ctx.options.web_host
        if ":" in web_host:  # ipv6
            web_host = f"[{web_host}]"
        # noinspection HttpUrlsUsage
        return f"http://{web_host}:{ctx.options.web_port}/{auth}"

    @staticmethod
    def auth_cookie_name() -> str:
        return f"mitmproxy-auth-{ctx.options.web_port}"

    def is_valid_password(self, password: str) -> bool:
        if self._password.startswith("$"):
            try:
                return self._hasher.verify(self._password, password)
            except argon2.exceptions.VerificationError:
                return False
        else:
            return hmac.compare_digest(
                self._password,
                password,
            )


class WebAddon:
    def load(self, loader):
        loader.add_option("web_open_browser", bool, True, "Start a browser.")
        loader.add_option("web_debug", bool, False, "Enable mitmweb debugging.")
        loader.add_option("web_port", int, 8081, "Web UI port.")
        loader.add_option("web_host", str, "127.0.0.1", "Web UI host.")
        loader.add_option(
            "web_columns",
            Sequence[str],
            ["tls", "icon", "path", "method", "status", "size", "time"],
            f"Columns to show in the flow list. Can be one of the following: {', '.join(AVAILABLE_WEB_COLUMNS)}",
        )

    def running(self):
        if hasattr(ctx.options, "web_open_browser") and ctx.options.web_open_browser:
            master: WebMaster = ctx.master  # type: ignore
            success = open_browser(master.web_url)
            if not success:
                logger.info(
                    f"No web browser found. Please open a browser and point it to {master.web_url}",
                )
            if not success and not ctx.options.web_password:
                logger.info(
                    f"You can configure a fixed authentication token by setting the `web_password` option "
                    f"(https://docs.mitmproxy.org/stable/concepts-options/#web_password).",
                )


def open_browser(url: str) -> bool:
    """
    Open a URL in a browser window.
    In contrast to webbrowser.open, we limit the list of suitable browsers.
    This gracefully degrades to a no-op on headless servers, where webbrowser.open
    would otherwise open lynx.

    Returns:
        True, if a browser has been opened
        False, if no suitable browser has been found.
    """
    browsers = (
        "windows-default",
        "macosx",
        "wslview %s",
        "gio",
        "x-www-browser",
        "gnome-open %s",
        "xdg-open",
        "google-chrome",
        "chrome",
        "chromium",
        "chromium-browser",
        "firefox",
        "opera",
        "safari",
    )
    for browser in browsers:
        try:
            b = webbrowser.get(browser)
        except webbrowser.Error:
            pass
        else:
            if b.open(url):
                return True
    return False
