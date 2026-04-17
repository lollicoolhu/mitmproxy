# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## Project Overview

mitmproxy is an interactive, SSL/TLS-capable intercepting proxy for HTTP/1, HTTP/2, and WebSockets. It provides three tools:
- `mitmproxy`: Interactive console interface
- `mitmdump`: Command-line version (like tcpdump for HTTP)
- `mitmweb`: Web-based interface

## Development Environment

This project uses `uv` for dependency management. Always use `uv run` to execute commands.

### Common Commands

```bash
# Setup and run
uv run mitmproxy --version        # Verify installation
uv run mitmdump --version         # Check mitmdump
uv run mitmweb --version          # Check mitmweb

# Testing
uv run pytest                     # Run all tests
uv run pytest <file>              # Run specific test file
uv run pytest -k <name>           # Run tests matching pattern
uv run pytest --cov <module>      # Run with coverage

# Full test suite (lint + mypy + pytest)
uv run tox                        # Run all checks
uv run tox -e lint                # Run ruff linting only
uv run tox -e mypy                # Run mypy type checking only
uv run tox -e fix                 # Auto-fix lint/format issues

# When adding new source files, also run:
uv run tox -e individual_coverage -- FILENAME
```

### Code Quality

```bash
uv run tox -e lint                # Check code style
uv run tox -e mypy                # Type checking
uv run tox -e fix                 # Auto-fix issues
```

## Architecture

### Core Components

- **`mitmproxy/`**: Main source code
  - `flow.py`: Central `Flow` and `HTTPFlow` data structures representing HTTP request/response pairs
  - `http.py`: HTTP message handling (requests, responses, headers)
  - `master.py`: `Master` class - orchestrates the main event loop and addon management
  - `options.py` / `optmanager.py`: Configuration options system
  - `addons/`: Built-in addons (intercept, modifyheaders, proxyauth, etc.)
  - `proxy/`: Proxy server implementation with protocol layers
  - `tools/`: Three tool implementations (console, dump, web)
  - `net/`: Low-level networking (HTTP parsing, TLS, DNS)
  - `contentviews/`: Message body parsing/formatting (JSON, XML, images, etc.)

### Addon System

Most functionality is implemented as addons. Addons hook into the proxy event lifecycle:
- `configure`: Addon configuration
- `running`: Proxy is running
- `request`: Intercept/modify incoming requests
- `response`: Intercept/modify outgoing responses
- `error`: Handle connection errors
- `done`: Cleanup on shutdown

See `mitmproxy/addons/` and `examples/addons/` for patterns.

### Protocol Layers

The proxy uses a layered architecture in `mitmproxy/proxy/layers/`:
- HTTP/1, HTTP/2, HTTP/3 handling
- TLS interception
- TCP and UDP proxying
- WebSocket support

### Entry Points

Defined in `pyproject.toml`:
- `mitmproxy` -> `mitmproxy.tools.main:mitmproxy`
- `mitmdump` -> `mitmproxy.tools.main:mitmdump`
- `mitmweb` -> `mitmproxy.tools.main:mitmweb`

## Key Implementation Notes

- **Asyncio**: The project is built on asyncio. Always use `mitmproxy.utils.asyncio_utils.create_task` instead of `asyncio.create_task` to avoid GC footgun.
- **Type hints**: The project uses mypy for static type checking. All new code should be properly typed.
- **Testing**: 100% test coverage is enforced for some parts of the codebase. New code must include tests.
- **Python version**: Requires Python 3.12+

## Web UI

The web UI frontend is in `/web` and uses Vite/React/TypeScript. This is separate from the Python backend.
