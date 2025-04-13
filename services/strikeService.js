const fs = require('fs');
const path = require('path');

const strikesPath = path.join(__dirname, '../strikes.json');
let strikes = {};
if (fs.existsSync(strikesPath)) {
    try {
        strikes = JSON.parse(fs.readFileSync(strikesPath, 'utf-8'));
    } catch (err) {
        console.error('❌ Error al leer strikes.json:', err);
    }
}

function guardarStrikes() {
    try {
        fs.writeFileSync(strikesPath, JSON.stringify(strikes, null, 2), 'utf-8');
        console.log('✅ Strikes guardados.');
    } catch (err) {
        console.error('❌ Error al guardar strikes:', err);
    }
}

async function agregarStrike(autorId, chat, client) {
    // Verificamos si el usuario ya tiene strikes, si no, le asignamos 0
    if (!strikes[autorId]) strikes[autorId] = 0;

    // Incrementamos el strike
    strikes[autorId]++;
    console.log(`Strikes de ${autorId}: ${strikes[autorId]}`);

    // Guardamos los cambios en el archivo JSON
    guardarStrikes();

    // Si el usuario alcanza 3 strikes, lo expulsamos
    if (strikes[autorId] >= 10) {
        try {
            const contacto = await client.getContactById(autorId);
            await chat.removeParticipants([autorId]);
            await chat.sendMessage(
                `@${autorId.split('@')[0]} fue expulsado por acumular 3 strikes.`,
                { mentions: [contacto] }
            );
        } catch (err) {
            console.error('❌ Error al expulsar al usuario:', err);
        }
        // Limpiamos los strikes después de expulsar
        delete strikes[autorId];
        guardarStrikes();
    } else {
        try {
            const contacto = await client.getContactById(autorId);
            await chat.sendMessage(
                `@${autorId.split('@')[0]} 🚫 Tienes ${strikes[autorId]} strike(s).`,
                { mentions: [contacto] }
            );
        } catch (err) {
            console.error('❌ Error al enviar mensaje de advertencia:', err);
        }
    }
}

async function verificarStrikes(autorId) {
    // Devuelve el número de strikes del usuario
    return strikes[autorId] || 0;
}

module.exports = { agregarStrike, verificarStrikes };
