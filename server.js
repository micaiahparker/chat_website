var express = require("express");
var app = express();
var http = require("http");
var server = http.Server(app);
var socketio = require("socket.io");
var io = socketio(server);
app.use(express.static("pub"));
var mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/chat_server');

var User = mongoose.model('User', {name: String, pass: String, rooms: Object});
var Room = mongoose.model('Room', {name: String, log: Array, users: Object});

function newUser(username, passwd, socket){
	if (!userExists(username)){
		User.create({name:username, pass:passwd, rooms:{}}, function(err, user){
			if (!err){
				socket.emit("senduser", {name:user.name,rooms:user.rooms});
				console.log("Created user "+ username);
			} else {
				badUser(socket);
				console.log("Couldn't create user "+username);
			}
		});
	} else {
		badUser(socket);
		console.log("User already exists "+username);
	}
}

function getUser(username, passwd, socket){
	if (userExists(username)){
		User.findOne({name:username, pass:passwd}, 'name rooms', function(err, user){
			if (!err){
				socket.emit("senduser", user);
				console.log("sent: "+ user);
			} else {
				console.log("An error for user "+username);
				badUser(socket);
			}
		});
	} else {
		badUser(socket);
		console.log("User: "+username+" already exists");
	}
}

function badUser(socket){
	socket.emit("senduser", {name:'null',rooms:{}});
}

function userExists(username){
	var ret = false;
	User.findOne({name:username}, 'name', function(err, user){
		if (err || !user){
			ret = false;
			console.log("User: "+username+" doesn't exist");
		} else {
			ret = true;
			console.log("User: "+username+" exists");
		}
	});
	return ret;
}

function newRoom(roomname, users){
	Room.create({name:roomname, log:[],users:[users]}, function(err, room){
		if (!err){
			console.log("created room "+room.name);
		} else {
			console.log("couldn't create room "+room.name);
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
	User.find({}, function(err, users){
		users.forEach(function(current){
			console.log("bye "+current.name);
			current.remove();
		});
	});
    console.log("Server is listening on port 1234");
});
