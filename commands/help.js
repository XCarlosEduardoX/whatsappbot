module.exports = {
    name: 'help',
    adminOnly: false,
    execute: async ({ message, autorEsAdmin }) => {
        if (!autorEsAdmin) {
            let texto = '🤖 *Comandos disponibles:*\n';
            const comandos = ['advert', 'song', 'saludo', 'help',];
            comandos.forEach(c => texto += `• !${c}\n`);
            message.reply(texto);
        } else {
            let texto = '🤖 *Comandos disponibles:*\n';
            const comandos = ['advert', 'poll', 'tourney', 'song', 'saludo', 'mute', 'unmute', 'help', 'strike', 'kick', 'ban'];

            comandos.forEach(c => texto += `• !${c}\n`);
            message.reply(texto);
        }
    }
};
