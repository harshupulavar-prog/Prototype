#!/usr/bin/env python3
"""
One-command launcher: installs dependencies (first run only) and starts the
backend (FastAPI) and frontend (Vite), then opens the app in your browser.
Press Ctrl+C to stop both.
"""
import hashlib
import json
import os
import shutil
import socket
import subprocess
import sys
import threading
import time
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
IS_WIN = os.name == "nt"

# run.json (written by PrototypeHub) says where the frontend / backend live.
_cfg = {"frontend": "frontend", "backend": "backend"}
try:
    _cfg.update(json.loads((ROOT / "run.json").read_text(encoding="utf-8")))
except (OSError, ValueError):
    pass
FRONTEND = ROOT / _cfg["frontend"]
BACKEND = (ROOT / _cfg["backend"]) if _cfg["backend"] else None
VENV = (BACKEND / ".venv") if BACKEND else None


def log(msg):
    print(f"[run] {msg}", flush=True)


def fail(msg):
    print(f"\n[run] ERROR: {msg}\n", flush=True)
    sys.exit(1)


def port_in_use(port):
    """True if anything listens on the port, on IPv4 or IPv6 (Vite binds to localhost = ::1)."""
    for family, host in ((socket.AF_INET, "127.0.0.1"), (socket.AF_INET6, "::1")):
        try:
            with socket.socket(family, socket.SOCK_STREAM) as s:
                s.settimeout(0.5)
                if s.connect_ex((host, port)) == 0:
                    return True
        except OSError:
            continue  # IPv6 not available on this machine
    return False


def free_port(start):
    for port in range(start, start + 100):
        if not port_in_use(port):
            return port
    fail(f"No free port found near {start}")


def file_hash(path):
    return hashlib.sha256(path.read_bytes()).hexdigest() if path.exists() else ""


def run_checked(cmd, cwd, label):
    log(label)
    if subprocess.run(cmd, cwd=cwd, shell=IS_WIN and cmd[0] == "npm").returncode != 0:
        fail(f"'{label}' failed. See the output above.")


def pump(proc, prefix):
    for line in iter(proc.stdout.readline, ""):
        print(f"[{prefix}] {line.rstrip()}", flush=True)


def main():
    if sys.version_info < (3, 9):
        fail("Python 3.9+ is required. Install it from https://www.python.org/downloads/")
    npm = shutil.which("npm")
    if not npm:
        fail("Node.js (npm) is required. Install the LTS version from https://nodejs.org/")

    # ---- Backend setup (skipped for front-end-only prototypes) --------
    py = None
    if BACKEND:
        py = VENV / ("Scripts/python.exe" if IS_WIN else "bin/python")
        if not py.exists():
            run_checked([sys.executable, "-m", "venv", str(VENV)], ROOT, "Creating Python virtual environment")
        req = BACKEND / "requirements.txt"
        stamp = VENV / ".req-hash"
        if not stamp.exists() or stamp.read_text() != file_hash(req):
            run_checked([str(py), "-m", "pip", "install", "-q", "-r", str(req)], BACKEND, "Installing backend dependencies")
            stamp.write_text(file_hash(req))

    # ---- Frontend setup ------------------------------------------------
    pkg = FRONTEND / "package.json"
    nm_stamp = FRONTEND / "node_modules" / ".pkg-hash"
    if not nm_stamp.exists() or nm_stamp.read_text() != file_hash(pkg):
        run_checked(["npm", "install", "--no-audit", "--no-fund"], FRONTEND, "Installing frontend dependencies (npm install)")
        nm_stamp.write_text(file_hash(pkg))

    # ---- Start both ----------------------------------------------------
    fe_port = free_port(5174)
    env = {**os.environ, "PYTHONUNBUFFERED": "1", "BROWSER": "none"}
    procs = []
    if BACKEND:
        be_port = free_port(8001)
        env["VITE_API_URL"] = f"http://127.0.0.1:{be_port}"
        procs.append(("backend", subprocess.Popen(
            [str(py), "-m", "uvicorn", "main:app", "--reload", "--port", str(be_port)],
            cwd=BACKEND, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)))
    procs.append(("frontend", subprocess.Popen(
        ["npm", "run", "dev", "--", "--port", str(fe_port), "--strictPort"],
        cwd=FRONTEND, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
        shell=IS_WIN)))
    for name, p in procs:
        threading.Thread(target=pump, args=(p, name), daemon=True).start()

    url = f"http://localhost:{fe_port}"
    if BACKEND:
        log(f"Backend  -> http://localhost:{be_port}  (API docs: /docs)")
    log(f"Frontend -> {url}")
    time.sleep(4)
    webbrowser.open(url)
    log("Running. Press Ctrl+C to stop.")

    try:
        while all(p.poll() is None for _, p in procs):
            time.sleep(1)
        log("A process exited unexpectedly; shutting down.")
    except KeyboardInterrupt:
        pass
    finally:
        for _, p in procs:
            if p.poll() is None:
                if IS_WIN:
                    subprocess.run(["taskkill", "/F", "/T", "/PID", str(p.pid)], capture_output=True)
                else:
                    p.terminate()


if __name__ == "__main__":
    main()
