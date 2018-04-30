class QuadFace {
    //Starting top left counter clock wise:
    //a--d
    //|  |
    //|  |
    //b--c
    constructor(a, b, c, d, normalSize){
        this.vertices = [];
        this.vertices.push(a);
        this.vertices.push(b);
        this.vertices.push(c);
        this.vertices.push(d);
        this.setIndices();
        this.setNormal();
        //this.setNormalLines();
        this.normalLines = [];
    }

    getIndices(){
        return Uint16Array(this.indices);
    }

    getVertices(){
        return this.vertices;
    }

    setIndices(){
        this.indices = [1, 2, 3, 1, 0, 3];
    }
    setNormal(){
        let ab = VectorLibrary.getVector(this.vertices[0], this.vertices[1]);
        let ac = VectorLibrary.getVector(this.vertices[0], this.vertices[2]);
        this.normal = VectorLibrary.crossProduct(ab, ac);
        this.normal.normalize();
        //May want to scale it to correct proportions here
    }
    setNormalLines(normalSize){
        this.normalLines = [];
        let normalVector = VectorLibrary.scaleVector(normalSize, this.normal);
        //let normalVectors = [];
        for(let i = 0; i < this.vertices.length; i++){
            let startPointVector = this.vertices[i];
            let startPoint = startPointVector.elements;
            let endPoint = VectorLibrary.translatePoint(startPointVector, normalVector).elements;
            this.normalLines.push(startPoint[0]);this.normalLines.push(startPoint[1]);this.normalLines.push(startPoint[2]);
            this.normalLines.push(endPoint[0]);this.normalLines.push(endPoint[1]);this.normalLines.push(endPoint[2]); 
        }
        
    }

    getNormalLines(normalSize = 0.01){
        this.setNormalLines(normalSize);
        return this.normalLines;
    }

}