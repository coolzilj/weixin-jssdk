var jsSHA = require('jssha');
var request = require('superagent');

function Weixin (appId, appSecret) {
  this.appId = appId;
  this.appSecret = appSecret;

  this.jsapiTicket = "";
  this.accessToken = "";
}

Weixin.prototype.sign = function (url, cb) {
  var self = this;
  this.getTicket(function(jsapiTicket) {
    var ret = {
      jsapi_ticket: jsapiTicket,
      nonceStr: createNonceStr(),
      timestamp: createTimestamp(),
      url: url
    };
    var string = raw(ret);
    var shaObj = new jsSHA(string, 'TEXT');
    ret.signature = shaObj.getHash('SHA-1', 'HEX');
    ret.appId = self.appId;

    delete ret.jsapi_ticket;
    delete ret.url;
    cb(ret);
  });

};

Weixin.prototype.getAccessToken = function(cb) {
  var self = this;

  if(this.accessToken) return cb(this.accessToken);

  var url = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid='
            + self.appId
            + '&secret='
            + self.appSecret;

  request.get(url).end(function(res) {
    if(res.ok) {
      self.accessToken = res.body.access_token;
      cb(self.accessToken);
    } else {
      console.log("something wrong");
    }
  });
}

Weixin.prototype.getTicket = function (cb) {
  var self = this;
  if(this.jsapiTicket) return cb(this.jsapiTicket);

  this.getAccessToken(function(accessToken) {
    var url = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token='
              + accessToken
              + '&type=jsapi';

    request.get(url).end(function(res) {
      if(res.ok) {
        self.jsapiTicket = res.body.ticket;
        cb(self.jsapiTicket);
      } else {
        console.log("something wrong");
      }
    });
  });
}

function createNonceStr() {
  return Math.random().toString(36).substr(2, 15);
};

function createTimestamp() {
  return parseInt(new Date().getTime() / 1000) + '';
};

function raw(args) {
  var keys = Object.keys(args);
  keys = keys.sort()
  var newArgs = {};
  keys.forEach(function (key) {
    newArgs[key.toLowerCase()] = args[key];
  });

  var string = '';
  for (var k in newArgs) {
    string += '&' + k + '=' + newArgs[k];
  }
  string = string.substr(1);
  return string;
};

module.exports = Weixin;
