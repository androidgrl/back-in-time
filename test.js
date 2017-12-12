const request = require('request');
const _ = require('lodash@4.8.2');

const getChannelIds = (ctx) => {
  targetTimestamp = firstUnreadTimestamp(ctx);
  return new Promise (function (fulfill, reject){
    request.get("https://slack.com/api/channels.list", {
      'auth': {
        'bearer': ctx.secrets.bearer
      }
    }, function (err, res, body){
      channels = JSON.parse(body).channels;
      idsWithCtx = _.map(channels, function (c) {
        return {id: c.id, ctx: ctx, targetTimestamp: targetTimestamp};
      });
      fulfill(idsWithCtx);
    });
  });
};

const firstUnreadTimestamp = (ctx) => {
  nowInUnix = Math.floor(Date.now() / 1000);
  hoursBack = parseInt(ctx.body.text);
  secondsBack = hoursBack * 60 * 60;
  return (nowInUnix - secondsBack);
};

const markChannelsForUpdate = (idsWithCtx) => {
  channelRequests = _.map(idsWithCtx, checkForUpdate);
  return Promise.all(channelRequests);
};

const checkForUpdate = (idwithCtx) => {
  return new Promise (function (fulfill, reject) {
    request.get('https://slack.com/api/conversations.history?channel=' + idwithCtx.id, {
      'auth': {
        'bearer': idwithCtx.ctx.secrets.bearer
      }
    }, function (err, res, body) {
      messages = JSON.parse(body).messages;
      messageIndex = _.findIndex(messages, function (m) {
        unixTimestamp = parseInt(m.ts.split('.')[0]);
        return unixTimestamp <= idwithCtx.targetTimestamp;
      });
      if (messageIndex) {
        result = {ts: messages[messageIndex].ts};
       } else {
         result = {ts: 0};
       }
       fulfill(Object.assign({}, idwithCtx, result));
    });
  });
};

const updateChannels = (channelInfo) => {
  channelsToUpdate = _.filter(channelInfo, function (c) {
    return c.ts;
  });
  requests = _.map(channelsToUpdate, composeRequest);
  return Promise.all(requests);
};

const composeRequest = (channelInfo) => {
  return new Promise (function (fufill, reject) {
    request.post('https://slack.com/api/channels.mark?channel=' + channelInfo.id + '&ts=' + channelInfo.ts, {
        'auth': {
          'bearer': channelInfo.ctx.secrets.bearer
        }
      }, function (err, res, body) {
    });
  });
};

module.exports = (ctx, cb) => {
  getChannelIds(ctx)
    .then(markChannelsForUpdate)
    .then(updateChannels);
};
