'use strict';
const config = require('./config');
const redis = require('redis').createClient;
const adapter = require('socket.io-redis');

// Social Authentication Logic
require('./auth')();

// Create An IO Server instance
const ioServer = app => {
  app.locals.chatrooms = [];
  const server = require('http').Server(app);
  const io = require('socket.io')(server);
  io.set('transport', ['websocket']);
  const pubClient = redis(config.redis.port, config.redis.host, {
    auth_pass: config.redis.password
  });

  const subClient = redis(config.redis.port, config.redis.host, {
    return_buffers: true,
    auth_pass: config.redis.password
  });

  io.adapter(adapter({
    pubClient,
    subClient
  }));

  io.use((socket, next) => {
    require('./session')(socket.request, {}, next);
  });
  require('./socket')(io, app);
  return server;
};

module.exports = {
  router: require('./routes')(),
  session: require('./session'),
  ioServer,
  logger: require('./logger')
};
