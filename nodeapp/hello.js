var Discordie = require('discordie');
var mysql = require('mysql');
var request = require('request');

const Events = Discordie.Events;
const client = new Discordie();

var connection = mysql.createConnection({
    host: 'mysql4.gear.host',
    user: 'disappointedsong',
    password: 'Ry7T0qQ~10R-',
    database: 'disappointedsong'
});

client.connect({
    //token: 'MzAwODEwOTE1NTg0OTMzODg4.C-0eXA.B6uha44_ewJlbJ4cTHfbOtFy2TQ'
    token: 'MzE2MjE2MDQ2MTA3MzYxMjgx.DASC1Q.2RrA5mLhJQzTUxLQHyYiyQoY2Dc'
});

client.Dispatcher.on(Events.GATEWAY_READY, e => {
    console.log('Connected as: ' + client.User.username);
    //console.log(client);
});

client.Dispatcher.on(Events.MESSAGE_CREATE, e => {
    if (e.message.channel_id == '266749722692288512') {
        switch (e.message.content.toLowerCase()) {
            case 'ping':
                e.message.channel.sendMessage('PONG');
                break;
            case '!smaktat':
                e.message.channel.sendMessage('all on the floor');
                break;

            case '!collectvotes':
                getActivePoll();
                break;
        }
    }
});

function checkValidYoutubeUrl(url) {
    url = url.replace(/(>|<)/gi, '').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
    if (url[2] !== undefined) {
        //ID = url[2].split(/[^0-9a-z_\-]/i);
        //ID = ID[0];
        return true;
    } else {
        //ID = url;
        //error += 'The Youtube URL entered is invalid. ';
        //displayNotification(error, 'error');
        return false;
    }
}


function formatYoutubeUrl(url) {
    var videoid = url.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);
    return videoid[1];
}

function getActivePoll() {
    connection.query('SELECT * FROM polls where dateEnd > NOW()', function(error, results, fields) {
        if (error) throw error;
        if (results.length > 0) {
        	var dateEnds = new Date(results[0].dateEnd);
        	var currDate = new Date();
        	var timeLeft = new Date();
        	timeLeft.setDate(dateEnds.getDate() - currDate.getDate());

        	var timeLeftHours, timeLeftDays, timeLeftMinutes;
        	timeLeftDays = timeLeft.getDate();
        	timeLeftHours = timeLeft.getHours();
        	timeLeftMinutes = timeLeft.getMinutes();

            sendDiscordMessage('266749722692288512', 'An active poll is currently running: http://www.strawpoll.me/' + results[0].strawpollid + '.  The voting period will end on ' + dateEnds + '.  Time left to vote: ' + timeLeftDays + ' day(s), ' + timeLeftHours + ' hour(s), ' + timeLeftMinutes + ' minute(s).');
        } else {
            console.log('no active polls');
            //polls have 4 weeks to be active
            //first, get last entry in db
            //second, add 4 weeks to last entry
            //if under 4 weeks, output time to next allowed voting period
            //else, allow a new voting period

            //no active polls, create one
            createPoll();
        }
    });
}

function createPoll() {
    var myJSONObject = {};
    myJSONObject['title'] = 'Disappointed_SongVote_BotTest';
    fetchMessages(myJSONObject);
}

function fetchMessages(object) {
    //console.log(client.Messages.forChannel('300448798365450240'));
    //console.log(client);
    //bot.Channels.get('channelid').fetchMessages() // you can also use a raw channel object.
    var options = ['https://www.youtube.com/watch?v=nxZORz9zx6w'];
    var members = [];
    client.Channels.get('266749722692288512').fetchMessages().then(() => {
        var messages = client.Channels.get('266749722692288512').messages;
        for (var i = 0; i < messages.length; i++) {
            if (messages[i].embeds.length > 0) {
                if (checkDups(members, messages[i].author.id) == false && messages[i].author.id != '316216046107361281') {
                    members.push(messages[i].author.id);
                    options.push(messages[i].embeds[0].url);
                }
                /*if (checkValidYoutubeUrl(messages[i].embeds[0].url)) {
                    var url = formatYoutubeUrl(messages[i].embeds[0].url);
                    console.log(url);
                }*/
            }
        }
        object['options'] = options;
        submitStrawPoll(object);
    }).catch((err) => {
        console.log(err);
    });
}

function checkDups(members, memberCheck) {
    var status = false;
    members.forEach(function(member) {
        if (memberCheck == member) {
            status = true;
        }
    });
    return status;
}

function submitStrawPoll(options) {
    request({
        url: "https://strawpoll.me/api/v2/polls",
        method: "POST",
        followAllRedirects: true,
        json: true, // <--Very important!!!
        body: options,
        headers: {
            "Content-Type": "application/json"
        }
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body)
                //do db stuff to track
            sendDiscordMessage('266749722692288512', 'A new StrawPoll was created: http://www.strawpoll.me/' + body.id);
            addPollToDB(body.id);
        } else {
            sendDiscordMessage('266749722692288512', 'An error occurred while posting the Strawpoll: ' + response.body.errorMessage + '  The Poll was not created.');
        }
    });
}

function addPollToDB(id) {
    console.log(id);

    connection.query('INSERT INTO polls (strawpollid, dateStart, dateEnd) VALUES(' + id + ', Now(), DATE_ADD(Now(),INTERVAL 1 WEEK))', function(error, results, fields) {
        if (error) {
            console.log(error);
        } else {
            console.log('Poll added to DB successfully.');
            var date = new Date();
            date.setDate(date.getDate() + 7);
            sendDiscordMessage('266749722692288512', 'The voting period has started.  Voting will end on ' + date);
        }
    });
}

function sendDiscordMessage(channelId, message){
	client.Channels.get(channelId).sendMessage(message);
}