'use strict';
const camel = require('to-camel-case');
const decamelize = require('decamelize');
const fs = require('fs');
const path = require('path');

module.exports = function (Model) {
    const modelName = Model.name;
    const jsonPath = path.resolve(__dirname, `../../../common/models/hub/${decamelize(camel(modelName), '-')}.json`);
    fs.access(path.resolve(jsonPath), fs.F_OK, (err) => {
        if (!err) {
            const rolePermissionConf = require(jsonPath).rolePermissions;
            if (rolePermissionConf && rolePermissionConf.length) {
                rolePermissionConf.forEach((k) => {
                    const { methodName = [], permissions = [] } = k;
                    // NOTE - This will be called afterwards, if any remote hook is present inside model.js
                    for (const method of methodName) {
                        Model.beforeRemote(method, function (context, modelInstance, next) {
                            (async function () {
                                try {
                                    const { req } = context;
                                    const { Role } = Model.app.models;
                                    if (permissions.length) {
                                        const roles = req.accessToken.user.role;
                                        let isRoleAvailable = false;
                                        if (roles) {
                                            for (const roleId of roles) {
                                                let roleObj = {};
                                                try {
                                                    roleObj = await Role.findById(roleId);
                                                }
                                                catch (err) {

                                                    throw err;
                                                }
                                                (permissions.indexOf(roleObj.name) > -1) && (isRoleAvailable = true);
                                            }
                                            if (!isRoleAvailable) {
                                                const e = new Error(`Access Denied!`);
                                                e.status = 403;
                                                e.code = '403_FORBIDDEN';
                                                throw e;
                                            }
                                        }
                                    }
                                    next();
                                } catch (err) {
                                    next(err);
                                }
                            })();
                        });
                    }
                });
            }
        }
    });
};
