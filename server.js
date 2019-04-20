var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

const path = require('path');
const jsdom = require('jsdom');

const Datauri = require('datauri');
const datauri = new Datauri();

const { JSDOM } = jsdom;

var players = {};

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/public/super-enigma-website/index.html');
});

app.get('/game/', function(req,res){
   res.sendFile(__dirname + '/public/game/game.html');
});

app.get('/sample/', function(req,res){
    res.sendFile(__dirname + '/public/sample.html');
});

function setupAuthoritativePhaser() {
    JSDOM.fromFile(path.join(__dirname, 'authoritative_server/index.html'), {
        // To run the scripts in the html file
        runScripts: "dangerously",
        // Also load supported external resources
        resources: "usable",
        // So requestAnimatinFrame events fire
        pretendToBeVisual: true
    }).then((dom) => {
        dom.window.URL.createObjectURL = (blob) => {
            if (blob){
                return datauri.format(blob.type, blob[Object.getOwnPropertySymbols(blob)[0]]._buffer).content;
            }
        };
        dom.window.URL.revokeObjectURL = (objectURL) => {};

        dom.window.gameLoaded = () => {
            server.listen(8081, function () {
                console.log(`Listening on ${server.address().port}`);
            });
        };

        dom.window.io = io;
    }).catch((error) => {
        console.log(error.message);
    });
}

setupAuthoritativePhaser();