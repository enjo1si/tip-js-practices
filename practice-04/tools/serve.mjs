import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const port = Number(process.argv[2]) || 5503;
const root = fileURLToPath(new URL("..", import.meta.url));

const types = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
};

const server = http.createServer(async (req, res) => {
    try {
        let path = decodeURIComponent(req.url.split("?")[0]);
        if (path === "/") path = "/index.html";
        const filePath = join(root, path);
        const data = await readFile(filePath);
        res.writeHead(200, { "Content-Type": types[extname(filePath)] || "application/octet-stream" });
        res.end(data);
    } catch {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Not found");
    }
});

server.listen(port, "127.0.0.1", () => {
    console.log(`Server started: http://127.0.0.1:${port}/`);
});