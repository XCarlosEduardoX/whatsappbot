module.exports = {
    name: 'saludo',
    adminOnly: false,
    execute: async ({ message, chat }) => {
        // sendStateTyping
        await chat.sendStateTyping();
        const contacto = await message.getContact();
        const nombre = contacto.pushname || 'amigo';
        message.reply(`👋 ¡Hola, ${nombre}! ¿En qué te puedo ayudar hoy?`);
    }
};
