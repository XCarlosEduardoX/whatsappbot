const fs = require('fs');
const path = require('path');
const configFile = path.join(__dirname, '../config.json');

// Cargar anuncios del archivo JSON
async function cargarConfiguraciones() {
    let config = {};
    if (fs.existsSync(configFile)) {
        try {
            const data = fs.readFileSync(configFile);
            config = JSON.parse(data);
        } catch (err) {
            console.error('❌ Error al leer config.json:', err);
        }
    }
    return config;
}

async function guardarConfiguraciones(config) {

    try {
        fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8');
        console.log('✅ Configuración guardada exitosamente.');
    } catch (err) {
        console.error('❌ Error al guardar config.json:', err);
    }
}


module.exports = { cargarConfiguraciones, guardarConfiguraciones };
