"""Minimal demo login service."""

def login(username: str, password: str) -> dict:
    if username == "admin" and password == "secret":
        return {"ok": True, "user": username}
    return {"ok": False, "error": "invalid_credentials"}
