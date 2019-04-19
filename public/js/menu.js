class Menu extends Phaser.Scene
{
    constructor()
    {
        super({key:"Menu"});
    }
    
    create()
    {
        var startText = new MenuItem(this, 'Start Game', 100, 100, 'Level1');
    }
}