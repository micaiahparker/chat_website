//var socket = io();

$(document).ready(function(){
    $("#loginPrompt").modal('show');
    
    $('#login').on('click', function(){
        
        let getUsername = $('#username').val(),
            getPassword = $('#password').val(),
            login = {};
        
        login.user = getUsername;
        login.pass = getPassword;
        
        socket.emit('login', login);
        
        $('#loginPrompt').modal('hide');
        
    });
    
    $('#createAccount').on('click', function(){
        let createUser = $('#username').val(),
            createPassword = $("#password").val(),
            account = {};
        account.user = createUser;
        account.pass = createPassword;
        
        socket.emit('newuser', account);
        
        $('#loginPrompt').modal('hide');
        
    });
        
	});


