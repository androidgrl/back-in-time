const request = require('request');
const _ = require('lodash@4.8.2');

const channelIds = (ctx) => {
  return new Promise (function (fulfill, reject){
    request.get("https://slack.com/api/channels.list", {
      'auth': {
        'bearer': ctx.secrets.bearer
      }
    }, function (err, res, body){
      channels = JSON.parse(body).channels;
      ids = _.map(channels, function (c) {
        return c.id;
      });
      fulfill(ids);
    });
  });
};

module.exports = (ctx, cb) => {
  channelIds(ctx).then(function (result){
    cb(null, {text: `${result}`});
  });
};
