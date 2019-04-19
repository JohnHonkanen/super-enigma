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
        this.on('pointerover', () => this.select());
        this.on('pointerout', () => this.deselect());
        
        this.selectAnim = this.scene.tweens.add({
            targets: this,
            alpha: 1,
            duration: 1000,
            ease: 'Sine.easeInOut',
            loop: -1,
            yoyo: true
        });
        this.selectAnim.stop()
    }
    
    select()
    {
        this.selectAnim.resume();
    }
    
    deselect()
    {
        console.log("out");
        this.selectAnim.pause();
        this.alpha = 1;
    }
    
    down()
    {
        console.log(this.destination);
        this.scenePlugin.start(this.destination);
    }
}