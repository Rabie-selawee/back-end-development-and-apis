import http from 'http';
import fs from 'fs';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';

const PORT = process.env.PORT || 3001;

// 1. إنشاء HTTP Server يقرأ ملف index.html
const server = http.createServer((req, res) => {
  const filePath = path.join(process.cwd(), 'public', 'index.html');
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
});

// 2. إنشاء WebSocketServer وتمرير الخادم server
const wss = new WebSocketServer({ server });

// دالة مساعدة لإرسال الرسائل لجميع العملاء المتصلين (Broadcast)
function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// 3. تسجيل الحدث 'connection'
wss.on('connection', (socket, req) => {
  // 4 & 5. استخراج اسم المستخدم من Query String
  const urlParams = new URL(req.url, 'http://localhost').searchParams;
  const username = urlParams.get('username') || 'Anonymous';

  // 7 & 8. بث رسالة انضمام المستخدم لجميع المتصلين
  broadcast({
    type: 'system',
    text: `${username} joined`
  });

  // 9. استقبال رسائل الـ Chat وبثها للجميع
  socket.on('message', (messageData) => {
    try {
      const parsed = JSON.parse(messageData.toString());
      broadcast({
        type: 'chat',
        username: parsed.username || username,
        text: parsed.text || ''
      });
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  });

  // 10. عند مغادرة المستخدم (close)
  socket.on('close', () => {
    broadcast({
      type: 'system',
      text: `${username} left`
    });
  });
});

// 11. تشغيل السيرفر على المنفذ PORT
server.listen(PORT, () => {
  console.log(`Chat server running at http://localhost:${PORT}`);
});