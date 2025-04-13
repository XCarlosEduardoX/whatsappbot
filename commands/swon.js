const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../config.json');

// Cargar configuración desde config.json
let config = (() => {
    if (fs.existsSync(configPath)) {
        try {
            const data = fs.readFileSync(configPath, 'utf-8');
            return JSON.parse(data);
        } catch (err) {
            console.error('❌ Error al leer config.json:', err);
        }
    } else {
        console.log('ℹ️ El archivo config.json no existe. Se creará al guardar.');
    }
    return { swon: false };  // Default si no existe config.json
})();

// Guardar configuración
const guardarConfig = () => {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        console.log('✅ Configuración guardada exitosamente.');
    } catch (err) {
        console.error('❌ Error al guardar config.json:', err);
    }
};

module.exports = {
    name: 'swon',
    adminOnly: true,

    execute: async ({ message, chat, args, autorEsAdmin }) => {
        await chat.sendStateTyping();

        if (!autorEsAdmin) {
            return message.reply('❌ No tienes permisos para usar este comando.');
        }

        // Validar argumentos
        if (args.length < 1 || (args[0] !== 'true' && args[0] !== 'false')) {
            return message.reply('❌ Por favor, usa el formato correcto: /swon <true|false>.');
        }

        // Establecer swon según el argumento
        config.swon = args[0] === 'true';
        guardarConfig();

        const estado = config.swon
            ? '✅ *Swon activado*. El bot ahora permitirá palabras ofensivas.'
            : '✅ *Swon desactivado*. El bot ahora bloqueará palabras ofensivas.';

        return message.reply(estado);
    }
};
