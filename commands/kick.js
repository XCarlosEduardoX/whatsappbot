module.exports = {
    name: 'kick',
    adminOnly: true,
    execute: async ({ message, chat, botEsAdmin }) => {
        await chat.sendStateTyping();

        if (!botEsAdmin) {
            return message.reply('Necesito ser administrador para expulsar.');
        }

        const mencionados = message.mentionedIds;

        if (!mencionados || mencionados.length === 0) {
            return message.reply('❌ No se mencionó a ningún usuario para expulsar. Ej: !kick @usuario');
        }

        for (const id of mencionados) {
            try {
                await chat.removeParticipants([id]);
                await message.reply(`🚫 Usuario expulsado: ${id}`);
            } catch (error) {
                await message.reply(`❌ No se pudo expulsar al usuario: ${id}`);
                console.error(`Error al expulsar a ${id}:`, error);
            }
        }
    }
};
