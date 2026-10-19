import http.server, os, re, sys
class H(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path) or not os.path.exists(path): return super().send_head()
        size = os.path.getsize(path); rng = self.headers.get('Range'); f = open(path, 'rb')
        ctype = self.guess_type(path)
        if rng:
            m = re.match(r'bytes=(\d*)-(\d*)', rng); a = int(m.group(1) or 0); b = int(m.group(2) or size - 1); b = min(b, size - 1)
            self.send_response(206); self.send_header('Content-Range', f'bytes {a}-{b}/{size}'); self.send_header('Content-Length', str(b - a + 1)); self.send_header('Accept-Ranges', 'bytes'); self.send_header('Content-type', ctype); self.end_headers()
            f.seek(a); self._range = (a, b); return f
        self.send_response(200); self.send_header('Content-Length', str(size)); self.send_header('Accept-Ranges', 'bytes'); self.send_header('Content-type', ctype); self.end_headers(); self._range = None; return f
    def copyfile(self, src, dst):
        if getattr(self, '_range', None): a, b = self._range; dst.write(src.read(b - a + 1))
        else: super().copyfile(src, dst)
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(('', int(sys.argv[1])), H).serve_forever()
