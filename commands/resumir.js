const { transcribeAudio } = require('../services/transcriptorService');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { pipeline } = require('stream/promises');
const { tmpdir } = require('os');

module.exports = {
    name: 'resumir',
    adminOnly: false,
    execute: async ({ message, chat, client }) => {
        if (!message.hasQuotedMsg) {
            return message.reply('❌ Por favor, responde a un mensaje de audio para resumirlo.');
        }

        const quotedMsg = await message.getQuotedMessage();
        if (!['audio', 'ptt'].includes(quotedMsg.type)) {
            return message.reply('❌ El mensaje citado no es un archivo de audio o una nota de voz.');
        }

        // Usar el directorio temporal del sistema para mejor rendimiento
        const tempDir = path.join(tmpdir(), 'whatsapp_audios');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const fileName = `audio_${Date.now()}`;
        const opusPath = path.join(tempDir, `${fileName}.opus`);
        const mp3Path = path.join(tempDir, `${fileName}.mp3`);

        try {
            // 1. Descargar el audio de forma más eficiente
            const audioMedia = await quotedMsg.downloadMedia();

            if (!audioMedia?.data) {
                throw new Error('No se pudo descargar el archivo de audio');
            }

            // Escribir el archivo directamente sin conversión de base64 si es posible
            const audioBuffer = Buffer.isBuffer(audioMedia.data)
                ? audioMedia.data
                : Buffer.from(audioMedia.data, 'base64');

            await fs.promises.writeFile(opusPath, audioBuffer);

            // 2. Conversión optimizada a MP3
            await new Promise((resolve, reject) => {
                ffmpeg(opusPath)
                    .audioCodec('libmp3lame')
                    .audioBitrate('64k') // Reducir bitrate para mayor velocidad
                    .audioChannels(1)    // Mono es más rápido que estéreo
                    .audioFrequency(16000) // Frecuencia estándar para voz
                    .outputOptions([
                        '-preset ultrafast', // Priorizar velocidad sobre calidad
                        '-threads 0'        // Usar todos los núcleos del CPU
                    ])
                    .on('start', (cmd) => console.log('Convertiendo:', cmd))
                    .on('progress', (p) => console.log(`Progreso: ${p.targetSize}KB`))
                    .on('end', resolve)
                    .on('error', reject)
                    .save(mp3Path);
            });
            await chat.sendStateTyping();

            // 3. Transcribir en paralelo con la limpieza
            const [transcript] = await Promise.all([
                transcribeAudio(mp3Path),
                // Limpiar el archivo OPUS mientras se transcribe
                fs.promises.unlink(opusPath).catch(console.error)
            ]);

            // Limitar la longitud del mensaje para evitar errores
            const maxLength = 4096; // Límite de WhatsApp
            const replyText = transcript.length > maxLength
                ? `📝 Transcripción (resumida):\n${transcript.substring(0, maxLength - 100)}...`
                : `📝 Transcripción:\n${transcript}`;

            await message.reply(replyText);

        } catch (error) {
            console.error('Error en resumir:', error);
            await message.reply('❌ Error al procesar el audio: ' + error.message);
        } finally {
            // Limpieza garantizada
            try {
                if (fs.existsSync(mp3Path)) await fs.promises.unlink(mp3Path);
            } catch (cleanError) {
                console.error('Error limpiando archivos:', cleanError);
            }
        }
    }
};