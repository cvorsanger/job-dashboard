#!/usr/bin/env python3
"""Start backend and frontend dev servers together. Ctrl+C stops both."""

import os
import signal
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT, "backend")
FRONTEND_DIR = os.path.join(ROOT, "frontend")
NPM = None
UVICORN = None

def set_system_settings():
    if sys.platform == "win32":
        UVICORN = os.path.join(BACKEND_DIR, ".venv", "Scripts", "uvicorn.exe")
        NPM = "npm.cmd"
    else:
        UVICORN = os.path.join(BACKEND_DIR, ".venv", "bin", "uvicorn")
        NPM = "npm"

class Process():
    '''
    Class that represents a process that is running
    '''
    def __init__(self, name: str):
        self.name = name
        self.proc = None

    def create_process(self):
        '''
        Crates a processs depending on if it is front or backend
        '''
        if (self.name == "backend"):
            self.proc = subprocess.Popen(
                [UVICORN, "app.main:app", "--reload"],
                cwd=BACKEND_DIR,
            )
        else:
            self.proc = subprocess.Popen(
                [NPM, "run", "dev"],
                cwd=FRONTEND_DIR,
            )
    
        return self

def check_prereqs():
    '''
    Verifys that all needed dependencies are installed
    '''
    if not os.path.isfile(UVICORN):
        print("ERROR: uvicorn not found. Set up the backend venv first:")
        print("  cd backend && python -m venv .venv")
        if sys.platform == "win32":
            print("  .venv\\Scripts\\pip install -r requirements.txt")
        else:
            print("  source .venv/bin/activate && pip install -r requirements.txt")
        sys.exit(1)

    node_modules = os.path.join(FRONTEND_DIR, "node_modules")
    if not os.path.isdir(node_modules):
        print("ERROR: node_modules not found. Install frontend dependencies first:")
        print("  cd frontend && npm install")
        sys.exit(1)

def main():
    set_system_settings()
    check_prereqs()
    print_startup_message()

    backend = Process("backend").create_process()
    frontend = Process("frontend").create_process()

    def shutdown(sig, frame):
        print("\nStopping...")
        frontend.proc.terminate()
        backend.proc.terminate()
        frontend.proc.wait()
        backend.proc.wait()
        sys.exit(0)

    for sig in (signal.SIGINT, signal.SIGTERM):
        signal.signal(sig, shutdown)

    while True:
        for process, other in (
            (backend, frontend),
            (frontend, backend),
        ):
            if process.proc.poll() is not None:
                print(f"{process.name} exited unexpectedly.")
                other.proc.terminate()
                sys.exit(1)
        time.sleep(1)

def print_startup_message():
    '''
    Prints a message to display to the user when the processes are starting
    '''
    print()
    print("  Backend:  http://localhost:8000  (API docs: /docs)")
    print("  Frontend: http://localhost:5173")
    print()
    print("  Press Ctrl+C to stop both servers.")
    print()

if __name__ == "__main__":
    main()
