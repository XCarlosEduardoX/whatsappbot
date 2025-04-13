const moment = require('moment');
require('moment/locale/es'); // Esto es necesario para trabajar con fechas en español
const fs = require('fs');
const path = require('path');
const { EpicFreeGames } = require('epic-free-games');

const RUTA_JSON = path.join(__dirname, '../juegosenviados.json');

// ✅ Cargar juegos ya enviados (como array siempre)
function cargarEnviados() {
    try {
        if (fs.existsSync(RUTA_JSON)) {
            const data = fs.readFileSync(RUTA_JSON, 'utf8');
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed : [];
        }
    } catch (err) {
        console.error('❌ Error leyendo enviados.json:', err);
    }
    return [];
}

// ✅ Guardar lista de juegos enviados (solo los IDs)
function guardarEnviados(ids) {
    try {
        fs.writeFileSync(RUTA_JSON, JSON.stringify(ids, null, 2), 'utf8');
    } catch (err) {
        console.error('❌ Error guardando enviados.json:', err);
    }
}

// 🔍 Obtener juegos gratis de Epic Games usando la librería epic-free-games
async function getJuegosGratis() {
    const freeGames = [];
    const epicFreeGames = new EpicFreeGames({ country: 'US', locale: 'en', includeAll: true }); // Ajusta el país y el idioma si es necesario

    try {
        const juegos = await epicFreeGames.getGames(); // Obtenemos la lista de juegos gratuitos
        const juegosEnviados = cargarEnviados();

        if (juegos.currentGames.length > 0) {
            juegos.currentGames.forEach((juego) => {
                const id = juego.id;

                // Si el juego es gratuito y no se ha enviado antes
                if (!juegosEnviados.includes(id)) {
                    // Formatear la fecha de expiración usando moment.js
                    const fechaExpiracion = juego.expiryDate ? moment(juego.expiryDate).locale('es').format('LL') : 'Fecha de expiración no disponible';

                    const mensaje = `🎁JUEGO EPIC GAMES GRATIS DISPONIBLE🎁\n\n*${juego.title}* ahora está gratis en Epic Games.\n\n${juego.description}\n\n🔗 https://www.epicgames.com/store/es-ES/p/${juego.urlSlug}\n🗓️ Disponible hasta: ${fechaExpiracion}`;

                    freeGames.push({
                        id,
                        mensaje
                    });

                    juegosEnviados.push(id); // Evita reenvíos futuros
                }
            });

            // Guardamos los juegos enviados (solo los IDs) para evitar reenvíos
            guardarEnviados(juegosEnviados);

            return freeGames;
        } else {
            return freeGames;
        }
    } catch (err) {
        console.error('❌ Error al obtener juegos gratis de Epic Games:', err);
        return [];
    }
}

module.exports = { getJuegosGratis };
