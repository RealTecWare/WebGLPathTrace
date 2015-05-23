ShapeTracer = function ()
{
	this.canvas = null;
	this.context = null;
	this.gpuTracer = null;
	this.fragmentShader = null;
	this.settings = null;
};

ShapeTracer.prototype.Init = function (canvasElem, controlsElem, fragmentShaderElem)
{
	if (!this.InitUserInterface (controlsElem)) {
		return false;
	}
	
	if (!this.InitRenderer (canvasElem, fragmentShaderElem)) {
		return false;
	}
	
	return true;
};

ShapeTracer.prototype.InitUserInterface = function (controlsElem)
{
	this.settings = {
		light : {
			position : new JSM.Coord (4.0, 2.0, 3.0),
			radius : 0.5
		}
	};	
	
	return true;
};

ShapeTracer.prototype.InitRenderer = function (canvasElem, fragmentShaderElem)
{
	this.canvas = canvasElem;
	this.fragmentShader = fragmentShaderElem.childNodes[0].nodeValue;

	var camera = new JSM.Camera (
		new JSM.Coord (4, 1, 2),
		new JSM.Coord (0, 0, 0),
		new JSM.Coord (0, 0, 1)
	);
	
	var maxIteration = 32;
	var myThis = this;
	
	this.gpuTracer = new GPUTracer ();
	var callbacks = {};
	
	if (!this.gpuTracer.Init (this.canvas, camera, maxIteration, callbacks)) {
		return false;
	}
	
	if (!this.Compile ()) {
		return false;
	}
	
	if (!this.UpdateUniforms ()) {
		return false;
	}
	
	this.gpuTracer.StartInNormalMode ();	
	return true;
};

ShapeTracer.prototype.Compile = function ()
{
	var timer = new JSM.Timer ();
	timer.Start ();
	var defines = [
		//'#define TRIANGLE_COUNT ' + this.model.TriangleCount ()
	].join ('\n');
	var result = this.gpuTracer.Compile (defines + this.fragmentShader, function (error) {
		console.log (error);
	});
	if (!result) {
		return false;
	}
	if (!this.UpdateUniforms ()) {
		return false;
	}
	timer.Stop ();
	console.log ('Compile time: ' + timer.Result ());
	return true;
};

ShapeTracer.prototype.UpdateUniforms = function ()
{
	this.gpuTracer.GetNavigation ().SetNearDistanceLimit (1.0);
	this.gpuTracer.GetNavigation ().SetFarDistanceLimit (20.0);
	this.gpuTracer.SetUniformVector ('uLightPosition', [this.settings.light.position.x, this.settings.light.position.y, this.settings.light.position.z]);
	this.gpuTracer.SetUniformFloat ('uLightRadius', this.settings.light.radius);
	
	return true;
};
