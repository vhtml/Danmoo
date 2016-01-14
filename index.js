var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//启动
var port = process.env.PORT || 8090;
http.listen(port, function() {
	console.log('Server listening at port %d', port);
});

//路由
app.use(express.static('public'));


//socket实时消息
io.on('connection', function(socket) {
	console.log('a guest connected');
	socket.on('disconnect', function() {
		console.log('a guest disconnected');
	});

	socket.on('barrage', function(msg) {
		console.log(msg + ' ---- ' + socket.handshake.headers['user-agent']);
		if(msg.trim().length > 0){
			io.emit('barrage', msg.substring(0,30));
		}
	});
});