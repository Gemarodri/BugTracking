/*## Copyright (C) 2015 Libresoft
##
## This program is free software; you can redistribute it and/or modify
## it under the terms of the GNU General Public License as published by
## the Free Software Foundation; either version 3 of the License, or
## (at your option) any later version.
##
## This program is distributed in the hope that it will be useful,
## but WITHOUT ANY WARRANTY; without even the implied warranty of
## MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
## GNU General Public License for more details.
##
## You should have received a copy of the GNU General Public License
## along with this program; if not, write to the Free Software
## Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.
##
## Check some properties of a SCM database.
##
## Authors:
##   Gema Rodriguez <gerope@libresoft.es>
##*/

/* SERVER */
/*
 * Module dependencies
 */

var express = require('express')
  , request = require('request')
  , http = require('http')
  , json = require('json')
  , bodyParser = require('body-parser')
  , fs = require('fs')
  , jsonfile = require('jsonfile')


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
  var repo = req.query.repository
  var user = req. query.user
  //console.log(repo,numTicket)
  request({url: "https://raw.githubusercontent.com/"+user+"/"+repo+"/master/"+numTicket,
  json:true,
  },function (error,response,body){
    if (!error && response.statusCode===200){
      res.send(body);
      }
    })
})
app.get('/tickets/:title/statistics/',function (req,res){
  var title=req.query.title
  var repo = req.query.repository
  var user = req.query.user
  request({url: "https://raw.githubusercontent.com/"+user+"/"+repo+"/master/"+title,
  json:true,
  },function (error,response,body){
    if (!error && response.statusCode===200){
      res.send(body);
      }
    })
})

app.get('/sourcecode/', function(req, res, next) {
  var numReview = req.query.idGerrit;
  var numPatch = req.query.lastRevision;
  var nameFile = req.query.file;

  request({url: 'http://review.openstack.org/changes/'+numReview+'/revisions/'+numPatch+'/files/'+nameFile+'/diff',
  },function (error, response, body) {
    if (!error && response.statusCode === 200) {
          // Send Json with relevant information from the messages of the idTicket  
        //Delete characters of json response
        res.send(body);
    }
  })
});
app.get('/random/',function(req, res, next) {
  var OpenStack= req.query.Repository;
  request({url: 'https://bugs.launchpad.net/'+OpenStack+'/+bugs?field.searchtext=&orderby=-date_last_updated&search=Search&field.status%3Alist=FIXCOMMITTED&field.status%3Alist=FIXRELEASED&assignee_option=any&field.assignee=&field.bug_reporter=&field.bug_commenter=&field.subscriber=&field.structural_subscriber=&field.tag=&field.tags_combinator=ANY&field.has_cve.used=&field.omit_dupes.used=&field.omit_dupes=on&field.affects_me.used=&field.has_patch.used=&field.has_branches.used=&field.has_branches=on&field.has_no_branches.used=&field.has_no_branches=on&field.has_blueprints.used=&field.has_blueprints=on&field.has_no_blueprints.used=&field.has_no_blueprints=on'
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
  })/*
  var OpenStack = req.query.Repository; 
  var file = './public/'+OpenStack+'.json'
  var tickets = []
  // Send 150 random tickets 
  array=jsonfile.readFileSync(file)
  for (i=0; i<150; i++){
    index= Math.floor( Math.random() * array.length )
    tickets.push(array[index])
    array.splice(index,1)
   }
  res.send(tickets)*/
})
app.get('/random/moreTickets',function(req, res, next) {
  var begin = req.query.last;
  var OpenStack= req.query.Repository;
  request({url: 'https://bugs.launchpad.net/'+OpenStack+'/+bugs?field.searchtext=&search=Search&field.status%3Alist=FIXCOMMITTED&field.status%3Alist=FIXRELEASED&assignee_option=any&field.assignee=&field.bug_reporter=&field.bug_commenter=&field.subscriber=&field.structural_subscriber=&field.tag=&field.tags_combinator=ANY&field.has_cve.used=&field.omit_dupes.used=&field.omit_dupes=on&field.affects_me.used=&field.has_patch.used=&field.has_branches.used=&field.has_branches=on&field.has_no_branches.used=&field.has_no_branches=on&field.has_blueprints.used=&field.has_blueprints=on&field.has_no_blueprints.used=&field.has_no_blueprints=on&orderby=-date_last_updated&memo='+begin+'&start='+begin
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
        console.log(tickets)
        res.send(tickets);
    }
  })
})

server.listen(3000, function() {
    console.log('Listening on port %d blabla', server.address().port);
});
