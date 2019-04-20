class Menu extends Phaser.Scene
{
    constructor()
    {
        super({key:"Menu"});
    }

    preload()
    {
        this.load.audio('music', ['assets/audio/background-looping.ogg', 'assets/audio/background-looping.mp3']);
    }

    create()
    {

        var startText = new MenuItem(this, 'Start Game', 100, 100, 'Level1');
        const music = this.sound.add('music');
        
        music.loop = true;
        music.play();



    }
}