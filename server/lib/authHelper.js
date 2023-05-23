const rp = require('request-promise');
const app = require('../server');
const jwt = require('jsonwebtoken');

exports.validateToken = async function validateToken(token) {
    try {
        const { Role } = app.models;
        let response = await rp.get({ url: process.env.MSAL_TOKEN_VERIFY, headers: { "Authorization": "Bearer " + token, "Content-type": "application/json" } });
        response = JSON.parse(response);
        const email = response.mail || response.userPrincipalName;
        const { User } = app.models;
        let ifUserRegisterd = {};
        try {
            ifUserRegisterd = await User.findOne({ where: { workEmail: email.toLowerCase() } });
        }
        catch (err) {

            throw err;
        }
        let role = [];
        try {
            for(let i=0;i<ifUserRegisterd.role.length;i++){
                let userRole = await Role.findById(ifUserRegisterd.role[i]);
                role.push(userRole);
            }
            
        }
        catch (err) {

            throw err;
        }
        if (!ifUserRegisterd) {
            const e = new Error();
            e.message = 'User not approved for any action yet, Contact Admin for authorization.';
            e.statusCode = 403;
            e.name = 'Forbidden User Activity';
            throw e;
        }
        // console.log(role,'roleeeeeeeeee');
        return Object.assign(response, { ...ifUserRegisterd, role });
    }

    catch (err) {
        console.log('error from auth helper', err);
        throw err;
    }
};

exports.validateExternalUser = async function validateExternalUser(token) {
    try {
        const private_key = 'Ssrx@!234';
        const data = jwt.verify(token, private_key);
        return data;
    } catch (err) {
        console.log('error from auth helper', err);
        throw err;
    }
};
