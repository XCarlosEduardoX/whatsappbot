const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../config.json');

let config = {};
if (fs.existsSync(configPath)) {
  try {
    const data = fs.readFileSync(configPath, 'utf-8');
    config = JSON.parse(data);
  } catch (err) {
    console.error('❌ Error al leer config.json:', err);
    config = {};
  }
}

function guardarConfig() {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    console.log('✅ Configuración guardada exitosamente.');
  } catch (err) {
    console.error('❌ Error al guardar config.json:', err);
  }
}

module.exports = {
  name: 'unmute',
  adminOnly: true,

  execute: async ({ message, chat, client, autorEsAdmin }) => {
    await chat.sendStateTyping();

    if (!autorEsAdmin) {
      return message.reply('❌ Este comando solo puede ser ejecutado por administradores.');
    }

    try {
      if (chat.isMuted) {
        await chat.unmute();
        console.log('🔓 Chat desmuteado manualmente.');
      }

      if (config.mute) {
        delete config.mute;
        guardarConfig();
        return message.reply('✅ Chat desmuteado y configuración de mute eliminada.');
      } else {
        return message.reply('ℹ️ No hay ninguna configuración de mute activa.');
      }

    } catch (err) {
      console.error('❌ Error al ejecutar /unmute:', err);
      return message.reply('❌ Ocurrió un error al intentar desmutear el chat.');
    }
  }
};
