// 最简单的代理服务
let cache = {};

export default async function handler(req, res) {
  const { method, query } = req;
  
  // 允许CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // 如果是GET请求且有id参数，就是代理请求
  if (method === 'GET' && query.id) {
    const data = cache[query.id];
    
    if (!data) {
      return res.status(404).send('链接不存在或已过期');
    }
    
    if (Date.now() > data.expires) {
      delete cache[query.id];
      return res.status(410).send('链接已过期（1小时有效）');
    }
    
    // 直接重定向
    return res.redirect(301, data.url);
  }
  
  // 如果是POST请求，生成链接
  if (method === 'POST') {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: '请输入URL' });
      }
      
      if (!url.startsWith('http')) {
        return res.status(400).json({ error: 'URL必须以http开头' });
      }
      
      // 生成ID
      const id = Math.random().toString(36).substring(2, 10);
      const expires = Date.now() + 3600000; // 1小时
      
      // 保存到内存
      cache[id] = {
        url: url,
        expires: expires
      };
      
      // 1小时后自动删除
      setTimeout(() => {
        delete cache[id];
      }, 3600000);
      
      // 返回结果
      const publicUrl = `https://${req.headers.host}/api/kou?id=${id}`;
      
      return res.json({
        success: true,
        id: id,
        publicUrl: publicUrl,
        expires: expires
      });
      
    } catch (error) {
      return res.status(500).json({ error: '服务器错误' });
    }
  }
  
  // 默认返回成功
  return res.json({ 
    message: '代理服务运行中',
    usage: 'POST /api/kou 生成链接，GET /api/kou?id=xxx 访问链接'
  });
}
