class Button extends Phaser.GameObjects.Sprite
{
    constructor(scene,x,y, imageGroup, text, callback){
        super(scene,x,y,imageGroup.img1);

        this.text = scene.add.text(-100,-100,text).setFontSize(15).setColor('#FFB6C1');
        this.cost = scene.add.text(-100,-100, 0).setFontSize(13).setColor('#FFB6C1');
        this.backdrop = scene.add.sprite(-100,-100, "white").setTint(0x000000);
        this.backdrop.displayWidth = 150;
        this.backdrop.depth = 400;
        this.backdrop.alpha= 0.7;
        this.backdrop.displayHeight = 50;

        this.text.depth = 500;
        this.cost.depth = 500;
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
        this.text.setPosition(this.x+32, this.y -25);
        this.backdrop.setPosition(this.x + 170, this.y + 15);

        this.cost.setPosition(this.x+32, this.y + 0);
        this.setTexture(this.imageGroup.img2);
    }

    enterButtonRestState() {
        this.text.setPosition(-100,-100);
        this.cost.setPosition(-100,-100);
        this.backdrop.setPosition(-100,-100);
        this.setTexture(this.imageGroup.img1);
    }

    enterButtonActiveState() {
        this.text.setPosition(-100,-100);
        this.cost.setPosition(-100,-100);
        this.backdrop.setPosition(-100,-100);
        this.setTexture(this.imageGroup.img3);
    }

    moveTo(x,y){
        this.setPosition(x,y);
    }

    updateCost(cost){
        this.cost.text = `Cost: ${cost} troops`
    }
}