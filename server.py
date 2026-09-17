#!/usr/bin/env python3
"""
Host do Salão de Apostas.

Servidor HTTP simples (só biblioteca padrão) que:
  - serve as páginas (index/loja/perfil/admin/login)
  - guarda o jogo em casino_state.json
  - guarda as regras ajustáveis em casino_config.json (arquivo à parte)
  - guarda senhas e sessões em casino_auth.json (nunca vai para o navegador)

Uso:
    python3 server.py            # porta 8000
    PORT=5050 python3 server.py  # outra porta
"""
import http.server
import socketserver
import json
import os
import socket
import hashlib
import secrets
import threading

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


# ---------------------------------------------------------------- handler
class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)

    # -------- utilidades
    def _json(self, obj, status=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _body(self):
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length else b"{}"
        try:
            data = json.loads(raw.decode("utf-8"))
            return data if isinstance(data, dict) else {}
        except (json.JSONDecodeError, UnicodeDecodeError):
            return None

    def _token(self):
        return self.headers.get("X-Token", "")

    # -------- GET
    def do_GET(self):
        if self.path == "/api/state":
            with LOCK:
                self._json(load_state())
            return
        if self.path == "/api/config":
            with LOCK:
                self._json(load_config())
            return
        if self.path == "/":
            self.path = "/index.html"
        return super().do_GET()

    # -------- POST
    def do_POST(self):
        data = self._body()
        if data is None:
            self._json({"error": "json inválido"}, 400)
            return

        route = self.path
        if route == "/api/register":
            self.handle_register(data)
        elif route == "/api/login":
            self.handle_login(data)
        elif route == "/api/logout":
            self.handle_logout()
        elif route == "/api/password":
            self.handle_password(data)
        elif route == "/api/state":
            self.handle_state(data)
        elif route == "/api/config":
            self.handle_config(data)
        else:
            self._json({"error": "rota não encontrada"}, 404)

    # -------- rotas
    def handle_register(self, data):
        name = str(data.get("name", "")).strip()
        pw = str(data.get("password", ""))
        if not name or len(name) > 20:
            self._json({"error": "nome inválido"}, 400)
            return
        if len(pw) < 3:
            self._json({"error": "a senha precisa de pelo menos 3 caracteres"}, 400)
            return
        with LOCK:
            auth = load_auth()
            if name in auth["users"]:
                self._json({"error": "esse nome já tem conta"}, 409)
                return
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
        self._json({"token": token, "name": name, "isAdmin": is_admin(name)})

    def handle_login(self, data):
        name = str(data.get("name", "")).strip()
        pw = str(data.get("password", ""))
        with LOCK:
            auth = load_auth()
            rec = auth["users"].get(name)
            if not rec or hash_pw(pw, rec["salt"]) != rec["hash"]:
                self._json({"error": "nome ou senha errados"}, 401)
                return
            state = load_state()
            if state.get("users", {}).get(name, {}).get("banned"):
                self._json({"error": "essa conta foi barrada pelo host"}, 403)
                return
            token = secrets.token_hex(16)
            auth["tokens"][token] = name
            save_auth(auth)
        self._json({"token": token, "name": name, "isAdmin": is_admin(name)})

    def handle_logout(self):
        with LOCK:
            auth = load_auth()
            auth["tokens"].pop(self._token(), None)
            save_auth(auth)
        self._json({"ok": True})

    def handle_password(self, data):
        me = user_of_token(self._token())
        if not me:
            self._json({"error": "faça login de novo"}, 401)
            return
        target = str(data.get("name", "") or me).strip()
        new = str(data.get("new", ""))
        old = str(data.get("old", ""))
        if len(new) < 3:
            self._json({"error": "a senha nova precisa de 3 caracteres"}, 400)
            return
        with LOCK:
            auth = load_auth()
            rec = auth["users"].get(target)
            if not rec:
                self._json({"error": "conta não encontrada"}, 404)
                return
            if target != me and not is_admin(me):
                self._json({"error": "só o host troca a senha dos outros"}, 403)
                return
            if target == me and hash_pw(old, rec["salt"]) != rec["hash"]:
                self._json({"error": "senha atual errada"}, 401)
                return
            salt = secrets.token_hex(8)
            auth["users"][target] = {"salt": salt, "hash": hash_pw(new, salt)}
            if target != me:
                auth["tokens"] = {t: n for t, n in auth["tokens"].items() if n != target}
            save_auth(auth)
        self._json({"ok": True})

    def handle_state(self, data):
        me = user_of_token(self._token())
        if not me:
            self._json({"error": "faça login de novo"}, 401)
            return
        if "users" not in data or "bets" not in data:
            self._json({"error": "formato inválido"}, 400)
            return
        with LOCK:
            save_state(data)
        self._json({"ok": True})

    def handle_config(self, data):
        me = user_of_token(self._token())
        if not is_admin(me):
            self._json({"error": "só o host muda as regras"}, 403)
            return
        with LOCK:
            cfg = load_config()
            for key in DEFAULT_CONFIG:
                if key in data:
                    if key == "slot" and isinstance(data[key], dict):
                        cfg["slot"].update({k: int(v) for k, v in data[key].items() if k in cfg["slot"]})
                    else:
                        cfg[key] = data[key]
            save_config(cfg)
        self._json({"ok": True, "config": cfg})

    def log_message(self, fmt, *args):
        print("[salao]", fmt % args)


class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def get_lan_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except OSError:
        return None
    finally:
        s.close()


def main():
    port = int(os.environ.get("PORT", 8000))
    if not os.path.exists(STATE_FILE):
        save_state(DEFAULT_STATE)
    if not os.path.exists(CONFIG_FILE):
        save_config(DEFAULT_CONFIG)
    if not os.path.exists(AUTH_FILE):
        save_auth(DEFAULT_AUTH)

    cfg = load_config()
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    lan_ip = get_lan_ip()
    print("Salão de Apostas rodando.")
    print(f"  Neste computador:          http://localhost:{port}")
    if lan_ip:
        print(f"  Para outros na mesma rede: http://{lan_ip}:{port}")
    else:
        print("  Não detectei o IP da rede — rode 'ipconfig' (Windows) ou 'ip a' (Mac/Linux).")
    print(f"  Jogo:    {STATE_FILE}")
    print(f"  Regras:  {CONFIG_FILE}")
    print(f"  Senhas:  {AUTH_FILE}")
    print(f"  Conta do host: '{cfg['adminUser']}' — crie essa conta primeiro e guarde a senha.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nEncerrando servidor.")
        server.shutdown()


if __name__ == "__main__":
    main()
