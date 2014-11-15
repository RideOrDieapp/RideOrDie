var nconf = require('nconf'),
    express = require('express'),
    http = require('http'),
    path = require('path'),
    app = require('./app.js');

//NConf Configuration
nconf.env().file({ file: 'settings.json' });

//Server Creation
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

