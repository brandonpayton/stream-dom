/* eslint-env node */

require('babel-register');

var path = require('path');
var express = require('express');
var webpack = require('webpack');
var config = require('./webpack.config');
var compiler = webpack(config);
var jsonParser = require('body-parser').json();
var when = require('when');
var node = require('when/node');
var fs = node.liftAll(require('fs'));

var app = express();

//
// TODO: Unit test all these handlers
//

var mapsDir = path.resolve(path.join(__dirname, 'maps'));

// TODO: Version API
var API_ROOT = '/api';

app.get(API_ROOT + '/maps', function (req, res) {
  fs.readdir(mapsDir).then(function (fileNames) {
    var fileNamePattern = /(.*)\.json$/i;
    return when.all(fileNames
      .map(function (fileName) { return fileName.match(fileNamePattern); })
      .filter(function (fileNameMatch) { return fileNameMatch !== null; })
      .map(function (fileNameMatch) {
        return fs.readFile(path.join(mapsDir, fileNameMatch[0]), { encoding: 'utf8' })
          .then(function (fileData) {
            return {
              name: fileNameMatch[1],
              data: JSON.parse(fileData)
            };
          });
      })
    );
  }).then(
    function (maps) {
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(maps));
    },
    function (err) {
      res.status(500).send(err.toString());
    }
  );
});
app.get(API_ROOT + '/maps/:name', function (req, res) {
  var mapFileName = path.join(mapsDir, req.params.name + '.json');
  fs.readFile(mapFileName).then(function (data) {
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  }, function (err) {
    // TODO: Find or create a hash of named statuses and use that instead
    // TODO: Where is a list of possible fs error codes?
    res.status(err.code === 'ENOENT' ? 404 : 500).send();
  });
});
app.put(API_ROOT + '/maps/:name', jsonParser, function (req, res) {
  var fileName = path.join(mapsDir, req.params.name + '.json');

  fs.writeFile(fileName, JSON.stringify(req.body)).then(function () {
    res.send();
  }, function () {
    res.status(500).send();
  });
});

app.use(require('webpack-dev-middleware')(compiler, {
  noInfo: true,
  publicPath: config.output.publicPath
}));

app.get('/editor.html', function (req, res) {
  res.sendFile(path.join(__dirname, 'editor.html'));
});

app.get('/index.html', function(req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(7777, 'localhost', function (err) {
  if (err) {
    console.log(err);
    return;
  }

  console.log('Listening at http://localhost:7777');
});
