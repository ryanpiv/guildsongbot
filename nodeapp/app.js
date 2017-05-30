//discord bot link: https://discordapp.com/developers/applications/me/316216046107361281

var Discordie = require('discordie');
var mysql = require('mysql');
var request = require('request');
var schedule = require('node-schedule');
var moment = require('moment');
var moment_tz = require('moment-timezone');

const Events = Discordie.Events;
const client = new Discordie();

var songchannel = '300448798365450240'; //real channel
//var songchannel = '266749722692288512'; //test channel

var job_WinnerTracker;
//executes function to record winning poll at the end of 7 days
var job_PollCreater;
//executes function to create poll after 28 days

var votingPeriodDays = 7;
//the amount of days users have to submit their votes
var winningPeriodDays = 21;
//the amount of days a winning poll stays alive

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

connection.query('set time_zone="+00:00"', function(error, results, fields) {
    if (error) {
        console.log('error setting the timezone: ' + error);
    }
});

/*var aDate = new Date();
console.log(moment(aDate).format('dddd, MMMM Do YYYY') + ' at ' + moment(aDate).utcOffset(0).format('h:mm:ss a'));*/

client.connect({
    //token: 'MzE2MjE2MDQ2MTA3MzYxMjgx.DAjXfQ.9UJJewQgiPFgYne--eF2SaL33OE' //test channel
    token: 'MzAwODEwOTE1NTg0OTMzODg4.DAZIDw.RAsvejCdsKL986Vc6MdJEvpHV5c' //real channel
});

client.Dispatcher.on(Events.GATEWAY_READY, e => {
    console.log('Connected as: ' + client.User.username);
    //console.log(client);
});

client.Dispatcher.on(Events.MESSAGE_CREATE, e => {
    if (e.message.channel_id == songchannel) {
        var command = e.message.content.toLowerCase();

        var whitespace = '';
        if (command.substring(0, 1) == '!') {
            console.log('received full command: ' + command);
            if (command.indexOf(' ') > -1) {
                whitespace = command.substring(command.indexOf(' ') + 1, command.length).toLowerCase();
                command = command.substring(0, command.indexOf(' '));
                console.log('received command param 1: ' + command + ', 2: ' + whitespace);
            }
            switch (command) {
                case '!ping':
                    console.log('ping executing');
                    e.message.channel.sendMessage('PONG');
                    break;
                case '!about':
                    {
                        e.message.channel.sendMessage('Once every ' + (votingPeriodDays + winningPeriodDays) + ' a new guild song is determined through an auto generated Strawpoll.  You have ' + winningPeriodDays + ' days to submit songs to this channel.  At the end of the timer, the poll is created.  You will then have ' + votingPeriodDays + ' days to vote on the submissions.  See the current or last poll submissions at http://disappointedsongvote.gear.host');
                        break;
                    }
                case '!smaktat':
                    console.log('smaktat executing');
                    e.message.channel.sendMessage('all on the floor');
                    break;
                case '!songvote':
                    console.log('get active poll executing');
                    getActivePoll();
                    break;
                case '!clearmessages':
                    console.log('clear messages executing');
                    if (whitespace == '') {
                        e.message.channel.sendMessage('Please send a value between 1 and 100 for the amount of messages to clear.');
                    } else {
                        if (parseInt(whitespace)) {
                            if (whitespace > 0 && whitespace < 101) {
                                console.log('Clearing last ' + whitespace + ' messages...');
                                clearMessages(whitespace);
                            } else {
                                e.message.channel.sendMessage('Please send a numerical value for the amount of messages to delete, between the values of 1 and 100.');
                            }
                        } else {
                            e.message.channel.sendMessage('Please send a numerical value for the amount of messages to delete, between the values of 1 and 100.');
                        }
                    }
                    break;
                case '!previouswinner':
                    console.log('previous winner executing');
                    sendDiscordMessage(songchannel, 'Feature coming soon!');
                    break;
                case '!invasion':
                    console.log('invasions executing');
                    console.log('finding invasion in ' + whitespace + ' timezone');
                    switch (whitespace) {
                        case 'est':
                            console.log('executing invasion finder for est');
                            getCurrentInvasion(require('./invasions_est.json'), 'America/New_York');
                            break;
                        case 'cst':
                            console.log('executing invasion finder for cst');
                            getCurrentInvasion(require('./invasions_est.json'), 'America/Chicago');
                            break;
                        case 'mdt':
                            console.log('executing invasion finder for mdt');
                            getCurrentInvasion(require('./invasions_est.json'), 'America/Phoenix');
                            break;
                        case 'pst':
                            console.log('executing invasion finder for pst');
                            getCurrentInvasion(require('./invasions_est.json'), 'America/Los_Angeles');
                            break;
                        case 'gmt':
                            console.log('executing invasion finder for gmt');
                            getCurrentInvasion(require('./invasions_est.json'), 0);
                            break;
                        default:
                            console.log('executing invasion finder for gmt');
                            getCurrentInvasion(require('./invasions_est.json'), 'America/Phoenix');
                    }

                    break;
                case '!commands':
                    console.log('commands executing');
                    sendDiscordMessage(songchannel, 'You can say: !smaktat, !songVote, !about, !previousWinner, or !invasion <timezone> (EST, CST, MST, PST, GMT)');
                    break;
                default:
                    console.log('default executing');
                    sendDiscordMessage(songchannel, 'That command was not recognized.  You can say: !smaktat, !songVote, !previousWinner, or !invasion <timezone> (EST, CST, MST, PST, GMT)');
            }
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

            sendDiscordMessage(songchannel, 'An active poll is currently running: http://www.strawpoll.me/' + results[0].strawpollid + '.  The voting period will end on ' + moment(dateEnds).utcOffset(0).format('dddd, MMMM Do YYYY, h:mm a z') + '.  Time left to vote: ' + timeLeftDays + ' day(s), ' + timeLeftHours + ' hour(s), ' + timeLeftMinutes + ' minute(s).');
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
                        sendDiscordMessage(songchannel, 'Voting is currently on cooldown.  All links submitted to the channel will count towards the next vote.  Next vote will begin on ' + moment(endDatePlusFour).utcOffset(0).format('dddd, MMMM Do YYYY, h:mm a z'));
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
    myJSONObject['title'] = 'Disappointed_SongVote ' + moment(new Date()).format('dddd, MMMM Do YYYY');
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
            if (messages[i].embeds.length > 0 && messages[i].author.id != '316216046107361281' && messages[i].author.id != '300810915584933888') {
                if (checkValidYoutubeUrl(messages[i].embeds[0].url)) {
                    //var url = formatYoutubeUrl(messages[i].embeds[0].url);
                    if (checkDups(members, messages[i].author.id) == false) {
                        //checkDups adds a user to an array based on your most recent posting.  aka if you're in the array you have a more recent post
                        members.push(messages[i].author.id);
                        options.push(messages[i].embeds[0].url + ' - ' + messages[i].embeds[0].title + ' by ' +
                            messages[i].author.username);
                    }
                }
            }
        }
        object['options'] = options;
        submitStrawPoll(object);
    }).catch((err) => {
        console.log('An error occurred in the fetchMessages() method:' + err);
        sendDiscordMessage(songchannel, 'Well this is embarassing.  You should never see this.  An error occurred in the fetchMessages() method: ' + err + ' <@105094681141977088>');
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
            //date = date.addDays(votingPeriodDays);
            date = moment(date).add(votingPeriodDays, 'days');
            sendDiscordMessage(songchannel, 'The voting period has started.  Voting will end on ' + moment(date).tz('America/New_York').format('dddd, MMMM Do YYYY, h:mm a z'));
            console.log('starting job, will finish at: ' + moment(date).format('dddd, MMMM Do YYYY, h:mm a z') + ', raw: ' + date);
            job_WinnerTracker = schedule.scheduleJob(new Date(date), function() {
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

                var index = 0;
                var maxVotes = 0;
                var totalVotes = 0;
                var responseBody = JSON.parse(response.body);
                for (var i = 0; i < responseBody.votes.length; i++) {
                    if (parseInt(responseBody.votes[i]) > maxVotes) {
                        maxVotes = responseBody.votes[i];
                        index = i;
                    }
                    totalVotes += responseBody.votes[i];
                }
                connection.query("UPDATE polls set winner= '" + responseBody.options[index] + "', totalVotes='" + totalVotes + "', totalVotesWinner='" + maxVotes + "' where strawpollid=" + spid, function(error, results, fields) {
                    if (error) {
                        sendDiscordMessage(songchannel, 'An error occurred while updating the Strawpoll winner: ' + error + ' <@105094681141977088>');
                    } else {
                        sendDiscordMessage(songchannel, 'The voting period has ended! The winner is... : ' + responseBody.options[index]);

                        var newPollDate = new Date();
                        newPollDate = moment(newPollDate).add(winningPeriodDays, 'days');
                        sendDiscordMessage(songchannel, 'The poll is on cooldown until ' + moment(newPollDate).format('MM-DD-YYYY') + '.  You may post your submissions for the next voting period now.');
                        job_PollCreater = schedule.scheduleJob(new Date(newPollDate), function() {
                            getActivePoll();
                        });
                    }
                });
            } else {
                sendDiscordMessage(songchannel, 'An error occurred while getting the Strawpoll: ' + ' <@105094681141977088>');
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
    try {
        console.log('finding invasions');
        var currDate = new Date();
        if (!tz) {
            tz = 0;
        }
        console.log('the timezone offset is: ' + tz);
        for (var i = 0; i < invasions.length; i++) {
            var obj = invasions[i];
            var start = new Date(obj['FIELD1']);
            var end = new Date(obj['FIELD2']);

            start.setYear(new Date().getFullYear());
            end.setYear(new Date().getFullYear());

            //currDate.getTime() <= end.getTime()
            var isAfter = moment(end).isAfter(currDate);
            if (isAfter) {
                //invasion hasn't ended
                //var timeDiff = end.getTime() - currDate.getTime();
                var timeDiff = moment(end).diff(moment(currDate));
                //var timeLeft_Hours = Math.floor(timeDiff / 3600000);
                var timeLeft_Begin_Hours = moment(start).diff(moment(currDate), 'hours');
                var timeLeft_End_Hours = moment(end).diff(moment(currDate), 'hours');
                //var timeLeft_Minutes = Math.floor(timeDiff / 60000);
                var timeLeft_Begin_Minutes = moment(start).diff(moment(currDate, 'minutes'));
                var timeLeft_End_Minutes = moment(end).diff(moment(currDate, 'minutes'));
                var timeLeft_Begin_Minutes = Math.floor(timeLeft_Begin_Minutes % 60);
                var timeLeft_End_Minutes = Math.floor(timeLeft_End_Minutes % 60);

                //currDate.getTime() >= start.getTime()
                isAfter = moment(currDate).isAfter(start);
                if (isAfter) {
                    //invasion is currently happening
                    sendDiscordMessage(songchannel, 'An invasion is happening now!  It will end at ' + moment(end).tz(tz).format('h:mm a z') + '.  Time remaining: ' + timeLeft_End_Hours + ' hours ' + timeLeft_End_Minutes + ' minutes.');
                } else {
                    //this will be the next invasion
                    sendDiscordMessage(songchannel, 'The next invasion will begin on ' + moment(start).format('dddd, MMMM Do YYYY') + ' at ' + moment(start).tz(tz).format('h:mm a z') + '.  There are ' + timeLeft_Begin_Hours + ' hours and ' + timeLeft_Begin_Minutes + ' minutes until this invasion will begin.');
                }
                //output next 3 invasion times here
                var start_1, start_2, start_3, end_1, end_2, end_3;
                if (invasions[i + 1]) {
                    obj = invasions[i + 1];
                    start_1 = new Date(obj['FIELD1']);
                    end_1 = new Date(obj['FIELD2']);
                    start_1.setYear(new Date().getFullYear());
                    end_1.setYear(new Date().getFullYear());
                }
                if (invasions[i + 2]) {
                    obj = invasions[i + 2];
                    start_2 = new Date(obj['FIELD1']);
                    end_2 = new Date(obj['FIELD2']);
                    start_2.setYear(new Date().getFullYear());
                    end_2.setYear(new Date().getFullYear());
                }
                if (invasions[i + 3]) {
                    obj = invasions[i + 3];
                    start_3 = new Date(obj['FIELD1']);
                    end_3 = new Date(obj['FIELD2']);
                    start_3.setYear(new Date().getFullYear());
                    end_3.setYear(new Date().getFullYear());
                }
                sendDiscordMessage(songchannel, 'Here are the next 3 invasions.\nBegin: ' + moment(start_1).tz(tz).format('dddd, MMMM Do YYYY h:mm a z') + ' | ' + ' End: ' + moment(end_1).tz(tz).format('dddd, MMMM Do YYYY, h:mm a z') + '\nBegin: ' + moment(start_2).tz(tz).format('dddd, MMMM Do YYYY, h:mm a z') + ' | ' + ' End: ' + moment(end_2).tz(tz).format('dddd, MMMM Do YYYY, h:mm a z') + '\nBegin: ' + moment(start_3).tz(tz).format('dddd, MMMM Do YYYY, h:mm a z') + ' | ' + ' End: ' + moment(end_3).tz(tz).format('dddd, MMMM Do YYYY, h:mm a z'));
                sendDiscordMessage(songchannel, 'Source: https://docs.google.com/spreadsheets/d/1Uu4rQRANz9XN2pqWDceQUdW6LpmE_-UoEXgXaBzYFTA/htmlview?sle=true#');
                break;
            }
        }
    } catch (e) {
        sendDiscordMessage(songchannel, 'Well this is embarassing.  You should never see this.  An error occurred during invasion processing: ' + e + '  <@105094681141977088>');
    }
}
