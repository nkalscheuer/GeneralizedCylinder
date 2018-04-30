//Need RegularPolygon.js, VectorLibrary.js

class OrthoCylinder {
    //Start: position in 3d space
    //End: position in 3d space
    //Radius: Magnitude of Radius
    //Plane normal: 3d vector normal to drawing plane ** defaults to be normal of xy plane
    constructor(start, end, radius, numOfSides, planeNormal = new Vector3([0, 0, 1])){
        this.start = start;
        this.end = end;
        this.radius = radius;
        this.numOfSides = numOfSides;
        this.axialVector = VectorLibrary.getVector(start, end);
        this.radialVector = VectorLibrary.scaleVector(radius, planeNormal);
        this.firstVertex = VectorLibrary.translatePoint(end, this.radialVector);
        this.poly = new RegularPolygon(this.firstVertex, end, this.axialVector, numOfSides);
        

        //Initializing end caps:
        this.startVerts = VectorLibrary.translatePointArr(this.poly.vertices, VectorLibrary.scaleVector(-1, this.axialVector));
   
        VectorLibrary.printVectorArr(this.startVerts);
        this.endVerts = VectorLibrary.copyVectorArr(this.poly.vertices);
        VectorLibrary.printVectorArr(this.endVerts);
        this.setFaces();
        this.vertices = [];
        this.indices = [];
        this.normalLines = [];
        this.normalSize = 0;
    }

    //For connections
    setEndPolygon(){

    }
    setStartPolygon(){

    }
    setFaces(){
        this.faces = [];
        for(var i = 0; i < this.numOfSides; i++){
            var nextIndex = (i+1) % this.numOfSides;
            this.faces.push(new QuadFace(this.endVerts[i], this.startVerts[i], this.startVerts[nextIndex], this.endVerts[nextIndex]));
        }
    }

    concatVertices(){
        console.log("Concatentating vertices");
        this.vertices = [];
        this.indices = [];
        for(var j = 0; j < this.faces.length; j++){
            var faceOffset = j * this.faces[j].vertices.length;
            var vertexOffset = faceOffset;
            for(var k = 0; k < this.faces[j].indices.length; k++){
              this.indices.push(this.faces[j].indices[k] + vertexOffset);
            }
            for(var l = 0; l < this.faces[j].vertices.length; l++){
                for(var m = 0; m < this.faces[j].vertices[l].elements.length; m++){
                 this.vertices.push(this.faces[j].vertices[l].elements[m]);
                }
            }
        }
    }
    getFaces(){
        return this.faces;
    }

    getVertBuffer(){
        if(this.vertices.length == 0){
            this.concatVertices();
        }
        return this.vertices;
    }
    getIndexBuffer(){
        if(this.indices == 0){
            this.concatVertices();
        }
        return this.indices;
    }
    getNormalLines(length = 0.1){
        if(this.normalSize != length || this.normalLines.length == 0){
            this.normalSize = length;
            this.normalLines = [];
            for(let i = 0; i < this.faces.length; i++){
                this.normalLines = this.normalLines.concat(this.faces[i].getNormalLines(length));
            }
        }
        return this.normalLines;
    }
}
