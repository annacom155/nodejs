http.createServer((req, res) => {
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

    // ===== Android 推流 (POST) =====
    if (req.method === "POST") {
        req.connection.setKeepAlive(true);
        streams[id] = res;

        console.log("▶ start cast:", id);

        // ✅ 关键：设置响应头，告诉浏览器这是 MJPEG 流
        res.writeHead(200, {
            'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
            'Connection': 'keep-alive'
        });

        req.on("close", () => {
            delete streams[id];
            console.log("■ stop cast:", id);
        });

        // ✅ 关键：不要 end()，保持连接打开！
        // res.end(); ❌ 删除这行！

        return;
    }

    // ===== 浏览器观看 (GET) =====
    const source = streams[id];
    if (!source) {
        res.end("not casting");
        return;
    }

    // ✅ 将 Android 的流直接 pipe 给浏览器
    source.pipe(res);
});
