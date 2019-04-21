const players = {};
const bases = [];
var time = 0;
var worldTime = 0;
var serverTickRate = 0.03;
var baseRefilTimer = 0;

const CombatManager = {
    combats: {},
};
const SystemVar = {
    productionThreshold: 50,
    baseRefillRate: 1,
    maxTroops: 5000,
    troopTravelSpeed: 30,
    cost: [100,500,1000],
    speed: [1,1.2,1.5,1.8],
    capacity: [0,300, 600, 1000]
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
    //Random in center
    //ToDO: Create a random spawner
    var quadSpawner = function(x, y, c,troops){
        createBase(self, x, y, (c)? troops[0]: 0, SystemVar.baseRefillRate);
        createBase(self, x, y + 150, (c)? troops[1]: 0, SystemVar.baseRefillRate);
        createBase(self, x, y -150, (c)? troops[2]: 0, SystemVar.baseRefillRate);
        createBase(self, x + 150, y, (c)? troops[3]: 0, SystemVar.baseRefillRate);
        createBase(self, x - 150, y, (c)? troops[4]: 0, SystemVar.baseRefillRate);

    };

    var horizontalSpawner = function(x,y, c, troops){

        createBase(self, x, y, (c)? troops[0]: 0, SystemVar.baseRefillRate);
        createBase(self, x, y + 150, (c)? troops[1]: 0, SystemVar.baseRefillRate);
        createBase(self, x, y - 150, (c)? troops[2]: 0, SystemVar.baseRefillRate);
    }

    var verticalSpawner  = function(x,y, c, troops){

        createBase(self, x, y, (c)? troops[0]: 0, SystemVar.baseRefillRate);
        createBase(self, x + 150, y, (c)? troops[1]: 0, SystemVar.baseRefillRate);
        createBase(self, x - 150, y, (c)? troops[2]: 0, SystemVar.baseRefillRate);
    }

    quadSpawner(1300,750, true, [300,300,300,50,300]);
    quadSpawner(900,500, true, [1500,700,700,700,700]);
    quadSpawner(500,250, true, [300,300,300,300,50]);

    quadSpawner(1300,250, true, [300,300,300,50,300]);
    quadSpawner(500,750, true, [300,300,300,300,50]);

    horizontalSpawner(200, 500, false, []);
    horizontalSpawner(1600, 500, false, []);

    verticalSpawner(900, 150, false, []);
    verticalSpawner(900, 850, false, []);

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
                bases[el].capacity =0;
                bases[el].speed = 0;
                bases[el].troopSpeed = 1;
                bases[el].extraCapacity = 0;
                bases[el].extraProduction = 0;
            });

            delete CombatManager.combats[socket.id];
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

        socket.on('restartServer', function(){
            delete CombatManager.combats;
            CombatManager.combats = {};
            bases.forEach(function(base){
                base.troops = 0;
                base.owner = null;
                base.capacity = 0;
                base.speed = 0;
                base.troopSpeed = 1;
                base.extraCapacity = 0;
                base.extraProduction = 0;
            });

            io.emit("newGame");

        }, this);

        socket.on('basePowerup', function(id, speed, extra, cost){
            bases[id].troops -= cost;
            bases[id].troopSpeed = SystemVar.speed[speed];
            bases[id].extraProduction = extra;
            bases[id].speed = speed;

            io.emit('basePowerUpUpdate', id, speed, extra);
        });
    });
}

function update(wt,delta) {
    worldTime = wt;

    time+=delta/1000;

    baseRefilTimer+=delta/1000;
    if(baseRefilTimer > 1){
        bases.forEach(function(base){
            if(base.owner != null && base.troops < base.maxTroops+base.extraCapacity){
                base.troops += base.baseRefillRate + base.extraProduction; //+ Math.floor(base.troops/100);
                base.troops = (base.troops > base.maxTroops+base.extraCapacity)? base.maxTroops+base.extraCapacity: base.troops;
            }
        });

        baseRefilTimer = 0;
    }

    //Loop through combat manager, Owner, Bases
    for(const o of Object.values(CombatManager.combats)){
        for(const v1 of Object.values(o)){
            for(const v2 of Object.values(v1)){
                let state =0;
                let distance = v2.troopPos.distance(new Phaser.Math.Vector2(v2.defender.x, v2.defender.y));

                var dir = v2.dir.clone();
                v2.troopPos.add(dir.scale(delta * SystemVar.troopTravelSpeed/1000 * v2.attacker.troopSpeed));

                if(distance < 4){
                   if(v2.attackerPlayer === v2.defender.owner){
                       v2.defender.troops+= v2.troops;
                   }
                   else{
                       v2.defender.troops -= v2.troops;
                   }


                    if(v2.defender.troops <= 0){
                        state = 1;
                        v2.defender.owner = v2.attacker.owner;
                        v2.defender.extraCapacity = 0;
                        v2.defender.troopSpeed = 1;
                        v2.defender.capacity = 0;
                        v2.defender.speed = 0;
                        v2.defender.troops = (v2.defender.troops < 0) ? -v2.defender.troops : 0;
                        v2.defender.extraProduction = 0;
                        players[v2.defender.owner].bases.push(v2.defender.id);
                    }

                    delete CombatManager.combats
                        [v2.attackerPlayer]
                        [generateUniqueNum(v2.attacker.x,v2.attacker.y)]
                        [generateUniqueNum(v2.defender.x,v2.defender.y)];

                    io.emit('resolveCombat', v2.attacker, v2.defender, state);

                }
            }
        }
    }


    //Server Tick
    if(time > serverTickRate){
        time = 0;
        io.emit('serverUpdate', bases, CombatManager);
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

function createBase(self,x,y, troops, baseRefillRate){
    var base = {
        id: bases.length,
        x: x,
        y: y,
        troops: troops,
        maxTroops: 1000,
        troopSpeed: 1,
        extraCapacity: 0,
        speed: 0,
        capacity: 0,
        baseRefillRate: baseRefillRate,
        extraProduction: 0,
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

    //Register to combat manager
    let uniqId1 = generateUniqueNum(base1.x,base1.y);
    let uniqId2 = generateUniqueNum(base2.x,base2.y);

    if(!(base1.owner in CombatManager.combats)){
        CombatManager.combats[base1.owner] = {};
    }

    if(!(uniqId1 in CombatManager.combats[base1.owner])){
        CombatManager.combats[base1.owner][uniqId1] = {};
    }

    if(!(uniqId2 in CombatManager.combats[base1.owner][uniqId1])){
        // let line = new Phaser.Geom.Line(base1.x,base1.y,base2.x,base2.y);
        // let midpoint = Phaser.Geom.Line.GetMidPoint(line);
        // let icon = self.add.sprite(midpoint.x, midpoint.y, "attack");
        // icon.displayHeight = 32;
        // icon.displayWidth = 32;

        let distance = Phaser.Math.Distance.Between(base1.x,base1.y,base2.x, base2.y);
        let time = worldTime + Math.round(distance / SystemVar.troopTravelSpeed)*1000;

        let p1 = new Phaser.Math.Vector2(base1.x,base1.y);
        let p2 = new Phaser.Math.Vector2(base2.x,base2.y);
        let dir = p2.subtract(p1);
        dir.normalize();

        let combat = {
            attackerPlayer: base1.owner,
            attacker: base1,
            defender: base2,
            troops: Math.ceil(base1.troops/2),
            time: time,
            dir: dir,
            troopPos: new Phaser.Math.Vector2(base1.x, base1.y),
        }

        base1.troops -= combat.troops;
        CombatManager.combats[base1.owner][uniqId1][uniqId2] = combat;
    }
}

const game = new Phaser.Game(config);

window.gameLoaded();