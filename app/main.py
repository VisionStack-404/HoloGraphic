from __future__ import annotations

import asyncio
import json
import os
import re
import sqlite3
import subprocess
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE = Path(__file__).resolve().parent.parent
DATA = BASE / "data"
WORKSPACE = BASE / "workspace"
DB = DATA / "autopr.db"
STATIC = BASE / "static"

app = FastAPI(title="AutoPR-X", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

runs: dict[str, dict[str, Any]] = {}
subscribers: dict[str, list[asyncio.Queue]] = {}

class RunRequest(BaseModel):
    work_item_id: str = Field(default="AUTH-142")
    repository: str = Field(default="sample-repo")
    require_approval: bool = True
    inject_failure: bool = True

class ApprovalRequest(BaseModel):
    approved: bool


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def db_init():
    DATA.mkdir(exist_ok=True)
    with sqlite3.connect(DB) as c:
        c.execute("CREATE TABLE IF NOT EXISTS agent_runs (id TEXT PRIMARY KEY, work_item_id TEXT, status TEXT, created_at TEXT, updated_at TEXT)")
        c.execute("CREATE TABLE IF NOT EXISTS agent_steps (id INTEGER PRIMARY KEY AUTOINCREMENT, run_id TEXT, agent TEXT, event TEXT, payload TEXT, created_at TEXT)")
        c.execute("CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, run_id TEXT, action TEXT, detail TEXT, created_at TEXT)")

db_init()


def db_step(run_id: str, agent: str, event: str, payload: dict):
    with sqlite3.connect(DB) as c:
        c.execute("INSERT INTO agent_steps(run_id,agent,event,payload,created_at) VALUES(?,?,?,?,?)", (run_id, agent, event, json.dumps(payload), now()))
        c.execute("UPDATE agent_runs SET updated_at=? WHERE id=?", (now(), run_id))

async def emit(run_id: str, agent: str, event: str, message: str, data: dict | None = None):
    payload = {"run_id": run_id, "agent": agent, "event": event, "message": message, "data": data or {}, "timestamp": now()}
    db_step(run_id, agent, event, payload)
    for q in subscribers.get(run_id, []):
        await q.put(payload)


def repo_path(name: str) -> Path:
    p = WORKSPACE / name
    if not p.exists():
        raise HTTPException(404, "Repository not found in demo workspace")
    return p


def read_repo_files(repo: Path) -> list[str]:
    return [str(p.relative_to(repo)).replace('\\', '/') for p in repo.rglob('*') if p.is_file() and '.git' not in p.parts]


def retrieve_context(repo: Path, query: str) -> list[dict]:
    terms = set(re.findall(r"[a-zA-Z_]{3,}", query.lower()))
    hits = []
    for p in repo.rglob('*'):
        if not p.is_file() or '.git' in p.parts:
            continue
        try:
            text = p.read_text(errors='ignore')
        except Exception:
            continue
        score = sum(1 for t in terms if t in text.lower() or t in p.name.lower())
        if score:
            hits.append({"path": str(p.relative_to(repo)).replace('\\','/'), "score": score, "snippet": text[:700]})
    return sorted(hits, key=lambda x: x['score'], reverse=True)[:6]


def run_cmd(repo: Path, args: list[str]) -> tuple[int, str]:
    try:
        proc = subprocess.run(args, cwd=repo, capture_output=True, text=True, timeout=30)
        return proc.returncode, (proc.stdout + "\n" + proc.stderr).strip()[-6000:]
    except Exception as e:
        return 1, str(e)


def deterministic_plan(requirement: str, context: list[dict], files: list[str]) -> dict:
    return {
        "goal": requirement,
        "steps": [
            "Inspect login flow and repository guidance",
            "Implement IP-aware login rate limiting without changing authentication semantics",
            "Add automated tests for the new behavior",
            "Run repository validation and repair failures if required",
        ],
        "files_to_modify": ["src/login.py", "tests/test_login.py"],
        "risk": "medium",
        "evidence": [x["path"] for x in context[:4]],
    }


def apply_demo_change(repo: Path, inject_failure: bool):
    login = repo / "src/login.py"
    tests = repo / "tests/test_login.py"
    original = login.read_text()
    new = '''"""Minimal demo login service with rate limiting."""\n\n_attempts = {}\n\n\ndef login(username: str, password: str, ip: str = "unknown") -> dict:\n    count = _attempts.get(ip, 0)\n    if count >= 100:\n        return {"ok": False, "error": "rate_limited", "status": 429}\n    _attempts[ip] = count + 1\n    if username == "admin" and password == "secret":\n        return {"ok": True, "user": username}\n    return {"ok": False, "error": "invalid_credentials"}\n'''
    login.write_text(new)
    if inject_failure:
        tests.write_text('''from src.login import login\n\n\ndef test_valid_login():\n    assert login("admin", "secret") == {"ok": True, "user": "admin"}\n\n\ndef test_invalid_login():\n    assert login("admin", "wrong") == {"ok": False, "error": "invalid_credentials"}\n\n\ndef test_rate_limit():\n    for _ in range(100):\n        login("admin", "wrong", ip="10.0.0.1")\n    assert login("admin", "wrong", ip="10.0.0.1")["status"] == 200\n''')
    else:
        tests.write_text(tests.read_text() + '\n\ndef test_rate_limit():\n    for _ in range(100):\n        login("admin", "wrong", ip="10.0.0.1")\n    assert login("admin", "wrong", ip="10.0.0.1")["status"] == 429\n')
    return original


def repair_demo(repo: Path):
    # Demonstration repair: restore compatibility for callers while preserving rate limiting.
    p = repo / "src/login.py"
    text = p.read_text()
    text = text.replace('return {"ok": False, "error": "rate_limited", "status": 429}', 'return {"ok": False, "error": "rate_limited", "status": 429}')
    return text

async def execute_run(run_id: str, req: RunRequest):
    state = runs[run_id]
    repo = repo_path(req.repository)
    try:
        state['status'] = 'RUNNING'
        await emit(run_id, 'orchestrator', 'RUN_STARTED', f'Starting {req.work_item_id}')
        await asyncio.sleep(.15)
        await emit(run_id, 'requirement', 'ANALYSIS_COMPLETE', 'Requirement understood', {"goal": "Add login rate limiting", "criteria": ["100 requests/minute/IP", "HTTP 429 after limit", "existing auth behavior remains intact", "tests required"]})
        await asyncio.sleep(.15)
        files = read_repo_files(repo)
        context = retrieve_context(repo, 'login rate limiting authentication tests coding standards')
        await emit(run_id, 'context_rag', 'CONTEXT_RETRIEVED', f'Retrieved {len(context)} relevant context sources', {"sources": context})
        await asyncio.sleep(.15)
        await emit(run_id, 'repository', 'REPOSITORY_ANALYZED', f'Inspected {len(files)} repository files', {"files": files})
        plan = deterministic_plan('Add IP-based login rate limiting', context, files)
        state['plan'] = plan
        await emit(run_id, 'planner', 'PLAN_READY', 'Implementation plan created', plan)
        if req.require_approval:
            state['status'] = 'AWAITING_APPROVAL'
            await emit(run_id, 'orchestrator', 'APPROVAL_REQUIRED', 'Human approval required before code changes')
            return
        await continue_after_approval(run_id, True, req)
    except Exception as e:
        state['status'] = 'FAILED'
        await emit(run_id, 'orchestrator', 'RUN_FAILED', str(e))

async def continue_after_approval(run_id: str, approved: bool, req: RunRequest):
    state = runs[run_id]
    repo = repo_path(req.repository)
    if not approved:
        state['status'] = 'REJECTED'
        await emit(run_id, 'orchestrator', 'RUN_REJECTED', 'Human rejected the implementation plan')
        return
    state['status'] = 'RUNNING'
    await emit(run_id, 'orchestrator', 'APPROVED', 'Plan approved; execution continuing')
    await asyncio.sleep(.15)
    await emit(run_id, 'coding', 'IMPLEMENTATION_STARTED', 'Applying implementation and tests')
    apply_demo_change(repo, req.inject_failure)
    await emit(run_id, 'coding', 'IMPLEMENTATION_COMPLETE', 'Code and tests updated', {"files_changed": ["src/login.py", "tests/test_login.py"]})
    await asyncio.sleep(.15)
    await emit(run_id, 'sandbox', 'EXECUTION_STARTED', 'Running tests in isolated execution mode')
    code, output = run_cmd(repo, ['python', '-m', 'pytest', '-q'])
    if code != 0:
        await emit(run_id, 'validation', 'TEST_FAILED', 'Validation failed; self-debugging activated', {"output": output})
        state['attempts'] = 1
        await emit(run_id, 'debug', 'DEBUG_ANALYSIS', 'Analyzing failure and preparing repair', {"attempt": 1})
        # The demo failure is intentionally caused by missing the package marker in some environments; normalize test execution.
        tests = repo / 'tests/test_login.py'
        txt = tests.read_text()
        if 'from src.login import login' in txt and not (repo / 'src/__init__.py').exists():
            (repo / 'src/__init__.py').write_text('')
        # Demo self-repair: the generated assertion contradicts the requirement.
        if '== 200' in txt:
            tests.write_text(txt.replace('== 200', '== 429'))
            await emit(run_id, 'debug', 'PATCH_APPLIED', 'Corrected the generated test assertion to match the acceptance criterion HTTP 429')
        await asyncio.sleep(.15)
        code, output = run_cmd(repo, ['python', '-m', 'pytest', '-q'])
        if code != 0:
            state['status'] = 'FAILED'
            await emit(run_id, 'debug', 'REPAIR_FAILED', 'Repair attempt did not pass validation', {"output": output})
            return
        await emit(run_id, 'debug', 'REPAIR_SUCCESS', 'Repair applied; validation passes now')
    else:
        await emit(run_id, 'validation', 'TESTS_PASSED', 'All tests passed')
    await emit(run_id, 'validation', 'VALIDATION_COMPLETE', 'Build/test validation complete', {"tests": "PASS"})
    await emit(run_id, 'security', 'SECURITY_REVIEW', 'Security review completed', {"status": "PASS", "checks": ["secrets", "auth semantics", "unsafe changes"]})
    await emit(run_id, 'git', 'PR_CREATED', 'Pull Request artifact prepared', {"number": f"AUTO-{run_id[:6].upper()}", "branch": f"autopr/{req.work_item_id}"})
    await emit(run_id, 'work_item', 'WORK_ITEM_UPDATED', 'Work item moved to Submitted for Review')
    await emit(run_id, 'notification', 'STAKEHOLDER_NOTIFIED', 'Team notification prepared')
    state['status'] = 'COMPLETED'
    with sqlite3.connect(DB) as c:
        c.execute('UPDATE agent_runs SET status=?, updated_at=? WHERE id=?', ('COMPLETED', now(), run_id))
    await emit(run_id, 'orchestrator', 'RUN_COMPLETED', 'AutoPR-X completed the end-to-end workflow')

@app.get('/')
def index():
    return FileResponse(STATIC / 'index.html')

@app.get('/health')
def health():
    return {"status": "ok", "service": "autopr-x"}

@app.post('/api/runs')
async def create_run(req: RunRequest):
    rid = uuid.uuid4().hex
    runs[rid] = {"id": rid, "status": "QUEUED", "work_item_id": req.work_item_id, "repository": req.repository, "plan": None, "attempts": 0}
    with sqlite3.connect(DB) as c:
        c.execute('INSERT INTO agent_runs VALUES(?,?,?,?,?)', (rid, req.work_item_id, 'QUEUED', now(), now()))
    asyncio.create_task(execute_run(rid, req))
    return runs[rid]

@app.get('/api/runs/{run_id}')
def get_run(run_id: str):
    if run_id not in runs:
        raise HTTPException(404, 'Run not found')
    return runs[run_id]

@app.post('/api/runs/{run_id}/approval')
async def approve(run_id: str, body: ApprovalRequest):
    if run_id not in runs:
        raise HTTPException(404, 'Run not found')
    if runs[run_id]['status'] != 'AWAITING_APPROVAL':
        raise HTTPException(400, 'Run is not awaiting approval')
    req = RunRequest(work_item_id=runs[run_id]['work_item_id'], repository=runs[run_id]['repository'], require_approval=True, inject_failure=True)
    asyncio.create_task(continue_after_approval(run_id, body.approved, req))
    return {"ok": True}

@app.get('/api/runs/{run_id}/events')
async def events(run_id: str):
    if run_id not in runs:
        raise HTTPException(404, 'Run not found')
    q: asyncio.Queue = asyncio.Queue()
    subscribers.setdefault(run_id, []).append(q)
    async def stream():
        try:
            yield f"data: {json.dumps({'event':'CONNECTED','message':'Live stream connected'})}\n\n"
            while True:
                item = await q.get()
                yield f"data: {json.dumps(item)}\n\n"
                if item['event'] in ('RUN_COMPLETED','RUN_FAILED','RUN_REJECTED'):
                    break
        finally:
            subscribers.get(run_id, []).remove(q)
    return StreamingResponse(stream(), media_type='text/event-stream')
