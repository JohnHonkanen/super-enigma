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


const CombatManager = {
    combats: {},
};
var game = new Phaser.Game(config);
