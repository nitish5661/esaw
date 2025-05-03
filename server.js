const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// WhatsApp Client with session persistence using LocalAuth
const client = new Client({
    authStrategy: new LocalAuth(), // session auto-saved in .wwebjs_auth/
    puppeteer: {
        headless: true,
        args: ['--no-sandbox']
    }
});

// Global QR variable
let qrCode = null;

client.on('qr', (qr) => {
    console.log('QR RECEIVED');
    qrCode = qr;
});

// Save session automatically
client.on('ready', () => {
    console.log('Client is ready!');
    qrCode = null; // Clear QR after login
});

client.initialize();

// Endpoint to fetch QR code if available
app.get('/qr', async (req, res) => {
    if (qrCode) {
        const qrImage = await qrcode.toDataURL(qrCode);
        res.send(`<img src="${qrImage}"><p>Scan to login</p>`);
    } else {
        res.send('Already authenticated!');
    }
});

// Basic homepage route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
