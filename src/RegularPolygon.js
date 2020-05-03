class RegularPolygon{
    
    constructor(firstVertex, center, axialVector, numOfSides){
        //Setting parameters
        this.firstVertex = firstVertex;
        this.setAngle(numOfSides);
        //console.log(this.theta);
        this.center = center;
        this.vertices = [];
        this.normals = [];

        this.vertices.push(firstVertex);
        this.axialVector = axialVector;
        this.generatePolygon();
    }

    generatePolygon(){
        //Getting radial vector from 
        var radialVector = this.getVector(this.center, this.firstVertex);
        //console.log(radialVector);

        //console.log("Axial vector in Polygon:");
        //console.log(this.axialVector.elements);

        var rotateMatrix = new Matrix4();
        for(var i = 1; i < this.numOfSides; i++){
            rotateMatrix.setRotate(
                (i * this.theta),
                this.axialVector.elements[0],  
                this.axialVector.elements[1],  
                this.axialVector.elements[2]);
            var translateVector = rotateMatrix.multiplyVector3(radialVector);
            // Get normal for that point, which is essentially the translate vector
            this.normals.push(translateVector);
            var translatedPoint = this.translatePoint(this.center, translateVector); 
            //console.log(translatedPoint);
            this.vertices.push(translatedPoint);   
        }

    }

    getNormals() {
        return this.normals;
    }
    translatePoint(point, vector){
        var result = new Vector3();
        result.elements[0] = point.elements[0] + vector.elements[0];
        result.elements[1] = point.elements[1] + vector.elements[1];
        result.elements[2] = point.elements[2] + vector.elements[2];
        return result;
    }
    
    getVector(start, end){
        return new Vector3([
            (end.elements[0] - start.elements[0]),
            (end.elements[1] - start.elements[1]),
            (end.elements[2] - start.elements[2])
        ]);
    }
    
    setAngle(numOfSides){
        this.numOfSides = numOfSides;
        //Calculate angle
        this.theta = 360 / numOfSides;
    }



}