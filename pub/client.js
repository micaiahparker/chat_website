var socket = io();

var user = {
    name: "Jack",
    currentRoom: "Public",
    availableRooms: {}
};

/**
 * to server calls:
 * 'logout',user
 * 'login', login{name:name, password:password}
 * 'newuser', login{name:name, password:password}
 * 'newRoom', room{users:users, name:name}
 * 'messageToServer', message{sender:sender, msg:message, time:time},room{id:roomID}
 * 
 * from server calls:
 * 'sendroom', room{id:roomID,users:users,localLog:localLog}
 * 'messageFromServer', message{sender:sender,msg:message,time:time}, room{id:roomID}
 * 'userLoggedIn', user{name:name,rooms:availableRooms{id:id, users:users}}
 * 'senduser', userInfo{name:name, rooms:availableRooms{id:id,users:users,localLog:someLog/emptyLog}}
 */

$(document).ready(function () {
    $("#loginPrompt").modal('show');

    $("#logout").on('click', function () {
        socket.emit('logout', user.name);
        //show the login modal again?
    });

    $('#login').on('click', function () {

        var getUsername = $('#username').val(),
                getPassword = $('#password').val(),
                login = {};

        login.user = getUsername;
        login.pass = getPassword;
        //hash password
        socket.emit('login', login);
        //socket.emit("dumblogin", login);
    });

    $('#createAccount').on('click', function () {
        var createUser = $('#username').val(),
                createPassword = $("#password").val(),
                account = {};
        account.user = createUser;
        account.pass = createPassword;

        socket.emit('newuser', account);

    });

    $("#createGroupButton").on('click', function () {
        var groupName = $("#groupName").val(),
                groupUsers = $("#users").val();

        var splitUsers = groupUsers.split(",");
        var room = {
            users: splitUsers,
            name: groupName,
            messages: []
        };
        socket.emit("newRoom", room);
    });

    socket.on("sendroom", function (room) {
        //TODO
        //should just be used for new users and new groups
        if (!(room.id in user.availableRooms)) {
            user.availableRooms[room.id] = room;
        }
        //enter room
        enterRoom(room);
    });

    $("#sendChatButton").on('click', function () {
        var msg = $("#message").val();
        if (msg !== "") {
            var sender = user.name;
            var time = new Date();
            var message = {
                sender: sender,
                msg: msg,
                time: time
            };
            var room = {
                id: user.currentRoom.id
            };
            $("#message").val("");
            socket.emit("messageToServer", message, room);
        }
    });

    socket.on('messageFromServer', function (message, room) {
        //if the room's id is part of my available rooms, add stuff to it
        //otherwise just don't do anything
        if (room.id in Object.keys(user.availableRooms)) {
            user.availableRooms[room.id].localLog.push(message);
            $("#room" + room.id).append(createMessageHTML(message));
            //if i'm not in the room, light up room
        }

    });

    socket.on('userLoggedIn', function (user) {
        //for each room that you have that this user's name is in
        //update the user list in it to show that they've logge in
        //maybe include a "User has entered the channel" message to the rooms?
        var keys = Object.keys(this.user.availableRooms);
        keys.forEach(function (key) {
            var room = this.user.availabeRooms[key];
            var users = room.users;
            if (user in users) {
                updateUsersInRoom(room);
                var loggedInMessage = {
                    sender: "Server",
                    msg: user.name + " logged in.",
                    time: new Date()
                };
                socket.emit("messageToServer", loggedInMessage, room);
            }
        });
    });


    socket.on('senduser', function (userInfo) {
        //TODO
        //assuming userInfo will eventually contain:
        //{
        //  name: username
        //  availableRooms: rooms (id's or the dictionary of rooms?
        //}

        /*
         * user.name = userInfo.username;
         * user.availableRooms = userInfo.rooms
         * or
         * userInfo.rooms.forEach(function(room){
         *  user.availableRooms[room] = getRoomFromServerByID(room);
         *  });
         * displayRoom(user.availableRooms[0]);//put them in the public room
         * updateUsers(user.availableRooms[0]);
         * append either the last 10 messages of the public room's server log or maybe just not show them?
         * 
         */
        if (userInfo.name === "null") {
            return;
        }
        user.name = userInfo.name;
        var keys = Object.keys(userInfo.rooms);
        keys.forEach(function(key){
           user.availableRooms[key] = userInfo.rooms[key]; 
        });
        //user = userInfo;
        //check if valid user
        $("#displayUserName").text(user.name);
        //var keys = Object.keys(user.availableRooms);
        $("#currentUsers").append("<p>" + user.availableRooms[0].users + "</p>" + "</br");
        /*
         var groupNameAsLink = $('<a>',{
         text: someGroupName,
         href:'#',
         click:function(){
         
         //puts you into that room
         //displays that room's chat
         
         return false; 
         }
         }).appendTo("#createGroup");
         */

        //make all the room divs
        var div = createDiv(user.availableRooms[0]);
        $("#publicChat").append(div);
        $('#loginPrompt').modal('hide');


    });

    $("#userListTab").on('click', function () {
        //show the user's list in the current room
    });

    $("#roomListTab").on('click', function () {
        //show the room's list to show
    });


});

function createDiv(room) {
    var div = "<div id=room" + room.id + " style=\"overflow: auto\"></div>";
    return div;
}

function createMessageHTML(message) {
    var msg = "<p>" + message.sender + ": " + message.msg + " |" + message.time + "</p>";
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
    room.users.forEach(function (user) {
        $("#currentUsers").append("<p>" + user + "</p>");
    });
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
 *      List<String> membersInGroup
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
 * User can enter room by clicking it
 * User can send messages in chat room
 * User can receive messages in chat room
 * User can start a new room with a selected group of people
 * User can start a private room without needing to go through create room process
 * If you get a message in a room you're not in, the room lights up and a little notification icon pops up
 * When you enter a room, you start scrolled down to the bottom of the chat box
 * When you enter a room with new messages, you still start at the bottom of the chat box
 * No indicator of which messages in the room are new (probably?)
 * User can leave rooms
 * User can close rooms
 * If a room gets a message and is closed for the user (but user is still a user in the room)
 *  it will reopen the room on the side and highlight or whatever indicator a new message is
 * User can see a list of all people in a room
 *  if in a private room with multilple people, should show whether online or offline(?)
 * In the Public room, it only shows online people. When a user goes offline, he should "Leave" the room
 * On closing and reopening the page 
 *  the public room should show the last 10 or so messages (or up to the last 10 minutes?)
 *  all available rooms should still be listed in the rooms list
 *  all available rooms should show the last 10 or so messages (or up to the last 10 minutes?)
 */
