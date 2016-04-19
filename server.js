var express = require("express");
var app = express();
var http = require("http");
var server = http.Server(app);
var socketio = require("socket.io");
var io = socketio(server);
app.use(express.static("pub"));
var url = "mongodb://localhost:27017/chat_server";
var MongoClient = require('mongodb').MongoClient;

users = [];

function newUser(username, passwd){
	MongoClient.connect(url, function(err, db) {
		db.collection('users').find({'user':username}, function(err, found){
			console.log(found);
		});
		console.log(user);
		db.close();
		return user;
	});
}

function getUser(username, passwd){
	MongoClient.connect(url, function(err, db) {
		db.collection('users').find({'user':username}, function(err, found){
			console.log(found);
		});
		console.log(user);
		db.close();
		return user;
	});
}

io.on("connection", function(socket){
	socket.on('newuser', function(data){
		var user = newUser(data['user'], data['pass']);
		socket.emit('senduser', user);
	});
	socket.on('login', function(data){
		var user = newUser(data['user'], data['pass']);
		socket.emit('senduser', user);
	});
	socket.on('dumblogin', function(data){
		socket.emit('senduser', {'user':data['user'], 'users':users});
		users.push(data['user']);
	});
	socket.on('messageToServer', function(data){
		io.emit('messageFromServer', data);
	});
});

server.listen(5555, function() {
	/*
	MongoClient.connect(url, function(err, db){
		console.log(err);
		db.createCollection("users");
		db.createCollection("rooms");
		db.collection("users").insert({'user':'null_user','passwd':'dumbPass'});
		db.close();
	});
	*/
    console.log("Server is listening on port 80");
});

function testUser(){
	var user = {}
	user.name = 'test';
	user.passwd = 'pass';
	user.rooms = {};
	return user;
}