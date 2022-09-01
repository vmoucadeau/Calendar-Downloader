
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

if(!process.env.AGALAN_AUTH) throw new Error('AGALAN_AUTH environment variables not set');

const dl = new DownloaderHelper(url, __dirname + '/web', {
    fileName: '2A.ics',
    override: true,
    headers: {
        'Authorization': 'Basic ' + process.env.AGALAN_AUTH
    }
});

dl.on('end', () => console.log('Download Completed'));
dl.on('error', (err) => console.log('Download Failed', err));

console.log("Starting sync task...");
cron.schedule('0 0 18 * * *', () => { // at 6h pm every day
    
    console.log("Downloading new calendar...");
    console.log(url)
    dl.start().catch((err) => {
        console.log(err);
    });
});



console.log("Local API running on port 3200");

api.listen(3200, () => {
    
});

api.get("/agenda.ics", (req, res, next) => {
    res.sendFile(path.join(__dirname, 'web/agenda.ics'));
})

// Downloading calendar on program start
console.log("Downloading calendar on start...");
dl.start().catch((err) => {
    console.log(err);
});
