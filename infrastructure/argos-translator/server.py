#!/usr/bin/env python3
import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import argostranslate.translate

LOCK = threading.Lock()
LANGUAGES = {'en', 'ru', 'ar'}

class Handler(BaseHTTPRequestHandler):
    def send_json(self, status, value):
        payload = json.dumps(value, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        if self.path == '/health':
            return self.send_json(200, {'status':'healthy', 'engine':'argos', 'targets':sorted(LANGUAGES)})
        return self.send_json(404, {'error':'not found'})

    def do_POST(self):
        if self.path != '/translate':
            return self.send_json(404, {'error':'not found'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length <= 0 or length > 200000:
                return self.send_json(400, {'error':'invalid content length'})
            body = json.loads(self.rfile.read(length))
            text = str(body.get('q', ''))
            source = body.get('source', 'zh')
            target = body.get('target')
            if source != 'zh' or target not in LANGUAGES:
                return self.send_json(400, {'error':'unsupported language pair'})
            with LOCK:
                translated = argostranslate.translate.translate(text, source, target)
            return self.send_json(200, {'translatedText':translated})
        except Exception as exc:
            return self.send_json(500, {'error':str(exc)})

    def log_message(self, fmt, *args):
        print('[argos-http]', fmt % args, flush=True)

if __name__ == '__main__':
    ThreadingHTTPServer(('127.0.0.1', 5000), Handler).serve_forever()
