# AutoPR-X

Autonomous Software Engineering Workspace: Work Item → Context/RAG → Repository Analysis → Plan → Implement → Validate → Self-Debug → PR.

## Quick start

```bash
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open http://localhost:8000

### Optional environment variables
- `OPENAI_API_KEY` — enables LLM-backed requirement/planning/debugging.
- `GITHUB_TOKEN` — enables real GitHub PR creation when a real repository is supplied.
- `GITHUB_REPO` — `owner/name`.

Without external credentials, AutoPR-X runs in deterministic demo mode against the included sample repository.
