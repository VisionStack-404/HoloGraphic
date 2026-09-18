from src.login import login


def test_valid_login():
    assert login("admin", "secret") == {"ok": True, "user": "admin"}


def test_invalid_login():
    assert login("admin", "wrong") == {"ok": False, "error": "invalid_credentials"}
