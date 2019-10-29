const settings = require('../config/settings');
module.exports = { //Get the portnumber from the environment variable
    getPortNumber: () => {
        return process.env.PORT || settings.defaultPort;
    }
};
