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
 * 'leaveGroup', user{name:name},room{id:roomID}
 *      //respond with 'userLeftGroup'(?)
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
 * 'userLeftGroup', user{name:name},room{id:roomID}
 *      //response to 'leaveGroup'
 * 'userLoggedOut', user{name:name}
 *      //broadcasted response to logout (?)
 */

$(document).ready(function () {
    $("#loginPrompt").modal('show');

    //'logout',user
    //responds with 'userLoggedOut'(?)
    $("#logout").on('click', function () {
        socket.emit('logout', user.name);
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

        socket.emit('newuser', account);

    });
    // 'newRoom', room{users:users, name:name}
    //responds with 'sendroom'
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

    // 'messageToServer', message{sender:sender, msg:message, time:time},room{id:roomID}
    //responds with 'messageFromServer'
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
    //'leaveGroup', user{name:name},room{id:roomID}
    //respond with 'userLeftGroup'(?)
    $("#leaveGroupButton").on('click', function () {
        //can't leave public room
        if (user.currentRoom.id === 0)
            return;
        var user = {
            name: user.name
        };
        var room = {
            id: user.currentRoom.id
        };
        //enter public room
        enterRoom(user.availableRooms[0]);
        //remove group from user's groups
        delete user.availableRooms[user.currentRoom.id];
        //updateGroupsList
        updateGroupsList();
        socket.emit("userLeftGroup", user, room);
    });

    //'sendroom', room{id:roomID,users:users,localLog:localLog}
    //response to 'newRoom'
    socket.on("sendroom", function (room) {
        //TODO
        //should just be used for new users and new groups
        if (!(room.id in user.availableRooms)) {
            user.availableRooms[room.id] = room;
        }
        updateGroupsList();
        //enter room
        enterRoom(room);
    });

    //'messageFromServer', message{sender:sender,msg:message,time:time}, room{id:roomID}
    //response to 'messageToServer'
    socket.on('messageFromServer', function (message, room) {
        //if the room's id is part of my available rooms, add stuff to it
        //otherwise just don't do anything
        if (room.id in Object.keys(user.availableRooms)) {
            user.availableRooms[room.id].localLog.push(message);
            $("#room" + room.id).append(createMessageHTML(message));
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

    //'userLoggedIn', user{name:name}
    //on successful login, this broadcasts to all clients
    socket.on('userLoggedIn', function (userInfo) {
        //for each room that you have that this user's name is in
        //update the user list in it to show that they've loggeg in
        //maybe include a "User has entered the channel" message to the rooms?
        this.user.availableRooms[0].users.push(userInfo.name);
        var keys = Object.keys(this.user.availableRooms);
        keys.forEach(function (key) {
            var room = this.user.availableRooms[key];
            var users = room.users;
            if (userInfo.name in users) {
                updateUsersInRoom(room);
                var loggedInMessage = {
                    sender: "Server",
                    msg: userInfo.name + " logged in.",
                    time: new Date()
                };
                socket.emit("messageToServer", loggedInMessage, room);
            }
        });
    });


    //'senduser', userInfo{name:name, rooms:availableRooms{id:id,users:users,localLog:someLog/emptyLog}}
    //response to 'login' and 'createuser'
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
            //set login message to an error
            alert("Invalid username/password");
            return;
        }
        user.name = userInfo.name;
        if(userInfo.rooms.length > 0){
        var keys = Object.keys(userInfo.rooms);
        keys.forEach(function (key) {
            user.availableRooms[key] = userInfo.rooms[key];
                    //make all the room divs
            var div = createDiv(user.availableRooms[key]);
            $("#publicChat").append(div);

        });
    }
        else{
            var publicRoom = {
                name: "Public",
                users: [user.name],
                id: 0,
                localLog: []
            };
            user.availableRooms[0] = publicRoom;
        }
        //user = userInfo;
        //check if valid user
        user.currentRoom = user.availableRooms[0];
        $("#displayUserName").text(user.name);
        enterRoom(user.availableRooms[0]);
        //var keys = Object.keys(user.availableRooms);
        //$("#currentUsers").append("<p>" + user.availableRooms[0].users + "</p>" + "</br");
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

        $('#loginPrompt').modal('hide');
    });

    //'userLeftGroup', user{name:name},room{id:roomID}
    //response to 'leaveGroup'
    socket.on('userLeftGroup', function (user, room) {
        if (room.id in Object.keys(this.user.availableRooms)) {
            //remove user.name from room
            var index = this.user.availableRooms[room.id].users.indexOf(user.name);
            this.user.availableRooms[room.id].users.split(index, 1);
            updateUsersInRoom(this.user.availableRooms[room.id]);
        }
    });

    //'userLoggedOut', user{name:name}
    //broadcasted response to logout (?)
    socket.on('userLoggedOut', function (user) {
        var keys = Object.keys(this.user.availableRooms);
        var room = this.user.availableRooms[0];
        if (room.users.indexOf(user.name) >= 0) {
            room.users.splice(room.users.indexOf(user.name),1);
        }
        updateUsersInRoom(room);
        keys.forEach(function (key) {
            var room = this.user.availableRooms[key];
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
    //clear list of users(?)
    $("#currentUsers").html("");
    room.users.forEach(function (user) {
        $("#currentUsers").append("<p>" + user + "</p>");
    });
}

function updateGroupsList() {
    //TODO
    var keys = Object.keys(user.availableRooms);
    //clear our the current groups list
    $("#currentGroups").html("");
    keys.forEach(function(key){
        var roomElem = createGroupElement(user.availableRooms[key]);
        //add room element to groups list
        $("#currentGroups").append(roomElem);
        //add click function to it (?)
        $("#roomButton"+user.availableRooms[key].id).on('click',function(){
            enterRoom(user.availableRooms[key]);
        });
    });
}

function createGroupElement(room){
    //create html for a group thing for the list
    //give it an id of roomButton1, roomButton2, etc
    var html = "<div id=roomButton"+room.id+"></div>";
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
