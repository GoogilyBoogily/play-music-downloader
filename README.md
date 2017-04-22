Google Play Music Downloader
============================

Program to download mp3 from [Google Play music](https://play.google.com/music)

Right now it uses `./bin/metamp3.exe` to write metadata tags. This only runs on Windows. In the future, this should probably use something like this: https://www.npmjs.com/package/ffmetadata

Getting Started
---------------

* Install [node.js](https://nodejs.org)
* `cd play-music-downloader/`
* `npm install`

Uses
----

* Fill out `config.json.template` with your Google account details.
* Rename `config.json.template` to `config.json`.
* Run `node index.js`
* Log in, and the program will download to folder `music/`.
