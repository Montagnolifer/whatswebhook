const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

console.log("Inicializando cliente...");

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: '/usr/bin/chromium-browser',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

client.on('qr', qr => {
    console.log('Evento QR disparado');
    qrcode.generate(qr, { small: true });
    console.log('QR Code gerado. Escaneie com o aplicativo WhatsApp.');
});

client.on('ready', () => {
    console.log('Cliente está pronto!');
});

client.on('auth_failure', msg => {
    console.error('Falha na autenticação', msg);
});

client.on('authenticated', () => {
    console.log('Autenticado');
});

client.on('message', message => {
    console.log('Mensagem recebida:', message.body);
});

client.on('disconnected', (reason) => {
    console.log('Cliente desconectado', reason);
    // Tentar reconectar em caso de desconexão
    client.initialize();
});

client.initialize();
console.log("Cliente inicializado");

app.post('/send-message', async (req, res) => {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
        return res.status(400).send({ status: 'error', message: 'Número de telefone e mensagem são obrigatórios' });
    }

    const formattedNumber = phoneNumber.includes('@c.us') ? phoneNumber : `${phoneNumber}@c.us`;

    try {
        await client.sendMessage(formattedNumber, `${message}`);
        res.status(200).send({ status: 'success', message: 'Mensagem enviada com sucesso' });
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).send({ status: 'error', message: 'Erro ao enviar mensagem', error: error.message });
    }
});

app.listen(3000, '0.0.0.0', () => {
    console.log('Servidor rodando na porta 3000');
});