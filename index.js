"use strict";

var albums, child_process, fs, http, https, mkdirp, numberTracks, PlayMusic, pm, sanitize, tracks, tracksWritten;

PlayMusic = require("playmusic");
sanitize = require("sanitize-filename");
https = require("https");
http = require("http");
fs = require("fs");
mkdirp = require("mkdirp");
child_process = require("child_process");
pm = new PlayMusic();
tracks = [];
albums = [];

numberTracks = 0;
tracksWritten = 0;


function fileExists(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    } catch (err) {
        return false;
    }
}


function updateProgress() {
    console.log(`${tracksWritten}/${numberTracks} ${Math.round(tracksWritten / numberTracks * 100)}%`);
}

function id3(artist, albumName, fileName, track) {
    var command;

    command = `./bin\\metamp3.exe --artist "${track.artist}" --album "${track.album}" --track "${track.trackNumber}" --title "${track.title}" --year "${track.year}" --genre "${track.genre}" --pict "./music\\${artist}\\${albumName}\\cover.jpg" "music\\${albumName}\\${fileName}.mp3"`;

    child_process.exec(command, (err, stdout, stderr) => {
        if (tracks.length) {
            setTimeout(loadTrack, 30000);
        }
    });
}


function loadTrack() {
    var albumName, artist, fileName, filePath, folderPath, reg, track;

    track = tracks.shift();
    reg = /([^a-z0-9А-Яа-я' -]+)/gi;
    artist = sanitize(track.artist) || sanitize(track.albumArtist);
    albumName = sanitize(track.album);
    fileName = sanitize((track.trackNumber ? ("0" + track.trackNumber).slice(-2) + " - " : "") + track.title);
    folderPath = `./music/${artist}/${albumName}/`;

    if (fileName.includes(".mp3") || fileName.includes(".flac") || fileName.includes(".ogg")) {
        filePath = `./music/${artist}/${albumName}/${fileName}`;
    } else {
        filePath = `./music/${artist}/${albumName}/${fileName}.mp3`;
    }

    if (!fileExists(filePath)) {
        updateProgress();
        console.log(filePath);

        try {
            mkdirp.sync(folderPath);
        } catch (e) {
            console.log(e);
            console.log(folderPath);

            return;
        }

        pm.getStreamUrl(track.id, (err, streamUrl) => {
            var cover, file;

            if (streamUrl) {
                if (albums.indexOf(albumName) !== -1) {
                    albums.push(albumName);

                    if (track.albumArtRef) {
                        cover = fs.createWriteStream(`./music/${artist}/${albumName}/cover.jpg`);

                        if (track.albumArtRef[0].url.startsWith("https")) {
                            https.get(track.albumArtRef[0].url, (res) => {
                                res.pipe(cover);
                                res.on("end", () => {
                                    console.log("Successfully got cover art.");
                                });
                            });
                        } else {
                            http.get(track.albumArtRef[0].url, (res) => {
                                res.pipe(cover);
                                res.on("end", () => {
                                    console.log("Successfully got cover art.");
                                });
                            });
                        }
                    }
                }

                file = fs.createWriteStream(filePath);
                file.on("open", () => {
                    https.get(streamUrl, (res) => {
                        res.pipe(file);
                        res.on("end", () => {
                            tracksWritten += 1;

                            if (tracks.length) {
                                id3(artist, albumName, fileName, track);
                            } else {
                                console.log("completed");
                            }
                        });
                    });
                });
            }
        });
    } else {
        tracksWritten += 1;

        if (tracks.length) {
            loadTrack();
        }
    }
}


function getAllTracks() {
    pm.getAllTracks({
        limit: 49500
    }, (err, library) => {
        if (!err) {
            tracks = library.data.items;

            // Filter out the songs we've uploaded
            tracks = tracks.filter((track) => {
                return typeof track.storeId !== "undefined";
            });
            numberTracks = tracks.length;
            loadTrack();
        } else {
            console.error("getAllTracks ERROR!");
        }
    });
}


fs.readFile("./config.json", "utf8", (readFileErr, data) => {
    var config;

    if (readFileErr) {
        console.log(readFileErr);

        return;
    }

    config = JSON.parse(data);
    pm.init(config, (initErr) => {
        if (!initErr) {
            getAllTracks();
        } else {
            console.error("Login ERROR!");
        }
    });
});
