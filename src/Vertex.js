class Vertex {
    constructor(x, y, z = 0.0){
        this.x = x;
        this.y = y;
        this.z = z;
    }
    setIndex(index){
        this.index = index;
    }
    setPointSize(pointSize){
        this.pointSize = pointSize;
    }
    copy(){
        return new Vertex(this.x, this.y, this.z);
    }
    print(){
        return "(" + this.x + ", " + this.y + ", " + this.z + ")";
    }
}