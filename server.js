var express = require("express");
var app = express();
var http = require("http");
var server = http.Server(app);
var socketio = require("socket.io");
var io = socketio(server);
app.use(express.static("pub"));
var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
mongoose.connect('mongodb://localhost/chat_server');

var UserSchema = mongoose.Schema({
    name: {type: String, required: true, unique: true},
    pass: {type: String, require: true},
    rooms: {type: Array, require: true}
});

var RoomSchema = mongoose.Schema({
    name: {type: String, require: true, unique: true},
    users: {type: Array, require: true},
    log: {type: Array, require: true}
});

UserSchema.plugin(uniqueValidator);
RoomSchema.plugin(uniqueValidator);

var User = mongoose.model("User", UserSchema);
var Room = mongoose.model("Room", RoomSchema);

function newUser(username, passwd, socket) {
    User.create({name: username, pass: passwd, rooms: []}, function (err, user) {
        if (!err) {
            //userCreatePass
            console.log(user.name+":"+user.rooms);
            addUserToRoom(user.name, "Public");
            socket.emit("sendUser", {name: "null", msg: "Account Created"});
        } else {
            //userCreateFail
            socket.emit("sendUser", {name: "null", msg: err});
        }
    });
}

function getUser(username, passwd, socket) {
    User.findOne({name: username}, 'name rooms', function (err, user) {
        if (!err && user.pass === passwd) {
            socket.emit("sendUser", {name: user.name, rooms: user.rooms});
            io.emit("userLoggedIn", {name: user.name});
        } else {
            socket.emit("sendUser", {name: "null", msg: err});
        }
    });
}

function badUser(socket, msg) {
    socket.emit("senduser", {name: 'null', rooms: {}, msg: msg});
}

function newRoom(roomname, users) {
    Room.create({name: roomname, log: [], users: users}, function (err, room) {
        if (!err) {
            console.log("created room " + room.name);
        } else {
            console.log("couldn't create room " + room.name);
        }
    });
}

function addUserToRoom(username, roomname) {
    User.find({name: username}, 'name', function (err, user) {
        Room.find({name: roomname}, 'name', function (err, room) {
            if(!user){
                console.log("Shit");
            }
            if(!user.rooms){
                console.log("Double shit");
            }
            user.rooms.push(room.name);
            room.users.push(user.name);
            user.save();
            room.save();

        });
    });
}

function removeUserfromRoom(username, roomname) {
    User.find({name: username}, 'name rooms', function (err, user) {
        Room.find({name: roomname}, 'name users', function (err, room) {
            if (room.users.indexOf(user.name) >= 0) {
                delete room.users.indexOf(user.name);
            }
            if (user.rooms.indexOf(room.name) >= 0) {
                delete user.rooms.indexOf(room.name);
            }
            user.save();
            room.save();
            io.emit('userLeftRoom', {name: user.name}, {id: room._id});
        });
    });
}

function createPublic() {
    Room.create({name: "Public"}, function (err, room) {
        if (err) {
            console.log('create public failed: ' + err);
        } else {
            console.log('created public');
        }
    });
}

io.on("connection", function (socket) {
    socket.on('newuser', function (data) {
        newUser(data['name'], data['pass'], socket);
    });
    socket.on('login', function (data) {
        getUser(data['name'], data['pass'], socket);
    });
    socket.on('messageToServer', function (data, room) {
        io.emit('messageFromServer', data, room);
    });
    socket.on('newRoom', function (room) {
        newRoom(room.name, room.users);
    });
    socket.on('leaveRoom', function (user, room) {
        removeUserfromRoom(user.name, room.name);
    });
    socket.on('addToRoom', function (user, room) {
        addUserToRoom(user.name, room.name);
    });
});

server.listen(1234, function () {
    User.find({}, function (err, users) {
        users.forEach(function (current) {
            console.log("bye " + current.name);
            current.remove();
        });
    });
    Room.find({}, function (err, rooms) {
        rooms.forEach(function (current) {
            if (current.name !== "Public") {
                console.log("bye " + current.name);
                current.remove();
            }
        });
    });
    //createPublic();
    console.log("Server is listening on port 1234");
});
