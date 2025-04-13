const { agregarStrike } = require('../services/strikeService');

const esLink = (texto) => {
    return /(https?:\/\/[^\s]+|www\.[^\s]+|t\.me\/|discord\.gg|wa\.me\/)/i.test(texto);
};

const sospechosoAcortadores = new Set(['shrtco.de', 'zz.gd', 'ouo.io']); // Puedes añadir más
const dominiosPopulares = new Set([
    'facebook.com', 'youtube.com', 'instagram.com', 'twitter.com', 'whatsapp.com',
    'google.com', 'yahoo.com', 'wikipedia.org', 'linkedin.com', 'reddit.com',
    'tiktok.com', 'pinterest.com', 'snapchat.com', 'github.com', 'spotify.com',
]);

function esAcortadorSospechoso(url) {
    try {
        const hostname = new URL(url).hostname.toLowerCase();
        return [...sospechosoAcortadores].some(acortador => hostname.includes(acortador));
    } catch {
        return false;
    }
}

function detectarTyposquatting(url) {
    try {
        const hostname = new URL(url).hostname.toLowerCase();
        const partes = hostname.split('.');
        if (partes.length >= 2) {
            const dominioPrincipal = partes.slice(-2).join('.');
            for (const popular of dominiosPopulares) {
                if (dominioPrincipal.length > popular.length - 2 &&
                    dominioPrincipal.length < popular.length + 2 &&
                    (dominioPrincipal.includes(popular.slice(0, -4)) || dominioPrincipal.includes(popular.slice(1, -3)))) {
                    return true;
                }
            }
        }
        return false;
    } catch {
        return false;
    }
}

function contienePalabrasClaveSpam(texto) {
    const palabrasClave = ['gana dinero', 'gratis', 'oferta exclusiva', 'haz clic aquí', 'secreto revelado', 'urgente', 'limitado'];
    const textoLower = texto.toLowerCase();
    return palabrasClave.some(palabra => textoLower.includes(palabra));
}

function textoEsSimilar(a, b) {
    if (a.length !== b.length) return false;
    let iguales = 0;
    for (let i = 0; i < a.length; i++) {
        if (a[i] === b[i]) iguales++;
    }
    return iguales / a.length > 0.8;
}

// Cache de últimos mensajes
const mensajeCache = new Map(); // { userId: { text: '...', time: ... } }
const mensajeHistorial = new Map(); // { userId: [timestamp1, timestamp2, ...] }

function esSpamPorFrecuencia(autorId, ahora) {
    const ventanaTiempo = 10000; // 10 segundos
    const maxMensajes = 5;

    if (!mensajeHistorial.has(autorId)) {
        mensajeHistorial.set(autorId, []);
    }

    const historial = mensajeHistorial.get(autorId).filter(t => ahora - t < ventanaTiempo);
    historial.push(ahora);
    mensajeHistorial.set(autorId, historial);

    return historial.length >= maxMensajes;
}

async function detectarSpam(message, chat, client, esGrupo) {
    if (!esGrupo) return; // Solo detectar en grupos

    const texto = message.body?.trim() || '';
    const ahora = Date.now();

    const autorId = message.author || message.from || message.participant || message.sender || 'desconocido';
    if (autorId === 'desconocido') {
        console.warn('⚠️ No se pudo determinar el autor del mensaje:', message);
        return false;
    }

    if (message.fromMe) return false; // Ignorar mensajes enviados por el bot

    console.log(`📝 Mensaje de ${autorId}: ${texto}`);
    const anterior = mensajeCache.get(autorId);
    console.log(`📝 Anterior mensaje de ${autorId}: ${anterior?.text}`);

    // Detección de links sospechosos
    if (esLink(texto)) {
        let esSpam = false;

        if (esAcortadorSospechoso(texto)) {
            esSpam = true;
            console.log(`⚠️ Link sospechoso por acortador: ${texto}`);
        } else if (detectarTyposquatting(texto)) {
            esSpam = true;
            console.log(`⚠️ Posible typosquatting detectado en: ${texto}`);
        } else if (contienePalabrasClaveSpam(texto)) {
            esSpam = true;
            console.log(`⚠️ Texto con palabras clave de spam y un link: ${texto}`);
        }

        if (esSpam) {
            try {
                await message.delete();
                await chat.sendMessage(`🔒 @${autorId.split('@')[0]} este link parece sospechoso y ha sido eliminado.`, {
                    mentions: [await client.getContactById(autorId)]
                });
                agregarStrike(autorId, chat, client);
                return true;
            } catch (err) {
                console.error('❌ No se pudo borrar el link sospechoso:', err);
                return false;
            }
        }
    }

    // Mensaje exactamente igual o muy similar al anterior
    if (anterior && textoEsSimilar(anterior.text, texto) && ahora - anterior.time < 5000) {
        try {
            await message.delete();
            await chat.sendMessage(`🛑 @${autorId.split('@')[0]} no repitas el mismo mensaje.`, {
                mentions: [await client.getContactById(autorId)]
            });
            agregarStrike(autorId, chat, client);
            return true;
        } catch (err) {
            console.error('❌ No se pudo borrar mensaje repetido:', err);
            return false;
        }
    }

    // Frecuencia de mensajes
    if (esSpamPorFrecuencia(autorId, ahora)) {
        try {
            await message.delete();
            await chat.sendMessage(`🚨 @${autorId.split('@')[0]} estás enviando mensajes demasiado rápido.`, {
                mentions: [await client.getContactById(autorId)]
            });
            agregarStrike(autorId, chat, client);
            return true;
        } catch (err) {
            console.error('❌ No se pudo borrar spam por frecuencia:', err);
            return false;
        }
    }

    // Guardar el mensaje actual para futuras comparaciones
    mensajeCache.set(autorId, { text: texto, time: ahora });
    return false;
}

module.exports = { detectarSpam };
