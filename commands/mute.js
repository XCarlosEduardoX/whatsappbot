// module.exports = {
//     name: 'mute',

//     adminOnly: true,
//     execute: async ({ message, chat, client, args, autorEsAdmin }) => {




//         if (!autorEsAdmin) {
//             return message.reply('❌ Este comando solo puede ser ejecutado por administradores.');
//         }

//         try {
//             console.log('Cerrando chat...',chat);
//             // mute(unmuteDate)

//             await chat.mute(new Date('2025-04-07'));
//             message.reply('✅ El chat ha sido cerrado para los usuarios normales.');
//         } catch (err) {
//             console.error('❌ Error al cerrar el chat:', err);
//             message.reply('❌ Ocurrió un error al cerrar el chat.');
//         }
//     }
// };
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../config.json');

console.log('Ruta del archivo de configuración:', configPath);

// Cargar configuración de mute desde config.json
let config = {};
if (fs.existsSync(configPath)) {
    try {
        const data = fs.readFileSync(configPath, 'utf-8');
        config = JSON.parse(data);

    } catch (err) {
        console.error('❌ Error al leer config.json:', err);
        config = {}; // Si hay un error al leer, inicializamos el objeto vacío
    }
} else {
    console.log('ℹ️ El archivo config.json no existe. Se creará al guardar.');
}

// Guardar configuración de mute en config.json
function guardarConfig() {
    try {
        // Asegurarnos de que la estructura es válida antes de escribir
        if (!config.mute) {
            config.mute = {};
        }
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        console.log('✅ Configuración guardada exitosamente.');

    } catch (err) {
        console.error('❌ Error al guardar config.json:', err);
    }
}

module.exports = {
    name: 'mute',
    adminOnly: true,
    execute: async ({ message, chat, client, args, autorEsAdmin }) => {
        await chat.sendStateTyping();

        // Validar si el autor es admin
        if (!autorEsAdmin) {
            return message.reply('❌ Este comando solo puede ser ejecutado por administradores.');
        }

        // Validación de los argumentos
        if (args.length < 1) {
            return message.reply('❌ Por favor, usa el formato correcto: /mute <hora de cierre> <hora de apertura> [daily] o /mute now [hora de apertura].');
        }

        let closeTime, openTime, daily = false, now = false;

        if (args[0] === 'now') {
            // Si el primer argumento es 'now', se debe cerrar ahora
            now = true;
            closeTime = new Date().toISOString();  // Usamos la fecha y hora actuales para el cierre inmediato

            // Si hay un segundo argumento, lo tomamos como la hora de apertura
            if (args[1]) {
                openTime = args[1];
            } else {
                // Si no hay segundo argumento, se usa la fecha y hora actuales mas 1 año
                openTime = new Date().setFullYear(new Date().getFullYear() + 1).toISOString();
            }
        } else {
            // Si no es 'now', interpretamos los dos primeros argumentos como las horas
            closeTime = args[0];
            openTime = args[1];

            // Verificamos si el comando es 'daily'
            daily = args[2] === 'daily';
        }

        // Validar el formato de las horas si no es 'now'
        const regex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
        if (!now && (!regex.test(closeTime) || !regex.test(openTime))) {
            return message.reply('❌ Por favor, ingresa las horas en formato correcto: HH:MM.');
        }

        // Configurar los datos de mute
        config.mute = {
            close: closeTime,
            open: openTime,
            daily: daily,
            chatId: chat.id._serialized,
            now: now,
            onlyOneTime: !daily,
            muted: false
        };
        console.log('Configuración de mute:', config.mute);
        // Guardar la configuración en el archivo

        if (now) {
            const chat = await client.getChatById(config.mute.chatId);

            if (chat) {
                chat.mute(new Date(config.mute.open)).then(() => {
                    console.log('Chat cerrado');
                    guardarConfig();
                }).catch((err) => {
                    console.error('❌ Error al cerrar el chat:', err);
                    message.reply('❌ Ocurrió un error al cerrar el chat.');
                });
            }

        }else{
            guardarConfig();
        }

        // Responder al usuario según el caso
        if (now && openTime) {
            // Caso: /mute now <hora de apertura>
            return message.reply(`✅ El chat se cerrará de inmediato y se abrirá a las ${openTime}.`);
        } else if (now) {
            // Caso: /mute now
            return message.reply(`✅ El chat se cerrará de inmediato sin apertura programada.`);
        } else if (daily) {
            // Caso: /mute <hora de cierre> <hora de apertura> daily
            return message.reply(`✅ Configuración guardada: El chat se cerrará a las ${closeTime} y se abrirá a las ${openTime} todos los días.`);
        } else {
            // Caso: /mute <hora de cierre> <hora de apertura>
            return message.reply(`✅ Configuración guardada: El chat se cerrará a las ${closeTime} y se abrirá a las ${openTime} una sola vez.`);
        }
    }
};
