#!/usr/bin/env python3
"""
Host do Salão de Apostas — versão Flask.

Faz exatamente o que o server.py original faz (mesmas rotas, mesmos
arquivos JSON), só que rodando em cima do Flask em vez da biblioteca
padrão. Serve para quem já tem Flask no projeto ou quer usar
gunicorn/waitress depois.

Instalar:
    pip install flask --break-system-packages
    (ou, num venv: pip install flask)

Rodar:
    python3 server_flask.py            # porta 8000
    PORT=5050 python3 server_flask.py  # outra porta

    ou, com o CLI do Flask:
    flask --app server_flask run --host 0.0.0.0 --port 8000
    (nesse modo, o print do IP da rede não aparece)
"""
import os
import json
import socket
import hashlib
import secrets
import threading

from flask import Flask, request, jsonify, send_from_directory

DIR = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(DIR, "casino_state.json")
CONFIG_FILE = os.path.join(DIR, "casino_config.json")
AUTH_FILE = os.path.join(DIR, "casino_auth.json")
LOCK = threading.Lock()

DEFAULT_STATE = {"users": {}, "bets": [], "chat": [], "shop": {"items": []}, "log": []}

DEFAULT_CONFIG = {
    "adminUser": "Casa",
    "startBalance": 500,
    "betCost": 20,
    "bonusAmount": 100,
    "bonusCooldownMin": 3,
    "spinCooldownSec": 45,
    "slot": {
        "seteTriplo": 500,
        "trio": 150,
        "par": 40,
        "nada": 10
    },
    "defaultExpireMin": 60,
    "betsLocked": False,
    "chatOn": True,
    "shopOn": True,
    "announcement": ""
}

DEFAULT_AUTH = {"users": {}, "tokens": {}}

app = Flask(__name__, static_folder=DIR, static_url_path="")


# ---------------------------------------------------------------- arquivos
def _load(path, default):
    if not os.path.exists(path):
        return json.loads(json.dumps(default))
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return json.loads(json.dumps(default))


def _save(path, data):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, path)


def load_state():
    return _load(STATE_FILE, DEFAULT_STATE)


def save_state(data):
    _save(STATE_FILE, data)


def load_config():
    cfg = _load(CONFIG_FILE, DEFAULT_CONFIG)
    merged = json.loads(json.dumps(DEFAULT_CONFIG))
    merged.update({k: v for k, v in cfg.items() if k != "slot"})
    if isinstance(cfg.get("slot"), dict):
        merged["slot"].update(cfg["slot"])
    return merged


def save_config(data):
    _save(CONFIG_FILE, data)


def load_auth():
    return _load(AUTH_FILE, DEFAULT_AUTH)


def save_auth(data):
    _save(AUTH_FILE, data)


# ---------------------------------------------------------------- senhas
def hash_pw(password, salt):
    return hashlib.sha256((salt + ":" + password).encode("utf-8")).hexdigest()


def user_of_token(token):
    if not token:
        return None
    return load_auth()["tokens"].get(token)


def is_admin(name):
    return bool(name) and name == load_config()["adminUser"]


def ensure_player(state, name, cfg):
    if name not in state["users"]:
        state["users"][name] = {
            "balance": cfg["startBalance"],
            "lastBonus": 0,
            "lastSpin": 0,
            "inventory": [],
            "equipped": {}
        }
    return state["users"][name]


def current_user():
    return user_of_token(request.headers.get("X-Token", ""))


# ---------------------------------------------------------------- páginas
@app.get("/")
def home():
    return send_from_directory(DIR, "index.html")


# static files (index.html, app.js, style.css, etc.) are served
# automatically by Flask's static_folder configured above.


# ---------------------------------------------------------------- API
@app.get("/api/state")
def get_state():
    with LOCK:
        return jsonify(load_state())


@app.get("/api/config")
def get_config():
    with LOCK:
        return jsonify(load_config())


@app.post("/api/register")
def register():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    pw = str(data.get("password", ""))
    if not name or len(name) > 20:
        return jsonify({"error": "nome inválido"}), 400
    if len(pw) < 3:
        return jsonify({"error": "a senha precisa de pelo menos 3 caracteres"}), 400
    with LOCK:
        auth = load_auth()
        if name in auth["users"]:
            return jsonify({"error": "esse nome já tem conta"}), 409
        salt = secrets.token_hex(8)
        auth["users"][name] = {"salt": salt, "hash": hash_pw(pw, salt)}
        token = secrets.token_hex(16)
        auth["tokens"][token] = name
        save_auth(auth)

        cfg = load_config()
        state = load_state()
        for key, default in DEFAULT_STATE.items():
            state.setdefault(key, json.loads(json.dumps(default)))
        ensure_player(state, name, cfg)
        save_state(state)
    return jsonify({"token": token, "name": name, "isAdmin": is_admin(name)})


@app.post("/api/login")
def login():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    pw = str(data.get("password", ""))
    with LOCK:
        auth = load_auth()
        rec = auth["users"].get(name)
        if not rec or hash_pw(pw, rec["salt"]) != rec["hash"]:
            return jsonify({"error": "nome ou senha errados"}), 401
        state = load_state()
        if state.get("users", {}).get(name, {}).get("banned"):
            return jsonify({"error": "essa conta foi barrada pelo host"}), 403
        token = secrets.token_hex(16)
        auth["tokens"][token] = name
        save_auth(auth)
    return jsonify({"token": token, "name": name, "isAdmin": is_admin(name)})


@app.post("/api/logout")
def logout():
    with LOCK:
        auth = load_auth()
        auth["tokens"].pop(request.headers.get("X-Token", ""), None)
        save_auth(auth)
    return jsonify({"ok": True})


@app.post("/api/password")
def change_password():
    me = current_user()
    if not me:
        return jsonify({"error": "faça login de novo"}), 401
    data = request.get_json(silent=True) or {}
    target = str(data.get("name", "") or me).strip()
    new = str(data.get("new", ""))
    old = str(data.get("old", ""))
    if len(new) < 3:
        return jsonify({"error": "a senha nova precisa de 3 caracteres"}), 400
    with LOCK:
        auth = load_auth()
        rec = auth["users"].get(target)
        if not rec:
            return jsonify({"error": "conta não encontrada"}), 404
        if target != me and not is_admin(me):
            return jsonify({"error": "só o host troca a senha dos outros"}), 403
        if target == me and hash_pw(old, rec["salt"]) != rec["hash"]:
            return jsonify({"error": "senha atual errada"}), 401
        salt = secrets.token_hex(8)
        auth["users"][target] = {"salt": salt, "hash": hash_pw(new, salt)}
        if target != me:
            auth["tokens"] = {t: n for t, n in auth["tokens"].items() if n != target}
        save_auth(auth)
    return jsonify({"ok": True})


@app.post("/api/state")
def post_state():
    me = current_user()
    if not me:
        return jsonify({"error": "faça login de novo"}), 401
    data = request.get_json(silent=True)
    if not isinstance(data, dict) or "users" not in data or "bets" not in data:
        return jsonify({"error": "formato inválido"}), 400
    with LOCK:
        save_state(data)
    return jsonify({"ok": True})


@app.post("/api/config")
def post_config():
    me = current_user()
    if not is_admin(me):
        return jsonify({"error": "só o host muda as regras"}), 403
    data = request.get_json(silent=True) or {}
    with LOCK:
        cfg = load_config()
        for key in DEFAULT_CONFIG:
            if key in data:
                if key == "slot" and isinstance(data[key], dict):
                    cfg["slot"].update({k: int(v) for k, v in data[key].items() if k in cfg["slot"]})
                else:
                    cfg[key] = data[key]
        save_config(cfg)
    return jsonify({"ok": True, "config": cfg})


# ---------------------------------------------------------------- boot
def get_lan_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except OSError:
        return None
    finally:
        s.close()


def bootstrap_files():
    if not os.path.exists(STATE_FILE):
        save_state(DEFAULT_STATE)
    if not os.path.exists(CONFIG_FILE):
        save_config(DEFAULT_CONFIG)
    if not os.path.exists(AUTH_FILE):
        save_auth(DEFAULT_AUTH)


bootstrap_files()  # roda também quando importado por "flask run" ou gunicorn


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    cfg = load_config()
    lan_ip = get_lan_ip()
    print("Salão de Apostas (Flask) rodando.")
    print(f"  Neste computador:          http://localhost:{port}")
    if lan_ip:
        print(f"  Para outros na mesma rede: http://{lan_ip}:{port}")
    else:
        print("  Não detectei o IP da rede — rode 'ipconfig' (Windows) ou 'ip a' (Mac/Linux).")
    print(f"  Jogo:    {STATE_FILE}")
    print(f"  Regras:  {CONFIG_FILE}")
    print(f"  Senhas:  {AUTH_FILE}")
    print(f"  Conta do host: '{cfg['adminUser']}' — crie essa conta primeiro e guarde a senha.")
    app.run(host="0.0.0.0", port=port, threaded=True)