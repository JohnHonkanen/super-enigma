class MenuItem extends Phaser.GameObjects.Text
{
    constructor(scene, text, x, y, newScene)
    {
        super(scene, x, y, text);
        scene.add.existing(this)
        this.setInteractive();
        this.scenePlugin = scene.sys.scenePlugin;
        console.log(newScene);
        this.destination = newScene;
        this.on('pointerdown', () => this.down());
    }
    
    create()
    {
    }
    
    down()
    {
        console.log(this.destination);
        this.scenePlugin.start(this.destination);
    }
}