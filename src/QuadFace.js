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
        for(let i = 0; i < this.vertices.lenght; i++){
            let startPoint = this.vertices[i].elements;
            let endPoint = VectorLibrary.translatePoint(startPoint, normalVector).elements;
            this.normalLines.push(startPoint.x);this.normalLines.push(startPoint.y);this.normalLines.push(startPoint.z);
            this.normalLines.push(endPoint.x);this.normalLines.push(endPoint.y);this.normalLines.push(endPoint.z); 
        }
        
    }

}