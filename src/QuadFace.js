class QuadFace {
    //Starting top left counter clock wise:
    //a--d
    //|  |
    //|  |
    //b--c
    constructor(a, b, c, d){
        this.vertices = [];
        this.vertices.push(a);
        this.vertices.push(b);
        this.vertices.push(c);
        this.vertices.push(d);
        this.setIndices();
    }

    getIndices(){
        return Uint16Array(this.indices);
    }

    getVertices(){
        return this.vertices;
    }

    setIndices(){
        this.indices = [0, 1, 2, 0, 3, 2];
    }

}