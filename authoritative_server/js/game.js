const players = {};
const bases = [];
var time = 0;
var worldTime = 0;
var serverTickRate = 1;

const CombatManager = {
    combats: {},
};

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

        socket.on('resolveBaseAction', function(base1, base2){
            resolveBaseAction(socket,base1,base2);
        });
    });
}

function update(wt,delta) {
    worldTime = wt;

    time+=delta/1000;
    //Server Tick
    if(time > serverTickRate){
        time = 0;

        bases.forEach(function(base){
            if(base.troops > 30 && base.owner != null){
                base.troops+=base.baseRefillRate;
            }

        });

        //Loop through combat manager
        for(const v1 of Object.values(CombatManager.combats)){
            for(const v2 of Object.values(v1)){
                if(worldTime > v2.time){
                    console.log("resolved");
                    v2.attacker.troops -= v2.troops;
                    v2.defender.troops -= v2.troops;

                    if(v2.defender.troops <= 0){
                        v2.defender.owner = v2.attacker.owner;
                        v2.defender.troops = (v2.defender.troops < 0) ? -v2.defender.troops : 0;
                        delete CombatManager.combats
                            [generateUniqueNum(v2.attacker.x,v2.attacker.y)]
                            [generateUniqueNum(v2.defender.x,v2.defender.y)]

                        io.emit('resolveCombat', v2.attacker, v2.defender);
                    }

                }
            }
        }

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
        id: bases.length,
        x: x,
        y: y,
        troops: 0,
        baseRefillRate: baseRefillRate,
        attackRate: baseRefillRate,
        sprite: self.add.sprite(x,y, 'circle'),
        owner: null,
    };

    bases.push(base);
}

function generateUniqueNum(x,y){
    return x*13+y*17;
}

function resolveBaseAction(socket,b1, b2){
    let base1 = bases[b1];
    let base2 = bases[b2];

    if(base1.owner == base2.owner){
        console.log("Defend");
    }
    else{

        //Register to combat manager
        let uniqId1 = generateUniqueNum(base1.x,base1.y);
        let uniqId2 = generateUniqueNum(base2.x,base2.y);

        if(!(uniqId1 in CombatManager.combats)){
            CombatManager.combats[uniqId1] = {};
        }

        if(!(uniqId2 in CombatManager.combats[uniqId1])){
            // let line = new Phaser.Geom.Line(base1.x,base1.y,base2.x,base2.y);
            // let midpoint = Phaser.Geom.Line.GetMidPoint(line);
            // let icon = self.add.sprite(midpoint.x, midpoint.y, "attack");
            // icon.displayHeight = 32;
            // icon.displayWidth = 32;

            let distance = Phaser.Math.Distance.Between(base1.x,base1.y,base2.x, base2.y);
            let time = worldTime + Math.round(distance / 30)*1000;

            console.log(time);
            let combat = {
                attacker: base1,
                defender: base2,
                troops: Math.ceil(base1.troops/2),
                time: time,
            }
            CombatManager.combats[uniqId1][uniqId2] = combat;

            socket.emit("basesInCombat", base1, base2);
        }
    }
}

const game = new Phaser.Game(config);

window.gameLoaded();