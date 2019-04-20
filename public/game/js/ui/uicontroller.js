class UIController{
    constructor(sceneContext)
    {
        this.scene = sceneContext;
        this.uiObjects = [];
    }

    preload(){
        this.scene.load.image('transparent_pixel', 'assets/transparent_pixel.png');
        this.scene.load.image('white_pixel', 'assets/white_pixel.png');
    }

    create(){


    }

    update(){
        this.uiObjects.forEach(function(uiObject){
            uiObject.uiObject.alpha = (uiObject.isOpen)? 0.5 : 0;
            if(uiObject.callback && typeof uiObject.callback === "function"){
                uiObject.callback(uiObject);
            }

        });
    }

    createPanel(x,y,width,height,color, callback)
    {

        var img = this.scene.add.image(x + width,y + height, 'white_pixel');
        img.displayHeight = height;
        img.displayWidth = width;
        img.setTint(color);
        img.depth = SystemVar.MenuDepth;
        img.alpha = 0.5;

        const panel = {
            id: this.uiObjects.length,
            uiObject: img,
            isOpen: false,
            callback: callback,
        }

        this.uiObjects.push(panel);

        return panel;
    }
}