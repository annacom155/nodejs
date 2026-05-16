const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();

/* ================= 加密配置 ================= */
const SECRET = "plmqazwsx";
const KEY = crypto.createHash("sha256").update(SECRET).digest();
const IV = Buffer.alloc(16, 0);

function encrypt(text) {
  const cipher = crypto.createCipheriv("aes-256-cbc", KEY, IV);
  let enc = cipher.update(text, "utf8", "base64");
  enc += cipher.final("base64");
  return enc;
}

function decrypt(text) {
  const decipher = crypto.createDecipheriv("aes-256-cbc", KEY, IV);
  let dec = decipher.update(text, "base64", "utf8");
  dec += decipher.final("utf8");
  return dec;
}

/* ================= 目录 ================= */
const BASE = path.join(__dirname, "postamessage");
const TI = path.join(BASE, "ti");
const PL = path.join(BASE, "pl");

[TI, PL].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

/* ================= JSON 存储 ================= */
function saveJson(dir, id, data) {
  const raw = JSON.stringify(data);
  fs.writeFileSync(path.join(dir, `${id}.json`), encrypt(raw));
}

function readJson(dir, id) {
  const enc = fs.readFileSync(path.join(dir, `${id}.json`), "utf8");
  return JSON.parse(decrypt(enc));
}

/* ================= 上传 ================= */
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, TI),
  filename: (_, __, cb) => {
    const id = Date.now().toString();
    cb(null, `${id}.tmp`);
  }
});

const upload = multer({ storage });

/* ================= 发帖 ================= */
app.post("/post", upload.any(), (req, res) => {
  const postId = Date.now().toString();

  const media = {
    images: [],
    video: null,
    audio: null
  };

  req.files.forEach(f => {
    const ext = f.filename.split(".").pop();
    const id = `${postId}_${Math.random().toString(36).slice(2, 5)}`;
    fs.renameSync(f.path, path.join(TI, `${id}.${ext}`));

    if (f.mimetype.startsWith("image")) {
      media.images.push({ id, ext });
    } else if (f.mimetype.startsWith("video")) {
      media.video = { id, ext };
    } else if (f.mimetype.startsWith("audio")) {
      media.audio = { id, ext };
    }
  });

  const data = {
    postId,
    text: req.body.text || "",
    media,
    createdAt: new Date().toISOString()
  };

  saveJson(TI, postId, data);

  res.json({
    code: 0,
    msg: "ok",
    data: encrypt(JSON.stringify(data))
  });
});

/* ================= 评论 ================= */
app.post("/comment", upload.any(), (req, res) => {
  const commentId = Date.now().toString();
  const { postId, text } = req.body;

  const media = {
    images: [],
    audio: null
  };

  req.files.forEach(f => {
    const ext = f.filename.split(".").pop();
    const id = `${commentId}_${Math.random().toString(36).slice(2, 5)}`;
    fs.renameSync(f.path, path.join(PL, `${id}.${ext}`));

    if (f.mimetype.startsWith("image")) {
      media.images.push({ id, ext });
    } else if (f.mimetype.startsWith("audio")) {
      media.audio = { id, ext };
    }
  });

  const data = {
    commentId,
    postId,
    text,
    media,
    createdAt: new Date().toISOString()
  };

  saveJson(PL, commentId, data);

  res.json({
    code: 0,
    msg: "ok",
    data: encrypt(JSON.stringify(data))
  });
});

/* ================= 读取 ================= */
app.get("/post/:id", (req, res) => {
  res.json(readJson(TI, req.params.id));
});

app.get("/comment/:id", (req, res) => {
  res.json(readJson(PL, req.params.id));
});

/* ================= 启动 ================= */
app.listen(3000, () => {
  console.log("✅ http://localhost:3000");
});
