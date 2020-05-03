class GhostCylinder {
    constructor(start, end, radius, numOfSides, normal, planeNormal = new Vector3([0, 0, 1])) {
        //
        this.axialVector = VectorLibrary.getVector(start, end);
        this.radialVector = VectorLibrary.getVector(radius, planeNormal);
        let firstVertex = VectorLibrary.translatePoint(start, this.radialVector);
        this.cap = new RegularPolygon(this.firstVertex, start, this.axialVector, numOfSides);
    }
    
    getAxialVector() {
        return this.axialVector;
    }

    getCap() {
        return this.cap;
    }
    getNormals() {
        return this.cap.getNormals();
    }

}