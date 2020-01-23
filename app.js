var express = require("express");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io").listen(server);
var fs = require("fs");
var request = require("request");
const bodyParser = require("body-parser");

var url = "http://sabdhan.com/mocktest/get/11";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("/", express.static(__dirname + "/public"));

var usernames = {};
var pairCount = 0,
  id,
  clientsno,
  pgmstart = 0,
  varCounter;
var scores = {};

const usernamee = "sadman";
const passworde = "123456";
//Route
app.get("/game", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});
app.get("/", function(req, res) {
  res.sendFile(__dirname + "/login.html");
});
app.get("/chapter", function(req, res) {
  res.sendFile(__dirname + "/chapter.html");
});

app.post("/auth", function(request, response) {
  var username = request.body.username;
  var password = request.body.password;
  if (username && password) {
    username == usernamee;
    password == passworde;
    response.redirect("/game");
  }
});

io.sockets.on("connection", function(socket) {
  console.log("New Client Arrived!");

  socket.on("addClient", function(username) {
    socket.username = username;
    usernames[username] = username;
    scores[socket.username] = 0;
    varCounter = 0;

    pairCount++;
    if (pairCount === 1 || pairCount >= 3) {
      id = Math.round(Math.random() * 1000000);
      socket.room = id;
      pairCount = 1;
      console.log(pairCount + " " + id);
      socket.join(id);
      pgmstart = 1;
    } else if (pairCount === 2) {
      console.log(pairCount + " " + id);
      socket.join(id);
      pgmstart = 2;
    }

    console.log(username + " joined to " + id);

    socket.emit(
      "updatechat",
      "SERVER",
      "You are connected! <br> Waiting for other player to connect...",
      id
    );

    socket.broadcast
      .to(id)
      .emit(
        "updatechat",
        "SERVER",
        username + " has joined to this game !",
        id
      );

    if (pgmstart == 2) {
      request(
        {
          url: url,
          json: true
        },
        function(err, data) {
          jsoncontent = data;
          io.sockets.in(id).emit("sendQuestions", jsoncontent);
        }
      );
      console.log("Player2");
    } else {
      console.log("Player1");
    }
  });

  socket.on("result", function(usr, rst) {
    io.sockets.in(rst).emit("viewresult", usr);
  });

  socket.on("disconnect", function() {
    delete usernames[socket.username];
    io.sockets.emit("updateusers", usernames);
    io.sockets
      .in(id)
      .emit("updatechat", "SERVER", socket.username + " has disconnected", id);
    socket.leave(socket.room);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT);
console.log(`Listening to ${PORT}`);
console.log("Connection Established !");
