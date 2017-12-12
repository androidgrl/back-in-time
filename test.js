const request = require('request');
const _ = require('lodash@4.8.2');

const getChannelIds = (ctx) => {
  return new Promise (function (fulfill, reject){
    request.get("https://slack.com/api/channels.list", {
      'auth': {
        'bearer': ctx.secrets.bearer
      }
    }, function (err, res, body){
      channels = JSON.parse(body).channels;
      idsWithCtx = _.map(channels, function (c) {
        return {id: c.id, ctx: ctx};
      });
      fulfill(idsWithCtx);
    });
  });
};

const makeChannelRequest = (idwithCtx) => {
  return new Promise (function (fulfill, reject) {
    request.get('https://slack.com/api/conversations.history?channel=' + idwithCtx.id, {
        'auth': {
          'bearer': idwithCtx.ctx.secrets.bearer
        }
      }, function (err, res, body) {
      lastMessage = JSON.parse(body).messages[0].text;
      fulfill(lastMessage);
    });
  });
};

const getLastMessages = (idsWithCtx) => {
  channelRequests = _.map(idsWithCtx, makeChannelRequest);
  return Promise.all(channelRequests);
};

module.exports = (ctx, cb) => {
  getChannelIds(ctx)
    .then(getLastMessages)
    .then(function (result){
      cb(null, {text: `${result}`});
    });
};
