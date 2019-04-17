const players = {};
const bases = [];
var time = 0;
var serverTickRate = 1;

const config = {
    type: Phaser.HEADLESS,
    parent: 'phaser',
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0 }
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    autoFocus : false,
};

function preload() {
    this.load.image('base', 'assets/circle.png');
}

function create() {
    const self = this;
    this.players = []; //arr init
    //Create Bases
    createBase(self, 400,300, 1);
    createBase(self, 600,500, 1);

    io.on('connection', function (socket) {
        console.log('a user connected');
        // create a new player and add it to our players object
        players[socket.id] = {
            playerId: socket.id,
            bases: [],
        };
        // add player to server
        addPlayer(self, players[socket.id]);
        // send the players object to the new player
        socket.emit('currentPlayers', players, bases);
        // update all other players of the new player
        socket.broadcast.emit('newPlayer', players[socket.id]);

        socket.on('disconnect', function () {
            console.log('user disconnected');
            // remove player from server
            removePlayer(self, socket.id);
            // remove this player from our players object
            players[socket.id].bases.forEach(function(el){
                bases[el].owner = null;
            });
            delete players[socket.id];
            // emit a message to all players to remove this player
            io.emit('disconnect', socket.id);
        });

        socket.on('updateBaseData', function(data){
            bases[data.id].owner = data.base.owner;
            bases[data.id].troops =  data.base.troops;
            players[data.player.playerId].bases.push(data.id);
        });
    });


}

function update(wt,delta) {
    time+=delta/1000;
    if(time > serverTickRate){
        time = 0;

        bases.forEach(function(base){
            if(base.troops > 30 && base.owner != null){
                base.troops+=base.baseRefillRate;
            }

        });

        io.emit('serverUpdate', bases);
    }
}

function addPlayer(self, playerInfo){
    const player = {
        playerId: playerInfo.playerId,
    }
    console.log(`Welcome ${playerInfo.playerId} to game`);

    self.players.push(player);
}

function removePlayer(self, playerId) {
    self.players = self.players.filter(function(v, i, arr){
       return v.playerId !== playerId;
    });

    console.log(self.players);
}

function createBase(self,x,y, baseRefillRate){
    var base = {
        x: x,
        y: y,
        troops: 0,
        baseRefillRate: baseRefillRate,
        sprite: self.add.sprite(x,y, 'circle'),
        owner: null,
    };

    bases.push(base);
}
const game = new Phaser.Game(config);

window.gameLoaded();