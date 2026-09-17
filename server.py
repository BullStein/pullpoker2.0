#!/usr/bin/env python3
"""
Host do Salão de Apostas.
Servidor HTTP simples (só biblioteca padrão) que:
  - serve o index.html na raiz
  - guarda o estado do jogo em casino_state.json
  - expõe GET/POST /api/state para o front-end ler e salvar o estado

Uso:
    python3 server.py            # porta 8000
    PORT=5050 python3 server.py  # outra porta
"""
import http.server
import socketserver
import json
import os
import socket
import threading

DIR = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(DIR, "casino_state.json")
LOCK = threading.Lock()

DEFAULT_STATE = {"users": {}, "bets": [], "chat": []}


def load_state():
    if not os.path.exists(STATE_FILE):
        return dict(DEFAULT_STATE)
    try:
        with open(STATE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return dict(DEFAULT_STATE)


def save_state(data):
    tmp = STATE_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)
    os.replace(tmp, STATE_FILE)


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)

    def _json(self, obj, status=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/api/state":
            with LOCK:
                data = load_state()
            self._json(data)
            return
        if self.path == "/":
            self.path = "/index.html"
        return super().do_GET()

    def do_POST(self):
        if self.path == "/api/state":
            length = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(length) if length else b"{}"
            try:
                data = json.loads(raw.decode("utf-8"))
            except json.JSONDecodeError:
                self._json({"error": "json invalido"}, 400)
                return
            if not isinstance(data, dict) or "users" not in data or "bets" not in data:
                self._json({"error": "formato invalido"}, 400)
                return
            with LOCK:
                save_state(data)
            self._json({"ok": True})
            return
        self._json({"error": "rota nao encontrada"}, 404)

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
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    lan_ip = get_lan_ip()
    print(f"Salão de Apostas rodando.")
    print(f"  Neste computador:        http://localhost:{port}")
    if lan_ip:
        print(f"  Para outros na mesma rede: http://{lan_ip}:{port}")
    else:
        print("  Não consegui detectar o IP da rede local — rode 'ipconfig' (Windows)")
        print("  ou 'ifconfig' / 'ip a' (Mac/Linux) e use o IPv4 da sua rede Wi-Fi/LAN.")
    print(f"  Estado salvo em: {STATE_FILE}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nEncerrando servidor.")
        server.shutdown()


if __name__ == "__main__":
    main()
