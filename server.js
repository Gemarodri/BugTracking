/* SERVER */
/*
 * Module dependencies
 */

var express = require('express')
  , request = require('request')
  , http = require('http')
  , json = require('json')
  , bodyParser = require('body-parser')


//create the application
var app = express()
var server = http.createServer(app);

//static folders localization
app.use(express.static(__dirname + '/public'))
// Show a log (console) when a request is done
//app.use(express.logger('dev'))

//Load index.html 
app.get('/', function (req, res) {
  res.sendFile('./index.html');
})
// REST /ticket/numticket
app.get('/ticket/:numticket', function (req, res) {
  //API launchpad
	var numBug = req.query.idTicket;
  	//console.log(numBug);
  	request({url: 'https://api.launchpad.net/1.0/bugs/'+numBug,
  	json: true,
	},function (error, response, body) {
		if (!error && response.statusCode === 200) {
            // Send Json with relevant information from the ticket
	        res.send({
                idBug: body.id, 
                description: body.description,
                title: body.title,
                messages:body.messages_collection_link,
                webpage: body.web_link,
        	});
        }
	})
})
// REST /ticket/numticket/messages/
app.get('/ticket/:numTicket/messages/',function (req, res) {
  //API launchpad
	var numBug = req.query.idTicket;
  	//console.log(numBug);
  	request({url: 'https://api.launchpad.net/1.0/bugs/'+numBug+'/messages',
  	json: true,
	},function (error, response, body) {
		if (!error && response.statusCode === 200) {
            // Send Json with relevant information from the messages of the ticket
	        res.send(body.entries);
        }
	})
})
// REST /review/numReview/
app.get('/review/:numReview',function (req, res) {
  //API gerrit
	var numReview = req.query.idGerrit;
  	//console.log(numReview);
  	request({url: 'http://review.openstack.org/changes/'+numReview+'/detail',
  	json: true,
	},function (error, response, body) {
	 if (!error && response.statusCode === 200) {
      //Delete characters of json response
      var end = body.length     
      if (end>=0){
        body= body.substring(5, end-1); 
      }
      //Convert string to JSON data
      body = JSON.parse(body);
      res.send({
      	number: body._number,
      	changeid: body.change_id,
      	messages: body.messages,
      	lastPatch: body.messages[body.messages.length-1]._revision_number,
      });
    }
	})
})
app.get('/commit/:numCommit/aboutcommit',function (req, res) {
  //API launchpad
  var numReview = req.query.idGerrit;
	var numPatch = req.query.lastRevision;
  	request({url: 'http://review.openstack.org/changes/'+numReview+'/revisions/'+numPatch+'/commit',
  	json: true,
	},function (error, response, body) {
		if (!error && response.statusCode === 200) {
          // Send Json with relevant information from the messages of the idTicket  
	      //Delete characters of JSON response
	      var end = body.length     
	      if (end>=0){
	        body= body.substring(5, end-1); 
	      }
	      //Convert string to JSON data
	      body = JSON.parse(body);
	      res.send({
	      	commitParent: body.parents[0].commit,
	      	author: body.author,
	      	description: body.message,
	      });
        }
	})
})
app.get('/commit/:numCommit/files',function (req, res) {
  //API launchpad
  var numReview = req.query.idGerrit;
	var numPatch = req.query.lastRevision;
  	request({url: 'http://review.openstack.org/changes/'+numReview+'/revisions/'+numPatch+'/files',
  	json: true,
	},function (error, response, body) {
		if (!error && response.statusCode === 200) {
          // Send Json with relevant information from the messages of the idTicket  
	      //Delete characters of json response
	      var end = body.length     
	      if (end>=0){
	        body= body.substring(5, end-1); 
	      }
	      //Convert string to JSON data
	      body = JSON.parse(body);
	      res.send(body);
        }
	})
})
app.get('/ticket/:numTicket/seeData/',function (req,res){
  var numTicket=req.query.ticket
  console.log(numTicket)
  request({url: "https://raw.githubusercontent.com/Gemarodri/Prueba/master/"+numTicket,
  json:true,
  },function (error,response,body){
    if (!error && response.statusCode===200){
      console.log(body)
      //body = JSON.parse(body);
      res.send(body);
      }
    })
})
app.get('/tickets/:title/statistics/',function (req,res){
  var title=req.query.title
  request({url: "https://raw.githubusercontent.com/Gemarodri/Prueba/master/"+title,
  json:true,
  },function (error,response,body){
    if (!error && response.statusCode===200){
      //console.log(body)
      //body = JSON.parse(body);
      res.send(body);
      }
    })
})

app.get('/sourcecode/', function(req, res, next) {
  var numReview = req.query.idGerrit;
  var numPatch = req.query.lastRevision;
  var nameFile = req.query.file;

  request({url: 'http://review.openstack.org/changes/'+numReview+'/revisions/'+numPatch+'/files/'+nameFile+'/diff',
    //json: true,
  },function (error, response, body) {
    if (!error && response.statusCode === 200) {
          // Send Json with relevant information from the messages of the idTicket  
        //Delete characters of json response
        res.send(body);
    }
  })
});
app.get('/random/',function(req, res, next) {
  //var tickets= []
  request({url: 'https://bugs.launchpad.net/cinder/+bugs?field.searchtext=&orderby=-date_last_updated&search=Search&field.status%3Alist=FIXCOMMITTED&field.status%3Alist=FIXRELEASED&assignee_option=any&field.assignee=&field.bug_reporter=&field.bug_commenter=&field.subscriber=&field.structural_subscriber=&field.tag=&field.tags_combinator=ANY&field.has_cve.used=&field.omit_dupes.used=&field.omit_dupes=on&field.affects_me.used=&field.has_patch.used=&field.has_branches.used=&field.has_branches=on&field.has_no_branches.used=&field.has_no_branches=on&field.has_blueprints.used=&field.has_blueprints=on&field.has_no_blueprints.used=&field.has_no_blueprints=on'
  //,json: true,
  //https://bugs.launchpad.net/cinder/+bugs?assignee_option=any&amp%3Bfield.affects_me.used=&amp%3Bfield.assignee=&amp%3Bfield.bug_commenter=&amp%3Bfield.bug_reporter=&amp%3Bfield.has_blueprints=on&amp%3Bfield.has_blueprints.used=&amp%3Bfield.has_branches=on&amp%3Bfield.has_branches.used=&amp%3Bfield.has_cve.used=&amp%3Bfield.has_no_blueprints=on&amp%3Bfield.has_no_blueprints.used=&amp%3Bfield.has_no_branches=on&amp%3Bfield.has_no_branches.used=&amp%3Bfield.has_patch.used=&amp%3Bfield.omit_dupes=on&amp%3Bfield.omit_dupes.used=&amp%3Bfield.searchtext=&amp%3Bfield.status%3Alist=FIXCOMMITTED&amp%3Bfield.status%3Alist=FIXRELEASED&amp%3Bfield.structural_subscriber=&amp%3Bfield.subscriber=&amp%3Bfield.tag=&amp%3Bfield.tags_combinator=ANY&amp%3Borderby=-date_last_updated&amp%3Bsearch=Search&amp%3Bmemo=75&amp%3Bstart=75&orderby=-date_last_updated&memo=150&start=150
  },function (error, response, body) {
    if (!error && response.statusCode === 200) {

        lines = body.split("\n");
        linesInterested=[];
        tickets=[];

        j=0;
        for (var i in lines) {
          if (lines[i].match('class="bugnumber"')){
            linesInterested[j]= lines[i];
             j=j+1;
          }
        }
        j=0;
        for (var i in linesInterested){
          if (linesInterested[i].match(/[0-9]+/)!=null)
          {
            tickets[j]= linesInterested[i].match(/[0-9]+/)[0];
            j=j+1;
          }
        }
        //return (tickets)
        res.send(tickets);
    }
  })
})
app.get('/random/moreTickets',function(req, res, next) {
  var begin = req.query.last;
  request({url: 'https://bugs.launchpad.net/cinder/+bugs?field.searchtext=&search=Search&field.status%3Alist=FIXCOMMITTED&field.status%3Alist=FIXRELEASED&assignee_option=any&field.assignee=&field.bug_reporter=&field.bug_commenter=&field.subscriber=&field.structural_subscriber=&field.tag=&field.tags_combinator=ANY&field.has_cve.used=&field.omit_dupes.used=&field.omit_dupes=on&field.affects_me.used=&field.has_patch.used=&field.has_branches.used=&field.has_branches=on&field.has_no_branches.used=&field.has_no_branches=on&field.has_blueprints.used=&field.has_blueprints=on&field.has_no_blueprints.used=&field.has_no_blueprints=on&orderby=-date_last_updated&memo='+begin+'&start='+begin
  //,json: true,
  //https://bugs.launchpad.net/cinder/+bugs?assignee_option=any&amp%3Bfield.affects_me.used=&amp%3Bfield.assignee=&amp%3Bfield.bug_commenter=&amp%3Bfield.bug_reporter=&amp%3Bfield.has_blueprints=on&amp%3Bfield.has_blueprints.used=&amp%3Bfield.has_branches=on&amp%3Bfield.has_branches.used=&amp%3Bfield.has_cve.used=&amp%3Bfield.has_no_blueprints=on&amp%3Bfield.has_no_blueprints.used=&amp%3Bfield.has_no_branches=on&amp%3Bfield.has_no_branches.used=&amp%3Bfield.has_patch.used=&amp%3Bfield.omit_dupes=on&amp%3Bfield.omit_dupes.used=&amp%3Bfield.searchtext=&amp%3Bfield.status%3Alist=FIXCOMMITTED&amp%3Bfield.status%3Alist=FIXRELEASED&amp%3Bfield.structural_subscriber=&amp%3Bfield.subscriber=&amp%3Bfield.tag=&amp%3Bfield.tags_combinator=ANY&amp%3Borderby=-date_last_updated&amp%3Bsearch=Search&amp%3Bmemo=75&amp%3Bstart=75&orderby=-date_last_updated&memo=150&start=150
  },function (error, response, body) {
    if (!error && response.statusCode === 200) {

        lines = body.split("\n");
        linesInterested=[];
        tickets=[];

        j=0;
        for (var i in lines) {
          if (lines[i].match('class="bugnumber"')){
            linesInterested[j]= lines[i];
             j=j+1;
          }
        }
        j=0;
        for (var i in linesInterested){
          if (linesInterested[i].match(/[0-9]+/)!=null)
          {
            tickets[j]= linesInterested[i].match(/[0-9]+/)[0];
            j=j+1;
          }
        }
        res.send(tickets);
    }
  })
})

server.listen(3000, '193.147.51.75', function() {
    console.log('Listening on port %d', server.address().port);
});
/*http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
}).listen(8080, '193.147.51.75');
console.log('Server running at http://APP_PRIVATE_IP_ADDRESS:8080/');*/
