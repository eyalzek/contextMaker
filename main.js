var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    path = require('path'),
    Promises = require('./promise-methods');


app.use(express.static(__dirname + '/src'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// routes
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

app.post('/makeScreenshots', function(req, res) {
    var tmpPath;
    console.log('taking screenshots of the following links:');
    console.log(req.body.data);
    Promises.screenshot(req.body.data)
    .then(function(screenshotPaths) {
        tmpPath = path.dirname(screenshotPaths[0]);
        return Promises.append(tmpPath);
    })
    .then(function(newfilePath) {
        console.log(newfilePath);
        return Promises.imgurUpload(newfilePath);
    })
    .then(function(uploadData) {
        console.log(uploadData);
        Promises.cleanup(tmpPath);
        res.send(uploadData.link);
    });
});

// start server
var server = app.listen(3000, function() {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Server listening at http://%s:%s', host, port);
});
