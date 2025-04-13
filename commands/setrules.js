const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../config.json');

module.exports = {
    name: 'setrules',
    adminOnly: true,
    execute: async ({ message, chat, args }) => {
        if (!chat.isGroup) return;

        const isAdmin = chat.participants.find(p => p.id._serialized === message.author)?.isAdmin || message.fromMe;
        if (!isAdmin) return message.reply('❌ Solo los administradores pueden cambiar las reglas.');

        const nuevasReglas = args.join(' ');
        if (!nuevasReglas) {
            return message.reply('✍️ Escribe las nuevas reglas después del comando. Ejemplo:\n*setreglas Respeto ante todo.*');
        }

        // Leer, actualizar y guardar config
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        config.reglas = nuevasReglas;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        await chat.sendStateTyping();
        message.reply('✅ Las reglas han sido actualizadas.');
    }
};
