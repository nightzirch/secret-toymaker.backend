const unirest = require('unirest');
/**
* isValidResponse - Quick check to see if the response is not null && has the http code 200
*/
let isValidResponse = (response) => {
    if (response === null) {
        return false;
    }
    let valid = response.code === 200;
    return true;
};

module.exports = {
    /**
    *  replaceUrlParameter - Replaces placeholders in a "url" with actual values
    *
    */
    replaceUrlParameter: (url, data) => {
        let result = url;
        for (let variable in data) {
            if (data.hasOwnProperty(variable)) {
                let param = variable;
                let value = data[variable];
                result = result.replace(`{${param}}`, value);
            }
        }
        return result;
    },
    /**
    * post - Helper method for calling webmegler with a POST request.
    */
    post: (url, data, callback) => {
        let app = this;
        unirest.post(url)
            .headers({
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            })
            .send(data)
            .end((response) => {
                let result = isValidResponse(response);
                if (result) {
                    return callback(null, response.body);
                } else {
                    return callback(response.body);
                }
            });
    },
    /**
    * get - Helper method for calling webmegler with a GET request.
    */
    get: (url, callback) => {
        let app = this;
        unirest.get(url)
            .headers({
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            })
            .send()
            .end((response) => {
                let result = isValidResponse(response);
                if (result) { //We still need to check the content of response.body.validListings
                  if(response.body){
                    return callback(null, response.body);
                  }
                  return callback({error: {message: "Error"}});
                } else {
                    return callback(response.body); //The response was not valid we are then sending the response.body with the error messages
                }

            });
    },
    /**
    * get - Helper method for calling webmegler with a GET request.
    * Same as above but returns a promise.
    */
    getPromise: (url) => {
        return new Promise((resolve, reject) => {
            unirest.get(url)
                .headers({
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                })
                .send()
                .end((response) => {
                    let result = isValidResponse(response);
                    if (result) { //We still need to check the content of response.body.validListings
                        resolve(response.body);
                    } else {
                        reject(response.body);
                    }

                });
        });
    }

};
