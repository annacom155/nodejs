/**
 * tp.js
 * 路径：/api/tp.js?id=投屏ID
 */

const http = require("http");

const streams = {};

http.createServer((req, res) => {

    // ✅ 只允许 /api/tp.js
    if (!req.url.startsWith("/api/tp.js")) {
        res.statusCode = 404;
        res.end("Not Found");
        return;
    }

    const url = new URL(req.url, "http://localhost");
    const id = url.searchParams.get("id");

    if (!id) {
        res.end("missing id");
        return;
    }

    // ===== Android 推流 =====
    if (req.method === "POST") {
        req.connection.setKeepAlive(true);
        streams[id] = res;

        console.log("▶ start cast:", id);

        req.on("close", () => {
            delete streams[id];
            console.log("■ stop cast:", id);
        });

        return;
    }

    // ===== 浏览器观看 =====
    const source = streams[id];
    if (!source) {
        res.end("not casting");
        return;
    }

    res.setHeader(
        "Content-Type",
        "multipart/x-mixed-replace; boundary=frame"
    );

    source.pipe(res);

}).listen(80);

console.log("tp.js running → /api/tp.js");
