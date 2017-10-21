const JWT = require('./jwt');
var request = require('request-promise');

var jwtToken = JWT.generateToken('C:\\Users\\admin\\Downloads\\robocop.2017-10-19.private-key.pem', "5599");
var token = "Bearer " + jwtToken;
var finalToken = "token " + "v1.3e8dc341bc77bec7efeed4b2519a77198efe13e1";
console.log(token);
var urlRoot = "https://api.github.com"
main();
//listBranches("goeltanmay", "Duke-MEM-MENG")
//postComment("goeltanmay", "Duke-MEM-MENG", 2)
//integration();
//getToken("/installations/59503/access_tokens");

function main() {
	var github = {
		git_token: token,

	  getInstallations: function() {
			return request({
				url: urlRoot + "/integration/installations",
				method: 'GET',
		    json: true,
				headers: {
					"User-Agent": "EnableIssues",
					"content-type": "application/json",
					"Authorization": git_token,
		      "Accept": "application/vnd.github.machine-man-preview+json"
				}
			});
		},

		getAccessTokensUrl: function(installations, userId) {
			installations.body.forEach(function(installation) {
				if(installation.account.login === userId) {
					return access_token_url;
				}
			});
		}
	}

	console.log(github);
	//github.git_token = token;
	var userId = "goeltanmay";
	return github.getInstallations()
	.then(function (installations){
		return github.getAccessTokensUrl(installations, userId);
	})
	.then(console.log);
}

function integration()
{
	var options = {
		url: urlRoot + "/integration/installations",
		method: 'GET',
    json: true,
		headers: {
			"User-Agent": "EnableIssues",
			"content-type": "application/json",
			"Authorization": token,
      "Accept": "application/vnd.github.machine-man-preview+json"
		}
	};

  console.log(options)

	// Send a http request to url and specify a callback that will be called upon its return.
	request(options, function (error, response, body)
	{
		console.log(body );
	});

}

function getToken(url)
{
	var options = {
		url: urlRoot + url,
		method: 'POST',
    json: true,
		headers: {
			"User-Agent": "EnableIssues",
			"content-type": "application/json",
			"Authorization": token,
      "Accept": "application/vnd.github.machine-man-preview+json"
		}
	};

  console.log(options)

	// Send a http request to url and specify a callback that will be called upon its return.
	request(options, function (error, response, body)
	{
		console.log(body );
	});

}

function listBranches(owner, repo)
{
	var options = {
		url: urlRoot + "/repos/" + owner + "/" + repo + "/branches",
		method: 'GET',
		headers: {
			"User-Agent": "EnableIssues",
			"content-type": "application/json",
			"Authorization": finalToken,
      "Accept": "application/vnd.github.machine-man-preview+json"
		}
	};

	// Send a http request to url and specify a callback that will be called upon its return.
	request(options, function (error, response, body)
	{
		var obj = JSON.parse(body);
		console.log( obj );
		for( var i = 0; i < obj.length; i++ )
		{
			var name = obj[i].name;
			console.log( name );
		}
	});

}

function postComment(userId, repo, pullRequestNum)
{
	var options = {
		url: urlRoot + "/repos/" + userId + "/" + repo + "/issues/" + pullRequestNum + "/comments",
		method: 'POST',
		headers: {
			"User-Agent": "EnableIssues",
			"content-type": "application/json",
			"Authorization": finalToken,
      "Accept": "application/vnd.github.machine-man-preview+json"
		},
		json: {
      "body" : "My first comment"
    }
	};

	request(options, function (error, response, body)
	{
		console.log( body );
	});
}
