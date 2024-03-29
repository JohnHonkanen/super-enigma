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

app.get('/game-design', function(req,res){
    res.sendFile(__dirname + '/public/super-enigma-website/extra-pages/game-design.html');
});

app.get('/project-management', function(req,res){
    res.sendFile(__dirname + '/public/super-enigma-website/extra-pages/project-management.html');
});

app.get('/team', function(req,res){
    res.sendFile(__dirname + '/public/super-enigma-website/extra-pages/team.html');
});

app.get('/game/', function(req,res){
    res.sendFile(__dirname + '/public/game/game.html');
});
app.get('/game/', function(req,res){
   res.sendFile(__dirname + '/public/game/game.html');
});

var port = process.env.PORT | 8080;
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
            server.listen(port, function () {
                console.log(`Listening on ${server.address().port}`);
            });
        };

        dom.window.io = io;
    }).catch((error) => {
        console.log(error.message);
    });
}

setupAuthoritativePhaser();