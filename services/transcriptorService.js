const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

// Función para transcribir el audio usando la API de AssemblyAI
async function transcribeAudio(filePath) {
    try {
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));

        // 1. Subir el archivo de audio
        const uploadRes = await axios.post('https://api.assemblyai.com/v2/upload', form, {
            headers: {
                ...form.getHeaders(),
                authorization: process.env.ASSEMBLY_API_KEY,
            },
        });

        const audioUrl = uploadRes.data.upload_url;

        // 2. Enviar la solicitud de transcripción
        const transcriptRes = await axios.post(
            'https://api.assemblyai.com/v2/transcript',
            { audio_url: audioUrl, auto_chapters: true },
            {
                headers: {
                    authorization: process.env.ASSEMBLY_API_KEY,
                    'content-type': 'application/json',
                },
            }
        );

        const transcriptId = transcriptRes.data.id;

        // 3. Esperar a que se complete la transcripción
        const checkTranscriptStatus = async (id) => {
            const { data } = await axios.get(`https://api.assemblyai.com/v2/transcript/${id}`, {
                headers: { authorization: process.env.ASSEMBLY_API_KEY },
            });
            return data;
        };

        // Verificar el estado de la transcripción con un tiempo de espera optimizado
        let transcript = await checkTranscriptStatus(transcriptId);
        while (transcript.status !== 'completed' && transcript.status !== 'error') {
            await new Promise((resolve) => setTimeout(resolve, 3000)); // Espera de 3 segundos antes de verificar nuevamente
            transcript = await checkTranscriptStatus(transcriptId); // Reintentar obtener el estado
        }

        if (transcript.status === 'completed') {
            // Si la transcripción está completa, devolver el resumen o el texto completo
            const resumen = transcript.chapters?.map((ch) => ch.summary).join('\n') || transcript.text;
            return resumen;
        } else {
            throw new Error('Error al transcribir el audio');
        }
    } catch (error) {
        console.error('Error en el proceso de transcripción:', error);
        throw new Error('Hubo un problema con la transcripción del audio.');
    }
}

module.exports = { transcribeAudio };
