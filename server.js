'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const os = require('node:os');
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const root = path.join(__dirname, 'public');
const contentTypes = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
const chunk = crypto.randomBytes(64 * 1024);
const maxDownload = 128 * 1024 * 1024;
const maxUpload = 128 * 1024 * 1024;
const corsHeaders = { 'Cache-Control': 'no-store, no-cache, must-revalidate', 'X-Content-Type-Options': 'nosniff', 'Access-Control-Allow-Origin': '*' };
function sendJson(res, code, data) { res.writeHead(code, {...corsHeaders,'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data)); }
const server = http.createServer((req,res)=>{
  let url;
  try { url = new URL(req.url, 'http://localhost'); } catch { return sendJson(res,400,{error:'Bad URL'}); }
  if (req.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {res.writeHead(204,{...corsHeaders,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'});return res.end();}
  if (url.pathname === '/api/ping' && req.method === 'GET') {res.writeHead(204,corsHeaders);return res.end();}
  if (url.pathname === '/api/info' && req.method === 'GET') return sendJson(res,200,{name:process.env.SERVER_NAME || os.hostname(),timestamp:Date.now(),version:'1.0.0'});
  if (url.pathname === '/api/download' && req.method === 'GET') {
    const bytes = Math.max(1024, Math.min(maxDownload,Number(url.searchParams.get('bytes')) || 12*1024*1024));
    res.writeHead(200,{...corsHeaders,'Content-Type':'application/octet-stream','Content-Length':bytes,'Content-Encoding':'identity'});
    let written=0;
    const pump=()=>{while (written < bytes) {const n=Math.min(chunk.length,bytes-written);written+=n;if(!res.write(n===chunk.length?chunk:chunk.subarray(0,n)))return;} res.end();};
    res.on('drain',pump);pump();return;
  }
  if (url.pathname === '/api/upload' && req.method === 'POST') {
    let received=0;let aborted=false;
    req.on('data',data=>{received+=data.length;if(received>maxUpload){aborted=true;sendJson(res,413,{error:'Upload size exceeds limit'});req.destroy();}});
    req.on('end',()=>{if(!aborted)sendJson(res,200,{received});});
    req.on('error',()=>{});return;
  }
  if(req.method !== 'GET' && req.method !== 'HEAD')return sendJson(res,405,{error:'Method not allowed'});
  const reqPath = url.pathname === '/' ? '/index.html' : url.pathname;
  const resolved=path.resolve(root,'.'+decodeURIComponent(reqPath));
  if(resolved!==root && !resolved.startsWith(root+path.sep))return sendJson(res,403,{error:'Forbidden'});
  fs.stat(resolved,(err,stat)=>{
    if(err || !stat.isFile())return sendJson(res,404,{error:'Not found'});
    res.writeHead(200,{'Content-Type':contentTypes[path.extname(resolved)] || 'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    if(req.method==='HEAD')return res.end();
    fs.createReadStream(resolved).pipe(res);
  });
});
server.requestTimeout=30000;
server.listen(PORT,HOST,()=>console.log(`Velocity speed test running on http://localhost:${PORT}`));
