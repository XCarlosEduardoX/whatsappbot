const path = require('path');
const fs = require('fs');
const partidasFile = path.join(__dirname, '../partidas.json');

// Leer partidas desde el archivo
function leerPartidas() {
    if (fs.existsSync(partidasFile)) {
        try {
            const data = fs.readFileSync(partidasFile, 'utf8');
            // Verificar si el archivo está vacío o tiene contenido no válido
            if (!data.trim()) {
                return []; // Si está vacío, devolver un arreglo vacío
            }
            // Intentar parsear el JSON
            const partidas = JSON.parse(data);
            // Verificar que la estructura sea la esperada (arreglo de objetos)
            if (!Array.isArray(partidas)) {
                throw new Error('Formato de datos no válido');
            }
            return partidas;
        } catch (err) {
            console.error('❌ Error al leer partidas.json:', err);
            return []; // Si ocurre un error, devolver un arreglo vacío
        }
    } else {
        // Si el archivo no existe, devolver un arreglo vacío y crearlo
        fs.writeFileSync(partidasFile, JSON.stringify([]));
        return [];
    }
}

// Guardar partidas en el archivo JSON
function guardarPartidas(partidas) {
    try {
        fs.writeFileSync(partidasFile, JSON.stringify(partidas, null, 2)); // Formatear con 2 espacios
    } catch (err) {
        console.error('❌ Error al guardar partidas.json:', err);
    }
}

function generateID() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// eliminarPartida
function eliminarPartida(id) {
    const partidas = leerPartidas();
    const index = partidas.findIndex(partida => partida.id === id);
    if (index !== -1) {
        partidas.splice(index, 1);
        guardarPartidas(partidas);
        console.log(`✅ Partida eliminada con éxito: ${id}`);
    } else {
        console.error(`❌ Partida no encontrada: ${id}`);
    }
}

module.exports = {
    leerPartidas,
    guardarPartidas,
    generateID,
    eliminarPartida,
}
