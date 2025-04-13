const express = require('express');
const app = express();
const path = require('path');

const PORT = 3000;

// Servir archivos estáticos (incluyendo qr.png)
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
    console.log(`Servidor corriendo en: http://localhost:${PORT}/qr.png`);
});
