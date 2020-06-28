'use strict'

const chalk = require('chalk');
const log = console.log;
const findInFiles = require('find-in-files');
const Flickr = require('flickr-sdk');
var flickr = new Flickr(process.env.FLICKR_API_KEY); // API key
var oauth = new Flickr.OAuth(
  process.env.FLICKR_API_KEY,
  process.env.FLICKR_API_SECRET);
var auth_flickr = new Flickr(oauth.plugin(
  process.env.FLICKR_OAUTH_TOKEN,
  process.env.FLICKR_OAUTH_TOKEN_SECRET
));

function arrayRemove (array, value) {
  return array.filter( arr => arr != value )
}

function getPhotos(photoset_id) {
  flickr.photosets.getPhotos({
    user_id: "99605377@N04",
    photoset_id: photoset_id
  }).then(function (res) {
    let set = res.body.photoset
    log(chalk.yellow(set.title))
    var allphoto = set.photo.map( photo => photo.id ).sort()

    findInFiles.find("\/[0-9]+_", 'source/_drafts/', 'Portugal-Lisbon.md$')
      .then(function(results) {
        var allfiles = [];
        for (var result in results) {
          // result is *.md with relative path
          var res = results[result];
          // files may contain the photos don't belong the photoset
          var files = res.matches.map(matchedID => matchedID.toString().match(/[0-9]+/)[0]).sort()
          var sets = new Set(files)
          sets.forEach(file => allfiles.push(file))
          log('photo number in the file ' + result + ': ' + chalk.green(sets.size))
        }
        var photo_to_delete = allphoto.filter( photo => !allfiles.includes(photo)).sort()
        allfiles.forEach( photo => {
          auth_flickr.photos.delete({
            user_id: "99605377@N04",
            photo_id: photo
          }).then(function(res){
            log(`${chalk.red('Delete')} photo ${chalk.yellow(photo)}: ${chalk.green(res.body.stat)}`)
          }).catch(function (err){
            log(chalk.red(err))
          })
        })
      });
  }).catch(function (err){
    log(err);
  })
}

getPhotos("72157686349279344", 1)
