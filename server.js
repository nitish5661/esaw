const fs = require('fs');
const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const http = require('http');
const socketIO = require('socket.io');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

const client = new Client({
  authStrategy: new LocalAuth()
});

let allMessages = [];

client.on('qr', async (qr) => {
  const qrImageUrl = await qrcode.toDataURL(qr);
  io.emit('qr', qrImageUrl);
});

client.on('ready', () => {
  console.log('Client is ready!');
  io.emit('ready');
});

client.on('message', message => {
  allMessages.push({
    from: message.from,
    body: message.body,
    timestamp: new Date().toISOString()
  });

  io.emit('messages', allMessages);
});

app.post('/send', async (req, res) => {
  const { to, message } = req.body;
  try {
    await client.sendMessage(to, message);
    res.json({ status: 'sent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

client.initialize();

server.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});
