class OrthoCylindersModel{
    constructor(cylinders){
       this.vertices = [];
       this.indices = [];
       this.normals = [];
       
       for(var i = 0; i < cylinders.length; i++){
        //    console.log("Cylinder : " + i);
           var cylinderOffset = i * (cylinders[0].numOfSides * 4);
        //    console.log("Num of Sides: " + cylinders[0].numOfSides);
        //    console.log("Cylinder Offset: " + cylinderOffset);
           for(var j = 0; j < cylinders[i].faces.length; j++){
               var faceOffset = j * cylinders[i].faces[j].vertices.length;
               //console.log("Face Offset: " + faceOffset);
               var vertexOffset = faceOffset + cylinderOffset;
               //console.log("Vertex Offset: " + vertexOffset);
               for(var k = 0; k < cylinders[i].faces[j].indices.length; k++){
                 this.indices.push(cylinders[i].faces[j].indices[k] + vertexOffset);
               }
               for(var l = 0; l < cylinders[i].faces[j].vertices.length; l++){
                   for(var m = 0; m < cylinders[i].faces[j].vertices[l].elements.length; m++){
                    this.vertices.push(cylinders[i].faces[j].vertices[l].elements[m]);
                    this.normals.push(cylinders[i].faces[j].normalVectors[l].elements[m]);
                   }
               }
           }
       }
    }

    addCylinder(cylinder){
        var cylinderOffset = this.vertices.length;
        for(var j = 0; j < cylinder.faces.length; j++){
            var faceOffset = j * cylinders.faces[j].vertices.length;
            var vertexOffset = faceOffset + cylinderOffset;
            for(var k = 0; k < cylinder.faces[j].indices.length; k++){
              this.indices.push(cylinder.faces[j].indices[k] + vertexOffset);
            }
            for(var l = 0; l < cylinder.faces[j].vertices.length; l++){
                for(var m = 0; m < cylinder.faces[j].vertices[l].elements.length; m++){
                 this.vertices.push(cylinder.faces[j].vertices[l].elements[m]);
                 this.normals.push(cylinders[i].faces[j].normalVectors[l].elements[m]);
                }
            }
        }
    }
}