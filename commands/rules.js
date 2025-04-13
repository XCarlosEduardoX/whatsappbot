const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../config.json');

module.exports = {
    name: 'rules',
    adminOnly: false,
    execute: async ({ message, chat }) => {
        await chat.sendStateTyping();
        try {
            const configData = fs.readFileSync(configPath, 'utf-8');
            const config = JSON.parse(configData);
            const reglas = config.reglas || '⚠️ No hay reglas configuradas todavía.';
            await message.reply(`ℹ️ Las reglas son:\n${reglas}`);
        } catch (err) {
            console.error('❌ Error al leer config.json:', err);
            await message.reply('⚠️ Error al leer las reglas.');
        }
    }
};
