const UIManager = {
    upgradePanelIsOpen : true,
    ESCKeyDown: false,
}

class Level1 extends Phaser.Scene{
    constructor(){
        super({key:"Level1"});

        this.UI = new UIController(this);
    }

    preload() {
        this.load.image('base', 'assets/circle.png');
        this.load.image('attack', 'assets/attack.png');
        this.load.image('defend', 'assets/shield.png');

        this.UI.preload();
    }

    create() {
        this.input.mouse.disableContextMenu();
        this.input.setDefaultCursor('url(assets/cursors/cursor.cur), pointer');
        var self = this;
        this.socket = io();
        this.players = [];
        this.bases = [];
        this.actionData = {
            started: false,
            selected: null,
            hover: null,
            actionLine: new Phaser.Geom.Line(0,0,0,0),
            actionLineIcon: this.add.sprite(-100,-100, "attack"),
            actionText: this.add.text(-100,-100, "Hello", {align: "center"}),
            drawActionLine: false,
        };
        this.actionData.actionLineIcon.displayHeight = 32;
        this.actionData.actionLineIcon.displayWidth = 32;
        this.actionData.actionLineIcon.depth = 100;

        this.graphics = this.add.graphics({ lineStyle: { width: SystemVar.ActionLineWidth, color: SystemVar.ActionLineColor } });
        this.graphics.strokeLineShape(this.actionData.actionLine);

        //Multiplayer CallBack Functions
        //Get Current Players
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
        //Register New players that joins
        this.socket.on('newPlayer', function (playerInfo) {
            console.log("New Player JOIN");
            addPlayer(self, playerInfo);
        });

        this.socket.on('disconnect', function (playerId) {
            self.players = self.players.filter(function(v, i, arr){
                return v.playerId !== playerId;
            });
        });
        //Sync Server Updates
        this.socket.on('serverUpdate', function(bases, combatManager){
            bases.forEach(function(base, it){
                self.bases[it].troops = base.troops;
                self.bases[it].text.text = base.troops;
                self.bases[it].owner = base.owner;
                if(base.owner== null){
                    self.bases[it].sprite.clearTint();
                }
                else if(base.owner != self.player.playerId && base.owner !== null){
                    self.bases[it].sprite.setTint(SystemVar.EnemyColor);
                }
                else{
                    if(base.owner == self.players.playerId && base !== self.actionData.selected){
                        self.bases[it].sprite.setTint(SystemVar.PlayerColor);
                    }
                }
            });

            for(const o of Object.values(combatManager.combats)){
                for(const v1 of Object.values(o)) {
                    for (const v2 of Object.values(v1)) {
                        let uniq1 = generateUniqueNum(v2.attacker.x, v2.attacker.y);
                        let uniq2 = generateUniqueNum(v2.defender.x, v2.defender.y);

                        addCombat(self, v2.attacker, v2.defender);

                        CombatManager.combats[uniq1][uniq2].icon.setPosition(v2.troopPos.x, v2.troopPos.y);
                        CombatManager.combats[uniq1][uniq2].text.setPosition(v2.troopPos.x, v2.troopPos.y-30);
                        CombatManager.combats[uniq1][uniq2].text.text = v2.troops;
                    }
                }
            }
        });
        //Receive Server PingBack on base
        this.socket.on('basesInCombat', function(base1, base2) {
            console.log("Combat Ping Back");
            addCombat(self, base1, base2);
        });
        //Recieve Combat Resolve Status :: TODO
        this.socket.on('resolveCombat', function(base1, base2){
            if(base2.owner == self.player.playerId){
                self.bases[base2.id].sprite.setTint(SystemVar.PlayerColor);
            }

            let id1 = generateUniqueNum(base1.x,base1.y),
                id2 = generateUniqueNum(base2.x,base2.y);
            var combatData = CombatManager.combats
                [id1]
                [id2];

            CombatManager.combats
                [id1]
                [id2].icon.destroy();

            CombatManager.combats
                [id1]
                [id2].text.destroy();

            delete CombatManager.combats
                [id1]
                [id2];
        });

        this.socket.on('newGame', function(){

            for(const v1 of Object.values(CombatManager.combats)){
                for(const v2 of Object.values(v1)){
                    v2.icon.destroy();
                    v2.text.destroy();
                }
            }

            delete CombatManager.combats;
            CombatManager.combats = {};
            self.actionData.selected = null;
            self.actionData.hover = null;
            self.actionData.started = false;
        });

        //Mouse Pointer Event
        this.input.on('pointerdown', function(pointer){
            if(pointer.rightButtonDown()){
                if(self.actionData.selected != null){
                    self.actionData.selected.sprite.setTint(SystemVar.PlayerColor);
                    self.actionData.drawActionLine = false;
                    self.actionData.actionLineIcon.x = -1000;
                    self.actionData.actionText.x = -1000;
                    self.actionData.selected = null;
                    self.actionData.hover = null;
                }
            }
        });

        //Keyboard
        this.input.keyboard.on("keydown-ESC", function(event){
            if(!UIManager.ESCKeyDown){
                UIManager.ESCKeyDown = true;
                if(UIManager.upgradePanelIsOpen){
                    UIManager.upgradePanelIsOpen = false;
                }
                else{
                    //Open Menu/Quit
                    console.log("quit");
                    self.socket.emit("restartServer");
                }
            }
        });

        this.input.keyboard.on("keyup-ESC", function(event){
            console.log("ESC UP");
            UIManager.ESCKeyDown = false;
        });

        //Create Any Default UI
        this.UI.create();
        //Creat Custom UI
        this.UI.createPanel(0,0,1000,1000, SystemVar.EnemyColor, function(obj){
            //Syncing Panel with UI states
            obj.isOpen = UIManager.upgradePanelIsOpen;
        });
    }

    update(wt, dt) {
        //Graphics
        var self = this;
        this.graphics.clear();
        //Handle Player Input
        if(this.actionData.selected !== null){
            //Player has something selected, draw a line
            this.actionData.drawActionLine = true;
            let pointer = this.input.activePointer;
            this.actionData.actionLine.setTo(
                this.actionData.selected.x,this.actionData.selected.y,
                pointer.worldX,pointer.worldY);


            //Line Physics to find closest intersect
            var shortestDistance = -1;
            this.bases.forEach(function(el){
                if(el !== this.actionData.selected){
                    if(Phaser.Geom.Intersects.LineToCircle(this.actionData.actionLine, el.shape)){
                        let distanceBetweenBase = Phaser.Math.Distance.Between(
                            this.actionData.selected.x,this.actionData.selected.y,
                            el.x,el.y);
                        if(shortestDistance == -1|| shortestDistance < distanceBetweenBase)

                            shortestDistance = distanceBetweenBase;

                        this.actionData.actionLine.setTo(
                            this.actionData.selected.x,this.actionData.selected.y,
                            el.x,el.y);
                        this.actionData.hover = el;

                    }
                }
            }, this);

            if(this.actionData.drawActionLine){
                this.graphics.strokeLineShape(this.actionData.actionLine);
            }


            if(this.actionData.hover !== null){
                let midPoint =  Phaser.Geom.Line.GetMidPoint(this.actionData.actionLine);
                this.actionData.actionLineIcon.x = midPoint.x;
                this.actionData.actionLineIcon.y = midPoint.y;

                this.actionData.actionText.x = midPoint.x - 10;
                this.actionData.actionText.y = midPoint.y - 40;

                let base1 = this.actionData.selected;
                let base2 = this.actionData.hover;

                let distance = Phaser.Math.Distance.Between(base1.x,base1.y,base2.x, base2.y);
                let timeNeeded = Math.round(distance / SystemVar.TroopTravelSpeed);
                this.actionData.actionText.text = `${timeNeeded} seconds`;

                if(this.actionData.hover.owner == this.actionData.selected.owner){
                    this.actionData.actionLineIcon.setTexture("defend");
                }
                else{
                    this.actionData.actionLineIcon.setTexture("attack");
                }

            }
            else{
                this.actionData.actionLineIcon.x = -100;
                this.actionData.actionLineIcon.y = -100;

                this.actionData.actionText.x = -100;
                this.actionData.actionText.y = -100;
            }
        }

        //Loop through combat manager
        for(const v1 of Object.values(CombatManager.combats)){
            for(const v2 of Object.values(v1)){
                this.graphics.strokeLineShape(v2.line);
                // v2.icon.setPosition(v2.icon.x + v2.dir.x * dt/1000 * SystemVar.TroopTravelSpeed,
                //     v2.icon.y + v2.dir.y * dt/1000 * SystemVar.TroopTravelSpeed);
            }
        }
        this.UI.update();
    }
}


//Helper Functions
//Add Player to Current Context
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
//Create and Add Base to Current Context
function createBase(self,base){
    var nBase = {
        id: base.id,
        x: base.x,
        y: base.y,
        troops: base.troops,
        sprite: self.add.sprite(base.x,base.y, 'base').setInteractive(),
        shape: new Phaser.Geom.Circle(base.x, base.y, 50),
        text: self.add.text(base.x-10,base.y-50, 0, {align: 'center'}),
        owner: base.owner,
        attacking: null,
    };

    nBase.sprite.displayWidth = 100;
    nBase.sprite.displayHeight = 100;

    if(nBase.owner != self.player.playerId && nBase.owner !== null){
        nBase.sprite.setTint(SystemVar.EnemyColor);
    }
    let index = self.bases.push(nBase) - 1;

    self.bases[index].sprite.on('pointerdown', function(){
        actionManager(self,index,self.bases[index], self.actionData);
    });

    self.bases[index].sprite.on('pointerover', function(){
        if(self.actionData.selected !== null && self.actionData.selected != self.bases[index]){
            self.actionData.hover = self.bases[index];
        }
    });

    self.bases[index].sprite.on('pointerout', function(){
        if(self.actionData.hover ===  self.bases[index]){
            console.log("Pointer Out");
            self.actionData.hover = null;
        }
    });
}
//Action Resolver
function actionManager(self, baseId, base, action){
    //Take Control of Empty Base to Start
    let updateServer = false;

    if(!action.started){
        action.started = true;
        if(base.owner === null){
            base.owner = self.player.playerId;
            base.troops = SystemVar.StartTroops;
            self.player.bases.push(baseId);
            base.sprite.setTint(SystemVar.PlayerColor);

            updateServer = true;
        }
    }
    else{
        if(base.owner === self.player.playerId && action.selected === null){
            action.selected = base;
            base.sprite.setTint(SystemVar.HighlightColor);
        }

        if(action.selected !== null && action.hover != null){
            performBaseAction(self,action.selected.id, action.hover.id);
            action.selected = null, action.hover = null;
        }
    }

    if(updateServer){
        const data = {
            id: baseId,
            base: base,
            player: self.player,
        };

        self.socket.emit("updateBaseData", data);
    }
}
//Send Info to Server
function performBaseAction(self,base1, base2){

    self.actionData.selected.sprite.setTint(SystemVar.PlayerColor);
    self.actionData.drawActionLine = false;
    self.actionData.actionLineIcon.x = -1000;
    self.actionData.actionText.x = -1000;
    self.actionData.selected = null;
    self.actionData.hover = null;

    self.socket.emit("resolveBaseAction", base1, base2);
}
//Add Combat Data to current Context
function addCombat(self,base1, base2){
    let uniqId1 = generateUniqueNum(base1.x, base1.y);
    let uniqId2 = generateUniqueNum(base2.x, base2.y);

    if (!(uniqId1 in CombatManager.combats)) {
        CombatManager.combats[uniqId1] = {};
    }

    if (!(uniqId2 in CombatManager.combats[uniqId1])) {
        let line = new Phaser.Geom.Line(base1.x, base1.y, base2.x, base2.y);
        let midpoint = Phaser.Geom.Line.GetMidPoint(line);
        var string = (base1.owner === base2.owner)? "defend" : "attack";
        let icon = self.add.sprite(base1.x, base1.y, string);
        icon.displayHeight = 32;
        icon.displayWidth = 32;

        let p1 = new Phaser.Math.Vector2(base1.x,base1.y);
        let p2 = new Phaser.Math.Vector2(base2.x,base2.y);
        let dir = p2.subtract(p1);
        dir.normalize();

        if(base1.owner !== self.player.playerId){
            icon.setTint(SystemVar.EnemyColor);
        }
        const combat = {
            attackerPlyer: base1.owner,
            attacker: base1,
            defender: base2,
            line: line,
            icon: icon,
            text: self.add.text(midpoint.x, midpoint.y-30, "Test"),
            dir: dir,
        }

        self.actionData.actionLineIcon.x = -1000;

        CombatManager.combats[uniqId1][uniqId2] = combat;
    }
}
//Generate 1D Unique Number based on 2D values;
function generateUniqueNum(x,y){
    return x*13+y*17;
}


