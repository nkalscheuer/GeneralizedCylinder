// var VSHADER_SOURCE =
//   'attribute float a_PointSize;\n' +
//   'attribute vec4 a_Color;\n' +
//   'attribute vec4 a_Position;\n' +
//   'varying vec4 v_Color;\n' +
//   'uniform mat4 u_MvpMatrix;\n' +
//   'void main() {\n' +
//   '  gl_Position = a_Position;\n' +
//   '  gl_Position = a_Position;\n' +
//   '  gl_PointSize = a_PointSize;\n' +
//   '  v_Color = a_Color;\n' +
//   '}\n';

  var VSHADER_SOURCE = `
  #ifdef GL_ES
    precision mediump float;
    #endif
  attribute float a_PointSize;
  attribute vec4 a_Color;
  varying vec4 v_Color;
  attribute vec4 a_Normal;
  varying vec3 v_Normal;
  attribute vec4 a_Position;
  varying vec4 v_Position;
  uniform mat4 u_MvpMatrix;
  uniform mat4 u_NormalMatrix;
  uniform vec3 u_DiffuseColor;
  uniform vec3 u_LightPosition;
  uniform vec3 u_AmbientLight;
  uniform vec3 u_SpecularColor;
  uniform float u_Shader;
  void main() {
    //Shared changes
    gl_Position = u_MvpMatrix * a_Position;
    gl_PointSize = a_PointSize;
    v_Normal = vec3(a_Normal);
    v_Position = u_MvpMatrix * a_Position;
    
    //Goraud shading
    if(u_Shader == 0.0){
      vec3 lightPosition = vec3(u_MvpMatrix * vec4(u_LightPosition, 1));  
      vec3 lightDirection = normalize((lightPosition) - vec3(v_Position));
      float nDotL = max(dot(lightDirection, v_Normal), 0.0);
      vec3 diffuse = u_DiffuseColor * a_Color.rgb * nDotL;
      vec3 ambient = u_AmbientLight;
      v_Color = vec4(diffuse + ambient, a_Color.a);
    }else if(u_Shader == 1.0 || u_Shader == 2.0){
      v_Color = a_Color;
    }
    
  }
  `;
 
  


// var FSHADER_SOURCE =
//     '#ifdef GL_ES\n' +
//     'precision mediump float;\n' +
//     '#endif\n' +
//     'varying vec4 v_Color;\n' + 
//     'void main() {\n' +
//     '  gl_FragColor = v_Color;\n' +
//     '}\n';

var FSHADER_SOURCE = `
    #ifdef GL_ES
    precision mediump float;
    #endif
    uniform float u_Shader;
    varying vec4 v_Color; 
    varying vec3 v_Normal;
    varying vec4 v_Position;
    uniform vec3 u_DiffuseColor;
    uniform vec3 u_LightPosition;
    uniform vec3 u_AmbientLight;
    uniform vec3 u_SpecularColor;
    uniform float u_SpecularExponent;
    uniform mat4 u_MvpMatrix;
    uniform float u_ObjectIndex;
    uniform float u_AlphaMode;
    uniform float u_ClickedIndex;
    float celColor(in float colorVal){
      if(colorVal >= 1.0 ){
        return 1.0;
      }else if (colorVal >= 0.8){
        return 0.8;
      }else if (colorVal >= 0.6){
        return 0.6;
      }else if (colorVal >= 0.4){
        return 0.4;
      }else if(colorVal >= 0.1){
        return 0.1;
      }else if(colorVal >= 0.0 || colorVal < 0.0){
        return 0.0;
      }
      return 0.0;
    }
    void main() {
      if(u_Shader == 0.0){
        //Goraud Shading
        gl_FragColor = v_Color;
      }else if(u_Shader == 1.0){
        //Phong Shading
        vec3 lightPosition = vec3(u_MvpMatrix * vec4(u_LightPosition, 1));
        vec3 lightDirection = normalize(lightPosition - vec3(v_Position));
        float nDotL = max(dot(lightDirection, v_Normal), 0.0);
        vec3 diffuse = u_DiffuseColor * v_Color.rgb * nDotL;
        vec3 ambient = u_AmbientLight;
        vec3 reflectionVector = normalize(2.0 * nDotL * v_Normal - lightDirection);
        vec3 orthoEyeVector = vec3(0.0, 0.0, -1.0);
        //vec3 specular = vec3(v_Color) * u_SpecularColor * pow(max(dot(reflectionVector, orthoEyeVector), 0.0), u_SpecularExponent);
        vec3 specular = u_SpecularColor * pow(max(dot(reflectionVector, orthoEyeVector), 0.0), u_SpecularExponent);
        gl_FragColor = vec4(diffuse + ambient + specular, v_Color.a);
      } else if (u_Shader == 2.0){
        //Cel Shading
        vec3 lightPosition = vec3(u_MvpMatrix * vec4(u_LightPosition, 1));
        vec3 lightDirection = normalize(lightPosition - vec3(v_Position));
        float nDotL = max(dot(lightDirection, v_Normal), 0.0);
        vec3 diffuse = u_DiffuseColor * v_Color.rgb * nDotL;
        vec3 ambient = u_AmbientLight;
        vec3 reflectionVector = normalize(2.0 * nDotL * v_Normal - lightDirection);
        vec3 orthoEyeVector = vec3(0.0, 0.0, -1.0);
        //vec3 specular = vec3(v_Color) * u_SpecularColor * pow(max(dot(reflectionVector, orthoEyeVector), 0.0), u_SpecularExponent);
        vec3 specular = u_SpecularColor * pow(max(dot(reflectionVector, orthoEyeVector), 0.0), u_SpecularExponent);
        vec4 resultColor = vec4(diffuse + ambient + specular, 1.0);
        resultColor.r = celColor(resultColor.r);
        resultColor.g = celColor(resultColor.g);
        resultColor.b = celColor(resultColor.b);
        gl_FragColor = resultColor;
      }
      if(u_ClickedIndex == u_ObjectIndex){
        vec3 highlight = vec3(0.15, 0.15, 0.15);
        gl_FragColor = vec4(vec3(gl_FragColor) + highlight, 1.0); 
      }
      if(u_AlphaMode == 1.0){
        gl_FragColor = vec4(vec3(gl_FragColor), u_ObjectIndex/255.0);
      }
    }
    
`;

var DRAWMODE = 0;
var SELECTMODE = 1;

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
var normalLineFlag = false;
var translateX = 0;
var translateY = 0;
var translateZ = 0;
var eyePosition = new Vector3();
var lookAtCenter = new Vector3();
var upVector = new Vector3([0, 1, 0]); //Up in the y direction

var clickMode = DRAWMODE;
var mainLightSource = new LightSource(new Vector3([1, 1, 1]), new Vector3([1, 1, 1]), 1);
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

  //Get the storage location of u_MvpMatrix
  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  if (!u_MvpMatrix) {
    console.log('Failed to get the storage location of u_MvpMatrix');
    return;
  }
//   // Set the eye point and the viewing volume
  var mvpMatrix = new Matrix4();
//   mvpMatrix.setTranslate(0.5, 0, 0);
//   var orthoMatrix = new Matrix4();
//   orthoMatrix.setOrtho(-1, 1, -1, 1, 1, -1);
//   mvpMatrix.multiply(orthoMatrix);
  mvpMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
  mvpMatrix.lookAt(0, 0, 5, 0, 0, -10, 0, 1, 0);

  // Pass the model view projection matrix to u_MvpMatrix
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

  setLights(gl);
  
  // Register event handlers
  //Click and mouse move
  canvas.onmousedown = function(ev){ click(ev, gl, canvas, a_Position); };
  canvas.onmousemove = function(ev){ mouseChange(ev, gl, canvas, a_Position); };
 
  //Disabling right click menu
  canvas.oncontextmenu = function(ev){ ev.preventDefault(); };

  // //Point size slider
  // var pointSizeChanger = document.getElementById("pointSizeChanger");
  // pointSizeChanger.onchange = function(ev){ pointSizeSliderChange(ev, gl); };
  // //Initializing point size
  // changePointSize(pointSizeChanger.value, gl);

  
  var radiusChanger = document.getElementById("radius");
  radius.onchange = function(ev){ radiusSlideChanger(ev, gl); };

  //Change number of sides

  var sidesNumberChanger = document.getElementById("sidesNumberChanger");
  sidesNumberChanger.onchange = function (ev) { changePolygonSides(ev, gl) };

  document.getElementById('save_canvas').onclick = function(){ saveCanvas(); };
  document.getElementById('update_screen').onclick = function(){ updateScreen(canvas, gl); };

  document.getElementById('normalLines').onclick = function(ev){normalLinesToggle(ev, gl)};

  document.getElementById('translateX').onchange = function(ev){translateXSlider(ev, gl)};

  document.getElementById('lightX').onchange = function(ev){lightXSlider(ev, gl)};
  document.getElementById('lightRotate').onchange = function(ev){rotateLightSlider(ev, gl)};
  setupIOSOR("fileinput");

  document.getElementById('clickMode').onchange = function(ev){clickModeChange(ev, gl)};
  //Delete functions
  var deleteButton = document.getElementById("deleteLine");
  //console.log(deleteButton);
  deleteButton.onmousedown = function(ev){ onDelete(ev, gl); };
 
  //Color changer
  var colorChanger = document.getElementById("colorChanger");
  colorChanger.onchange = function(ev){ changeColor(ev, gl); };
  var rgb = hexToRgb(colorChanger.value);

  //Ambient
  document.getElementById('ambientChanger').onchange = function(ev){ changAmbientColor(gl, hexToRgb(ev.target.value)) };

  //Specular Color
  document.getElementById('specularColorChanger').onchange = function(ev){ changeSpecularColor(gl, hexToRgb(ev.target.value)) };
  
  //Specular Exponent
  document.getElementById('specularExponentChanger').onchange = function(ev){changeSpecularExponent(gl, ev.target.value)};
  
  document.onkeydown = function(ev){
    if(ev.key == '0'){
      changeShader(gl, 0);
    }else if(ev.key == '1'){
      //
      changeShader(gl, 1);
    }else if(ev.key == '2'){
      //
      changeShader(gl, 2);
    }
  }
  
  //Initializing color value
  gl.uniform4f(u_FragColor, rgb[0], rgb[1], rgb[2], 1.0);
 
  setAlphaMode(gl, 0.0);
  setClickedIndex(gl, -1.0);
  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

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

    if(clickMode == 1){
      //Select mode
      if(ev.button == 0){
        let pixels = new Uint8Array(4);
        let intCoords = getCanvasCoordinatesInt(ev, canvas);
        //console.log('RGBA clicked: (' + pixels[0] + ', ' + pixels[1] + ', ' + pixels[2] + ', ' + pixels[3] + ')');
        //grab pixel
        setAlphaMode(gl, 1.0);
        renderClickScene(gl);
        gl.readPixels(intCoords[0], intCoords[1], 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        console.log('RGB clicked: (' + pixels[0] + ', ' + pixels[1] + ', ' + pixels[2] + ')');
        setAlphaMode(gl, 0.0);
        setClickedIndex(gl, pixels[3]);
        // renderClickScene(gl);
        // gl.readPixels(intCoords[0], intCoords[1], 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        // console.log('RGBA clicked: (' + pixels[0] + ', ' + pixels[1] + ', ' + pixels[2] + ', ' + pixels[3] + ')');
        setTimeout(function (){renderClickScene(gl)}, 0);
        //renderClickScene(gl);
        
        // renderClickScene(gl);
        // renderClickScene(gl);
        // renderClickScene(gl);
      }
      return;

    }

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

function getCanvasCoordinatesInt(ev, canvas){
  let x = ev.clientX;
  let y = ev.clientY;
  let rect = ev.target.getBoundingClientRect();
  x = (x - rect.left);
  y = (rect.bottom - y);
  return [x, y];
}

//Renders scene one a click action, also used for other actions
function renderClickScene(gl){
  let alphaLocation = gl.getUniformLocation(gl.program, 'u_AlphaMode');
  // console.log('Alpha:');
  // console.log(gl.getUniform(gl.program, alphaLocation));
    gl.clear(gl.COLOR_BUFFER_BIT);
    for(i = 0; i < polyLineArr.length; i++){
        setObjectIndex(gl, i);
        renderPolyLine(gl, polyLineArr[i]);
    }
}

//Renders a specific polyline
function renderPolyLine(gl, vertices){
  // for(var i = 0; i < vertices.length - 3; i += 2){
  //   var start = new Vector3([vertices[i], vertices[i + 1], 0]);
  //   var end = new Vector3([vertices[i + 2], vertices[i + 3], 0]);
  //   //console.log("Cylinders Model: ");
  //   //console.log(cylindersModel);
  //   renderCylinder(gl, start, end, NUMOFSIDES, RADIUS);
  // }
  var model = polyLineToOrthoCylindersModel(vertices);
  renderCylinders(gl, model);

  //var n = initVertexBuffers(gl, vertices);
  //gl.drawArrays(gl.LINE_STRIP, 0, n);
  //gl.drawArrays(gl.POINTS, 0, n);
}

//Renders a scene where the cursor moves (Makes rubber band line)
function renderMouseMoveScene(gl, vertices){
    gl.clear(gl.COLOR_BUFFER_BIT);
    for(i = 0; i < polyLineArr.length; i++){
        if(i != polyLineIndex){
          setObjectIndex(gl, i);
          renderPolyLine(gl, polyLineArr[i]);
        }
        //
    }
    // var n = initVertexBuffers(gl, vertices);
    // gl.drawArrays(gl.LINE_STRIP, 0, n);
    setObjectIndex(gl, polyLineIndex);
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
    //console.log("Color Integer: " + bigint);
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
  function initColorBuffer(gl) {
    // create buffer object
    var color_buffer = gl.createBuffer();
    if (!color_buffer) {
      console.log("failed to create vertex buffer");
      return false;
    }
    // bind buffer objects to targets
    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
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
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if (a_Position < 0) {
    console.log("failed to get storage location of attribute");
    return false;
  }
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 3, 0);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 3, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.enableVertexAttribArray(a_Color);
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

    let color = new Vector3([0, 1, 0]);
    let lightColor = new Vector3([1, 1, 1]);
    let lightPosition = new Vector3([1, 1, 1]);
    let upVector = new Vector3([0, 0, 1]);
    let lightSource = new LightSource(lightColor, lightPosition, 2); //intensity is 0.5
    var cylinder = new ColoredCylinder(start, end, radius, numberOfSides,upVector, color, mainLightSource);
    var cylinders = [];
    var colors = cylinder.getColoredBuffer(mainLightSource);
    var vertices = cylinder.getVertBuffer();
    translateVertexBuffer(translateX, translateY, translateZ, vertices);
    var indices = cylinder.getIndexBuffer();
    var normals = cylinder.getNormalVectors();
    // console.log("Colored Buffer");
    // console.log(colors);
    // console.log("Vertex Buffer: ");
    // console.log(vertices);
    // console.log("Indices");
    // console.log(indices);

    // initVertexBuffer(gl);
    // initIndexBuffer(gl);
    // initColorBuffer(gl);

    // initAttributes(gl);
    // initIndexBuffer(gl);
  
//     console.log("First face: ");
//   // console.log(cylinder.faces[0]);
//   // for(var i = 0; i < cylinder.faces.length; i++){
//   //   drawFace(gl, cylinder.faces[i]);
//   // }
// //   var cylinderModel = new OrthoCylindersModel(cylinders);
//     setVertexBuffer(gl, new Float32Array(cylinder.getVertBuffer()));
//     let colors = cylinder.getColoredBuffer(lightSource);
//     console.log("Color buffer");
//     console.log(colors);
// //   console.log(cylinderModel);
//     setIndexBuffer(gl, new Uint16Array(cylinder.getIndexBuffer()));
//   //setIndexBuffer(gl, new Uint16Array([0, 1, 2]));
//     gl.drawElements(gl.LINE_STRIP, cylinder.indices.length, gl.UNSIGNED_SHORT, 0);
        // Create a buffer object
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) 
        return -1;

    // Write the vertex coordinates and color to the buffer object
    if (!initArrayBuffer(gl, new Float32Array(vertices), 3, gl.FLOAT, 'a_Position'))
        return -1;

    if (!initArrayBuffer(gl, new Float32Array(colors), 3, gl.FLOAT, 'a_Color'))
        return -1;
    
    
    if (!initArrayBuffer(gl, new Float32Array(normals), 3, gl.FLOAT, 'a_Normal'))
        return -1;

    // Write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cylinder.getIndexBuffer()), gl.STATIC_DRAW);
    gl.drawElements(gl.TRIANGLES, cylinder.getIndexBuffer().length, gl.UNSIGNED_SHORT, 0);
    if(normalLineFlag){
        renderNormals(gl, cylinder.getNormalLines());
    }
    // console.log("CYLINDER !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    // console.log(cylinder);
}
function renderNormals(gl, normalLines){
    let indexBuff = [];
    for(let i = 0; i < normalLines.length/3; i++){
        indexBuff.push(i);
    }
    console.log("Normal lines:");
    console.log(normalLines);
    // setVertexBuffer(gl, new Float32Array(normalLines));

    // setIndexBuffer(gl, new Uint16Array(indexBuff));
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) 
        return -1;

    var lineColor = new Vector3([1, 0, 0]);
    var colors = makeSolidColorBuffer(lineColor, indexBuff.length);
    // Write the vertex coordinates and color to the buffer object
    if (!initArrayBuffer(gl, new Float32Array(normalLines), 3, gl.FLOAT, 'a_Position'))
        return -1;

    if (!initArrayBuffer(gl, new Float32Array(colors), 3, gl.FLOAT, 'a_Color'))
        return -1;
    
    
    // Write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexBuff), gl.STATIC_DRAW);
    
    gl.drawElements(gl.LINES, indexBuff.length, gl.UNSIGNED_SHORT, 0);
}

function renderCylinders(gl, model){
  // // initVertexBuffer(gl);
  // // initIndexBuffer(gl);
  // // initAttributes(gl);
  // // setVertexBuffer(gl, new Float32Array(model.vertices));
  // // //console.log(cylinderModel);
  // setIndexBuffer(gl, new Uint16Array(model.indices));
  // gl.drawElements(gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);
  var vertices = model.vertices;
  var indices = model.indices;
  var normals = model.normals;
  var color = new Vector3([1, 0, 0]);
  var colors = makeSolidColorBuffer(color, vertices.length);

  var indexBuffer = gl.createBuffer();
    if (!indexBuffer) 
        return -1;

    // Write the vertex coordinates and color to the buffer object
    if (!initArrayBuffer(gl, new Float32Array(vertices), 3, gl.FLOAT, 'a_Position'))
        return -1;

    if (!initArrayBuffer(gl, new Float32Array(colors), 3, gl.FLOAT, 'a_Color'))
        return -1;
    
    
    if (!initArrayBuffer(gl, new Float32Array(normals), 3, gl.FLOAT, 'a_Normal'))
        return -1;

    // Write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

}

function polyLineToOrthoCylindersModel(vertices){
  //console.log(vertices);
  var cylinders = [];
  for(var i = 0; i < vertices.length - 3; i += 2){
    var start = new Vector3([vertices[i], vertices[i + 1], 0]);
    var end = new Vector3([vertices[i + 2], vertices[i + 3], 0]);
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

function initArrayBuffer(gl, data, num, type, attribute) {
    var buffer = gl.createBuffer();   // Create a buffer object
    if (!buffer) {
      console.log('Failed to create the buffer object');
      return false;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // Assign the buffer object to the attribute variable
    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
      console.log('Failed to get the storage location of ' + attribute);
      return false;
    }
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute);
  
    return true;
  }

  function makeSolidColorBuffer(color, length){
      let colorArr = color.elements;
      var colorBuff = [];
      for(let i = 0; i < length; i++){
        colorBuff.push(colorArr[0]);colorBuff.push(colorArr[1]);colorBuff.push(colorArr[2]);
      }
      return colorBuff;
  }
  function normalLinesToggle(ev, gl){
    console.log("Toggle val: " + ev.target.checked);
    if(ev.target.checked){
        //Box is checked
        normalLineFlag = true;
        renderClickScene(gl);
    }else{
        normalLineFlag = false;
        renderClickScene(gl);
    }
    console.log(ev);
  }
  function translateXSlider(ev, gl){
      translateX = ev.target.value / 100;
      renderClickScene(gl);
  }
  function translateVertexBuffer(x, y, z, vertexBuffer){
      // console.log("Translating");
      // console.log(vertexBuffer);
      for(let i = 0; i < vertexBuffer.length - 2; i +=3){
          vertexBuffer[i] += x;
          vertexBuffer[i + 1] += y;
          vertexBuffer[i+2] += z;
      }
      // console.log(vertexBuffer);
  }
  function lightXSlider(ev, gl){
      translateLight(ev.target.value/100, 0, 0);
      renderClickScene(gl);
  }
  function translateLight(x, y, z){
    mainLightSource.location.elements[0] = 1 + x;
    mainLightSource.location.elements[1] = 1 + y;
    mainLightSource.location.elements[2] = 1 + z;
     
  }

  function rotateLightSlider(ev, gl){
    rotateLight(ev, gl);
    rotateLight(ev.target.value);
    setLightPosition(gl, mainLightSource.location);
    renderClickScene(gl);
  }
  function rotateLight(degrees){
      let rotateMatrix = new Matrix4();
      rotateMatrix.setRotate(degrees, 0, 1, 0);
      //Resetting back
      mainLightSource.location.elements[0] = 1; mainLightSource.location.elements[1] = 1; mainLightSource.location.elements[2] = 1; 
      mainLightSource.location = rotateMatrix.multiplyVector3(mainLightSource.location);
  }

  function setLights(gl){
    var u_DiffuseColor = gl.getUniformLocation(gl.program, 'u_DiffuseColor');
    var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
    var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');

     // Set the light color (white)
    gl.uniform3f(u_DiffuseColor, 1.0, 1.0, 1.0);
    // Set the light direction (in the world coordinate)
    gl.uniform3f(u_LightPosition, 1.0, 1.0, 1.0);
    // Set the ambient light
    gl.uniform3f(u_AmbientLight, 0.0, 0.0, 0.2);

    //Set specular exponent
    setSpecularColor(gl, 0.8, 0.8, 0.8);
    setSpecularExponent(gl, 20.0);
  }

  function setDiffuse(gl, r, g, b){
    var u_DiffuseColor = gl.getUniformLocation(gl.program, 'u_DiffuseColor');
    gl.uniform3f(u_DiffuseColor, r, g, b);

  }
  function setLightPosition(gl, position){
    var el = position.elements;
    var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
    gl.uniform3f(u_LightPosition, el[0], el[1], el[2]);
  }
  function setAmbient(gl, r, g, b){
    var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
    gl.uniform3f(u_AmbientLight, r, g, b);
  }
  function setShader(gl, shader){
    var u_Shader = gl.getUniformLocation(gl.program, 'u_Shader');
    gl.uniform1f(u_Shader, shader);
  }
  function setSpecularColor(gl, r, g, b){
    var u_SpecularColor = gl.getUniformLocation(gl.program, 'u_SpecularColor');
    gl.uniform3f(u_SpecularColor, r, g, b);
  }
  function setSpecularExponent(gl, exponent){
    var u_SpecularExponent = gl.getUniformLocation(gl.program, 'u_SpecularExponent');
    gl.uniform1f(u_SpecularExponent, exponent);
  }
  function setEyeVector(gl, eyePosition){
    var u_EyeVector = gl.getUniformLocation(gl.program, 'u_EyeVector');
    gl.uniform3f(u_EyeVector, eyePosition);
  }
  function changeShader(gl, shader, render=true){
    //Set shader
    setShader(gl, shader);
    //Change label
    var shaderLabel = document.getElementById('shader');
    if(shader == 0){
      shaderLabel.innerHTML = "Goraud";
    }else if(shader == 1){
      shaderLabel.innerHTML = "Phong";
    }else if(shader == 2){
      shaderLabel.innerHTML = "Cel/Toon";
    }
    //Rerender
    if(render){
      renderClickScene(gl);
    }
  }
  function changeSpecularExponent(gl, exponent, render=true){
    setSpecularExponent(gl, exponent);
    if(render){
      renderClickScene(gl);
    }
  }
  function changeSpecularColor(gl, color, render=true){
    setSpecularColor(gl, color[0], color[1], color[2]);
    if(render){
      renderClickScene(gl);
    }
  }
  function changAmbientColor(gl, color, render=true){
    setAmbient(gl, color[0], color[1], color[2]);
    if(render){
      renderClickScene(gl);
    }
  }
  function setMvpMatrix(gl, eyePosition, center, up, near, far, viewAngle, ratio=1){
    var mvpMatrix = new Matrix4();
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    mvpMatrix.setPerspective(viewAngle, ratio, near, far);
    var eye = eyePosition.elements;
    var point = center.elements;
    var upVec = up.elements;
    mvpMatrix.lookAt(eye[0], eye[1], eye[2], point[0], point[1], point[2], upVec[0], upVec[1], upVec[2]);
    // Pass the model view projection matrix to u_MvpMatrix
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  }
  function clickModeChange(ev, gl){
    console.log("Changing click mode! Previous click mode: " + clickMode);
    clickMode = document.getElementById('clickMode').value;
    //console.log(clickMode);
  }
  function setObjectIndex(gl, index){
    //Get uniform location
    var u_ObjectIndex = gl.getUniformLocation(gl.program, 'u_ObjectIndex');
    //Set uniform value to index
    gl.uniform1f(u_ObjectIndex, index);
  }
  function setAlphaMode(gl, alpha){
    // console.log('Changing alpha mode to ' + alpha);
    //Get uniform location
    var u_AlphaMode = gl.getUniformLocation(gl.program, 'u_AlphaMode');
    //Set uniform calue
    gl.uniform1f(u_AlphaMode, alpha);
  }
  function setClickedIndex(gl, index){
    var u_ClickedIndex = gl.getUniformLocation(gl.program, 'u_ClickedIndex');
    gl.uniform1f(u_ClickedIndex, index);
  }
