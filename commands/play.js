const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ytdl = require('@distube/ytdl-core');
const ytSearch = require('yt-search');

ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = {
    name: 'play',
    adminOnly: false,
    execute: async ({ message, chat, args, client }) => {
        if (args.length === 0) {
            return message.reply('❌ Escribe el nombre de la canción. Ej: /reproducir avicii wake me up');
        }

        await chat.sendStateRecording();

        const query = args.join(' ') + ' official lyrics';
        const { videos } = await ytSearch(query);
        const video = videos[0];

        if (!video) return message.reply('❌ No encontré la canción.');

        const audioStream = ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio' });
        const audioPath = path.join(__dirname, '..', 'audios', `${Date.now()}.mp3`);

        ffmpeg(audioStream)
            .audioBitrate(128)
            .on('end', async () => {
                if (!fs.existsSync(audioPath)) {
                    return message.reply('❌ El archivo de audio no se encuentra.');
                }

                try {
                    const media = MessageMedia.fromFilePath(audioPath);
                    await client.sendMessage(message.from, media, {
                        caption: `🎵 Aquí tienes "${video.title}"`,
                        mimetype: 'audio/mp4'
                    });

                    console.log('Audio enviado correctamente');
                } catch (err) {
                    message.reply('❌ Ocurrió un error al enviar el audio.');
                } finally {
                    fs.unlink(audioPath, err => {
                        if (err) console.error('❌ Error al eliminar archivo:', err);
                    });
                }
            })
            .on('error', err => {
                message.reply('❌ Ocurrió un error al convertir el audio.');
            })
            .output(audioPath)
            .run();
    }
};
