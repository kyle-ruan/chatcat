'use strict';

const config = require('../config');
const logger = require('../logger');
const Mongoose = require('mongoose').connect(config.dbURI);

Mongoose.connection.on('error', error => {
  logger.log('error', "MongoDB Error: ", error);
});

// Create a Schema that defines the structure for storing user data
const chatUser = new Mongoose.Schema({
  profileId: String,
  fullName: String,
  profilePic: String
});

// Turn the schema into a usable model
const userModel = Mongoose.model('chatUser', chatUser);

module.exports = {
  Mongoose,
  userModel
};
