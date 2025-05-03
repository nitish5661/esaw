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
  authStrategy: new LocalAuth() // Save session, no repeat login
});

let allMessages = [];

client.on('qr', async (qr) => {
  const qrImage = await qrcode.toDataURL(qr);
  io.emit('qr', qrImage);
});

client.on('ready', () => {
  console.log('WhatsApp is ready!');
  io.emit('ready');
});

client.on('message', message => {
  const msg = {
    from: message.from,
    body: message.body,
    timestamp: new Date().toISOString()
  };
  allMessages.push(msg);
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
  console.log('Server is running on http://localhost:3000');
});
