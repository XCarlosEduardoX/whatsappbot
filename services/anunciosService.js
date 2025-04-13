const fs = require('fs');
const path = require('path');

// Cargar anuncios del archivo JSON
async function cargarAnuncios() {
    const anunciosFile = path.join(__dirname, '../anuncios.json');
    let anuncios = [];
    if (fs.existsSync(anunciosFile)) {
        try {
            anuncios = JSON.parse(fs.readFileSync(anunciosFile));
        } catch (err) {
            console.error('❌ Error al leer anuncios.json:', err);
        }
    }
    return anuncios;
}

// Eliminar anuncio del archivo JSON
function eliminarAnuncio(id) {
    const anunciosFile = path.join(__dirname, '../anuncios.json');
    const anuncios = JSON.parse(fs.readFileSync(anunciosFile));
    anuncios.splice(anuncios.findIndex(anuncio => anuncio.id === id), 1);
    fs.writeFileSync(anunciosFile, JSON.stringify(anuncios, null, 2));
    console.log(`✅ Anuncio eliminado con éxito: ${id}`);
}

module.exports = { cargarAnuncios, eliminarAnuncio };
