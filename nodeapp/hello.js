var Discordie = require('discordie');

const Events = Discordie.Events;
const client = new Discordie();

client.connect({ 
	//token: 'MzAwODEwOTE1NTg0OTMzODg4.C-0eXA.B6uha44_ewJlbJ4cTHfbOtFy2TQ'
	token: 'MzAwODEwOTE1NTg0OTMzODg4.DADwhQ.GiR4m4j50sGlgJ8fjI7UYVNtSPM'
});

client.Dispatcher.on(Events.GATEWAY_READY, e => {
	console.log('Connected as: ' + client.User.username);
	console.log(client);
});

client.Dispatcher.on(Events.MESSAGE_CREATE, e => {
	if(e.message.channel_id == '300448798365450240'){
		if(e.message.content == 'PING') {
			e.message.channel.sendMessage('PONG');
		}
		if(e.message.content.toLowerCase() == '!smaktat') {
			e.message.channel.sendMessage('all on the floor');
		}
		if(e.message.content.toLowerCase() == '!collectvotes'){
			//console.log(client.Messages.forChannel('300448798365450240'));
			console.log(client);
		}
	}
});