const path = require('path');
const fs = require('fs');
const { generate } = require('qrcode-terminal');
const anunciosFile = path.join(__dirname, '../partidas.json');

// Leer anuncios desde el archivo
function leerAnuncios() {
    if (fs.existsSync(anunciosFile)) {
        try {
            return JSON.parse(fs.readFileSync(anunciosFile));
        } catch (err) {
            console.error('❌ Error al leer anuncios.json:', err);
            return []; // Si ocurre un error, devolvemos un arreglo vacío
        }
    }
    return []; // Si el archivo no existe, devolvemos un arreglo vacío
}

// Guardar anuncios en el archivo JSON
function guardarAnuncios(anuncios) {
    fs.writeFileSync(anunciosFile, JSON.stringify(anuncios, null, 2));
}
function generateID() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
module.exports = {
    name: 'match',
    adminOnly: true,
    execute: async ({ message, args, chat, client }) => {
        if (args.length < 2) return message.reply('❌ Uso: !anuncio [mensaje] [hora]');

        const horaRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;  // Regex para la hora en formato HH:MM
        let hora = null;
        let mensaje = null;

        for (let i = 0; i < args.length; i++) {
            if (horaRegex.test(args[i])) {
                hora = args[i];
                mensaje = args.filter((_, idx) => idx !== i).join(' ');
                break;
            }
        }

        if (!hora || !mensaje) {
            return message.reply('❌ Hora inválida. Usa el formato HH:MM (ej: 17:00)');
        }

        // Cargar anuncios existentes
        const nuevosAnuncios = leerAnuncios();
        let id = generateID();
        // Guardar el nuevo anuncio
        nuevosAnuncios.push({
            chatId: message.from,
            hora,
            mensaje,
            id
        });

        // Guardar los anuncios en el archivo JSON
        guardarAnuncios(nuevosAnuncios);

        // Obtener los participantes del chat
        const participantes = chat.participants; // Usamos chat.participants

        // Crear una lista de menciones con los contactos correspondientes
        const menciones = participantes.map(async (p) => {
            const contacto = await client.getContactById(p.id._serialized); // Obtener el contacto por su ID
            return contacto;
        });

        // Esperar que todas las menciones sean resueltas
        let contacts = await Promise.all(menciones);
        // Filtrar contactos para evitar mencionar al bot o al autor del mensaje
        contacts = contacts.filter(c => c.id._serialized !== client.info.wid._serialized && c.id._serialized !== message.from);
        // Enviar mensaje de confirmación
        console.log('Contactos mencionados:', contacts);
        // Enviar el mensaje de anuncio mencionando a todos
        try {
            await chat.sendMessage(`🕹️Partida programada🕹️\nHorario: ${hora}\n\n *${mensaje}*`, {
                mentions: contacts // Mencionar a todos los participantes
            });
            // message.reply(`📢 Anuncio guardado para las ${hora}:\n"${mensaje}"`);
        } catch (err) {
            console.error('❌ Error al enviar anuncio:', err);
            message.reply('❌ No se pudo enviar el anuncio.');
        }
    }
};
