const path = require('path');
const fs = require('fs');
const moment = require('moment'); // Importamos moment
const torneosFile = path.join(__dirname, '../torneos.json');

// Leer torneos desde el archivo
function leerTorneos() {
    if (fs.existsSync(torneosFile)) {
        try {
            return JSON.parse(fs.readFileSync(torneosFile));
        } catch (err) {
            console.error('❌ Error al leer torneos.json:', err);
            return []; // Si ocurre un error, devolvemos un arreglo vacío
        }
    }
    return []; // Si el archivo no existe, devolvemos un arreglo vacío
}

// Guardar torneos en el archivo JSON
function guardarTorneos(torneos) {
    fs.writeFileSync(torneosFile, JSON.stringify(torneos, null, 2));
}

function generateID() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

module.exports = {
    name: 'tourney',
    adminOnly: true,
    execute: async ({ message, args, chat }) => {
        await chat.sendStateTyping();

        // Extraer el nombre del torneo entre comillas, hora y fecha
        const input = message.body.replace(/^!tourney\s*/, '');
        const match = input.match(/"(.+?)"\s+([0-9]{1,2}:[0-9]{2})\s+(today|tomorrow|\d{2}\/\d{2}\/\d{4})/i);

        if (!match) {
            return message.reply('❌ Formato inválido. Usa: !tourney "Nombre del torneo" HH:MM today|tomorrow|DD/MM/YYYY');
        }

        const nombreTorneoFinal = match[1];
        const hora = match[2];
        const fechaInput = match[3];

        console.log('Nombre del torneo:', nombreTorneoFinal);
        console.log('Hora:', hora);
        console.log('Fecha:', fechaInput);

        // Validar formato de hora
        const horaRegex = /^([01]?[0-9]|2[0-3]):([0-5]?[0-9])$/; // Formato: 12:20 o 02:05
        if (!horaRegex.test(hora)) {
            return message.reply('❌ Hora inválida. Usa el formato HH:MM (ej: 17:30)');
        }

        let fechaTorneo;

        if (fechaInput === 'today') {
            fechaTorneo = moment().set({
                'hour': parseInt(hora.split(':')[0]),
                'minute': parseInt(hora.split(':')[1]),
                'second': 0,
                'millisecond': 0
            });
        } else if (fechaInput === 'tomorrow') {
            fechaTorneo = moment().add(1, 'days').set({
                'hour': parseInt(hora.split(':')[0]),
                'minute': parseInt(hora.split(':')[1]),
                'second': 0,
                'millisecond': 0
            });
        } else {
            // Si es una fecha específica, validarla en formato DD/MM/YYYY
            const fechaTorneoParseada = moment(fechaInput, 'DD/MM/YYYY', true);
            if (!fechaTorneoParseada.isValid()) {
                return message.reply('❌ Formato de fecha inválido. Usa el formato: 12/01/2025 o "today" o "tomorrow"');
            }
            fechaTorneo = fechaTorneoParseada.set({
                'hour': parseInt(hora.split(':')[0]),
                'minute': parseInt(hora.split(':')[1]),
                'second': 0,
                'millisecond': 0
            });
        }

        // Comprobar que la fecha y hora no sea en el pasado
        if (fechaTorneo.isBefore(moment())) {
            return message.reply('❌ La fecha y hora seleccionadas ya pasaron. Elige una fecha futura.');
        }

        // Formatear la fecha a un formato adecuado (por ejemplo, "12/01/2025 17:20")
        const fechaFormateada = fechaTorneo.format('DD/MM/YYYY HH:mm');

        // Enviar el mensaje en el grupo y obtener el messageId
        const mensaje = await chat.sendMessage(`🏆 Torneo "${nombreTorneoFinal}" programado para el ${fechaFormateada}.`);
        // // pin the message
        // const messages = await chat.fetchMessages({ limit: 1 });
        // const lastMessage = messages[0];
        // await lastMessage.pin(); // Pone el último mensaje como "pinned" (destacado)

        const nuevosTorneos = leerTorneos();
        let id = generateID();

        nuevosTorneos.push({
            chatId: message.from,
            nombre: nombreTorneoFinal,
            fecha: fechaFormateada,
            id,
            messageId: mensaje.id, // Guardamos el ID del mensaje
            participantes: [] // Lista de participantes vacía por ahora
        });

        guardarTorneos(nuevosTorneos);

        // Mensaje de confirmación
        // message.reply(`🏆 Torneo "${nombreTorneoFinal}" programado para el ${fechaFormateada}. Los participantes que reaccionen tendrán acceso.`);
    }
};
