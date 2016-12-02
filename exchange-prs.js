var fetch = require('isomorphic-fetch');

module.exports = function (ctx, cb) {
  var token = ctx.data['github-token'];
  var prsPromise = [
    'mulesoft/anypoint-vcs',
    'mulesoft/anypoint-vcs-db',
    'mulesoft/asset-manager',
    'mulesoft/asset-manager-db',
    'mulesoft/asset-portal-service',
    'mulesoft/asset-portal-service-db',
    'mulesoft/exchange-maven-facade',
    'mulesoft/exchange-ui',
    'mulesoft/exchange-xapi',
    'mulesoft/repository-service',
    'mulesoft/repository-service-db',
  ].map(function (repo) {
    return fetchPRs(repo);
  });
  
  Promise.all(prsPromise)
    .then(function (prs) { 
      return prs.reduce(function(a, b) {
        return a.concat(b);
      }, []);
    })
    .then(function (prs) {
      var result = prs
        .sort(function(a, b){
          return new Date(a.updated_at) - new Date(b.updated_at);
        })
        .map(function (pr) {
          return {
            fallback: pr.html_url,
            color: "#36a64f",
            pretext: "Optional text that appears above the attachment block",
            author_name: pr.user.login,
            author_link: pr.user.html_url,
            author_icon: pr.user.avatar_url,
            title: pr.title + ' in ' + pr.base.repo.name,
            title_link: pr.html_url
          };
          // return '> :pushpin: ' + pr.title + '\n> :link: ' + pr.html_url + '\n> :speaking_head_in_silhouette: ' + pr.user.login + '\n';
        });
        
      cb(null, {
        response_type: 'in_channel',
        text: '*' + prs.length + ' pending PRs*',
        attachments: result
      });
    })
    .catch(function (err) {
      cb(null, {
        // response_type: 'in_channel', // uncomment to have the response visible to everyone on the channel
        text: err.message
      });
    });

  function fetchPRs(repo) {
    var headers = {
      Authorization: 'token ' + token
    };
    
    return fetch('https://api.github.com/repos/' + repo + '/pulls', { headers: headers })
      .then(function (response) {
        return response.json();
      });
  }
};