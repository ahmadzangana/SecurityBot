const GitEventHandler = require('./git_event_handler');
const Repo = require('../models').Repo;
const RepoEvent = require('../models').RepoEvent;
const github = require('./actions');
const JWT = require('./jwt');
const nodemailer = require('nodemailer');
const Promise = require('bluebird');

const gitEvents = {
  'pull_request' : GitEventHandler.pull_request,
  'installation_repositories' : GitEventHandler.installation_repositories,
  'push': GitEventHandler.push,
}

githook = function (req, res) {
  // do your thing here.
  console.log(req.get('X-GitHub-Event'));
  console.log(req.body);
  var git_event = req.get('X-GitHub-Event');
  gitEvents[git_event](req, res);
}

setup = function(req, res){
  console.log(req.body);
  res.render('setup',{ installation_id : req.query.installation_id });
}

emailReportForm = function(req, res) {
  res.render('emailReport');
}

register = function(req,res) {
  var integration_id = req.body.integration_id;
  var instance_url = req.body.instance_url;

}

report = function(req, res) {
  res.status(200).send();
  // forward here to github
  console.log(req.body);
  var eventType = req.body.eventType;
  var userId = req.body.userId;
	var repoName = req.body.repoName;
	var detail = req.body.detail;
  var vulnerabilities = req.body.vulnerabilities;
  var zap_vulnerabilities = vulnerabilities.zap;
  var snyk_vulnerabilities = vulnerabilities.snyk;
  var vulnerabilityList = [];
  var vulnerabilityLength = zap_vulnerabilities.length + snyk_vulnerabilities.length;
  var message_body = "";
  var promises = [];
  var message_title = "Robocop Report : " + vulnerabilityLength  +" new vulnerabilities found";
  zap_vulnerabilities.forEach(function (alert) {
    promises.push(new Promise(function(resolve, reject) {
      message_body += "\nName : " + alert.name;
      message_body += "\nDescription : " + alert.description;
      message_body += "\nSolution : " + alert.solution;
      message_body += "\n___"
      resolve();
    }));
 });

  Promise.all(promises)
  .then(() =>{
    return new Promise(function(resolve, reject) {
      var promises = [];
      snyk_vulnerabilities.forEach(function (alert) {
        promises.push(new Promise(function(resolve, reject) {
          message_body += "\nName : " + alert.title;
          message_body += "\nDescription : " + alert.description;
          // message_body += "\nSolution : " + alert.solution;
          message_body += "\n___"
          resolve();
        }));
      });
      Promise.all(promises).then(resolve());
    });
  })
  .then(() => {
    if (eventType === "email_request") {
      var transporter = nodemailer.createTransport({
        service : 'Gmail',
        auth: {
               user: process.env.gmail_username, // Your email id
               pass: process.env.gmail_password // Your password
           }
      });

      var mailOptions = {
        from: process.env.gmail_username, // sender address
        to: detail, // list of receivers
        subject: message_title, // Subject line
        text: message_body //, // plaintext body
      };

      transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
        }else{
            console.log('Message sent: ' + info.response);
        };
      });

      res.status(200).send();
    }
  	else {
      JWT.generateToken("7054") // Fixed ROBOCOP id used for signing JWT tokens
    	.then(function (jwtToken) {
    		github.getInstallations(jwtToken)
    		.then(function (installations){
    			return github.getAccessTokensUrl(installations, userId);
    		})
    		.then(function(access_tokens_url) {
    			return github.postAccessTokenUrl(jwtToken, access_tokens_url);
    		})
    		.then(github.getToken)
    		.then(function (token) {
          if (eventType === "installation_repositories") {
            return github.createIssue(token, userId, repoName, message_title, message_body);
          }
          else if (eventType === "pull_request") {
            return github.postCommentPullRequest(token, userId, repoName, detail, message_title + "\n" + message_body);
          }
          else if (eventType === "push") {
            return github.postCommentPush(token, userId, repoName, detail, message_title + "\n" + message_body);
          }
    		})
    		.then(function (res) {
    			return null;
    		});
    	});
    }
  }).catch(error => res.status(400).send(error));
}

email = function(req, res) {
  Repo.findOne({
    where: {
      username: req.body.userId,
      repo: req.body.repo
    }
  })
  .then(repo => {
    RepoEvent.create({
      type: 'email_request',
      detail: req.body.email,
      repoId: repo.id,
      current_commit: null,
      previous_commit: null,
    })
    .then(repoEvent => res.status(201).send(repo))
    .catch(error => res.status(500).send(error));
  })
  .catch(error => {
    console.log(error);
    res.status(404).send(error);
  });
}

module.exports = {
  githook,
  setup,
  register,
  report,
  emailReportForm,
  email,
}
