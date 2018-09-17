function main()
{
	console.log("draw_rect run")
	var canvas = document.getElementById("canvas")
	if(!canvas)
	{
		console.log("failed to retrieve the <canvas> element")
		return
	}
	canvas.width = 400
	canvas.height = 400

	draw_2d()
	// var gl = 
}

function draw_2d()
{
	var ctx = canvas.getContext("2d")
	ctx.fillStyle = "rgba(0, 0, 255, 1.0)"
	ctx.fillRect(120, 10, 150, 150)
}