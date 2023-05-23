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

            const ownerPermissionConf = require(jsonPath).ownerPermission;
            if (ownerPermissionConf && ownerPermissionConf.length) {
                ownerPermissionConf.forEach((k) => {
                    const {
                        methodName,
                        idParam,
                        role
                    } = k;
                    const targetModel = k.targetModel ? Model.app.models[k.targetModel] : Model;
                    Model.beforeRemote(methodName, function (context, modelInstance, next) {
                        (async function () {
                            try {
                                const {
                                    req,
                                    args,
                                    instance
                                } = context;
                                const { Role } = Model.app.models;
                                let isRoleAvailable = false;
                                const roles = req.accessToken.user.role;
                                if (roles) {
                                    for (const roleId of roles) {
                                        let roleObj = {};
                                        try {
                                            roleObj = await Role.findById(roleId);
                                        }
                                        catch (err) {

                                            throw err;
                                        }
                                        (role.indexOf(roleObj.name) > -1) && (isRoleAvailable = true);
                                    }
                                    if (isRoleAvailable) {
                                        const idValue = args[idParam || 'id'];
                                        console.log('idValue', idValue);
                                        if (instance) {
                                            // case for prototype methods
                                            modelInstance = instance;
                                        } else {
                                            try{
                                            modelInstance = await targetModel.findById(idValue);
                                            }
                                            catch (err) {
                                                
                                                throw err;
                                              }
                                        }
                                        if (String(req.accessToken.user.id) !== String(modelInstance.createdBy)) {
                                            if (modelInstance.assignedTo && String(req.accessToken.user.id) !== String(modelInstance.assignedTo)) {
                                                console.log('status---', String(req.accessToken.user.id) !== modelInstance.createdBy);
                                                const e = new Error(`Access Denied: ${modelInstance.id}, model: ${Model.modelName}`);
                                                e.status = 403;
                                                e.code = '403_FORBIDDEN';
                                                throw e;
                                            }
                                        }
                                    }
                                }
                                next();
                            } catch (err) {
                                next(err);
                            }
                        })();
                    });
                });
            }
        }
    });
};
