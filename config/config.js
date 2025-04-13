const { Client, LocalAuth } = require('whatsapp-web.js');

module.exports.clientOptions = {
    authStrategy: new LocalAuth(),
    
};
