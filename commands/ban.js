module.exports = {
    name: 'ban',
    adminOnly: true,
    execute: async ({ message, chat, botEsAdmin }) => {
        if (!botEsAdmin) return message.reply('Necesito ser administrador para banear.');

        const mentioned = message.mentionedIds;
        if (mentioned.length === 0) return message.reply('Menciona a alguien para banear.');

        for (const id of mentioned) {
            await chat.removeParticipants([id]);
            message.reply(`⛔ Usuario baneado: ${id}`);
        }
    }
};
