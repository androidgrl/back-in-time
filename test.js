const request = require('request');
const _ = require('lodash@4.8.2');

module.exports = (ctx, cb) => {
  const promise = new Promise (function (fulfill, reject){
      request.get("https://slack.com/api/channels.list", {
            'auth': {
                    'bearer': ctx.secrets.bearer
                  }
          }, function (err, res, body){
                channels = JSON.parse(body).channels;
                fulfill(channels[1].id);
              });
    });
  promise.then(function (result){
      cb(null, {text: `${result}`});
    });
};
