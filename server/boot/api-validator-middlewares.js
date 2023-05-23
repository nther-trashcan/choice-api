const {
  validateToken,
  validateExternalUser
} = require('../lib/authHelper');
const UnauthenticatedError = require('../lib/UnauthenticatedError');
const guestApis = [ 
  '/cassia/SharedConfigGET',
  '/cassia/Patient/patientGrxWebhookPOST',
  '/cassia/User/setTimeStampPOST',
  '/cassia/Patient/prescriptionGrxWebhookPOST',
  '/cassia/Order/orderGrxWebhookPOST'
];
module.exports = function initApp(app) {
  app.all('/cassia/*', function tokenValidator(req, res, next) {
    // console.log('11111111111',req);
    // console.log('22222222222222',req.headers);
    // console.log(`${req.url}${req.method}cccccccccc`);
    (async function () { 
      const {
        Logger
      } = app.models;
      let loggerObj;
      try {
        if(req&&req.headers&&req.headers.subscription_key){
          req.reqObj.headers.subscription_key = req.headers.subscription_key
        }
        loggerObj = {
          endPoint: req.url,
          isPost: false,
          isLoggedIn: false,
          isError: false,
          requestType: 'simple-event',
          eventType: 'Event'
        };
        // console.log('22222222222');
        if (req.method.toLowerCase() === 'post') {
          loggerObj.isPost = true;
          // loggerObj.postBody = req.body;
        }
        const token = req.headers.authorization || req.query.access_token;
        const isExternalUser = req.headers.isexternaluser || req.query.isExternalUser;
        loggerObj.isExternalUser = isExternalUser;
        req.isLoggedIn = false;
        // console.log('3333333333');
        if (token && token !== 'null') {
          // console.log('ffffffffffff');
          let info = await validateToken(token);
          // console.log(info);
          if (info) {
            loggerObj.isLoggedIn = true;
            req.isLoggedIn = true;
            req.accessToken = Object.assign({}, info);
            loggerObj.email = info.userPrincipalName || (info && info.workEmail);
            // req.reqObj.workEmail = loggerObj.email;
          }
          const reqCopy = req;
          req.reqObj = reqCopy;
          req.reqObj.workEmail = loggerObj.email;
          req.reqObj.isLoggedIn = loggerObj.isLoggedIn;
          const {User} = app.models; 
          const data = await User.findOne({ where: { workEmail: req.reqObj.workEmail.toLowerCase() }, }); 
          // console.log(data,'data');
          if(data.isDeleted){
            let e = new Error()
              e.message = 'Your account has been disabled. Please follow up with the Administrator.';
              e.statusCode = 404;
              e.name = 'User not found';
              throw e;
          }
          next();
          // console.log('4444444444444');
        } else {
          // console.log('55555555555');
          //Need to be uncomented when for docusign url
          const apiUrl = `${req.url}${req.method}`;
          // console.log('.................Guest API ', apiUrl);
          // if (apiUrl.includes("getDataForEsignConcent")) {
          //   req.accessToken = {
          //     user: {}
          //   };
          // } else 
          if (guestApis.indexOf(apiUrl) === -1) {
            // console.log('666666666666');
            let e = new Error()
              e.message = 'User not approved for any action yet, Contact Admin for authorization.';
              e.statusCode = 403;
              e.name = 'Forbidden User Activity';
              throw e;
          }
          else {
            // console.log('77777777777777');
            req.accessToken = {
              user: {role:''}
            };
          }
          const reqCopy = req;
          req.reqObj = reqCopy;
          // console.log('bbbbbbbbbbb');
          loggerObj.email = 'whitelistedMail';
          req.reqObj.workEmail = loggerObj.email;
          req.reqObj.isLoggedIn = loggerObj.isLoggedIn;
          // console.log('aaaaaaaaaaaa');
          // console.log('8888888888888',`${req.url}${req.method}`);
          next();
        }
      } catch (err) {
        next(err.statusCode ? err : new UnauthenticatedError());
      }
    })();
  });
};