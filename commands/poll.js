const { Poll } = require('whatsapp-web.js');

module.exports = {
    name: 'poll',
    adminOnly: true,
    execute: async ({ message, args }) => {
        await message.react('🗳️');

        const input = args.join(' ');

        if (!input.includes('?') || !input.includes('/')) {
            return message.reply('❌ Usa el formato: /poll ¿Qué jugamos? Valorant/WZ/Fortnite');
        }

        const [preguntaParte, opcionesParte] = input.split('?');
        const pregunta = preguntaParte.trim() + '?';
        const opciones = opcionesParte.trim().split('/').map(opt => opt.trim()).filter(opt => opt.length > 0);

        if (opciones.length < 2) {
            return message.reply('❌ Necesitas al menos dos opciones para crear una encuesta.');
        }

        // Crear y enviar la encuesta
        await message.reply(new Poll(pregunta, opciones));
    }
};
