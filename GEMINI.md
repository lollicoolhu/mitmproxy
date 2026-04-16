# Gemini CLI Context: mitmproxy

`mitmproxy` is a world-class interactive, SSL/TLS-capable intercepting HTTP/S proxy. It provides a suite of tools for inspecting, modifying, and replaying web traffic.

## Project Overview

- **Core Tools:**
  - `mitmproxy`: An interactive console interface for inspecting and modifying HTTP/S traffic.
  - `mitmdump`: A command-line version of mitmproxy, similar to `tcpdump` but for HTTP.
  - `mitmweb`: A web-based interface for mitmproxy.
- **Technologies:**
  - **Language:** Python 3.12+ (CPython).
  - **Networking:** `aioquic` (QUIC/HTTP3), `h2` (HTTP/2), `h11` (HTTP/1.1), `wsproto` (WebSockets), `tornado` (networking/web).
  - **Cryptography:** `cryptography`, `pyOpenSSL`.
  - **UI:** `urwid` (console UI), React/TypeScript (web UI).
  - **Dependency Management:** `uv`.
  - **Testing & Quality:** `pytest`, `tox`, `ruff`, `mypy`.

## Getting Started

### Installation & Environment Setup

This project uses `uv` for dependency management. It automatically manages virtual environments.

```bash
# Install dependencies and run mitmproxy version check
uv run mitmproxy --version

# Explicitly activate the virtual environment (optional)
source .venv/bin/activate  # macOS/Linux
.venv\Scripts\activate     # Windows
```

### Running the Tools

```bash
# Run the interactive console
uv run mitmproxy

# Run the command-line version
uv run mitmdump

# Run the web-based interface
uv run mitmweb
```

## Development & Contribution

### Building

The project uses `setuptools` as the build backend, but most development tasks are orchestrated through `uv` and `tox`.

- **Web UI:** The web UI (located in `/web`) is built using `vite` and `package.json` scripts.
- **Documentation:** Built with `hugo`. See `docs/README.md` for local preview instructions.

### Testing

Testing is a core part of the project. The target is 100% code coverage.

```bash
# Run the full test suite (lint, mypy, pytest)
uv run tox

# Run only pytest
uv run pytest

# Run specific tests with coverage
uv run pytest test/mitmproxy/addons/test_anticache.py --cov mitmproxy.addons.anticache
```

### Linting & Type Checking

```bash
# Run ruff for linting and formatting checks
uv run tox -e lint

# Run mypy for static type checking
uv run tox -e mypy

# Auto-fix linting and formatting issues
uv run tox -e fix
```

## Architectural Guidelines

- **Asynchronous Programming:** `mitmproxy` is built on `asyncio`. Use `mitmproxy.utils.asyncio_utils.create_task` instead of `asyncio.create_task` to avoid garbage collection issues.
- **Addons:** Most functionality is implemented as "addons." See `mitmproxy/addons/` and `examples/addons/` for patterns.
- **Layers:** The proxy logic is organized into protocol layers (HTTP, TLS, TCP, etc.) in `mitmproxy/proxy/layers/`.
- **Flows:** The central data structure is a `Flow` (e.g., `HTTPFlow`), which encapsulates a request and response.

## Key Directories

- `mitmproxy/`: Core source code.
- `test/`: Comprehensive test suite.
- `examples/`: Addon and script examples.
- `docs/`: Documentation sources (`hugo`).
- `web/`: Frontend source for `mitmweb`.
- `release/`: Scripts and configurations for building releases and installers.
