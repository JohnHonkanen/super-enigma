class Button extends Phaser.GameObjects.Sprite
{
    constructor(scene,x,y, imageGroup, text, callback){
        super(scene,x,y,imageGroup.img1);

        this.text = scene.add.text(-100,-100,text);
        this.text.depth = 500;
        this.imageGroup = imageGroup;
        this.setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.enterButtonHoverState() )
            .on('pointerout', () => this.enterButtonRestState() )
            .on('pointerdown', () => this.enterButtonActiveState() )
            .on('pointerup', () => {
                this.enterButtonHoverState();
                callback();
            });
    }

    enterButtonHoverState() {
        this.text.setPosition(this.x+32, this.y)
        this.setTexture(this.imageGroup.img2);
    }

    enterButtonRestState() {
        this.text.setPosition(-100,-100);
        this.setTexture(this.imageGroup.img1);
    }

    enterButtonActiveState() {
        this.text.setPosition(-100,-100);
        this.setTexture(this.imageGroup.img3);
    }

    moveTo(x,y){
        this.setPosition(x,y);
    }
}