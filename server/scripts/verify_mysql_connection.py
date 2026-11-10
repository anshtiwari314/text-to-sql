#!/usr/bin/env python3
"""
Check MySQL reachability the same way QueryAI does (TCP → pymysql → SQLAlchemy schema).

Usage (from server/ with venv):
  .venv/bin/python scripts/verify_mysql_connection.py \\
    --lan-host 192.168.1.42 --lan-port 5246 \\
    --ngrok-host 0.tcp.in.ngrok.io --ngrok-port 24026

Env fallbacks: MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, MYSQL_LAN_HOST, MYSQL_LAN_PORT,
NGROK_HOST, NGROK_PORT.
"""
from __future__ import annotations

import argparse
import os
import socket
import sys

# server root on sys.path when run from repo
_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)


def log(msg: str) -> None:
    print(f"[verify_mysql] {msg}", flush=True)


def tcp_check(label: str, host: str, port: int, timeout: float) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            log(f"{label} TCP OK {host}:{port}")
            return True
    except OSError as err:
        log(f"{label} TCP FAIL {host}:{port} — {err}")
        return False


def mysql_ping(label: str, host: str, port: int, user: str, password: str, database: str) -> bool:
    import pymysql

    try:
        conn = pymysql.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
            connect_timeout=15,
        )
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
            cur.execute("SHOW TABLES")
            n = len(cur.fetchall())
        conn.close()
        log(f"{label} MySQL login OK ({n} tables in {database!r})")
        return True
    except Exception as err:
        log(f"{label} MySQL login FAIL — {type(err).__name__}: {err}")
        return False


def flask_schema(label: str, host: str, port: int, user: str, password: str, database: str) -> bool:
    from core.engines import get_credentials
    from services.db_service import fetch_schema

    raw = {
        "engine": "MySQL",
        "host": host,
        "port": port,
        "db_name": database,
        "db_username": user,
        "db_password": password,
    }
    try:
        conn = get_credentials({"credentials": raw})
        text = fetch_schema(conn)
        log(f"{label} fetch_schema OK ({len(text)} chars)")
        return True
    except Exception as err:
        log(f"{label} fetch_schema FAIL — {err}")
        return False


def run_endpoint(
    label: str,
    host: str | None,
    port: int | None,
    user: str,
    password: str,
    database: str,
    timeout: float,
    skip_schema: bool,
) -> bool:
    if not host or not port:
        log(f"{label} skipped (no host/port)")
        return True

    ok = tcp_check(label, host, port, timeout)
    if not ok:
        return False
    ok = mysql_ping(label, host, port, user, password, database)
    if not ok:
        return False
    if skip_schema:
        return True
    return flask_schema(label, host, port, user, password, database)


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify MySQL LAN and/or ngrok tunnel for QueryAI")
    parser.add_argument("--user", default=os.getenv("MYSQL_USER", "root"))
    parser.add_argument("--password", default=os.getenv("MYSQL_PASSWORD", ""))
    parser.add_argument("--database", default=os.getenv("MYSQL_DATABASE", "first_db"))
    parser.add_argument("--lan-host", default=os.getenv("MYSQL_LAN_HOST", "192.168.1.42"))
    parser.add_argument("--lan-port", type=int, default=int(os.getenv("MYSQL_LAN_PORT", "5246")))
    parser.add_argument("--ngrok-host", default=os.getenv("NGROK_HOST"))
    parser.add_argument("--ngrok-port", type=int, default=int(os.getenv("NGROK_PORT", "0")))
    parser.add_argument("--timeout", type=float, default=12.0)
    parser.add_argument("--skip-schema", action="store_true")
    parser.add_argument("--ngrok-only", action="store_true")
    args = parser.parse_args()

    if not args.password:
        log("Set --password or MYSQL_PASSWORD")
        return 2

    ngrok_port = args.ngrok_port if args.ngrok_port > 0 else None
    ngrok_host = args.ngrok_host

    log(f"database={args.database!r} user={args.user!r}")

    results = []
    if not args.ngrok_only:
        results.append(
            run_endpoint("LAN", args.lan_host, args.lan_port, args.user, args.password, args.database, args.timeout, args.skip_schema)
        )
    if ngrok_host and ngrok_port:
        results.append(
            run_endpoint("ngrok", ngrok_host, ngrok_port, args.user, args.password, args.database, args.timeout, args.skip_schema)
        )
    else:
        log("ngrok skipped — pass --ngrok-host and --ngrok-port (get port from ngrok UI; it changes on restart)")

    if all(results):
        log("All requested checks passed — use the same host/port in QueryAI Configuration.")
        return 0
    log("One or more checks failed — fix ngrok (addr localhost:5246 or 192.168.1.42:5246) or published port.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
