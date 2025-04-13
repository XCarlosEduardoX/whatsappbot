const qrcode = require('qrcode');

async function generarQR(qr, filePath) {
    await qrcode.toFile(filePath, qr);
    console.log('QR generado como "qr.png". Escanéalo con tu WhatsApp.');
}

module.exports = { generarQR };
