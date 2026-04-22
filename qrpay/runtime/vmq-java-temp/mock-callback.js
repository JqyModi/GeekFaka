const http = require("node:http");
const { URL } = require("node:url");

const port = Number(process.env.PORT || 19001);

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  const payload = Object.fromEntries(url.searchParams.entries());

  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${url.pathname}`);
  console.log(payload);

  if (url.pathname === "/notify") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("success");
    return;
  }

  if (url.pathname === "/return") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true, payload }, null, 2));
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("not found");
});

server.listen(port, "127.0.0.1", () => {
  console.log(`mock callback listening on http://127.0.0.1:${port}`);
  console.log(`notify: http://127.0.0.1:${port}/notify`);
  console.log(`return: http://127.0.0.1:${port}/return`);
});
