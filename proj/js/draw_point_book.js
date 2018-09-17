var VSHADER_SOURCE = 
	'void main(){\n'+
	'	gl_Position = vec4(0.0, 0.0, 0.0, 1.0);\n'+
	'	gl_PointSize = 10.0;'+
	'}\n'

var FSHADER_SOURCE = 
	'void main(){\n'+
	'	gl_FragColor = vec4(1.0， 0.0， 0.0, 1.0);\n'+
	'}\n'

function main()
{
	var canvas = document.getElementById("webgl")
	var gl = canvas.getContext("webgl")
	if(!gl)
	{
		console.log("fail to get the rendering context for webgl")
		return
	}

	if(!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE))
	{
		console.log("fail to init shaders")
		return
	}

	gl.clearColor(0.0, 0.0, 0.0, 1.0)
	gl.clear(gl.COLOR_BUFFER_BIT)
	gl.drawArrays(gl.POINTS, 0, 1)
}