const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Requerimos servicios y configuraciones
const { generarQR } = require('./utils/fileUtils');
const { cargarAnuncios, eliminarAnuncio } = require('./services/anunciosService');
const { cargarComandos } = require('./services/botService');
const { clientOptions } = require('./config/config');
const { leerPartidas, eliminarPartida } = require('./services/partidaService');
const { cargarConfiguraciones, guardarConfiguraciones } = require('./services/configService');
const moment = require('moment');
const { detectarSpam } = require('./functions/detectarSpam');
const { detectarMalasPalabras } = require('./functions/detectarGroserias');
const { getJuegosGratis } = require('./services/juegosGratisService');
const client = new Client(clientOptions);
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
// Generar QR

app.use(express.static(path.join(__dirname)));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'qr.html'));
});



client.on('qr', async (qr) => {
    console.log('Generando imagen QR...');
    //genear qr cada 2 minutos
   minutos
    await generarQR(qr, './qr.png');
    const qrLink = await qrcode.toDataURL(qr);

    // Guardar el enlace en un archivo HTML (opcional)
    fs.writeFileSync('./qr.html', `<img src="${qrLink}" />`);
    console.log('QR generado. Escanea el código QR con tu WhatsApp.');

});


app.listen(PORT, () => {
    console.log(`🚀 Servidor Express activo en http://localhost:${PORT}`);
});

// Conexión lista
client.on('ready', async () => {
    console.log('✅ Bot conectado y funcionando.');
    // // obtener el chatId del grupo
    // let config = await cargarConfiguraciones();

    // if (config.chatId !== undefined) {
    //     // Obtener el chat utilizando el chatId almacenado
    //     const chat = await client.getChatById(config.chatId);

    //     // Asegurarse de que chat.id._serialized esté disponible
    //     const chatId = chat.id._serialized;

    //     // Verificar si el chatId de la configuración es el mismo que el actual
    //     if (config.chatId === chatId) return;

    //     // Si no es el mismo chatId, no se puede usar el bot en este chat
    //     if (config.chatId !== chatId) {
    //         return;
    //     }
    // } else {
    //     // Si no se encuentra un chatId en la configuración, establecer uno nuevo
    //     const chat = await client.getChatById(config.chatId);
    //     const chatId = chat.id._serialized; // Definir chatId

    //     // Asignar y guardar el nuevo chatId en la configuración
    //     config.chatId = chatId;
    //     await guardarConfiguraciones(config);
    // }
});
// Cargar comandos dinámicamente
const comandos = cargarComandos();

// Escuchar mensajes
client.on('message', async (message) => {
    const chat = await message.getChat();
    // if (!chat.isGroup) return;
    // Si no es un grupo, no hacer nada

    let autorId = message.author || message.from;
    let autorEsAdmin = true;
    let botEsAdmin = true;
    let esGrupo = false;;
    if (!chat.isGroup) {

    } else {
        esGrupo = true;
        autorId = message.author || message.from;
        autorEsAdmin = chat.participants.find(p => p.id._serialized === autorId)?.isAdmin;
        botEsAdmin = chat.participants.find(p => p.id._serialized === client.info.wid._serialized)?.isAdmin;
        if (botEsAdmin) {
            await detectarSpam(message, chat, client, autorId, esGrupo);
            await detectarMalasPalabras(message, chat, client, autorId, esGrupo);
        }
    }

    if (message.body.startsWith('/')) {
        const [cmdName, ...args] = message.body.slice(1).split(' ');
        const comando = comandos[cmdName.toLowerCase()];
        if (comando) {
            try {
                await comando.execute({ message, chat, client, args, autorEsAdmin, botEsAdmin, esGrupo });
            } catch (err) {
                console.error(`Error en comando ${cmdName}:`, err);
                message.reply('❌ Ocurrió un error al ejecutar el comando.');
            }
        }
    }
});
// Escuchar reacciones
client.on('vote_update', (vote) => {
    console.log('Voto recibido:', vote);
    // const voter = pollVote.sender;
    // const selectedOptions = pollVote.selectedOptions;
    // const pollMessage = pollVote.parentMessage;

    // const poll = await pollMessage.getPoll();
    // const opciones = poll.options;

    // const opcionesSeleccionadas = selectedOptions.map(i => opciones[i].name).join(', ');
    // console.log(`${voter.pushname || voter.id.user} votó por: ${opcionesSeleccionadas}`);
});


client.initialize();

// Cronjob para revisar anuncios programados cada minuto
cron.schedule('*/1 * * * *', async () => {
    await ejecutarAnuncios();
    await ejecutarPartidas();
    await ejecutarMute();
    await ejecutarJuegosGratis();
});


async function obtenerMenciones(participantes, client) {
    // Crear una lista de menciones con los ids correspondientes
    const menciones = participantes.map(async (p) => {
        const contacto = await client.getContactById(p.id._serialized); // Obtener el contacto por su ID
        return contacto.id._serialized; // Retornar solo el ID serializado
    });

    // Esperar que todas las menciones sean resueltas
    let contacts = await Promise.all(menciones);
    // Filtrar contactos para evitar mencionar al bot (si es necesario)
    contacts = contacts.filter(id => id !== client.info.wid._serialized);

    return contacts;
}

async function enviarMensajeProgramado(chat, partida, contacts, minutes) {
    if (minutes === 5) await chat.sendMessage(`🕹️ RECORDATORIO DE PARTIDA\n\n*${partida.mensaje}*\n\n Comienza en ${minutes} minutos.`, {
        mentions: contacts // Mencionar a todos los participantes
    });
    if (minutes === 1) await chat.sendMessage(`🕹️ RECORDATORIO DE PARTIDA\n\n"${partida.mensaje}"\n\n Comienzaen ${minutes} minuto.`, {
        mentions: contacts // Mencionar a todos los participantes
    });


    // Pin the message
    const messages = await chat.fetchMessages({ limit: 1 });
    const lastMessage = messages[0];
    await lastMessage.pin(); // Pone el último mensaje como "pinned" (destacado)
}

async function ejecutarPartidas() {
    const partidas = leerPartidas();
    const horaActual = moment().format('HH:mm'); // Obtener la hora actual en formato "HH:mm"

    for (let partida of partidas) {
        let horaPartida = moment(partida.hora, 'HH:mm');


        // 5 minutos antes
        let cincoMinutosAntes = horaPartida.clone().subtract(5, 'minutes').format('HH:mm');
        // 1 minuto antes
        let unMinutoAntes = horaPartida.clone().subtract(1, 'minute').format('HH:mm');

        // Si es el momento adecuado para enviar el mensaje
        if ([cincoMinutosAntes, unMinutoAntes, horaPartida.format('HH:mm')].includes(horaActual)) {
            const chat = await client.getChatById(partida.chatId);
            const participantes = chat.participants; // Usamos chat.participants

            const contacts = await obtenerMenciones(participantes, client);
            console.log('Participantes:', contacts);

            //obtener el seialized de cada participante


            if (horaActual === cincoMinutosAntes || horaActual === unMinutoAntes) {
                if (horaActual === cincoMinutosAntes) await enviarMensajeProgramado(chat, partida, contacts, 5)
                if (horaActual === unMinutoAntes) await enviarMensajeProgramado(chat, partida, contacts, 1);
            }

            if (horaActual === horaPartida.format('HH:mm')) {
                await chat.sendMessage(`🎉 ¡La partida ha comenzado! 🎉\n🕹️ Llegó el momento de jugar\n\n*${partida.mensaje}*\n\n Ya comenzó`, {
                    mentions: contacts // Mencionar a todos los participantes
                });
                eliminarPartida(partida.id);

            }
        }
    }
}


async function ejecutarAnuncios() {
    const anuncios = await cargarAnuncios();
    const now = new Date();
    const horaActual = now.toTimeString().slice(0, 5); // "HH:MM"
    // console.log(`⏰ Revisando anuncios programados a las ${horaActual}...`);

    anuncios.forEach(async (anuncio, index) => {
        if (anuncio.hora === horaActual) {
            try {
                const chat = await client.getChatById(anuncio.chatId);
                const participantes = chat.participants; // Usamos chat.participants

                const contacts = await obtenerMenciones(participantes, client);
                console.log('Participantes:', contacts);
                await chat.sendMessage(`📢 ANUNCIO\n*${anuncio.mensaje}*`, {
                    mentions: contacts // Mencionar a todos los participantes
                });
                eliminarAnuncio(anuncio.id);
            } catch (err) {
                console.error('❌ Error enviando anuncio:', err);
            }
        }
    });
}

async function ejecutarMute() {
    const config = await cargarConfiguraciones();
    if (!config.mute) return;

    const chat = await client.getChatById(config.mute.chatId);
    if (!chat) return;

    const now = new Date();

    // Si el mute es onlyOneTime (no se repite diariamente)
    if (config.mute.onlyOneTime) {
        const closeTime = new Date();
        const [closeHour, closeMinute] = config.mute.close.split(':');
        closeTime.setHours(parseInt(closeHour), parseInt(closeMinute), 0, 0);

        const openTime = new Date();
        const [openHour, openMinute] = config.mute.open.split(':');
        openTime.setHours(parseInt(openHour), parseInt(openMinute), 0, 0);

        // 🔒 Si aún no se ha muteado, y estamos entre hora de cierre y apertura
        if (!config.mute.muted && now >= closeTime && now < openTime) {
            await chat.mute(openTime);
            config.mute.muted = true;
            config.mute.unmuted = false;
            guardarConfiguraciones(config);
        }

        // 🔓 Si ya está muteado pero ya pasó la hora de apertura
        if (config.mute.muted && !config.mute.unmuted && now >= openTime) {
            await chat.unmute();
            config.mute.unmuted = true;
            guardarConfiguraciones(config);
        }

    } else {
        // 🔁 Modo diario
        const [closeHour, closeMinute] = config.mute.close.split(':');
        const [openHour, openMinute] = config.mute.open.split(':');

        const closeTime = new Date();
        closeTime.setHours(parseInt(closeHour), parseInt(closeMinute), 0, 0);

        const openTime = new Date();
        openTime.setHours(parseInt(openHour), parseInt(openMinute), 0, 0);

        // Si estamos en la ventana de muteo
        if (now >= closeTime && now < openTime && !chat.isMuted) {
            await chat.mute(openTime);
        }

        // Si ya pasó la hora de apertura y el chat sigue muteado
        if (now >= openTime && chat.isMuted) {
            await chat.unmute();
        }
    }
}


async function ejecutarJuegosGratis() {
    const config = await cargarConfiguraciones();
    const chat = await client.getChatById(config.chatId);

    // Obtener los juegos gratis
    const juegos = await getJuegosGratis();

    for (const juego of juegos) {
        if (!chat) continue;

        // Aquí accedemos al mensaje ya que `juego` ahora es un objeto con propiedades `id` y `mensaje`
        const mensaje = juego.mensaje;

        // Enviar el mensaje al chat
        await chat.sendMessage(mensaje);
    }
}




