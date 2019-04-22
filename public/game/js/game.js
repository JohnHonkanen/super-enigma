var config = {
    type: Phaser.AUTO,
    parent: 'phaser',
    width: '100%',
    height: '100%',
    scene: [Menu,Level1]
};

const SystemVar = {
    EnemyColor: 0xFF0000,
    PlayerColor: 0x0000FF,
    HighlightColor: 0x00FF00,
    StartTroops: 100,
    ActionLineWidth: 4,
    ActionLineColor: 0xaa00aa,
    TroopTravelSpeed: 30,
    cost: [100,500,1000],
    speed: [1,1.2,1.5,1.8],
    capacity: [0,300, 300, 400],
    troopCost: 25,

    //UISettings
    MenuDepth: 500,

    //
    capacityID : 0,
    speedID: 1.
}

const AudioManager = {
    Attack:
        {
            name: "attack",
            file: "attack.mp3",
            sync: false,
            obj: null,
            lastPlayed: 0,
        },
    Defend:
        {
            name: "defend",
            file: "defend.mp3",
            sync: false,
            obj: null,
        },
    PUpgrade:
        {
            name: "pupgrade",
            file: "prod_upgrade.mp3",
            sync: false,
            obj: null,
        },
    PDowngrade:
        {
            name: "pdowngrade",
            file: "prod_downgrade.mp3",
            sync: false,
            obj: null,
        },
    SpUpgrade:
        {
            name: "spupgrade",
            file: "speed.mp3",
            sync: false,
            obj: null,
        },
    Spotted:
        {
            name: "spotted",
            file: "spotted.mp3",
            sync: true,
            obj: null,
        },
    Lost:
        {
            name: "lost",
            file: "lost.mp3",
            sync: true,
            obj: null,
        },
    Claim:
        {
            name: "claim",
            file: "claimed.mp3",
            sync: true,
            obj: null,
        },

    HelperData: {
        sfxInProgress: false,
    },

    HelperFunction: {
        playAudio: function(context,audioManager, audio){

            if(audio.obj === null){
                audio.obj = context.sound.add(audio.name);
            }

            var sound =  audio.obj;
            sound.play();

        },
    }
}


const CombatManager = {
    combats: {},
};
var game = new Phaser.Game(config);
