function CookieAuth(){
  //yes yes, server restart will drop all the cookies.
  this._cookies = {};
}

CookieAuth.prototype.setCookie = function(res, token){
  var cookie = Math.round((new Date().valueOf() * Math.random())) + '';
  this._cookies[cookie] = token;
  res.setCookie('who-is-me',  cookie, {path: '/', secure: true, httpOnly: true});
};

CookieAuth.prototype.isCookieSet = function(req){
  var cookie = req.cookies['who-is-me'];
  return this._cookies[cookie];
};

module.exports = CookieAuth;
