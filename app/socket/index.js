'use strict';
const h = require('../helpers');
module.exports = (io, app) => {
  let allrooms = app.locals.chatrooms;

  io.of('/roomslist').on('connection', socket => {
    socket.on('getChatrooms', () => {
      socket.emit('chatRoomsList', JSON.stringify(allrooms));
    });

    socket.on('createNewRoom', (val) => {
      // check to see if a room with the same title exists
      // if not, create one and broadcast
      if(!h.findRoomByName(allrooms, val)) {
        allrooms.push({
          room: val,
          roomID: h.randomHex(),
          users: []
        });

        // Emit an updated list to the creator
        socket.emit('chatRoomsList', JSON.stringify(allrooms));

        // Emit an updated list to everyone
        socket.broadcast.emit('chatRoomsList', JSON.stringify(allrooms));
      }
    })
  });

  io.of('/chatter').on('connection', socket => {
    // Join a chatroom
    socket.on('join', data => {
      const usersList = h.addUserToRoom(allrooms, data, socket);
      let users = [];
      if(usersList !== undefined) {
         users = usersList.users;
      }
      // Update the list of active users as shown on the chatroom page
      socket.broadcast
            .to(data.roomID)
            .emit('updateUsersList', JSON.stringify(users));
      socket.emit('updateUsersList', JSON.stringify(users));
    });

    // When a socket exits
    socket.on('disconnect', () => {
      const room = h.removeUserFromRoom(allrooms, socket);
      if(room !== undefined)
        socket.broadcast.to(room.roomID).emit('updateUsersList', JSON.stringify(room.users));
    });

    // When a new message arrives
    socket.on('newMessage', data => {
      socket.to(data.roomID).emit('inMessage', JSON.stringify(data));
    });
  });
};
