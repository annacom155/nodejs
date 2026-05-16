const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();

// 静态资源（直链访问）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 上传配置
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const name = Date.now() + '-' + file.originalname;
    cb(null, name);
  }
});

const upload = multer({ storage });

// 上传接口
app.post('/upload', upload.single('file'), (req, res) => {
  const url = `${req.protocol}://${req.headers.host}/uploads/${req.file.filename}`;
  res.json({
    success: true,
    url
  });
});

app.listen(3000, () => {
  console.log('Server running: http://localhost:3000');
});
