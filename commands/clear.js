module.exports = {
    name: 'clear',
    adminOnly: true,
    execute: async ({ message, chat, client, args, autorEsAdmin }) => {

        if (!autorEsAdmin) {
            return message.reply('❌ Este comando solo puede ser ejecutado por administradores.');
        }

        try {
            // Obtén todos los mensajes del chat
            const mensajes = await chat.fetchMessages();
            
            // Elimina los mensajes en un bucle
            for (let msg of mensajes) {
                try {
                    await msg.delete(); // Eliminar mensaje individual
                } catch (err) {
                    console.error(`❌ No se pudo eliminar el mensaje: ${msg.id._serialized}`, err);
                }
            }
            message.reply('✅ El chat ha sido limpiado.');
        } catch (err) {
            console.error('❌ Error al intentar limpiar el chat:', err);
            message.reply('❌ Ocurrió un error al intentar limpiar el chat.');
        }
    }
};
