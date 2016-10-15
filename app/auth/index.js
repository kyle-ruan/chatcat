'use strict';
const passport = require('passport');
const config = require('../config');
const h = require('../helpers');
const logger = require('../logger');
const FacebookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;

module.exports = () => {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    // Find the user using the id
    h.findById(id)
      .then(user => done(null, user))
      .catch(error => logger.log('error', 'Error when deserilazing user.'));
  });

  const authProcessor = (accessToken, refreshToken, profile, done) => {
    // Find a user in the local db using profile.id
    // If the user is found return the user data using done()
    // If the user is not found, create one in the local db and return
    h.findOne(profile.id)
      .then(result => {
        if(result) {
          done(null, result);
        } else {
          // Create a new user and return
          h.createNewUser(profile)
            .then(newChatUser => done(null, newChatUser))
            .catch(error => logger.log('error', 'Error creating new user.'));
        }
      });
  };

  passport.use(new FacebookStrategy(config.fb, authProcessor));
  passport.use(new TwitterStrategy(config.twitter, authProcessor));
}
