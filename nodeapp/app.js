//discord bot link: https://discordapp.com/developers/applications/me/316216046107361281

var Discordie = require('discordie');
var mysql = require('mysql');
var request = require('request');
var schedule = require('node-schedule');
var moment = require('moment');

const Events = Discordie.Events;
const client = new Discordie();

//var songchannel = '300448798365450240'; //real channel
var songchannel = '266749722692288512'; //test channel

var job_WinnerTracker;
//executes function to record winning poll at the end of 7 days
var job_PollCreater;
//executes function to create poll after 28 days

//The problem with using setDate directly is that it's a mutator and that sort of thing is best avoided. ECMA saw fit to treat Date as a mutable class rather than an immutable structure.
Date.prototype.addDays = function(days) {
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
}
Date.prototype.makeGMT = function(date) {
    date = new Date(date.toGMTString());
    return date;
}

var connection = mysql.createConnection({
    host: 'mysql4.gear.host',
    user: 'disappointedsong',
    password: 'Ry7T0qQ~10R-',
    database: 'disappointedsong'
});

/*var aDate = new Date();
console.log(moment(aDate).format('dddd, MMMM Do YYYY') + ' at ' + moment(aDate).utcOffset(0).format('h:mm:ss a'));*/

client.connect({
    token: 'MzE2MjE2MDQ2MTA3MzYxMjgx.DAjXfQ.9UJJewQgiPFgYne--eF2SaL33OE' //test channel
        //token: 'MzAwODEwOTE1NTg0OTMzODg4.DAZIDw.RAsvejCdsKL986Vc6MdJEvpHV5c' //real channel
});

client.Dispatcher.on(Events.GATEWAY_READY, e => {
    console.log('Connected as: ' + client.User.username);
    //console.log(client);
});

client.Dispatcher.on(Events.MESSAGE_CREATE, e => {
    if (e.message.channel_id == songchannel) {
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
            case '!clearmessages':
                console.log('Clearing last 50 messages...');
                clearMessages(50);
                break;
            case '!previouswinner':
                sendDiscordMessage(songchannel, 'Feature coming soon!');
                break;
            case '!invasion est':
                getCurrentInvasion(require('./invasions_est.json'), 240);
                break;
            case '!invasion cst':
                getCurrentInvasion(require('./invasions_est.json'), 300);
                break;
            case '!invasion mdt':
                getCurrentInvasion(require('./invasions_est.json'), 360);
                break;
            case '!invasion pst':
                getCurrentInvasion(require('./invasions_est.json'), 400);
                break;
            case '!invasion gmt':
                getCurrentInvasion(require('./invasions_est.json'), 0);
                break;
            case '!invasion':
                getCurrentInvasion(require('./invasions_est.json'), 0);
                break;
            case '!commands':
                sendDiscordMessage(songchannel, 'You can say: !smaktat, !collectVotes, !previousWinner, or !invasion <timezone> (EST, CST, MST, PST, GMT)');
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
    connection.query('SELECT * FROM polls where dateEnd > NOW() order by dateEnd desc limit 1', function(error, results, fields) {
        if (error) {
            console.log(error);
        } else if (results.length > 0) {
            console.log(results);
            var dateEnds = new Date(results[0].dateEnd);
            var currDate = new Date();
            var timeLeft = new Date();
            timeLeft.setDate(dateEnds.getDate() - currDate.getDate());

            var timeLeftHours, timeLeftDays, timeLeftMinutes;
            timeLeftDays = timeLeft.getDate();
            timeLeftHours = timeLeft.getHours();
            timeLeftMinutes = timeLeft.getMinutes();

            sendDiscordMessage(songchannel, 'An active poll is currently running: http://www.strawpoll.me/' + results[0].strawpollid + '.  The voting period will end on ' + dateEnds + '.  Time left to vote: ' + timeLeftDays + ' day(s), ' + timeLeftHours + ' hour(s), ' + timeLeftMinutes + ' minute(s).');
        } else {
            console.log('no active polls');
            //polls have 4 weeks to be active
            //first, get last entry in db
            //second, add 4 weeks to last entry
            //if under 4 weeks, output time to next allowed voting period
            //else, allow a new voting period
            connection.query('SELECT * FROM polls order by id desc limit 1', function(error, results, fields) {
                if (!results) {
                    createPoll();
                } else {
                    var endDate = new Date(results[0].dateEnd);
                    var startDate = new Date(results[0].dateStart);
                    var currDate = new Date();
                    var endDatePlusFour = new Date(endDate);
                    endDatePlusFour = endDatePlusFour.addDays(28);
                    if (Date.parse(endDatePlusFour) > Date.parse(currDate)) {
                        //still under the 4 week period
                        sendDiscordMessage(songchannel, 'Voting is currently on cooldown.  Next vote will take place on ' + endDatePlusFour);
                    } else {
                        sendDiscordMessage(songchannel, 'A new poll is being created.  The previous winner was: ' + results[0].winner);
                        createPoll();
                    }
                }

                //voting period
                //week 0 - 1
                //week 2 - 5, winning period
                //week 4 - 5, voting period
                //week 5 - 9, winning period
            });
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
    //var options = ['https://www.youtube.com/watch?v=nxZORz9zx6w']; //testing
    var options = [];
    var members = [];
    client.Channels.get(songchannel).fetchMessages().then(() => {
        var messages = client.Channels.get(songchannel).messages;
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
            sendDiscordMessage(songchannel, 'A new StrawPoll was created: http://www.strawpoll.me/' + body.id);
            addPollToDB(body.id);
        } else {
            sendDiscordMessage(songchannel, 'An error occurred while posting the Strawpoll: ' + response.body.errorMessage + '  The Poll was not created.');
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
            date = date.addDays(7);
            sendDiscordMessage(songchannel, 'The voting period has started.  Voting will end on ' + date);
            job_WinnerTracker = schedule.scheduleJob(date, function() {
                winner();
            });
        }
    });
}

function winner() {
    console.log('cron finished');
    connection.query('SELECT * FROM polls order by id desc limit 1', function(error, results, fields) {
        var spid = results[0].strawpollid;
        request({
            url: "https://strawpoll.me/api/v2/polls/" + spid,
            method: "GET",
            followAllRedirects: true
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(response.body);
                var responseBody = JSON.parse(response.body);
                for (var i = 0; i < responseBody.votes.length; i++) {
                    var index = 0;
                    var maxVotes = 0;
                    if (parseInt(responseBody.votes[i]) > maxVotes) {
                        maxVotes = responseBody.votes[i];
                        index = i;
                    }
                }
                connection.query("UPDATE polls set winner= '" + responseBody.options[index] + "' where strawpollid=" + spid, function(error, results, fields) {
                    if (error) {
                        sendDiscordMessage(songchannel, 'An error occurred while updating the Strawpoll winner: ' + error + ' @smaktat#1528');
                    } else {
                        sendDiscordMessage(songchannel, 'The voting period has ended! The winner is... : ' + responseBody.options[index]);
                        sendDiscordMessage(songchannel, 'This song will rule for 4 weeks.  The next poll will begin in 3 weeks.  You can start posting submissions now!');
                        var newPollDate = new Date();
                        newPollDate = newPollDate.addDays(21);
                        job_PollCreater = schedule.scheduleJob(newPollDate, function() {
                            getActivePoll();
                        });
                    }
                });
            } else {
                sendDiscordMessage(songchannel, 'An error occurred while getting the Strawpoll: ' + ' @smaktat#1528');
            }
        });
    });
}

function sendDiscordMessage(channelId, message) {
    client.Channels.get(channelId).sendMessage(message);
}

function clearMessages(amount) {
    client.Channels.get(songchannel).fetchMessages(amount).then(() => {
        var messages = client.Channels.get(songchannel).messages;
        client.Messages.deleteMessages(messages, songchannel);
        console.log('Messages cleared.');
    }).catch((err) => {
        sendDiscordMessage(songchannel, err);
    });
}

function getCurrentInvasion(invasions, tz) {
    console.log('finding invasions');
    var currDate = new Date();
    for (var i = 0; i < invasions.length; i++) {
        var obj = invasions[i];
        var start = new Date(obj['FIELD1']);
        var end = new Date(obj['FIELD2']);

        start.setYear('2017');
        end.setYear('2017');

        if (!tz) {
            tz = 0;
        }

        //console.log(moment(aDate).format('dddd, MMMM Do YYYY') + ' at ' + moment(aDate).utcOffset(0).format('h:mm:ss a'));

        //currDate.getTimezoneOffset(); //240 for EST

        //console.log('currDate: ' + currDate + ', time: ' + currDate.getTime());
        //console.log('start: ' + start + ', end: ' + end);

        if (currDate.getTime() <= end.getTime()) {
            //invasion hasn't ended
            var timeDiff = end.getTime() - currDate.getTime();
            var timeLeft_Hours = Math.floor(timeDiff / 3600000);
            var timeLeft_Minutes = Math.floor(timeDiff / 60000);
            var minutes_factor = Math.floor(timeLeft_Minutes / 60);
            timeLeft_Minutes -= 60 * minutes_factor;
            if (currDate.getTime() >= start.getTime()) {
                //invasion is currently happening
                sendDiscordMessage(songchannel, 'An invasion is happening now!  It will end at ' + moment(end).utcOffset(tz).format('h:mm a z') + '.  There are ' + timeLeft_Hours + ' hour(s) and ' + timeLeft_Minutes + ' minute(s) left before it ends.');
            } else {
                //this will be the next invasion
                sendDiscordMessage(songchannel, 'The next invasion will begin on ' + start.toLocaleDateString() + ' at ' + moment(start).utcOffset(tz).format('dddd, MMMM Do YYYY, h:mm a z') + '.  There are ' + timeLeft_Hours + ' hours and ' + timeLeft_Minutes + ' minutes until this invasion will begin.');
            }
            //output next 3 invasion times here
            var start_1, start_2, start_3, end_1, end_2, end_3;
            if (invasions[i + 1]) {
                obj = invasions[i + 1];
                start_1 = new Date(obj['FIELD1']);
                end_1 = new Date(obj['FIELD2']);
            }
            if (invasions[i + 2]) {
                obj = invasions[i + 2];
                start_2 = new Date(obj['FIELD1']);
                end_2 = new Date(obj['FIELD2']);
            }
            if (invasions[i + 3]) {
                obj = invasions[i + 3];
                start_3 = new Date(obj['FIELD1']);
                end_3 = new Date(obj['FIELD2']);
            }
            sendDiscordMessage(songchannel, 'Here are the next 3 invasions.\nBegin: ' + moment(start_1).utcOffset(tz).format('dddd, MMMM Do YYYY, h:mm a z') + ' | ' + ' End: ' + moment(end_1).utcOffset(tz).format('dddd, MMMM Do YYYY, h:mm a z') + '\nBegin: ' + moment(start_2).utcOffset(tz).format('dddd, MMMM Do YYYY, h:mm a z') + ' | ' + ' End: ' + moment(end_2).utcOffset(tz).format('dddd, MMMM Do YYYY, h:mm a z') + '\nBegin: ' + moment(start_3).utcOffset(tz).format('dddd, MMMM Do YYYY, h:mm a z') + ' | ' + ' End: ' + moment(end_3).utcOffset(tz).format('dddd, MMMM Do YYYY, h:mm a z'));

            break;
        }
    }
}
