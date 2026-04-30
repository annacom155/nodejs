const https = require('https');

export default async (req, res) => {
  const { file } = req.query;
  
  if (!file) {
    res.status(400).send('No file specified\nUsage: /api?file=path/to/file\nExample: /api?file=README.md');
    return;
  }
  
  const githubUrl = `https://raw.githubusercontent.com/annacom155/nodejs/main/${file}`;
  
  https.get(githubUrl, (githubRes) => {
    res.setHeader('Content-Type', githubRes.headers['content-type'] || 'application/octet-stream');
    githubRes.pipe(res);
  }).on('error', (err) => {
    res.status(500).send('Error');
  });
};
