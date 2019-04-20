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
    StartTroops: 50,
    ActionLineWidth: 4,
    ActionLineColor: 0xaa00aa,
    TroopTravelSpeed: 80,
    cost: [100,500,1000],
    speed: [1,1.5,3,5],

    //UISettings
    MenuDepth: 500,
}


const CombatManager = {
    combats: {},
};
var game = new Phaser.Game(config);
