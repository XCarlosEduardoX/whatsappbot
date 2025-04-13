const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const dbPath = path.join(__dirname, '../usuarios.json');

module.exports = {
  name: 'stats',
  adminOnly: false,

  execute: async ({ message, chat, args, client }) => {
    let usuarios;

    try {
      usuarios = JSON.parse(fs.readFileSync(dbPath));
    } catch (err) {
      console.error('❌ Error al leer usuarios.json:', err);
      await client.sendMessage(chat.id._serialized, '❌ Error interno al cargar datos de usuarios.');
      return;
    }

    const juego = args[0]?.toLowerCase();

    if (!juego) {
      await client.sendMessage(chat.id._serialized, '❌ Debes especificar el juego. Ejemplo: `!stats valorant`');
      return;
    }

    const targetId = message.mentionedIds?.[0] || message.from;
    const userData = usuarios[targetId];

    if (!userData || !userData[juego]) {
      await client.sendMessage(chat.id._serialized, `❌ Este usuario no tiene una cuenta vinculada para el juego *${juego}*.`);
      return;
    }

    const riotID = userData[juego];
    const [username, tag] = riotID.split('#');

    if (!username || !tag) {
      await client.sendMessage(chat.id._serialized, '❌ El Riot ID vinculado no es válido.');
      return;
    }

    if (juego === 'valorant') {
      try {
        const res = await axios.get(`https://api.henrikdev.xyz/valorant/v1/account/${username}/${tag}`, {
          headers: {
            accept: 'application/json',
            Authorization: `${process.env.HENRIKDEV_API_KEY}`,
          }
        });

        const data = res.data.data;
        if (!data) {
          await client.sendMessage(chat.id._serialized, '❌ No se encontraron stats para este usuario.');
          return;
        }

        const reply = `📊 *Stats de Valorant: ${riotID}*
📍 Región: ${data.region.toUpperCase()}
🎮 Nivel de cuenta: ${data.account_level}
🕹️ Última vez activo: ${data.last_update}
🏆 Activo desde: ${data.created_at}`;

        await client.sendMessage(chat.id._serialized, reply);
      } catch (error) {
        console.error('❌ Error al obtener stats de Valorant:', error?.response?.data || error);
        await client.sendMessage(chat.id._serialized, '❌ No se pudieron obtener las stats de Valorant. Verifica que el Riot ID sea correcto.');
      }

    } else if (['lol', 'league', 'leagueoflegends', 'leagues'].includes(juego)) {
      try {
        const res = await axios.get(`https://lan.api.riotgames.com/lol/summoner/v4/summoners/by-name/${username}?api_key=${process.env.LOL_API_KEY}`);
        const data = res.data;

        if (!data) {
          await client.sendMessage(chat.id._serialized, '❌ No se encontraron stats para este usuario.');
          return;
        }

        const reply = `📊 *Stats de League of Legends: ${riotID}*
👤 Nombre: ${data.name}
🎮 Nivel de invocador: ${data.summonerLevel}
🆔 ID: ${data.id}`;

        await client.sendMessage(chat.id._serialized, reply);
      } catch (error) {
        console.error('❌ Error al obtener stats de LoL:', error?.response?.data || error);
        await client.sendMessage(chat.id._serialized, '❌ No se pudieron obtener las stats de LoL. Verifica que el Riot ID sea correcto.');
      }

    } else {
      await client.sendMessage(chat.id._serialized, `❌ Aún no tengo soporte para el juego *${juego}*.`);
    }
  }
};
