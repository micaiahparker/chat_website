var socket = io();

var user = {
    name: "Jack",
    currentRoom: "Public",
    availableRooms: {}
};

/**
 * to server calls:
 * 'logout',user
 *      //responds with 'userLoggedOut'(?)
 * 'login', login{name:name, password:password}
 *      //responds with 'senduser'
 *      //sends 'userLoggedIn' to all clients
 * 'newuser', login{name:name, password:password}
 *      //responds with 'senduser'
 *      //sends 'userLoggedIn' to all clients
 * 'newRoom', room{users:users, name:name}
 *      //responds with 'sendroom'
 * 'messageToServer', message{sender:sender, msg:message, time:time},room{id:roomID}
 *      //responds with 'messageFromServer'
 * 'leaveRoom', user{name:name},room{name:roomName}
 *      //respond with 'userLeftRoom'(?)
 * 'addToRoom', user{name:username},room{name:roomname}
 * 
 * 
 * from server calls:
 * 'sendroom', room{id:roomID,users:users,localLog:localLog}
 *      //response to 'newRoom'
 * 'messageFromServer', message{sender:sender,msg:message,time:time}, room{id:roomID}
 *      //response to 'messageToServer'
 * 'userLoggedIn', user{name:name}
 *      //on successful login, this broadcasts to all clients
 * 'senduser', userInfo{name:name, rooms:availableRooms{id:id,users:users,localLog:someLog/emptyLog}}
 *      //response to 'login' and 'createuser'
 * 'userLeftRoom', user{name:name},room{id:roomID}
 *      //response to 'leaveRoom'
 * 'userLoggedOut', user{name:name}
 *      //broadcasted response to logout (?)
 */

$(document).ready(function () {
    $("#loginPrompt").modal('show');

    //'logout',user
    //responds with 'userLoggedOut'(?)
    $("#logout").on('click', function () {
        socket.emit('logout', user.name);
        window.location.reload(false);//document.load();
        //$("#loginPrompt").modal('show');
        //show the login modal again?
    });
    //'login', login{name:name, password:password}
    //responds with 'senduser'
    //sends 'userLoggedIn' to all clients
    $('#login').on('click', function () {

        var getUsername = $('#username').val(),
                getPassword = $('#password').val(),
                login = {};

        login.name = getUsername;
        login.pass = getPassword;
        //hash password
        $("#username").val("");
        socket.emit('login', login);
        //socket.emit("dumblogin", login);
    });

    // 'newuser', login{name:name, password:password}
    //responds with 'senduser'
    //sends 'userLoggedIn' to all clients
    $('#createAccount').on('click', function () {
        var createUser = $('#username').val(),
                createPassword = $("#password").val(),
                account = {};
        account.name = createUser;
        account.pass = createPassword;
        //$("#username").val("");
        //$("#password").val("");
        socket.emit('newuser', account);

    });
    // 'newRoom', room{users:users, name:name}
    //responds with 'sendroom'
    $("#createRoomButton").on('click', function () {
        var groupName = $("#groupName").val(),
                groupUsers = $("#groupUsers").val();

        var splitUsers = groupUsers.split(",");
        var room = {
            users: splitUsers,
            name: groupName,
            messages: []
        };
        socket.emit("newRoom", room);
    });

    // 'messageToServer', message{sender:sender, msg:message, time:time},room{id:roomID}
    //responds with 'messageFromServer'
    $("#sendChatButton").on('click', function () {
        var msg = $("#message").val();
        if (msg !== "") {
            var sender = user.name;
            var time = new Date();
            var theTime = time.getHours() + ":" + time.getMinutes();
            var message = {
                sender: sender,
                msg: msg,
                time: theTime
            };
            var room = {
                id: user.currentRoom.id
            };
            $("#message").val("");
            socket.emit("messageToServer", message, room);
        }
    });
    //'leaveRoom', user{name:name},room{id:roomID}
    //respond with 'userLeftRoom'(?)
    $("#leaveRoom").on('click', function () {
        //can't leave public room
        if (user.currentRoom.id === 0)
            return;
        var userData = {
            name: user.name
        };
        var roomData = {
            name: user.currentRoom.name
        };
        //enter public room
        enterRoom(user.availableRooms[0]);
        //remove group from user's groups
        delete user.availableRooms[user.currentRoom.id];
        //updateRoomsList
        updateRoomsList();
        socket.emit("userLeftRoom", userData, roomData);
    });

    $("#addToRoom").on('click', function () {

    });


    socket.on('createdRoom', function (room, users) {
        users.forEach(function (aUser) {
            if (aUser === user.name) {
                user.availableRooms[room._id] = room;
                updateRoomsList();
                enterRoom(room);
            }
        });

    });

    //'sendroom', room{id:roomID,users:users,localLog:localLog}
    //response to 'newRoom'
    socket.on("sendroom", function (room) {
        //TODO
        //should just be used for new users and new groups
        if (!(room.id in user.availableRooms)) {
            user.availableRooms[room.id] = room;
        }
        updateRoomsList();
        //enter room
        enterRoom(room);
    });

    //'messageFromServer', message{sender:sender,msg:message,time:time}, room{id:roomID}
    //response to 'messageToServer'
    socket.on('messageFromServer', function (message, room) {
        //if the room's id is part of my available rooms, add stuff to it
        //otherwise just don't do anything
        Object.keys(user.availableRooms).forEach(function (key) {
            if (key === (""+room.id)) {
                user.availableRooms[room.id].localLog.push(message);
                var pc = $("#publicChat");
                var scroll = true;//(pc.scrollTop() === pc.scroll.scrollHeight);
                $("#room" + room.id).append(createMessageHTML(message));
                if (scroll) {
                    pc.scrollTop(pc[0].scrollHeight);
                }
                //if i'm not in the room, light up room
                //set a new message var in the room to 1 so we know you have new messages
                //when entering the room we should set it back to 0
                if (room.id !== user.currentRoom.id) {
                    user.availableRooms[room.id]["newMessage"] = 1;
                } else {
                    //just in case for some reason it wasn't set back to 0 when we entered the room
                    //we can double check by setting it to 0 here
                    user.availableRooms[room.id]["newMessage"] = 0;
                }
            }
        });

    });

    //'userLoggedIn', user{name:name}
    //on successful login, this broadcasts to all clients
    socket.on('userLoggedIn', function (userInfo) {
        if (userInfo.name === user.name)
            return;
        //for each room that you have that this user's name is in
        //update the user list in it to show that they've loggeg in
        //maybe include a "User has entered the channel" message to the rooms?
        user.availableRooms[0].users.push(userInfo.name);
        var keys = Object.keys(user.availableRooms);
        keys.forEach(function (key) {
            var room = user.availableRooms[key];
            var users = room.users;
            if (users.indexOf(userInfo.name) >= 0) {
                updateUsersInRoom(room);
                var d = new Date();
                var time = d.getHours() + ":" + d.getMinutes();
                var loggedInMessage = {
                    sender: "Server",
                    msg: userInfo.name + " logged in.",
                    time: time
                };
                socket.emit("messageToServer", loggedInMessage, room);
            }
        });
    });


    //'senduser', userInfo{name:name, rooms:availableRooms{id:id,users:users,localLog:someLog/emptyLog}}
    //response to 'login' and 'createuser'
    socket.on('sendUser', function (userInfo) {
        //TODO
        if (userInfo.name === "null") {// || userInfo.msg.indexOf("created") >= 0) {
            //set login message to an error
            alert(userInfo.msg.toString());
            return;
        }
        user.name = userInfo.name;
        
        //user = userInfo;
        //check if valid user
        //user.currentRoom = user.availableRooms[0];
        $("#displayUserName").text(user.name);
        //enterRoom(user.availableRooms[0]);
        //updateRoomsList();
        $('#loginPrompt').modal('hide');
    });

    socket.on("addRoom", function (room) {
        var key = room._id;
        if (room.name === "Public")
            key = 0;
        room.id = key;
        room.localLog = [];
        user.availableRooms[key] = room;
        var div = createDiv(user.availableRooms[key]);
        $("#publicChat").append(div);
        if (room.name === "Public") {
            user.currentRoom = user.availableRooms[key];
            enterRoom(user.availableRooms[key]);
        }
        updateRoomsList();
    });

    //'userLeftRoom', user{name:name},room{id:roomID}
    //response to 'leaveRoom'
    socket.on('userLeftRoom', function (userInfo, room) {
        if (room.id in Object.keys(user.availableRooms)) {
            //remove user.name from room
            var index = user.availableRooms[room.id].users.indexOf(userInfo.name);
            delete user.availableRooms[room.id].users[index];
            updateUsersInRoom(user.availableRooms[room.id]);
        }
    });

    //'userLoggedOut', user{name:name}
    //broadcasted response to logout (?)
    socket.on('userLoggedOut', function (userInfo) {
        var keys = Object.keys(user.availableRooms);
        var room = user.availableRooms[0];
        if (room.users.indexOf(userInfo.name) >= 0) {
            room.users.splice(room.users.indexOf(userInfo.name), 1);
        }
        updateUsersInRoom(room);
        keys.forEach(function (key) {
            var room = user.availableRooms[key];
            if (room.users.indexOf(user.name) >= 0) {
                //set user to logged out
                //or only do that for public room? (aka, remove from users list like above)
            }
        });

    });
});

function createDiv(room) {
    var div = "<div id=room" + room.id + " style=\"overflow: auto\"></div>";
    return div;
}

function createMessageHTML(message) {
    var msg = "<p class=\"message\">" + message.sender + ": " + message.msg + " |" + message.time + "</p>";
    return msg;
}

function enterRoom(room) {
    //if in groups tab
    //highlight currently joined group(?)
    $("#room" + user.currentRoom.id).hide();
    user.currentRoom = room;
    $("#room" + user.currentRoom.id).show();
    updateUsersInRoom(room);

}

function newUserInRoom(user, roomName) {
    var room = user.rooms[roomName];
    room.users.push(user.name);
    updateUsersInRoom(room);
}

function updateUsersInRoom(room) {
    //display room.users in users pane
    //clear list of users(?)
    $("#currentUsers").html("");
    room.users.forEach(function (user) {
        $("#currentUsers").append("<p>" + user + "</p>");
    });
}

function updateRoomsList() {
    //TODO
    var keys = Object.keys(user.availableRooms);
    //clear our the current groups list
    $("#currentRooms").html("");
    keys.forEach(function (key) {
        var roomElem = createRoomElement(user.availableRooms[key]);
        //add room element to groups list
        $("#currentRooms").append(roomElem);
        //add click function to it (?)
        $("#roomButton" + user.availableRooms[key].id).on('click', function () {
            enterRoom(user.availableRooms[key]);
        });
    });
}

function createRoomElement(room) {
    //create html for a group thing for the list
    //give it an id of roomButton1, roomButton2, etc
    var html = "<button class=\"groupButton\" id=\"roomButton" + room.id + "\">" + room.name + "</button>";
    return html;
}

/*
 * Here are my thoughts on parts of what the client could have/need/use
 * 
 * 
 * User object:
 *      name
 *      currentRoom(?)
 *      Dictionary<RoomName,Room> all available rooms
 * 
 * Room object:
 *      roomId
 *      roomName
 *      List<Message> localMessages
 *      List<String> membersInRoom
 *      
 * Possible method calls needed:      
 *      onServerMessage(Room room, Message message)
 *          this is what the server calls to when it receives a message from someone else
 *          add message to room's local message list
 *          if you're in the room, call updateRoom(room) to update your chat box
 *      onMessage(Message message)
 *          called when you send a message to your current room
 *          should add message to local list, call updateRoom(ourUser.room)
 *          then it should send the message to the server so the server can emit to the other connected clients
 *          NewMessage{
 *              room: myUser.currentRoom
 *              message: message
 *          }
 *          socket.emit("newMessage",
 *      updateRoom(Room r)
 *          this will update the room's chat log to show all of the local chats
 *          it needs to call update when you open a new chat and when you receive a new chat(in your room)
 *      createRoom(UserList usernames)
 *          sends a call to the server to create a new room with the list of users
 *          server replies with room's id(?)
 *          if -1 failed to create room
 *          otherwise create a new room object and add it to our user's list of available rooms
 *          or another possibility is the server could reply with the user object, having added
 *          the room to the list of available rooms to the user server sided anyway maybe?
 *          newRoom = {
 *              id: server's reply
 *              messageList: {}
 *              userList: usernames
 *          }
 *          user.rooms.push(newRoom)
 *      addUserToRoom(Room r, String username)
 *          roomRequest = {
 *              room: r,
 *              username: username
 *          }
 *          socket.emit("addUserToRoom", roomRequest)
 *          sends a request to the server to add a user to the room
 *          returns with a success or not(?)
 *          r.userList.push(username)
 *          add user to room(?)
 *          
 *      removeUserFromRoom(Room r, String username)
 *          similar to addUserToRoom
 *      leaveRoom()
 *          just calls removeUserFromRoom(user.currentRoom, user.username)
 *          if success, removes current room from list of available rooms and places you in public
 *          
 *      enterRoom(Room r)
 *          this would be when the user clicks to enter a room (or closes room and enters public)
 *          calls updateRoom(r)
 *          sets user.currentRoom to r
 *          tells server joined room r(?)
 *          
 *          
 *          
 *          
 * Features
 * User can enter room by clicking it //need some way to get the room with ajax(?)
 * User can send messages in chat room //done
 * User can receive messages in chat room //done
 * User can start a new room with a selected group of people //need to add room to list of rooms in room tab, and get adding things to that working
 * User can start a private room without needing to go through create room process //need to add a way to get username as an object, may not implement
 * If you get a message in a room you're not in, the room lights up and a little notification icon pops up //need some way to get room with ajax
 * When you enter a room, you start scrolled down to the bottom of the chat box //need to be able to change rooms to test, need to get scrolling to work too
 * When you enter a room with new messages, you still start at the bottom of the chat box // ^
 * No indicator of which messages in the room are new (probably?)
 * User can leave rooms //need a leave room button when in a room (can't leave public room)
 * User can close rooms //need a separate button that just hides the room from the rooms list until a new message appears
 * If a room gets a message and is closed for the user (but user is still a user in the room) // ^
 *  it will reopen the room on the side and highlight or whatever indicator a new message is// ^
 * User can see a list of all people in a room //need to get updateUsersInRoom to work
 *  if in a private room with multilple people, should show whether online or offline(?) //maybe an socket.emit('isonline',userName)
 * In the Public room, it only shows online people. When a user goes offline, he should "Leave" the room //in logout maybe could remove username from user list?
 * On closing and reopening the page 
 *  the public room should show the last 10 or so messages (or up to the last 10 minutes?)
 *  all available rooms should still be listed in the rooms list
 *  all available rooms should show the last 10 or so messages (or up to the last 10 minutes?)
 */
