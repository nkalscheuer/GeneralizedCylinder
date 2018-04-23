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

        console.log("Start: ");
        console.log(start);
        console.log("End: ");
        console.log(end);
        this.axialVector = VectorLibrary.getVector(start, end);
        this.radialVector = VectorLibrary.scaleVector(radius, VectorLibrary.crossProduct(this.axialVector, planeNormal).normalize());
        console.log("Radial Vector:");
        console.log(this.radialVector);
        console.log("Axial Vector:");
        console.log(this.axialVector);
        this.endCenter = VectorLibrary.translatePoint(end, this.radialVector);
        this.poly = new RegularPolygon(end, this.endCenter, this.axialVector, numOfSides);
        

        //Initializing end caps:
        this.startVerts = VectorLibrary.translatePointArr(this.poly.vertices, VectorLibrary.scaleVector(-1, this.axialVector));
        console.log("Start Verts:");
        VectorLibrary.printVectorArr(this.startVerts);
        this.endVerts = VectorLibrary.copyVectorArr(this.poly.vertices);
        console.log("End cap:");
        VectorLibrary.printVectorArr(this.endVerts);
        this.setFaces();
    }


    setPolygon(){

    }

    //Set faces

    setFaces(){
        this.faces = [];
        for(var i = 0; i < this.numOfSides; i++){
            var nextIndex = (i+1) % this.numOfSides;
            console.log("Next Index: " + nextIndex);
            this.faces.push(new QuadFace(this.endVerts[i], this.startVerts[i], this.startVerts[nextIndex], this.endVerts[nextIndex]));
            console.log("Face " + i);
            console.log(this.faces[i]);
        }
    }

    getFaces(){
        return this.faces;
    }
    //Draw faces




    
}