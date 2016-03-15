var path = require('path'),
    fs = require('fs'),
    q = require('q'),
    tmp = require('tmp'),
    webshot = require('webshot'),
    request = require('request'),
    _ = require('underscore'),
    gm = require('gm').subClass({imageMagick: true});


function screenshotPromise(data) {
    var dirPath;

    var returnScreenshotPromise = function(url, i) {
        var curPath = path.join(dirPath, i.toString() + '.png');
        return q.nfcall(webshot, url, curPath)
        .then(function() {
            return q(curPath);
        });
    };

    return q
    .nfcall(tmp.dir)
    .then(function(results) {
        dirPath = results[0];
        console.log('tmpdir created at: ', dirPath);
        var promises = data.map(returnScreenshotPromise);
        return q.all(promises);
    });
}

function appendPromise(screenshotPath) {
    var deferred = q.defer(),
        wildcardPath = path.join(screenshotPath, '*.png'),
        newFilename = path.join(screenshotPath, 'new.png');

    console.log(wildcardPath);
    gm(wildcardPath)
    .append()
    .write(newFilename, function(err) {
        if (err) throw err;
        console.log('image saved as ' + newFilename);
        deferred.resolve(newFilename);
    });
    return deferred.promise;
}

function imgurUploadPromise(imgPath) {
    var deferred = q.defer();
        readStream = fs.createReadStream(imgPath);

    readStream.on('error', deferred.reject);
    q.nfcall(fs.readFile, path.join(__dirname, '.imgur-secret'))
    .then(function(data) {
        console.log(JSON.parse(data).cid);
        return q('Client-ID ' + JSON.parse(data).cid);
    })
    .then(function(secret) {
        var options = {
                uri: 'https://api.imgur.com/3/image',
                method: 'POST',
                headers: {
                  Authorization: secret,
                  Accept: 'application/json'
                }
        };

        var r = request(options, function(err, res, body) {
            var parsed = JSON.parse(body);
            if (err) {
                deferred.reject(err);
            } else if (!parsed.success) {
                deferred.reject({status: parsed.status, message: parsed.data.error});
            } else {
                deferred.resolve(parsed.data);
            }
        });

        var form = r.form();
        form.append('image', readStream);
    });

    return deferred.promise;
}

// not exactly a promise, but...
function cleanupCb(tmpPath) {
    if (fs.existsSync(tmpPath)) {
        console.log('removing tmpdir at: ' + tmpPath);
        _.each(fs.readdirSync(tmpPath), function(file) {
            console.log('removing file: ' + file);
            fs.unlinkSync(path.join(tmpPath, file));
        });
        fs.rmdirSync(tmpPath);
        console.log('tmpdir removed.');
    }
}

module.exports = {
    screenshot: screenshotPromise,
    append: appendPromise,
    imgurUpload: imgurUploadPromise,
    cleanup: cleanupCb
};
