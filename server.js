const express = require("express");
const socket = require("socket.io");
const app = express();

app.use(express.static(__dirname + "/Public"));

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () =>
  console.log(`connected to server on port ${PORT}`)
);

const io = socket(server); //socket enabled server // upgraded express server

let Users = new Map();

io.on("connection", (socket) => {
  //add users // everytime a new user added the new array of users is sended to every client
  socket.on("add_user", (username) => {
    Users.set(socket.id, username);
    console.log(Users);
    let users_arr = [];
    for (let v of Users.values()) {
      users_arr.push(v);
    }
    io.emit("user_list", users_arr);
  });

  //Triggered when server gets an icecandidate from a peer in the room.
  //   socket.on("candidate", function (candidate, roomName) {
  //     console.log(candidate);
  //     socket.broadcast.to(roomName).emit("candidate", candidate); //Sends Candidate to the other peer in the room.
  //   });

  socket.on("make-offer", ({ offer, to }) => {
    let to_socketId = [...Users.entries()]
      .filter(({ 1: v }) => v === to)
      .map(([k]) => k);
    console.log(...to_socketId);

    socket.to(...to_socketId).emit("offer-made", {
      offer: offer,
      socket: socket.id,
    });
  });

  socket.on("disconnect", () => {
    // this.socketsArray.splice(this.socketsArray.indexOf(socket.id), 1);
    Users.delete(socket.id);
    console.log(Users);
    let users_arr = [];
    for (let v of Users.values()) {
      users_arr.push(v);
    }
    io.emit("user_list", users_arr);
  });

  socket.on("make-answer", (data) => {
    socket.to(data.to).emit("answer-made", {
      socket: socket.id,
      answer: data.answer,
    });
  });
});

// function to convert username to socket.id
function getSocketId(call_to_username) {
  let socketId = Users.get(call_to_username);
  return socketId;
}
