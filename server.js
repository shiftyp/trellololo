var express = require('express');
var path = require('path');
var glob = require('glob');
var fs = require('fs');

var app = new express();
var port = process.env.PORT || 3000;
var distDir = path.join(__dirname, './dist');
var filesDir = distDir + '/files';

function stat(path) {
  return new Promise(function(resolve, reject) {
    fs.stat(path, function(err, stats) {
      if (err) {
        return reject(err);
      }
      var name = path.match(/[^\/]*?(\.\w+)?$/);
      var res = {
        name: name[0],
        size: stats.size,
        path: path.replace(filesDir, '')
      };
      if (stats.isFile()) {
        resolve(Object.assign(res, {
          is_dir: false,
          extension: (name[1] && String(name[1]).substring(1)) || '',
        }));
      } else {
        resolve(Object.assign(res, {
          is_dir: true
        }));
      }
    })
  });
}

function globPromise(pattern) {
  return new Promise(function(resolve, reject) {
    glob(pattern, function(err, files) {
      if (err) {
        return reject(err);
      }
      resolve(files);
    })
  });
}

function globStat(pattern) {
  return globPromise(pattern)
    .then(function(files) {
      return Promise.all(files.map(stat));
    });
}

app.use(express.static(distDir));

app.get('/api/list*', function(req, res) {
  const globPath = filesDir + req.params[0];
  const globPattern = globPath + '*';

  globStat(globPattern)
    .then(function(stats) {
      res.status(200).json(stats);
    })
    .catch(function(error) {
      res.status(500).json({ error: error });
    })
});

app.use('*', function(req, res) {
  res.sendFile(path.join(__dirname, './dist/index.html'));
});

app.listen(port, function(error) {
  if (error) {
    console.error(error);
  } else {
    console.info("Listening on port:", port);
  }
});
