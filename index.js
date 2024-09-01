
const dotenv = require('dotenv');
const fs = require('fs');
const { DownloaderHelper } = require('node-downloader-helper');
dotenv.config();
const cron = require('node-cron');
const path = require('path');
var bodyParser = require('body-parser')

var express = require("express");

var api = express();
var router = express.Router();

api.use(bodyParser.urlencoded({ extended: false }));
api.use(bodyParser.json());

var url = process.env.URL;

var calendars = []

if(fs.existsSync(__dirname + "/config/calendars.json")) {
    calendars = JSON.parse(fs.readFileSync(__dirname + "/config/calendars.json"));
}

if(!process.env.AGALAN_AUTH) throw new Error('AGALAN_AUTH environment variables not set');

if (!fs.existsSync(__dirname + '/web')){
    console.log("Creating web folder");
    fs.mkdirSync(__dirname + '/web');
}

var dl;

function downloadCalendar(url, filename) {
    dl = new DownloaderHelper(url, __dirname + '/web', {
        fileName: filename,
        override: true,
        headers: {
            'Authorization': 'Basic ' + process.env.AGALAN_AUTH
        },
        retry: false
    });

    dl.on('error', (err) => {
        console.log('Download Failed, retrying in 1h', err)
        setTimeout(() => {downloadCalendar(url,filename)}, 3600000);
    });
    dl.start().catch((err) => {
        console.log(err);
    });

}


console.log("Starting sync task...");
cron.schedule('0 0 18 * * *', () => { // at 6h pm every day
    for(var calendar of calendars) {
        console.log("Downloading new calendar...");
        console.log(calendar.url);
        downloadCalendar(calendar.url, calendar.filename);
    }
    
});



console.log("Local API running on port 3200");

api.use('/web', express.static('web'))

api.listen(3200, () => {});



// Downloading calendar on program start
console.log("Downloading calendar on start...");
for(var calendar of calendars) {
    console.log("Downloading new calendar...");
    console.log(calendar.url);
    downloadCalendar(calendar.url, calendar.filename);
}