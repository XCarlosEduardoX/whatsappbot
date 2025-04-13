const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { MessageMedia } = require('whatsapp-web.js');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

module.exports = {
    name: 'sticker',
    adminOnly: false,
    execute: async ({ message, chat, client }) => {
        // Verificar si el mensaje es una respuesta a un mensaje citado
        if (!message.hasQuotedMsg) {
            return message.reply('❌ Por favor, responde a un mensaje de imagen o video para convertirlo en sticker.');
        }

        // Obtener el mensaje citado
        const quotedMsg = await message.getQuotedMessage();
        console.log('Mensaje citado:', quotedMsg);  // Depuración
        // Verificar si el mensaje citado es una imagen o video
        const isImage = quotedMsg.type === 'image';
        const isVideo = quotedMsg.type === 'video';

        if (!isImage && !isVideo) {
            return message.reply('❌ El mensaje citado no es una imagen ni un video.');
        }

        if (isImage) {
            try {
                const imageFile = await quotedMsg.downloadMedia();
                if (!imageFile || !imageFile.data) throw new Error('❌ No se pudo descargar la imagen.');
                const imagePath = path.join(__dirname, '..', 'images', `${Date.now()}.jpg`);
                fs.writeFileSync(imagePath, imageFile.data);
                const media = new MessageMedia('image/jpeg', imageFile.data.toString('base64'));
                await message.reply(media, undefined, { sendMediaAsSticker: true });
                fs.unlinkSync(imagePath);
            } catch (error) {
                console.error('Error al procesar la imagen:', error);
                message.reply('❌ No se pudo procesar la imagen para el sticker.');
            }
        } else if (isVideo) {
            try {
                const buffer = quotedMsg.body; // ya es un Buffer
                const videoPath = path.join(__dirname, '..', 'media', `${Date.now()}.mp4`);

                fs.writeFileSync(videoPath, buffer); // guardamos el video

                //convertimos el video a .gif
                await ffmpeg(videoPath)
                    .save(videoPath.replace('.mp4', '.gif'))
                    .on('end', async () => {
                        const gifBuffer = await readFile(videoPath.replace('.mp4', '.gif'));
                        const media = new MessageMedia('image/gif', gifBuffer.toString('base64'));
                        await message.reply(media, undefined, { sendMediaAsSticker: true });
                        fs.unlinkSync(videoPath);
                        fs.unlinkSync(videoPath.replace('.mp4', '.gif'));
                    })
                    .on('error', (err) => {
                        console.error('Error al convertir el video a gif:', err);
                        message.reply('❌ No se pudo convertir el video a gif.');
                    });



            } catch (error) {
                console.error('Error al procesar el archivo de video:', error);
                message.reply('❌ No se pudo convertir el video en sticker.');
            }
        }
    }
};
