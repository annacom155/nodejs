// server.js
const http = require('http');
const https = require('https');
const url = require('url');
const { URL } = require('url');

const server = http.createServer(async (req, res) => {
  // 解析查询参数
  const parsedUrl = url.parse(req.url, true);
  const targetUrl = parsedUrl.query.url;
  
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  if (!targetUrl) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '缺少url参数 喵～' }));
    return;
  }
  
  try {
    const decodedUrl = decodeURIComponent(targetUrl);
    const urlObj = new URL(decodedUrl);
    
    // 安全过滤
    const blockedHosts = ['localhost', '127.0.0.1'];
    if (blockedHosts.includes(urlObj.hostname)) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '禁止访问本地地址' }));
      return;
    }
    
    // 使用对应的模块发起请求
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Proxy/1.0)'
      }
    };
    
    // 转发请求
    const proxyReq = client.request(decodedUrl, options, (proxyRes) => {
      // 设置响应头
      res.writeHead(proxyRes.statusCode, {
        'Content-Type': proxyRes.headers['content-type'] || 'text/plain',
        'Access-Control-Allow-Origin': '*'
      });
      
      // 管道传输
      proxyRes.pipe(res);
    });
    
    // 如果有请求体，转发
    if (req.method === 'POST') {
      req.pipe(proxyReq);
    } else {
      proxyReq.end();
    }
    
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: '请求失败', 
      details: error.message 
    }));
  }
});

server.listen(3000, () => {
  console.log('代理服务器运行在 http://localhost:3000/proxy.js');
});
