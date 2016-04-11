var express = require("express");
var app = express();
var http = require("http");
var server = http.Server(app);
var socketio = require("socket.io");
var io = socketio(server);
app.use(express.static("pub"));

io.on("connection", function(socket){
});

server.listen(80, function() {
    console.log("Server is listening on port 80");
});
