var express = require("express");
var app = express();
var http = require("http");
var server = http.Server(app);
var socketio = require("socket.io");
var io = socketio(server);
app.use(express.static("pub"));

var MongoClient = require('mongodb').MongoClient;

function addUser(username, passwd){
	MongoClient.connect("mongodb://localhost:27017/chat_server", function(err, db) {
		var result = db.users.insert({'user': username, 'pass': passwd});
		console.log(result);
		db.close();
	});
}

function newUser(username, passwd){
	var user = {}
	user.name = username;
	user.pass = passwd;
	user.rooms = {};
	return user;
}

function getUser(username, passwd){
	return {'user': username, 'rooms':{}};
}

io.on("connection", function(socket){
	socket.on('newuser', function(data){
		addUser(newUser(data['user'], data['pass']));
		var user = getUser(data['user'], data['pass']);
		socket.emit('senduser', user);
	});
	socket.on('login', function(data){
		var user = getUser(data['user'], data['pass']);
		socket.emit('senduser', user);
	});
});

server.listen(80, function() {
    console.log("Server is listening on port 80");
});

function testUser(){
	var user = {}
	user.name = 'test';
	user.passwd = 'pass';
	user.rooms = {};
	return user;
}