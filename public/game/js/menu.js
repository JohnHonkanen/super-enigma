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
        
        this.logo = this.add.text(30, 100, 'Super Enigma', { font: '50px Arial' });

        const music = this.sound.add('music');

        music.loop = true;
        music.play();

        this.input.addDownCallback(function() {

            if (game.sound.context.state === 'suspended') {
                game.sound.context.resume();
            }

        });

        var startText = new MenuItem(this, 'Start Game', 35, 200, 'Level1', 30, 'hover', 'select');
        // var hiScoreText = new MenuItem(this, 'Highscores', 35, 250, 'High Scores', 30, 'hover', 'select');
        // var exitText = new MenuItem(this, 'Exit', 35, 300, 'Exit', 30, 'hover', 'select');

    }
}