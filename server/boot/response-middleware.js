// const {Helper} = require('./../../common/models/medvantx/static/utils/helpers') 
// const helper = new Helper();
module.exports = function (app) {
    var remotes = app.remotes();

    // modify all returned values
    remotes.after('**', function (ctx, next) {
        
        if (ctx) {
            ctx.result = {
                ...ctx.result,
                user:ctx.userData
            };
        }
        next();
    });

}