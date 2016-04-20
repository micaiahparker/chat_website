var express = require("express");
var app = express();
var fs = require("fs");

var privateKey = fs.readFileSync('certs/chat_key.pem').toString();
var certificate = fs.readFileSync('certs/chat_cert.crt').toString();  

const options = {key: privateKey, cert: certificate};

var https = require("https");
var server = https.Server(app, options);
var socketio = require("socket.io");
var io = socketio(server);
app.use(express.static("pub"));
var mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/chat_server');

var User = mongoose.model('User', {name: String, pass: String, rooms: Array});
var Room = mongoose.model('Room', {name: String, log: Array, users: Array});

function newUser(username, passwd, socket){
	if (!userExists(username)){
		User.create({name:username, pass:passwd}, function(err, user){
			if (!err){
				socket.emit("senduser", {'user':user.name,'rooms':user.rooms});
			} else {
				badUser(socket);
			}
		});
	} else {
		badUser(socket);
	}
}

function getUser(username, passwd, socket){
	if (userExists(username)){
		User.findOne({name:username, pass:passwd}, 'name rooms', function(err, user){
			if (!err){
				socket.emit("senduser", user);
			}
		});
	} else {
		badUser(socket);
	}
}

function badUser(socket){
	socket.emit("senduser", {'user':'null','rooms':[]});
}

function userExists(username){
	var ret = false;
	User.findOne({name:username}, 'name', function(err, user){
		if (err || !user){
			ret = false;
		} else {
			ret = true;
		}
	});
	return ret;
}

function newRoom(roomname, users){
	Room.create({name:roomname, log:[],users:[users]}, function(err, room){
		if (!err){
			console.log("created room "+room.name);
		}
	});
}

io.on("connection", function(socket){
	socket.on('newuser', function(data){
		newUser(data['name'], data['pass'], socket);
	});
	socket.on('login', function(data){
		getUser(data['name'], data['pass'], socket);
	});
	socket.on('dumblogin', function(data){
		users.push(data['user']);
		socket.emit('senduser', {'user':data['user'], 'users':users});
	});
	socket.on('messageToServer', function(data){
		io.emit('messageFromServer', data);
	});
});

server.listen(1234, function() {
    console.log("Server is listening on port 1234");
});
