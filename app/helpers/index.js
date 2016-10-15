'use strict';
const router = require('express').Router();
const db = require('../db');
const crypto = require('crypto');

let _registerRoutes = (routes, method) => {
  for(let key in routes) {
    if(typeof routes[key] === 'object'
    && routes[key] !== null
    && !(routes[key] instanceof Array)) {
      _registerRoutes(routes[key], key);
    } else {
      if(method === 'get') {
        router.get(key, routes[key]);
      } else if(method === 'post'){
        router.post(key, routes[key]);
      } else {
        router.use(routes[key]);
      }
    }
  }
};

let route = routes => {
  _registerRoutes(routes);
  return router;
}

// Find a single user based on a key
const findOne = profileId => {
  return db.userModel.findOne({
    'profileId': profileId
  });
}

const findById = (id) => {
  return new Promise((resolve, reject) => {
    db.userModel.findById(id, (error, user) => {
      if(error) {
        reject(error);
      } else {
        resolve(user);
      }
    });
  });
}

// Create a new user and returns that instance
const createNewUser = profile => {
  return new Promise((resolve, reject) => {
    const newChatUser = new db.userModel({
      profileId: profile.id,
      fullName:  profile.displayName,
      profilePic: profile.photos[0].value || ''
    });

    newChatUser.save(error => {
      if(error) {
        reject(error);
      } else {
        resolve(newChatUser);
      }
    });
  });
}

// Find a chatroom by a given name
const findRoomByName = (allrooms, room) => {
  let findRoom = allrooms.findIndex((element, index, array) => {
    if(element.room === room) {
      return true;
    } else {
      return false;
    }
  });

  return findRoom > -1 ? true : false;
};

const findRoomById = (allrooms, roomId) => {
  return allrooms.find(element => element.roomID === roomId);
};

const addUserToRoom = (allrooms, data, socket) => {
  // Get the room object
  const room = findRoomById(allrooms, data.roomID);

  if(room !== undefined) {
    // Get the active user's ID (userId as used in session)
    const userID = socket.request.session.passport.user;
    // Check to see if this user already exists in the chatroom
    const checkUser = room.users.findIndex((element, index) => element.userID === userID);

    // If the user is already present in the room, remove him first
    // e.g. try to join in another browser
    if(checkUser > -1) {
      room.users.splice(checkUser, 1);
    }

    // Push the user into the room's users array
    const { user, userPic} = data;
    room.users.push({
      socketID: socket.id,
      userID,
      user,
      userPic
    });

    // Join the room channle
    socket.join(data.roomID);

    // Return the updated room object
    return room;
  }
};

const removeUserFromRoom = (allrooms, socket) => {
  for(let room of allrooms) {
    const userIndex = room.users.findIndex(element => element.socketID === socket.id);

    if(userIndex > -1) {
      socket.leave(room.roomID);
      room.users.splice(userIndex, 1);
      return room;
    }
  }
};

// A middleware that checks if the user is authenticated & logged in
const isAuthenticated = (req, res, next) => {
  if(req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/');
  }
};

// A function that generates a unique roomID
let randomHex = () => {
  return crypto.randomBytes(24).toString('hex');
}

module.exports = {
  route,
  findOne,
  findById,
  findRoomById,
  findRoomByName,
  addUserToRoom,
  removeUserFromRoom,
  createNewUser,
  isAuthenticated,
  randomHex
};
