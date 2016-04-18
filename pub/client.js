var socket = io();

$(document).ready(function(){
    $("#loginPrompt").modal('show');
    
    $('#login').on('click', function(){
        
        var getUsername = $('#username').val(),
            getPassword = $('#password').val(),
            login = {};
        
        login.user = getUsername;
        login.pass = getPassword;
        
        socket.emit('login', login);
        
    });
    
    $('#createAccount').on('click', function(){
        var createUser = $('#username').val(),
            createPassword = $("#password").val(),
            account = {};
        account.user = createUser;
        account.pass = createPassword;
        
        socket.emit('newuser', account);
        
    });
    
    $("#createGroupButton").on('click',function(){
        var groupName = $("#groupName").va(),
            groupUsers = $("#users").val();
            
        var splitUsers = groupUsers.split(",");
        splitUsers.forEach(function(user){
            console.log(user);
        });
        
    });
    
    socket.on('senduser', function(userInfo){
        $('#loginPrompt').modal('hide');
    });
    
    /*
     * 
     * 
     */
       
});
/*
 * Here are my thoughts on parts of what the client could have/need/use
 * 
 * 
 * User object:
 *      name
 *      currentRoom(?)
 *      List<Room> all available rooms
 *      id(?)//name is probably id i guess?
 * 
 * Room object:
 *      roomId
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
