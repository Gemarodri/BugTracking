/* FRONT END*/

/*VARIABLES*/
var numTicket;
var numGerrit;
var webpage;
var title;
var description;
var gerriturl;
var idCommit;
var commitParent;
var descCommit;
var files=[];
var linesInserted=0;
var linesDeleted=0
var nameFile;
var lastPatch;
var tickets=[];
var count = 0;
var lengthTickets=0;
var github={};
var myrepo;
var revisorname;
var filesRepo = [];
var filesRepoNew = 0;
var Bug=0;
var Not_Bug=0;
var Undef=0;
var GitUser="";
var no_OAuth=false;
/*GITHUB AUTENTICATION*/
hello.init({
    github : "e631edc4d7bdba01cd03"
    },{
      redirect_uri : 'redirect.html',
      oauth_proxy : 'https://auth-server.herokuapp.com/proxy',
      scope : 'publish_files',
});
access = hello("github");
access.login({response_type: 'code'}).then( function(){
      auth = hello("github").getAuthResponse();
      token = auth.access_token;
      console.log (token);
      hello( "github" ).api( '/me' ).then( function(r){
        GitUser= r.login;
      });
      github = new Github({
        token: token,
        auth: "oauth"
      });
    }, function( e ){
      alert('Signin error: ' + e.error.message);
      no_OAuth=true;
    });

/*FUNCTIONS*/
// Obtain some information from messages into the Launchpad 
function splitMessages(data,index){
  numGerrit = undefined;
  idCommit = undefined;
  var regExpUrl = /^(https:\/\/review.openstack.org\/.*[0-9]+)/
  var lines = data.split("\n");
  for (var i in lines) {
    words= lines[i].split(" ");
    for (var j in words){
      if(words[j].match(regExpUrl)!=null){
          gerriturl= words[j];
          splitUrl=gerriturl.split("/");
          numGerrit=splitUrl.pop()
      }
      else if(words[j]== "commit"){
          //If there are others id commits mentioned in the messages
          if (idCommit==undefined){
            idCommit=words[++j];
          }
      }
    }
  }
  return [numGerrit,idCommit]
}

// Get the relevant information from the JSON of Launchpad
function getTicketInfo(data) {
  webpage= data.webpage;
  title=data.title;
  description=data.description.toString(),
  $("#linkLaunchpad").html(data.webpage).prop("href", webpage);
  $("#id").html(data.idBug);
  $("#title").html(title);
  $("#description").html("");
  var regExpUrl = /^https:\/\//
  var lines = description.split(" ")
  for (var i in lines) {
    words= lines[i].split(" ");
    for (var j in words){
      if(words[j].match(regExpUrl)!=null){
          if(words[j].substring(0,words[j].length-1).match(/\D/)!= null){
            words[j]= words[j].substring(0,words[j].length-1)
          }
          $("#description").append("<a target='_blank' href="+words[j]+">"+words[j]+"</a>"+ " ");
        }
      else{
        $("#description").append(words[j]+ " ");
      }
    }
  }
}

// Get review url, the Id of the Review and the Commit ID
function getMessagesInfo(data){
  console.log(data)
  for (i in data)
  { 
    //alert(data[i].subject)
    // If the commit was merged into branch of master in cinder 
    if(data[i].subject=="Fix merged to cinder (master)")
    {
      //alert("merged")
      info = splitMessages(data[i].content.toString(),i);
      $("#linkGerrit").html(gerriturl).prop("href", gerriturl);
      $("#idGerrit").html(info[0]);
      $("#idCommit").html(info[1]);
      break;
    }
    // If the commit is going to be merged into branch of master in cinder 
    else if(data[i].subject=="Fix proposed to cinder (master)")
    {
      //alert("proposed")
      info = splitMessages(data[i].content.toString(),i);
      $("#linkGerrit").html(gerriturl).prop("href", gerriturl);
      $("#idGerrit").html(info[0]);
      $("#idCommit").html(info[1]);
    }
    // If the commit was merged into a branch different to master in cinder  
    else if(data[i].subject.match(/Fix merged to cinder.*/)!=null || data[i].subject.match(/Fix proposed to cinder.*/)!=null)
    {
      //alert(3)
      info = splitMessages(data[i].content.toString(),i);
      $("#linkGerrit").html(gerriturl).prop("href", gerriturl);
      $("#idGerrit").html(info[0]);
      $("#idCommit").html(info[1]);
    }
  }
}

// Get the relevant information from the JSON of Gerrit
function getGerritInfo(data) {
  lastPatch=data.lastPatch
  var parameters = { idGerrit: numGerrit, lastRevision: lastPatch };
  $.get( '/commit/'+idCommit+'/files', parameters, getCommitFiles,"json");
  $.get( '/commit/'+idCommit+'/aboutcommit', parameters, getCommitInfo,"json");
}
// Get the relevant information from commit
function getCommitInfo(data) {
  descCommit=data.description;
  commitParent= data.commitParent;
  $("#descCommit").html("");
  $("#parent").html(commitParent);
  var regExpUrl = /^https:\/\//
  var lines = descCommit.split(" ")
  for (var i in lines) {
    words= lines[i].split(" ");
    for (var j in words){
      if(words[j].match(regExpUrl)!=null){
          if(words[j].substring(0,words[j].length-1).match(/\D/)!= null){
            words[j]= words[j].substring(0,words[j].length-1)
          }
          $("#descCommit").append("<a target='_blank' href="+words[j]+">"+words[j]+"</a>"+ " ");
        }
      else{
        $("#descCommit").append(words[j]+ " ");
      }
    }
  }
}
function getCommitFiles(data) { 
  linesInserted=0;
  linesDeleted=0;
  files=[];
  regExp = /.*test.*/
  j=0;
  for (i in data)
  { 
    if ((i!="/COMMIT_MSG") && (!(i.match(regExp))))
    {
        files[j]=i;
        j=++j;
        $("#files").append("<br><a class='afile' style='color:green'>"+i)
        if(data[i].lines_inserted)
          linesInserted = linesInserted + data[i].lines_inserted;
        if (data[i].lines_deleted)
          linesDeleted = linesDeleted +data[i].lines_deleted;
    }
    else if ((i!="/COMMIT_MSG") && ((i.match(regExp))))
    {
        files[j]=i;
        j=++j;
        $("#files").append("<br><a href='' onclick='return false' style='color:red' title='it has not been taken into account'>"+i)

    }
  }
  $("#lines").append("Inserted: "+linesInserted+"<br> Deleted: "+linesDeleted);
}
function getSourceCode(data){
  //alert('Perfecto')
}

// Inserting the list with numTickets (scroll div)
function getRandomTickets(data){
  console.log(data)
  lengthTickets=lengthTickets+data.length;
  ticketLeft= data.slice(0,data.length/3)
  ticketCenter= data.slice(data.length/3, (2*data.length)/3)
  ticketRight=  data.slice((2*data.length)/3, data.length)

  for (i in ticketLeft){
    $("#left").append("<p id="+ticketLeft[i]+" class='ticketlast'> <span>"+ticketLeft[i]+"</span></p>")
  }
  for (i in ticketCenter){
    $("#center").append("<p id="+ticketCenter[i]+" class='ticketlast'> <span>"+ticketCenter[i]+"</span></p>")
  }
  for (i in ticketRight){
    $("#right").append("<p id="+ticketRight[i]+" class='ticketlast'> <span>"+ticketRight[i]+"</span></p>")
  }
  tickets= data;
}

function showRepo(error, repo) {
  if (error) {
    //repodata.html("<p>Error code: " + error.error + "</p>");
  } else {
    setTimeout(showRepo,5000);
    myrepo.contents('master', '', listFiles);
  }
};

function listFiles(error, contents) {
  filesRepoNew =filesRepo.length
  console.log(filesRepoNew)
  if (error) {
  } else {
    filesRepo = [];
    for (var i = 0, len = contents.length; i < len; i++) {
      filesRepo.push(contents[i].name);
    };
    for (i in tickets){
      //console.log('mistickets',tickets)
      developers=[]
      for( j in filesRepo){
        //console.log('filesRepo',filesRepo)
        var num = filesRepo[j].split("_")
        if (tickets[i]==num[0]){
 	   developers.push(num[1])
	   $('#'+tickets[i]).html('<a style="color:green" title='+developers+'>'+tickets[i]+'</a>')
        }
      }
    }
    if (filesRepoNew!=filesRepo.length || filesRepo.length==0){
      $("#miFilesInRepo").empty()
      showFiles(filesRepo)
    }
  }
}
function showFiles(filesInRepo){
  for(i in filesInRepo){
    $("#myFilesInRepo").append("<li><span class='titleFile'>"+filesInRepo[i]+"</span></li>")
    $("#myFilesInRepo").on("click", ".titleFile",selectFile);
  }
}
function seeFile() {
  $('#infoSaved').removeClass('hide');
  $('#classification').addClass('hide');
  $('#comments').addClass('hide');
  $('#keywords').addClass('hide');
  $('#revisor').addClass('hide');

  if (revisorname==undefined){
      titleTicket = $('#'+numTicket).html().split("_")
      revisorname = titleTicket[1]
      $.get('/ticket/'+numTicket+'/seeData/',{ticket:numTicket+'_'+revisorname},function(data){
        //jsonObj = JSON.parse(data);
        console.log(data)
        $("#readfile").html("<h3><p class='text-uppercase'><strong>Contents:</strong></p></h3>")
        for (i in data){
          $("#readfile").append("<hr  />")
          $("#readfile").append("<p ><u><strong class='text-uppercase'><em>" + i +' :     '+"</em></strong></u>" + data[i] + "</p>");
        }
        
      })
  }else{
    $.get('/ticket/'+numTicket+'/seeData/',{ticket:numTicket+'_'+revisorname},function(data){
        //jsonObj = JSON.parse(data);
        console.log(data)
        $("#readfile").html("<h3><p class='text-uppercase'><strong>Contents:</strong></p></h3>")
        for (i in data){
          $("#readfile").append("<hr  />")
          $("#readfile").append("<p ><u><strong class='text-uppercase'><em>" + i +' :     '+"</em></strong></u>" + data[i] + "</p>");
        }
      })
  }
};

function ticketAnalysed(){
    
    //alert(tickets.length)
    if (tickets.length >= 0){
      numTicket=this.id
      numGerrit = undefined;
      
      count= count+1;
      $("#count").html("analyzed: "+count);
      $(this).css('color', 'coral');
    }
    var parameters = { idTicket: numTicket };
    $.get( '/ticket/'+numTicket, parameters, getTicketInfo,"json");
    $.get('/ticket/'+numTicket+'/messages/', parameters, getMessagesInfo,"json");
    
    if(!numGerrit){
      $("#linkGerrit").html("");     
      $("#idGerrit").html("");
      $("#idCommit").html("");
      $("#descCommit").html(""); 
      $("#files").html("");
      $("#lines").html("");
      $("#parent").html("");
    }
    $('textarea[name="revision"]').val(GitUser)
};
function selectFile() {
    var name=(this.innerHTML)
    revisor= this.innerHTML.split("_")
    myrepo.read('master', this.innerHTML, function(err, data) {
    //Conver into JSON  
    datos= JSON.parse(data)
    console.log(datos)
    $("#filename").html(name)
    $("#content").val(data);
    $("#launchpadSaved").val(datos.Launchpad)
    $("#idTicketSaved").val(datos.Id)
    $("#gerritSaved").val(datos.Gerrit)
    $("#idGerritSaved").val(datos.IdGerrit)
    $("#idCommitSaved").val(datos.IdCommit) 
    $("#insertedLines").val(datos.Lines_Inseted) 
    $("#deletedLines").val(datos.Lines_Deleted)
    $("#revisorSaved").val(revisor[1]); 
    $("#kwdTitle").val(datos.KeywordsTitle)
    $("#kwdDescription").val(datos.Description)
    $("#kwdCommit").val(datos.KeywordsCommit)
    $("#comentsSaved").val(datos.Comments)
    $("#filesSaved").val(datos.Files)
    $("#commitParentSaved").val(datos.CommitParent)
    $("input[type='radio'][id="+datos.Classification+"]").attr('checked', true);


       
    });
};
function writeFile() {
    var filename = $("#filename").html();
    //Before click in a file from the repo
    if (filename.trim() !="Data Saved"){
      var infoRelevant = new Object ();
      infoRelevant.Launchpad= $("#launchpadSaved").val();
      infoRelevant.Id= $("#idTicketSaved").val();
      infoRelevant.Gerrit= $("#gerritSaved").val();
      infoRelevant.IdGerrit= $("#idGerritSaved").val();
      infoRelevant.IdCommit= $ ("#idCommitSaved").val();
      infoRelevant.Files= $("#filesSaved").val();
      infoRelevant.Lines_Inseted= $("#insertedLines").val();
      infoRelevant.Lines_Deleted= $("#deletedLines").val();
      infoRelevant.CommitParent= $("#commitParentSaved").val();
      infoRelevant.Classification= $("input[type='radio'][name='newclass']:checked").val();
      infoRelevant.KeywordsTitle= $("#kwdTitle").val();
      infoRelevant.Description= $("#kwdDescription").val();
      infoRelevant.KeywordsCommit= $("#kwdCommit").val();
      infoRelevant.Comments= $("#comentsSaved").val();
    
      var InfoRelevantJSON=JSON.stringify(infoRelevant);

      //InfoRelevantJSON=JSON.stringify(InfoRelevant);
      console.log(InfoRelevantJSON);

      myrepo.write('master', filename, InfoRelevantJSON,
      "Updating data", function(err) {
         console.log (err);
      });
      
    }
    clearInputs()

};
function clearInputs(data){
      $("#changedata :input").each(function(){
      $(this).val('');
    });
}
function draw() {
        $('#firstclassification').highcharts({
            chart: {
                type: 'bar'
            },
            title: {
                text: 'First Classification'
            },
            xAxis: {
                categories: ['Bug', 'No Bug', 'Undefined'],
                title: {
                    text: 'Type'
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'percentage (%)'//,
                    //align: 'high'
                },
                labels: {
                    overflow: 'justify'
                }
            },
            tooltip: {
                valueSuffix: ' percentage'
            },
            plotOptions: {
                bar: {
                    dataLabels: {
                        enabled: true
                    }
                }
            },
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'top',
                x: -40,
                y: 80,
                floating: true,
                borderWidth: 1,
                backgroundColor: ((Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'),
                shadow: true
            },
            credits: {
                enabled: false
            },
            series: [{
                name: 'Ticket analysed',
                //data: [3, 31, 45]
                data: (function () {
                        data = [];
                        sum  = Bug+Not_Bug+Undef
                        data.push(Math.round((Bug*100)/sum));
                        data.push(Math.round((Not_Bug*100)/sum));
                        data.push(Math.round((Undef*100)/sum));
                        return data;
                    }())
            }]
        });
    }


/* JQUERY */
$(document).ready(function(){
  $('textarea').val('');
  // Open Url in a new browser window
  $('a[class="tblank"]').click( function() {
    window.open( $(this).attr('href') );
      return false;
  });
  //Labels
  $("#labelstatistics").click(function(evento){
    $("#mainContainer").hide()
    $("#infoAboutTickets").hide()
    $("#modifyContainer").addClass('hide');
    $("#statisticsContainer").removeClass('hide');
    $("#revisors_name").html("")
    $("#labelmodify").removeClass("menu-top-active")
    $("#labelanalyse").removeClass("menu-top-active")
    $(this).addClass('menu-top-active')
    revisors_name=[]
    for (i in filesRepo){
        //$("#revisors_name").html("<h3>Revisor's Name</h3>")
        title = filesRepo[i].split("_")[0]
        name = filesRepo[i].split("_")[1]
        if (revisors_name.indexOf(name)<0){
          revisors_name.push(name)
           $("#revisors_name").append("<input type='radio' name='revisor' value="+name+" >&nbsp" +name + "&nbsp;&nbsp"  )

        }
    }  
    $("#revisors_name input[name='revisor']").click(function(){
      //alert(this.value)
      for (i in filesRepo){
        name = filesRepo[i].split("_")[1]
        if (name==this.value){
          Bug=0;
          Not_Bug=0;
          Undef=0;
          //alert(filesRepo[i])
          $.get('/tickets/'+filesRepo[i]+'/statistics/',{title:filesRepo[i]},function(data){
              //jsonObj = JSON.parse(data);
              //console.log(data)
              if(data.Classification=="Bug"){
                Bug++;
              }else if(data.Classification=="Not_Bug"){
                Not_Bug++;
              }else{
                Undef++;
              }
          })
        }
      }
    })
    setInterval(function(){
      sum= (Bug+Not_Bug+Undef)
      $("#numB").html(Bug)
      $("#numNB").html(Not_Bug)
      $("#numU").html(Undef) 
      if (sum!=0){
        $("#percentageB").html(Math.round((Bug*100)/sum))
        $("#percentageNB").html(Math.round((Not_Bug*100)/sum))
        $("#percentageU").html(Math.round((Undef*100)/sum))
      }
    }, 500);
  });
  $("#labelanalyse").click(function(evento){
    $("#mainContainer").show()
    $("#infoAboutTickets").show()
    $("#statisticsContainer").addClass('hide');
    $("#modifyContainer").addClass('hide');
    $("#labelmodify").removeClass("menu-top-active")
    $("#labelstatistics").removeClass("menu-top-active")
    $(this).addClass('menu-top-active')
  });
  $("#labelmodify").click(function(evento){
    $("#mainContainer").hide()
    $("#infoAboutTickets").hide()
    $("#statisticsContainer").addClass('hide');
    $("#modifyContainer").removeClass('hide');
    $("#labelanalyse").removeClass("menu-top-active")
    $("#labelstatistics").removeClass("menu-top-active")
    $(this).addClass('menu-top-active')
  });
  // Start analizing 100 random tickets. The 100 latest commited
  $('#start').click(function(event){
    $.get('/random/', getRandomTickets);
    $('#click').removeClass('hide');
    $('#left').removeClass('hide');
    $('#center').removeClass('hide');
    $('#right').removeClass('hide');
    $('#moreInfo').removeClass('hide');
    $('#analize').addClass('hide');
    $('#someInfo').addClass('hide');

    if (github.getGist!=undefined){
      var reponame = 'Prueba';
      myrepo = github.getRepo('Gemarodri',reponame);
      myrepo.show(showRepo)
    }
 /*   var token = '3f30be94c7ccf56427d81ce3cdf0bfd5cee1345c';
      github = new Github({
        token: token,
        auth: "oauth"
      });

      var reponame = 'Prueba';
      myrepo = github.getRepo('Gemarodri',reponame);
    
      myrepo.show(showRepo)

*//*  hello.init({
      github : "e631edc4d7bdba01cd03"
    },{
      redirect_uri : 'redirect.html',
      oauth_proxy : 'https://auth-server.herokuapp.com/proxy',
      scope : 'publish_files',
    });
    access = hello("github");
    access.login({response_type: 'code'}).then( function(){
      auth = hello("github").getAuthResponse();
      token = auth.access_token;
      console.log (token);
      hello( "github" ).api( '/me' ).then( function(r){
        GitUser= r.login;
      });      
      github = new Github({
        token: token,
        auth: "oauth"
      });
      var reponame = 'Prueba';
      myrepo = github.getRepo('Gemarodri',reponame);
      myrepo.show(showRepo)
    }, function( e ){
      alert('Signin error: ' + e.error.message);
      no_OAuth=true;
    });
*/
  });
  $('#moreTickets').click(function(event){
        var parameters = { last: lengthTickets };
        $.get('/random/moreTickets',parameters, getRandomTickets, "json")
    })
  // Show the source Code of the file and hide the gerrit Info
  $("#files").on("click", ".afile",function(){
    //$('#infoGerrit').addClass('hide');
    //$('#sourceCode').removeClass('hide');
    nameFile=$(this).text();
    window.open("https://review.openstack.org/#/c/"+numGerrit+"/"+lastPatch+"/"+nameFile);
    var parameters = { idGerrit: numGerrit, lastRevision: lastPatch , file: nameFile};
    $.get('/sourcecode/',parameters, getSourceCode);
  });
  //showing info of numtickets
  $("#left").on("click", ".ticketlast", ticketAnalysed);
  $("#center").on("click", ".ticketlast", ticketAnalysed);
  $("#right").on("click", ".ticketlast", ticketAnalysed);

  // Go backt to show gerrit Info and hide source Code of file
  $('#goBack').click(function(evento){
    $('#infoGerrit').removeClass('hide');
    $('#sourceCode').addClass('hide');
  });
  $('#close').click(function(evento){
    $('#infoSaved').addClass('hide');
    $('#classification').removeClass('hide');
    $('#comments').removeClass('hide');
    $('#keywords').removeClass('hide');
    $('#revisor').removeClass('hide');
  });

  // Click to Get Info from about the ticket
  $('#submit').click(function(evento){
    //get ticket ID
    numTicket= $('#idTicket').val();
    // Delete older values of numGerrit
    numGerrit = undefined;

    // Back to placeholder value in input
    $('#idTicket').val('');
    if (numTicket != '')
    {
      var parameters = { idTicket: numTicket };
      $.get( '/ticket/'+numTicket, parameters, getTicketInfo,"json");
      $.get('/ticket/'+numTicket+'/messages/', parameters, getMessagesInfo,"json");
    }
    if(!numGerrit){
      $("#linkGerrit").html("");     
      $("#idGerrit").html("");
      $("#idCommit").html("");
      $("#descCommit").html(""); 
      $("#files").html("");
      $("#lines").html("");
      $("#parent").html("");
    }
  });

  //Get Info about the review of the Bug
  $('#infoReview').click(function(evento){
    var parameters = { idGerrit: numGerrit };
    if(numGerrit)
    {
      $.get('/review/'+numGerrit, parameters, getGerritInfo,"json");
    }
    else
    {    
      alert("we can't Obtain more information");
      $("#linkGerrit")
        .html("The Commit is not in Cinder Repository, see the messages for more information.")
        .prop("href", webpage);
        $("#idGerrit").html("We can't find the id Commit in this repository");
        $("#idCommit").html("We can't find the id Commit in this repository"); 
        $("#descCommit").html("Not Found"); 
        $("#files").html("Not Found");
        $("#lines").html("Not Found");  
        $("#parent").html("Not Found"); 
    }
  });

  //Save Info
  $("#save").click(function(evento){
    if ($("textarea[name='revision']").val()==""){
        alert('Please, fill revision\'s name')
    }else if(no_OAuth==true){
      alert('You don\'t have authoritation, please sign with github to save data')
    }else{

      var infoRelevant = new Object ();
      infoRelevant.Launchpad= webpage;
      infoRelevant.Id= numTicket;
      infoRelevant.Gerrit=gerriturl;
      infoRelevant.IdGerrit=numGerrit;
      infoRelevant.IdCommit=idCommit;
      infoRelevant.Files= files;
      infoRelevant.Lines_Inseted= linesInserted;
      infoRelevant.Lines_Deleted= linesDeleted;
      infoRelevant.CommitParent= commitParent;
      infoRelevant.Classification= $("input[type='radio'][name='class']:checked").val();
      infoRelevant.KeywordsTitle= $("textarea[name='title']").val();
      infoRelevant.Description= $("textarea[name='description']").val();
      infoRelevant.KeywordsCommit= $("textarea[name='commit']").val();
      infoRelevant.Comments= $("textarea[name='textarea']").val();
    
    
      name= $("textarea[name='revision']").val();
      revisorname= name.toUpperCase();
      console.log(infoRelevant);
      var InfoRelevantJSON=JSON.stringify(infoRelevant);

      //InfoRelevantJSON=JSON.stringify(InfoRelevant);
      console.log(InfoRelevantJSON);

      myrepo.write('master', numTicket+'_'+revisorname,
      InfoRelevantJSON,
       "Updating data"+numTicket, function(err) {
           console.log (err)
       });
      $('#'+numTicket).css('color', 'green');
    }
    $('textarea').val('');
  });
  //See info file
  $("#see").click(seeFile);
  //Draw Statistics
  $("#draw").click(draw);

  $("#write").click(writeFile);
});
