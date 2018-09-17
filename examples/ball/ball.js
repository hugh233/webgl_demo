// RotatingTranslatedTriangle.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Normal;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec2 a_TexCoord;\n' +
  'uniform mat4 u_ModelMatrix;\n' +   // Model matrix
  'varying vec2 v_TexCoord;\n' +
  'varying vec2 v_lightDirection;\n' +
  'varying vex3 v_Normal;\n'   +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '  v_TexCoord = a_TexCoord;\n' +
  // Calculate world coordinate of vertex
  '  vec4 vertexPosition = u_ModelMatrix * a_Position;\n' +
     // Calculate the light direction and make it 1.0 in length
  '  v_lightDirection = normalize(u_LightPosition - vec3(vertexPosition));\n' +
     // Recalculate the normal based on the model matrix and make its length 1.
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +  // Transformation matrix of the normal
  'uniform vec3 u_LightColor;\n' +    // Light color
  'uniform vec3 u_LightPosition;\n' + // Position of the light source (in the world coordinate system)
  'uniform vec3 u_AmbientLight;\n' +  // Ambient light color
  'uniform sampler2D u_Sampler0;\n' +
  'varying vec2 v_TexCoord;\n' +
  'varying vec2 v_Position;\n' +
  'varying vex3 v_Normal;\n'   +
  'varying vec2 v_lightDirection;\n' +
  'void main() {\n' +
  '  vec4 color0 = texture2D(u_Sampler0, v_TexCoord);\n' +
     // The dot product of the light direction and the normal
  '  float nDotL = max(dot(v_lightDirection, v_Normal), 0.0);\n' +
     // Calculate the color due to diffuse reflection
  '  vec3 diffuse = u_LightColor * color0.rgb * nDotL;\n' +
     // Calculate the color due to ambient reflection
  '  vec3 ambient = u_AmbientLight * color0.rgb;\n' +
     //  Add the surface colors due to diffuse reflection and ambient reflection
  '  gl_FragColor = vec4(diffuse + ambient, color0.a);\n' + 
  '}\n';

// Rotation angle (degrees/second)
var ANGLE_STEP = 45.0;

var u_ModelMatrix;
var u_MvpMatrix;
var u_NormalMatrix;
var u_LightColor;
var u_LightPosition;
var u_AmbientLight;

var modelMatrix;  // Model matrix
var mvpMatrix;    // Model view projection matrix
var normalMatrix; // Transformation matrix for normals

var canvas;

function main() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

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

  // Write the positions of vertices to a vertex shader
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0, 0, 0, 1);
  gl.enable(gl.DEPTH_TEST);

  // Get the storage locations of uniform variables and so on
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
  u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
  if (!u_MvpMatrix || !u_NormalMatrix || !u_LightColor || !u_LightPosition　|| !u_AmbientLight) { 
    console.log('Failed to get the storage location');
    return;
  }

   // Set the light color (white)
  gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
  // Set the light direction (in the world coordinate)
  gl.uniform3f(u_LightPosition, 2.0, 0.0, 0.0);
  // Set the ambient light
  gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);

  // Current rotation angle
  var currentAngle = 0.0;

  modelMatrix = new Matrix4();  // Model matrix
  mvpMatrix = new Matrix4();    // Model view projection matrix
  normalMatrix = new Matrix4(); // Transformation matrix for normals

  // Set texture
  if (!initTextures(gl, n)) {
    console.log('Failed to intialize the texture.');
    return;
  }
}

function draw(gl, n, currentAngle) {
  // Set the rotation matrix
  modelMatrix.setRotate(currentAngle, 0, 1, 0);
  // modelMatrix.translate(0.35, 0, 0);

  // Pass the rotation matrix to the vertex shader
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  mvpMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
  mvpMatrix.lookAt(0, 3, 5, 0, 0, 0, 0, 1, 0);
  mvpMatrix.multiply(modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Draw the rectangle
  gl.drawArrays(gl.TRIANGLES, 0, n);
}

function addPoint(vs, point) {
  vs.push(point[0]);
  vs.push(point[1]);
  vs.push(point[2]);
}

function calcDir(p1, p2)
{
  return [p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2]];
}

function sortPoint(vs, normal, color, texCoord, pos1, pos2)
{
  var len = pos1.length;
  for(var i = 0; i < pos1.length; i++)
  {
    var index = i + 1;
    var p1 = pos1[i];
    var p2 = pos2[i];
    var p3 = index >= len?pos2[0]:pos2[index];
    var p4 = pos1[i];
    var p5 = index >= len?pos2[0]:pos2[index];
    var p6 = index >= len?pos1[0]:pos1[index];

    addPoint(vs,p1);
    addPoint(vs,p2);
    addPoint(vs,p3);

    texCoord.push(p1[3]);
    texCoord.push(p1[4]);
    texCoord.push(p2[3]);
    texCoord.push(p2[4]);
    texCoord.push(p3[3]);
    texCoord.push(p3[4]);

    var normalPos1 = cross(calcDir(p1, p2), calcDir(p1, p3));
    addPoint(normal,normalPos1);
    addPoint(normal,normalPos1);
    addPoint(normal,normalPos1);

    addPoint(color,[1.0, 0.0, 0.0]);
    addPoint(color,[1.0, 0.0, 0.0]);
    addPoint(color,[1.0, 0.0, 0.0]);

    //////////////////////////////////////////////

    addPoint(vs,p4);
    addPoint(vs,p5);
    addPoint(vs,p6);

    texCoord.push(p4[3]);
    texCoord.push(p4[4]);
    texCoord.push(p5[3]);
    texCoord.push(p5[4]);
    texCoord.push(p6[3]);
    texCoord.push(p6[4]);

    var normalPos2 = cross(calcDir(p4, p5), calcDir(p4, p6));
    addPoint(normal,normalPos2);
    addPoint(normal,normalPos2);
    addPoint(normal,normalPos2);

    addPoint(color,[1.0, 0.0, 0.0]);
    addPoint(color,[1.0, 0.0, 0.0]);
    addPoint(color,[1.0, 0.0, 0.0]);

  }
}

function calcCircle()
{
  var W = 640;
  var H = 640;
  var R = 160;
  var dh = 5;
  var da = 5;
  var factor = W/2;
  
  var pos = new Array();
  for (var r = R; r >= -R; r = r - dh) {
    var _pos = new Array();
    var y = r;
    var x = 0;
    var z = 0;
    var s = 0;
    var t = (y + R)/(2*R);
    var cos = r/R;
    var deg = Math.acos(cos);
    for(var j = 0; j <= 360; j = j + da)
    {
      var rad = Math.PI/180 * j; 
      var len = Math.sin(deg) * R;
      x = len * Math.cos(rad);
      z = len * Math.sin(rad);
      s = j/360;
      _pos.push([x/factor, y/factor, z/factor, s, t]);
    }
    pos.push(_pos);
  }

  var len = pos.length;
  var vs = new Array();
  var normal = new Array();
  var color = new Array();
  var texCoord = new Array();
  for(var i = 0; i < len - 1; i++)
  {
    var pos1 = pos[i];
    var pos2 = pos[i + 1];
    sortPoint(vs, normal, color, texCoord, pos1, pos2);
  }

  var vertices = new Float32Array(vs.length);
  var normals = new Float32Array(normal.length);
  var colors = new Float32Array(color.length);
  var texCoords = new Float32Array(texCoord.length);
  for(var i = 0; i < vs.length; i++)
  {
    vertices[i] = vs[i];
  }
  for(var i = 0; i < normal.length; i++)
  {
    normals[i] = normal[i];
  }
  for(var i = 0; i < color.length; i++)
  {
    colors[i] = color[i];
  }
  for(var i = 0; i < texCoord.length; i++)
  {
    texCoords[i] = texCoord[i];
  }
  return [vertices, normals, colors, texCoords];
}

function initVertexBuffers(gl) {
  var array = calcCircle();
  var n = array[0].length/3;
  initArrayBuffer(gl, 'a_Position', array[0], 3, gl.FLOAT);
  initArrayBuffer(gl, 'a_Normal', array[1], 3, gl.FLOAT);
  initArrayBuffer(gl, 'a_Color', array[2], 3, gl.FLOAT);
  initArrayBuffer(gl, 'a_TexCoord', array[3], 2, gl.FLOAT);
  return n;
}


function cross(p1, p2) {
  var x1 = p1[0];
  var y1 = p1[1];
  var z1 = p1[2];

  var x2 = p2[0];
  var y2 = p2[1];
  var z2 = p2[2];

  nx = y1 * z2 - z1 * y2;
  ny = z1 * x2 - x1 * z2;
  nz = x1 * y2 - y1 * x2;
  
  return [nx, ny, nz];
}

function initArrayBuffer(gl, attribute, data, num, type) {
  // Create a buffer object
  var buffer = gl.createBuffer();
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

// Last time that this function was called
var g_last = Date.now();
function animate(angle) {
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}

function up() {
  ANGLE_STEP += 10; 
}

function down() {
  ANGLE_STEP -= 10; 
}


function initTextures(gl, n) {
  // Create a texture object
  var texture0 = gl.createTexture(); 
  if (!texture0) {
    console.log('Failed to create the texture object');
    return false;
  }

  // Get the storage location of u_Sampler0 and u_Sampler1
  var u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of u_Sampler');
    return false;
  }

  // Create the image object
  var image0 = new Image();
  if (!image0) {
    console.log('Failed to create the image object');
    return false;
  }
  // Register the event handler to be called when image loading is completed
  image0.onload = function(){ loadTexture(gl, n, texture0, u_Sampler0, image0, 0); };
  // Tell the browser to load an Image
  image0.src = '../resources/earth.png';
  return true;
}

function loadTexture(gl, n, texture, u_Sampler, image, texUnit) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);// Flip the image's y-axis
  // Make the texture unit active
  gl.activeTexture(gl.TEXTURE0);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the image to texture
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  
  gl.uniform1i(u_Sampler, texUnit);   // Pass the texure unit to u_Sampler
  
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Start drawing
  var tick = function() {
    currentAngle = animate(currentAngle);  // Update the rotation angle
    draw(gl, n, currentAngle);   // Draw the triangle
    requestAnimationFrame(tick, canvas);   // Request that the browser ?calls tick
  };
  tick();
}