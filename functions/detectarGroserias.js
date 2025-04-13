const { agregarStrike } = require('../services/strikeService');
const fs = require('fs');
const { cargarConfiguraciones } = require('../services/configService');

// Lista de malas palabras
const malasPalabras = ['groseria1', 'groseria2', 'groseria3']; // Agrega más palabras si lo deseas

async function detectarMalasPalabras(message, chat, client, autorId, esGrupo) {
    if (!esGrupo) return; // Solo detectar en grupos
    const config = await cargarConfiguraciones();
    if (config.swon) return; // 🔓 Links permitidos, no hacer nada
    const texto = message.body.toLowerCase().trim();

    // Verificar si el mensaje contiene alguna mala palabra
    const contieneMalaPalabra = malasPalabras.some(palabra => texto.includes(palabra));

    if (contieneMalaPalabra) {
        try {
            await message.delete();
            await chat.sendMessage(`🚫 @${autorId.split('@')[0]} has usado lenguaje inapropiado.`, {
                mentions: [await client.getContactById(autorId)]
            });
            agregarStrike(autorId, chat, client); // Acumula un strike
        } catch (err) {
            console.error('❌ No se pudo borrar el mensaje con mala palabra:', err);
        }
    }
}

module.exports = { detectarMalasPalabras };
