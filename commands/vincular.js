const fs = require('fs');
const path = require('path');
const fsPromises = fs.promises;

const dbPath = path.join(__dirname, '../usuarios.json');

// Asegúrate de que el archivo existe
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({}));
}

module.exports = {
    name: 'vincular',
    adminOnly: false,

    execute: async ({ message, chat, args, client }) => {
        const senderId = message.from;

        if (args.length !== 2) {
            await client.sendMessage(chat.id._serialized, '❌ Uso correcto: !vincular valorant nombre#tag');
            return;
        }

        const juego = args[0].toLowerCase();
        const gameID = args[1];

        const juegosPermitidos = ['valorant', 'lol'];

        if (!juegosPermitidos.includes(juego)) {
            await client.sendMessage(chat.id._serialized, '⚠️ Por ahora solo puedes vincular Valorant y League of Legends.');
            return;
        }

        if (!gameID.includes('#')) {
            await client.sendMessage(chat.id._serialized, '❌ El Riot ID debe contener "#" (Ejemplo: Erebus#LAN)');
            return;
        }

        try {
            const data = await fsPromises.readFile(dbPath, 'utf8');
            const usuarios = JSON.parse(data);

            // Si no existe el usuario, lo inicializa
            if (!usuarios[senderId]) {
                usuarios[senderId] = {};
            }

            // Guarda el ID del juego correspondiente sin sobrescribir los otros
            usuarios[senderId][juego] = gameID;

            await fsPromises.writeFile(dbPath, JSON.stringify(usuarios, null, 2));
            await client.sendMessage(chat.id._serialized, `✅ Has sido vinculado como ${gameID} para ${juego}.`);
        } catch (error) {
            console.error('Error al manejar usuarios.json:', error);
            await client.sendMessage(chat.id._serialized, '❌ Ocurrió un error al guardar tus datos. Intenta nuevamente.');
        }
    }
};
