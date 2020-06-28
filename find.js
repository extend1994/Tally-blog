'use strict'

const chalk = require('chalk');
const log = console.log;
const findInFiles = require('find-in-files');
const Flickr = require('flickr-sdk');
const https = require('https');
const Axios = require('axios');
const fs = require('fs');
const glob = require('glob');
const downloadDir = 'flickr-download/';
var flickr = new Flickr(process.env.FLICKR_API_KEY); // API key
var oauth = new Flickr.OAuth(
  'd697b6380f0e0cc10252e494591f375e',
  '7d48eaca3c5611d8'
);
var auth_flickr = new Flickr(oauth.plugin(
  '72157703950421944-04a69fae706bec13',
  '26af02e4e568ac32'
));
var oauth_new = new Flickr.OAuth(
  'c359950d5b815b72ac9bab69023d37c2',
  '4c5710fa285d6955',
);
var auth_new = new Flickr(oauth_new.plugin(
  '72157701145633902-999e025fbc2e863e',
  '150c155fd784c06e'
));

/*******************************************************
 * - Make sure photoSetName is consistent!             *
 * - The replaced file should be under source/_drafts  *
 ******************************************************/
function replaceUrls(photoSetName){
  var oriUrls = JSON.parse(fs.readFileSync('jsons/' + photoSetName + '.md.json'));
  var newUrls = JSON.parse(fs.readFileSync('jsons/' + photoSetName + '.new.json'));
  var textFile = fs.readFileSync('source/_drafts/' + photoSetName + '.md').toString();
  for (let photoName in oriUrls) {
    textFile = textFile.replace(oriUrls[photoName], newUrls[photoName]);
  }
  fs.writeFileSync('source/_complete/' + photoSetName + '-new.md', textFile);
  log('Write Done!');
}

/*******************************************************
 * - Get uploaded photos' urls and record them in json *
 *   file jsons/<photoSetName>.new.json                *
 ******************************************************/
function getNewUrls(setId, photoSet) {
  var json = {}
  flickr.photosets.getPhotos({
    photoset_id: setId,
    user_id: '166516173@N04',
    per_page: 500
  }).then( res => {
    res.body.photoset.photo.forEach( info => {
      flickr.photos.getSizes({
        photo_id: info.id
      }).then( res => {
        var sizeNum = res.body.sizes.size.length;
        var downloadUrl = res.body.sizes.size[sizeNum-4].source;
        json[info.title] = downloadUrl;
        fs.writeFile('jsons/'+photoSet+'.new.json', JSON.stringify(json), 'utf8', writeFileCallback)
      });
    })
  }).catch(err => log(err))
}

function findPhotoInSet(pattern, relativePath, file){
  findInFiles.find(pattern, relativePath, file)
    .then(function(results) {
      for (var result in results) {
        // result is *.md with relative path
        var res = results[result];
        var files = res.matches.map(matchedID => matchedID.toString().match(/[0-9]+/)[0])
        var sets = new Set(files)
        sets.forEach( file => {
          if (file.length == 11) {
            flickr.photos.getAllContexts({
              photo_id: file
            })
            .then(function(ress){
              log(`photo ${chalk.yellow(file)} is in album ${chalk.green(ress.body.set[0].title)} ${ress.body.set.length}`)
            }).catch(function(err){
              log(chalk.red(file + ' ' + err))
            })
          }
        })
      }
  }).catch(function (err){
    log(err);
  })
}

function deletePhoto (pattern, relativePath, file){
 findInFiles.find(pattern, relativePath, file)
  .then(function(results) {
    var allfiles = [];
    for (var result in results) {
      // result is *.md with relative path
      var res = results[result];
      var photos = res.matches.map(matchedID => matchedID.toString().match(/[0-9]+/)[0])
      var sets = new Set(photos);
      sets.forEach(file => allfiles.push(file));
    }
    allfiles.forEach( photo => {
      log(photo)
      auth_flickr.photos.delete({
        user_id: "99605377@N04",
        photo_id: photo
      })
      .then( res => log('Deleted'))
      .catch( err => log(err.response.res.text) )
    });
  }).catch(err => log(err))
}

/*******************************************************
 * - Download flickr photos according to existing urls *
 *   in flickr-download/<filename>                     *
 * - Record existing urls in jsons/<filename>.json     *
 ******************************************************/
function downloadPhotoInFile(photoPattern, relativePath, file) {
  findInFiles.find(photoPattern, relativePath, file)
    .then(function(results) {
      for (let result in results) {
        // result is *.md with relative path
        var textFile = result.match(/[A-Za-z\-]+.md/)[0];
        var downloadPath = downloadDir + textFile;
        var photoUrls = results[result].matches;
        var json = {};
        log('Download photos in file ' + chalk.yellow(textFile) + ' to ' + downloadPath + '...')
        downloadPath = downloadPath + '/';
        photoUrls.forEach( url => {
          var id = url.match(/\/[0-9]+_/)[0].match(/[0-9]+/)[0];
          var photoName, downloadUrl;
          if (id.length == 11) { // In order to make sure it's flickr photos
            flickr.photos.getInfo({
              photo_id: id
            }).then(function(info){
              photoName = info.body.photo.title._content.toString();
              json[photoName] = url
              fs.writeFile('jsons/'+textFile+'.json', JSON.stringify(json), 'utf8', writeFileCallback)
              flickr.photos.getSizes({
                photo_id: id
              }).then(async function(sizeRes){
                var sizeNum = sizeRes.body.sizes.size.length;
                downloadUrl = sizeRes.body.sizes.size[sizeNum-1].source;
                var media = sizeRes.body.sizes.size[sizeNum-1].media;
                if (!fs.existsSync(downloadDir)){
                  fs.mkdirSync(downloadDir);
                }
                if (!fs.existsSync(downloadPath)) {
                  fs.mkdirSync(downloadPath);
                }
                if (media.includes("photo")) {
                  var fileStream = fs.createWriteStream(downloadPath + photoName + '.jpg');
                  /*https.get(downloadUrl, function(httpsResponse){
                    httpsResponse.pipe(fileStream);
                  }) */
                  var res = await Axios({
                    url: downloadUrl,
                    method: 'get',
                    responseType: 'stream'
                  })

                  res.data.pipe(fileStream)

                  new Promise ((resolve, reject) => {
                    fileStream.on('finish', resolve)
                    fileStream.on('error', reject)
                  })
                }
              }).catch(function(err){
                log(chalk.red(id + ' getSizes ' + err))
              })
            }).catch(function(err){
              log(chalk.red(id + ' getInfo ' + err))
            })
          }
        })
      }
  }).catch(function (err){
    log(err);
  })
}

function writeFileCallback() {
  log('The json file had been saved!')
}

/*******************************************************
 * - Upload the photos in flickr-download/<filename> to*
 *   another flickr account                            *
 * - Need to manually enter photoset ID currently      *
 * - Ref: https://bit.ly/2FLM9d6                       *
 ******************************************************/
function uploadToNewSpace(path){
  var auth = Flickr.OAuth.createPlugin(
    'c359950d5b815b72ac9bab69023d37c2',
    '4c5710fa285d6955',
    '72157701145633902-999e025fbc2e863e',
    '150c155fd784c06e'
  );
  log('Upload photos in ' + chalk.yellow(path) + '...')
  for (let photo of glob.sync(path+'/*.jpg')) {
    var uploadPhotoName = photo.match(/[A-Za-z0-9_-]+.jpg/)[0].match(/[A-Za-z0-9_]+/)[0];
    Flickr.Upload(auth, path + '/' + uploadPhotoName + '.jpg', {
      title: uploadPhotoName
    }).then(function(uploadRes){
      // uploadRes.body would be like { stat: 'ok', photoid: { _content: <id> } }
      log(`Upload photo stat: ${chalk.green(uploadRes.body.stat)}`);
      auth_new.photosets.addPhoto({
        photoset_id: '72157706317766545',
        photo_id: uploadRes.body.photoid._content
      }).then(function(res){
        log('Add to photoset stat: ' + chalk.green(res.body.stat));
      }).catch(function(err){
        log(err);
      })
    }).catch(function (err) {
      log(`Upload stat ${chalk.red('error')} err`)
    });
  }
}

//findPhotoInSet('\/[0-9]+_', 'source/_drafts', 'Hungary-Budapest.md$')
//deletePhoto('\/[0-9]+_', 'source/_drafts', 'Czech-Cesky-Krumlov.md$');

//downloadPhotoInFile('https:\/\/[a-zA-Z.0-9/_]*.jpg', 'source/_drafts', 'Portugal-Lisbon.md')
//uploadToNewSpace('flickr-download/Portugal-Lisbon.md');
//getNewUrls('72157706317766545', 'Portugal-Lisbon');
replaceUrls('Portugal-Lisbon');
