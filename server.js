const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 5000;
const ROOT_DIR = __dirname;
const MESSAGES_FILE = path.join(ROOT_DIR, 'messages.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function ensureMessagesFile() {
  if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(MESSAGES_FILE, '[]', 'utf8');
  }
}

function readMessages() {
  ensureMessagesFile();
  const raw = fs.readFileSync(MESSAGES_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function writeMessages(messages) {
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf8');
}

function saveMessage(message) {
  const list = readMessages();
  list.push(message);
  writeMessages(list);
}

function handleApiContact(req, res) {
  let body = '';

  req.on('data', chunk => {
    body += chunk.toString();
    if (body.length > 1e6) {
      req.destroy();
    }
  });

  req.on('end', () => {
    try {
      const data = JSON.parse(body || '{}');
      const name = (data.name || '').trim();
      const email = (data.email || '').trim();
      const subject = (data.subject || '').trim();
      const message = (data.message || '').trim();

      if (!name || !email || !subject || !message) {
        return sendJson(res, 400, { ok: false, message: 'All fields are required.' });
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        return sendJson(res, 400, { ok: false, message: 'Please enter a valid email address.' });
      }

      const now = new Date();
      const ticketId = `MSG-${now.getTime()}`;
      const savedMessage = {
        ticketId,
        receivedAtISO: now.toISOString(),
        receivedAt: now.toLocaleString('en-IN', { hour12: true }),
        name,
        email,
        subject,
        message,
        ip: req.socket.remoteAddress || 'unknown'
      };

      saveMessage(savedMessage);

      return sendJson(res, 200, {
        ok: true,
        message: 'Message sent successfully and received in backend.',
        ticketId: savedMessage.ticketId,
        receivedAt: savedMessage.receivedAt
      });
    } catch (err) {
      return sendJson(res, 500, { ok: false, message: 'Server error while saving message.' });
    }
  });
}

function serveStatic(req, res) {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';

  const safePath = path.normalize(reqPath).replace(/^([.][.][/\\])+/, '');
  const filePath = path.join(ROOT_DIR, safePath);

  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      return res.end('Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  if (req.url.startsWith('/api/contact') && req.method === 'POST') {
    return handleApiContact(req, res);
  }

  if (req.url.startsWith('/api/messages') && req.method === 'GET') {
    const messages = readMessages().sort((a, b) => {
      const aTime = new Date(a.receivedAtISO || 0).getTime();
      const bTime = new Date(b.receivedAtISO || 0).getTime();
      return bTime - aTime;
    });

    return sendJson(res, 200, {
      ok: true,
      total: messages.length,
      latestTicket: messages[0]?.ticketId || null,
      messages
    });
  }

  if (req.url.startsWith('/api/health') && req.method === 'GET') {
    return sendJson(res, 200, { ok: true, status: 'up' });
  }

  return serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
