

class ColoredCylinder extends OrthoCylinder {
    constructor(start, end, radius, numOfSides, planeNormal = new Vector3([0, 0, 1]), color, lightSource){
        super(start, end, radius, numOfSides, planeNormal = new Vector3([0, 0, 1]));
        this.color = color;
        this.lightSource = lightSource;
    }
    getColoredBuffer(lightSource = this.lightSource){
        var coloredBuffer = [];
        for(let i = 0; i < this.faces.length; i++){
            let face = this.faces[i];
            //console.log("Cylinder color: ");
            //console.log(this.color);
            let faceColor = face.getColor(this.color, lightSource).elements;
            // console.log("FaceColor");
            // console.log(faceColor);
            //setting the same color to every vertex of a face
            for(let j = 0; j < face.vertices.length; j++){
                //coloredBuffer.push(faceColor[0]);coloredBuffer.push(faceColor[1]);coloredBuffer.push(faceColor[2]);
                coloredBuffer.push(1);coloredBuffer.push(0);coloredBuffer.push(0);
            }
        }
        return coloredBuffer;
    }
    changeColor(color){
        this.color = color;
    }
    
}