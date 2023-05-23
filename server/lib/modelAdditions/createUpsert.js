'use strict';
const moment = require('moment-timezone');

module.exports = (Model) => {

  const addSlaCounterBeginTime = (ctx) => {
    const hours = moment(ctx.instance.createdDate).tz('America/Chicago').hour();
    const tempDate = new Date(ctx.instance.lastModifiedDate);
    if (hours >= 0 && hours <= 8) {
      ctx.instance.slaCB = new Date(tempDate.setUTCHours(13, 0, 0, 0));
    } else if (hours > 8 && hours <= 16) {
      ctx.instance.slaCB = tempDate;
    } else if (hours > 16 && hours < 24) {
      let chicagoDate = new Date(moment(tempDate).tz('America/Chicago').add(1, 'days').format());
      ctx.instance.slaCB = new Date(chicagoDate.setUTCHours(13, 0, 0, 0));
    }
  }

  Model.observe('before save', async function (ctx, next) {
    // let usaTime = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });
    // usaTime = new Date(usaTime);
    // ctx.instance && (ctx.instance.createdDate = usaTime);
    // ctx.instance && (ctx.instance.lastModifiedDate = usaTime);
    const currentDate = new Date();
    if (ctx.instance && ctx.isNewInstance) {
      ctx.instance.createdDate = new Date(moment(currentDate).tz('America/Chicago').format());
      ctx.instance.lastModifiedDate = new Date(moment(currentDate).tz('America/Chicago').format());
    } else if (ctx.instance && !ctx.isNewInstance) {
      ctx.instance.lastModifiedDate = new Date(moment(currentDate).tz('America/Chicago').format());
    }
    if (ctx.data && Object.entries(ctx.data).length) {
      ctx.data.lastModifiedDate = new Date(moment(currentDate).tz('America/Chicago').format());
    }
    if (Model.name === 'FaxInbound') {
      addSlaCounterBeginTime(ctx);
    }
  });

  // Model.beforeRemote('**', function (ctx, modelInstance, next) {
  //   if (ctx && ctx.req && ctx.req.body && Object.entries(ctx.req.body).length !== 0 && !ctx.req.body.createdBy) {
  //     ctx.req.body.createdBy = String(ctx.req.accessToken.user.id);
  //   }
  //   next();
  // });
  // Model.observe('before save', async function (ctx, next) {
  //   console.log('....................before save', Object.keys(ctx), ctx.Model, ctx.instance, ctx.isNewInstance, ctx.options, ctx.hookState);

  // });

};
