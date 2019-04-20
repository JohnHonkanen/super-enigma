class Menu extends Phaser.Scene
{
    constructor()
    {
        super({key:"Menu"});
    }

    preload()
    {
        this.load.audio('music', ['assets/audio/background-looping.ogg', 'assets/audio/background-looping.mp3']);
        this.load.image('bg', 'assets/background/bg.jpg');
    }

    create()
    {
        this.add.image(0,0, 'bg').setOrigin(0);

        const music = this.sound.add('music');

        music.loop = true;
        music.play();

        var startText = new MenuItem(this, 'Start Game', 100, 100, 'Level1');

    }
}