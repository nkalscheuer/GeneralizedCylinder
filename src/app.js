var VSHADER_SOURCE =
  'attribute float a_PointSize;\n' +
  'attribute vec4 a_Position;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  gl_PointSize = a_PointSize;\n' +
  '}\n';
  


var FSHADER_SOURCE =
   'precision mediump float;\n' +
   'uniform vec4 u_FragColor;\n' + 
   'void main() {\n' +
   '  gl_FragColor = u_FragColor;\n' +
   '}\n';

var FSIZE = (new Float32Array()).BYTES_PER_ELEMENT;
var pauseState = false;
var polyLineArr = [];
var polyLineIndex;
var g_points = []; // The array for the position of a mouse press
var colorArr = [];
var scoreBoard = [];
var u_FragColor;
var MAXPOINTS = 4;
var NUMOFSIDES = 12;
var RADIUS = 0.1;
var cylindersModels = [];
var cylindersModelIndex;
//var gl;
function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');
  console.log(hexToRgb("#ff0000"));

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }


  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');

 
  // // Get the storage location of a_Position
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }
  
  // Register event handlers
  //Click and mouse move
  canvas.onmousedown = function(ev){ click(ev, gl, canvas, a_Position); };
  canvas.onmousemove = function(ev){ mouseChange(ev, gl, canvas, a_Position); };
 
  //Disabling right click menu
  canvas.oncontextmenu = function(ev){ ev.preventDefault(); };

  //Point size slider
  var pointSizeChanger = document.getElementById("pointSizeChanger");
  pointSizeChanger.onchange = function(ev){ pointSizeSliderChange(ev, gl); };
  //Initializing point size
  changePointSize(pointSizeChanger.value, gl);

  
  var radiusChanger = document.getElementById("radius");
  radius.onchange = function(ev){ radiusSlideChanger(ev, gl); };

  //Change number of sides

  var sidesNumberChanger = document.getElementById("sidesNumberChanger");
  sidesNumberChanger.onchange = function (ev) { changePolygonSides(ev, gl) };

  document.getElementById('save_canvas').onclick = function(){ saveCanvas(); };
  document.getElementById('update_screen').onclick = function(){ updateScreen(canvas, gl); };

  setupIOSOR("fileinput");

  //Delete functions
  var deleteButton = document.getElementById("deleteLine");
  console.log(deleteButton);
  deleteButton.onmousedown = function(ev){ onDelete(ev, gl); };
 
  //Color changer
  var colorChanger = document.getElementById("colorChanger");
  colorChanger.onchange = function(ev){ changeColor(ev, gl); };
  var rgb = hexToRgb(colorChanger.value);
  
  //Initializing color value
  gl.uniform4f(u_FragColor, rgb[0], rgb[1], rgb[2], 1.0);
 
  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);


  var startPoint = new Vector3([-0.5, 0, 0]);
  var endPoint = new Vector3([0.5, 0, 0]);
  renderPolyLine(gl, [0.5, 0, -0.5, 0]);

}

//Event handler for a click, also handles right click actions
function click(ev, gl, canvas, a_Position) {
    //Get click coordinates
    var canvasCoordinates = getCanvasCoordinates(ev, canvas);
    var x = canvasCoordinates[0];
    var y = canvasCoordinates[1];
    var message = "x:" + x + " y:" + y;
    if(ev.button == 0){
      message += " left click";
    }else if(ev.button == 2){
      message += " right click";
    }
    console.log(message);

    //Right click called, go into pause state, and remove rubber band
    if(ev.button == 2){
    //console.log("Right click event");
        if (typeof(polyLineIndex) != "undefined"){
            renderClickScene(gl, polyLineArr[polyLineIndex]);
            console.log("You have finished drawing");
            printVertexArray(polyLineArr[polyLineIndex]);
        }; 
        //printVertexArray
        pauseState = true;
    }
    //Left click during pause state, makes a new polyline
    if(ev.button == 0 && pauseState == true){
        pauseState = false;
        newPolyLine();
    }
  
    //End input if in pause state
    if(pauseState){
        return false;
    }
    //If there is no polylines make a new one
    if(polyLineArr.length == 0){
        newPolyLine();
    }

  // Store the coordinates to polyline array
  polyLineArr[polyLineIndex].push(x); polyLineArr[polyLineIndex].push(y);
  if(polyLineArr[polyLineIndex] > 2){
    addCylinder(polyLineArr[polyLineIndex]); 
   
  }

  

  //console.log("Clicked at: (" + x + ", " + y + ")");
  //console.log("A_position: " + a_Position);
  //console.log("Polyline length = " + getPolylineLength(polyLineArr[polyLineIndex]));
  renderClickScene(gl);
}

//Event handler for a mouse move
function mouseChange(ev, gl, canvas, a_Position){
    //Dont draw rubber band if there are no polylines or if it's in a pause state
    if(pauseState || polyLineArr.length == 0){
        return;
    }
    
    //Get cursor coordinates
    var canvasCoordinates = getCanvasCoordinates(ev, canvas);
    var x = canvasCoordinates[0];
    var y = canvasCoordinates[1];

    //console.log("Moved to: (" + x + ", " + y + ")");
    
    //Make a copy of the current polyLine and add at the current point to it
    var rubberBandVertexArr = polyLineArr[polyLineIndex].slice();
    rubberBandVertexArr.push(x); rubberBandVertexArr.push(y);
    
    //Render polyline with rubber band
    renderMouseMoveScene(gl, rubberBandVertexArr);
}

//Event handler for a change in the color picker
function changeColor(ev, gl){
  console.log(ev.target.value);
  var rgb = hexToRgb(ev.target.value);
  changeFragColor(rgb[0], rgb[1], rgb[2], 1.0, gl);
  renderClickScene(gl);
}

//Adding a new polyline
function newPolyLine(){
  console.log("")
  var polyLine = [];
  polyLineArr.push(polyLine);
  //console.log("PolylineArr length: " + polyLineArr.length);
  if(polyLineArr.length == 1){
    polyLineIndex = 0;
  }else{
    polyLineIndex++;
  }
  generateDropDown(polyLineArr.length);
}

//Deletes poly line at any index, changes index to the last made and available polyline
function deletePolyLine(index){
  if(index >= polyLineArr.length || index < 0){
    return;
  }
  newPolyLineArr = [];
  for(i = 0; i < polyLineArr.length; i++){
    if(i != index){
      newPolyLineArr.push(polyLineArr[i]);
    }
  }
  polyLineIndex = newPolyLineArr.length - 1;
  polyLineArr = newPolyLineArr;
  generateDropDown(polyLineArr.length);
}

//Gets cursor coordinates on canvas
function getCanvasCoordinates(ev, canvas){
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect() ;

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
  return [x, y];
}

//Renders scene one a click action, also used for other actions
function renderClickScene(gl){
    gl.clear(gl.COLOR_BUFFER_BIT);
    for(i = 0; i < polyLineArr.length; i++){
        renderPolyLine(gl, polyLineArr[i]);
    }
}

//Renders a specific polyline
function renderPolyLine(gl, vertices){
  for(var i = 0; i < vertices.length - 3; i += 2){
    var start = new Vector3([vertices[i], vertices[i + 1], 0]);
    var end = new Vector3([vertices[i + 2], vertices[i + 3], 0]);
    //console.log("Cylinders Model: ");
    //console.log(cylindersModel);
    // renderCylinder(gl, start, end, NUMOFSIDES, RADIUS);
  }
  var model = polyLineToOrthoCylindersModel(vertices);
  renderCylinders(gl, model);

  var n = initVertexBuffers(gl, vertices);
  gl.drawArrays(gl.LINE_STRIP, 0, n);
  //gl.drawArrays(gl.POINTS, 0, n);
}

//Renders a scene where the cursor moves (Makes rubber band line)
function renderMouseMoveScene(gl, vertices){
    gl.clear(gl.COLOR_BUFFER_BIT);
    for(i = 0; i < polyLineArr.length; i++){
        if(i != polyLineIndex){
          renderPolyLine(gl, polyLineArr[i]);
        }
        //
    }
    // var n = initVertexBuffers(gl, vertices);
    // gl.drawArrays(gl.LINE_STRIP, 0, n);
    renderPolyLine(gl, vertices);
    //gl.drawArrays(gl.POINTS, 0, n - 1);
}

//Initialize vertex buffers with a specific vertex array
function initVertexBuffers(gl, vertexArray) {
    //console.log(vertexArray);
    var vertices = new Float32Array(vertexArray);
    var n = vertexArray.length/2; // The number of vertices
  
    // Create a buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
      console.log('Failed to create the buffer object');
      return -1;
    }
  
    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
      console.log('Failed to get the storage location of a_Position');
      return -1;
    }
    // Assign the buffer object to a_Position variable
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  
    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);
  
    return n;
  }

  //Changes the frag shader color
  function changeFragColor(r, g, b, a, gl){
    gl.uniform4f(u_FragColor, r, g, b, a);
  }

  //Converts color picker hex to rgb array
  function hexToRgb(hex){
    var bigint = parseInt(hex.replace(/^#/, ''), 16);
    console.log("Color Integer: " + bigint);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;
    rgb = new Float32Array([(r/255), (g/255), (b/255)]);
    return rgb;

  }

  //Event handler for a change in the point size slider
  function pointSizeSliderChange(ev, gl){
    var size = ev.target.value;
    changePointSize(size, gl);
    renderClickScene(gl);
  }

  function radiusSlideChanger(ev, gl){
    var size = ev.target.value;
    RADIUS = size/40;
    renderClickScene(gl);
  }

  //Changes the gl point size to a specific size and renders the click scene
  function changePointSize(size, gl){
    var a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
    gl.vertexAttrib1f(a_PointSize, size);
  }
 
  //Creates an option for the delete dropdown
  function createOption(number){
    return '<option value="' + number + '">' + number + '</option>'
  }

  //Generates the list of polylines, by their order created in a select dropdown for deletion
  function generateDropDown(length){
    console.log("Generating Drop down of length: " + length);
    var dropDown = document.getElementById("polyLines");
    if(length == 0 || !dropDown){
      return;
    }
    var innerHtml = '';
    for(i = 0; i < length; i++){
      innerHtml += createOption(i);
    }
    dropDown.innerHTML = innerHtml;
  }

  //Event handler for the delete button
  //Deletes a polyline at a specific index and renders click scene
  function onDelete(ev, gl){
    console.log("Delete button called!");
    var dropDown = document.getElementById("polyLines");
    if(!dropDown){
      return;
    }
    var index = dropDown.value;
    deletePolyLine(index);
    renderClickScene(gl);
  }

  function printVertexArray(vertices){
      var outputString = "Your Polyline: ";
      for(i = 0; i < vertices.length; i += 2){
        outputString += coordinateToString(vertices[i], vertices[i+1]) + " ";
      }
      console.log(outputString);
  }
  function coordinateToString(x, y){
      return "(" + x + "," + y + ")";
  }

  //Getting length of polylines
  function getPolylineLength(vertices){
    var distance = 0.0;  
    for(i = 0; i < vertices.length - 2; i += 2){
        distance += getDistance(vertices[i], vertices[i + 1], vertices[i + 2], vertices[i + 3]);
    }
    return distance;
  }

  //Get distance between two points
  function getDistance(x1, y1, x2, y2){
      return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
  }

  function sortNumber(a, b){
      return b - a;
  }
  function makeScoreBoard(){
      var board = document.getElementById("scoreBoard");
      var innerHtml = "";
      for(i = 0; i < scoreBoard.length; i++){
          innerHtml += scoreEntry(i, scoreBoard[i]);
      }
      board.innerHTML = innerHtml;
  }
  function scoreEntry(rank, score){
      return "<li>" + (rank + 1) + ": " + score + "</li>";
  }

  function changePolygonSides(ev, gl){

    //renderPolygon(gl, Math.floor(ev.target.value));
    NUMOFSIDES = Math.floor(ev.target.value);
    renderClickScene(gl);
  }
  function renderPolygon(gl, sides){
    gl.clear(gl.COLOR_BUFFER_BIT);
    var firstVertex = new Vector3([0.5, 0.5, 0]);
    var center = new Vector3([0.0, 0.0, 0.0]);

    var axialVector = new Vector3([0, 0, 1]);

    var poly = new RegularPolygon(firstVertex, center, axialVector, sides);
    console.log(poly.firstVertex);
    var vertices = convertVectorArr(poly.vertices);
    var n = init3dVertexBuffers(gl, vertices);
    gl.drawArrays(gl.LINE_LOOP, 0, n);
    //gl.drawArrays(gl.POINTS, 0, n);
  }
  function init3dVertexBuffers(gl, vertexArray) {
    //console.log(vertexArray);
    var vertices = new Float32Array(vertexArray);
    var n = vertexArray.length/3; // The number of vertices
  
    // Create a buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
      console.log('Failed to create the buffer object');
      return -1;
    }
  
    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
      console.log('Failed to get the storage location of a_Position');
      return -1;
    }
    // Assign the buffer object to a_Position variable
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  
    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);
  
    return n;
  }

  function convertVectorArr(vectorArr){
    var verts = [];
      for(var i = 0; i < vectorArr.length; i++){
        for(var j = 0; j < vectorArr[i].elements.length; j++){
          verts.push(vectorArr[i].elements[j]);
        }
      }
      return verts;
  }
  // initialize vertex buffer
  function initVertexBuffer(gl) {
    // create buffer object
    var vertex_buffer = gl.createBuffer();
    if (!vertex_buffer) {
      console.log("failed to create vertex buffer");
      return false;
    }
    // bind buffer objects to targets
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    return true;
  }
  function initIndexBuffer(gl) {
    // create buffer object
    var index_buffer = gl.createBuffer();
    if (!index_buffer) {
	console.log("failed to create index buffer");
	return false;
    }
    // bind buffer objects to targets
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    return true;
}

function setVertexBuffer(gl, vertices) {
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
}

// set data in index buffer (given typed uint16 array)
function setIndexBuffer(gl, indices) {
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
}

function initAttributes(gl) {
  // assign buffer to a_Position and enable assignment
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log("failed to get storage location of attribute");
    return false;
  }
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 3, 0);
  gl.enableVertexAttribArray(a_Position);
  return true;
}
// function drawFace(gl, face){
//   var vertices = [];
//   for(var i = 0; i < face.vertices.length; i++){
//     //console.log(face.vertices);
//     var vertex = face.vertices[i].elements;
//     //vertices = vertices.concat(vertex);
//     //Push 3d vector on array
//     for(var j = 0; j < vertex.length; j++){
//       vertices.push(vertex[j]);
//     }
//   }
//   // console.log("face vertices for drawing:");
//   // console.log(vertices);
//   // console.log("face indices for drawing:");
//   // console.log(face.indices);
//   setVertexBuffer(gl, new Float32Array(vertices));
//   setIndexBuffer(gl, new Uint16Array(face.indices));
//   //setIndexBuffer(gl, new Uint16Array([0, 1, 2]));
//   gl.drawElements(gl.LINE_STRIP, face.indices.length, gl.UNSIGNED_SHORT, 0);
// }

function renderCylinder(gl, start, end, numberOfSides, radius){
  var cylinder = new OrthoCylinder(start, end, radius, numberOfSides);
  var cylinders = [];
  cylinders.push(cylinder);
  initVertexBuffer(gl);
  initIndexBuffer(gl);
  initAttributes(gl);
  initIndexBuffer(gl);
  //For loop of faces
  
  console.log("First face: ");
  // console.log(cylinder.faces[0]);
  // for(var i = 0; i < cylinder.faces.length; i++){
  //   drawFace(gl, cylinder.faces[i]);
  // }
  var cylinderModel = new OrthoCylindersModel(cylinders);
  setVertexBuffer(gl, new Float32Array(cylinderModel.vertices));
  console.log(cylinderModel);
  setIndexBuffer(gl, new Uint16Array(cylinderModel.indices));
  //setIndexBuffer(gl, new Uint16Array([0, 1, 2]));
  gl.drawElements(gl.LINE_STRIP, cylinderModel.indices.length, gl.UNSIGNED_SHORT, 0);
  console.log("CYLINDER !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  console.log(cylinder);
}

function renderCylinders(gl, model){
  initVertexBuffer(gl);
  initIndexBuffer(gl);
  initAttributes(gl);
  setVertexBuffer(gl, new Float32Array(model.vertices));
  //console.log(cylinderModel);
  setIndexBuffer(gl, new Uint16Array(model.indices));
  gl.drawElements(gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);
}

function saveModel(){

}

function polyLineToOrthoCylindersModel(vertices){
  //console.log(vertices);
  var cylinders = [];
  for(var i = 0; i < vertices.length - 3; i += 2){
    var start = new Vector3([vertices[i], vertices[i + 1], 0]);
    var end = new Vector3([vertices[i + 2], vertices[i + 3], 0]);
    // console.log("Start: ");
    // console.log(start);
    // console.log("End: ");
    // console.log(end);
    var cylinder = new OrthoCylinder(start, end, RADIUS, NUMOFSIDES);
    cylinders.push(cylinder);
  }
  //Have the array of cylinders
  var model = new OrthoCylindersModel(cylinders);
  //console.log(model);
  return model;
}

function saveCanvas(){
  var model = polyLineToOrthoCylindersModel(polyLineArr[polyLineIndex]);
  var sor = new SOR();
  sor.objName = "model";
  sor.vertices = model.vertices;
  sor.indexes = model.indices;
  saveFile(sor);
}

function updateScreen(canvas, gl) {
  canvas.onmousedown = null; // disable mouse
  var sor = readFile();      // get SOR from file

  // clear canvas    
  gl.clear(gl.COLOR_BUFFER_BIT);
  renderClickScene(gl); 
  initVertexBuffer(gl);
  initIndexBuffer(gl);
  initAttributes(gl);
  setVertexBuffer(gl, new Float32Array(sor.vertices));
  setIndexBuffer(gl, new Uint16Array(sor.indexes));
  // draw model
  //gl.drawElements(gl.POINTS, sor.indexes.length, gl.UNSIGNED_SHORT, 0);
  gl.drawElements(gl.LINE_STRIP, sor.indexes.length, gl.UNSIGNED_SHORT, 0);
}

// function addCylinder(vertices){
//   var i = vertices.length - 3;
//   var start = new Vector3([vertices[i], vertices[i + 1], 0]);
//   var end = new Vector3([vertices[i + 2], vertices[i + 3], 0]);
//   var cylinder = new OrthoCylinder(start, end, RADIUS, NUMOFSIDES);
//   if(cylindersModels.length == 0){
//     var cylinderModel = new OrthoCylindersModel(cylinder);
//     cylindersModelIndex = 0;
//   }else{
//     cylinderModel.addCylinder(cylinder);
//     cylindersModelIndex++;
//   }

// }
// var firstVertex = new Vector3([1.0, 1.0, 0]);
// var center = new Vector3([0.0, 0.0, 0.0]);

// var axialVector = new Vector3([0, 0, 1]);

// var poly = new RegularPolygon(firstVertex, center, axialVector, 4);
// console.log(poly.firstVertex);

// console.log(poly.vertices);