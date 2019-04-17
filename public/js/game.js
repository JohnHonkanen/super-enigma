var config = {
    type: Phaser.AUTO,
    parent: 'phaser',
    width: '100%',
    height: '100%',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

function preload() {
    this.load.image('base', 'assets/circle.png');
}

function create() {
    var self = this;
    this.socket = io();
    this.players = [];
    this.bases = [];
    this.actionData = {
        started: false,
        selected: null,
    };

    this.socket.on('currentPlayers', function(players, bases){
        console.log("Current Player");
        Object.keys(players).forEach(function(id){
           if(players[id].playerId === self.socket.id){
               //Our player
               addPlayer(self, players[id], true);
           }
           else{
               addPlayer(self, players[id], false);
           }
        });

        bases.forEach(function(base){
            createBase(self, base);
        });
    })

    this.socket.on('newPlayer', function (playerInfo) {
        console.log("New Player JOIN");
        addPlayer(self, playerInfo);
    });

    this.socket.on('disconnect', function (playerId) {
        self.players = self.players.filter(function(v, i, arr){
            return v.playerId !== playerId;
        });
    });

    this.socket.on('serverUpdate', function(bases){
        bases.forEach(function(base, it){
            self.bases[it].troops = base.troops;
            self.bases[it].text.text = base.troops;
            self.bases[it].owner = base.owner;
            if(base.owner== null){
                self.bases[it].sprite.clearTint();
            }
            else if(base.owner != self.player.playerId && base.owner !== null){
                self.bases[it].sprite.setTint(0xFF0000);
            }
        });
    });
}

function addPlayer(self, playerInfo, isPlayer){
    const player = {
        playerId: playerInfo.playerId,
        bases: [],
    }

    if(isPlayer){
        self.player = player;
    }

    self.players.push(player);
}

function createBase(self,base){
    var nBase = {
        x: base.x,
        y: base.y,
        troops: base.troops,
        sprite: self.add.sprite(base.x,base.y, 'base').setInteractive(),
        text: self.add.text(base.x,base.y, 0),
        owner: base.owner,
    };

    if(nBase.owner != self.player.playerId && nBase.owner !== null){
        nBase.sprite.setTint(0xFF0000);
    }
    let index = self.bases.push(nBase) - 1;

    self.bases[index].sprite.on('pointerdown', function(){
        actionManager(self,index,self.bases[index], self.actionData);
    });
}

function update() {}

function actionManager(self, baseId, base, action){
    //Take Control of Empty Base to Start
    if(!action.started){
        action.started = true;
        if(base.owner === null){
            base.owner = self.player.playerId;
            base.troops = 50;
            self.player.bases.push(baseId);
            base.sprite.setTint(0x00FF00);
        }
    }

    const data = {
        id: baseId,
        base: base,
        player: self.player,
    };

    console.log("Sending Data");
    self.socket.emit("updateBaseData", data);
}
