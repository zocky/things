var Patch = function(handlers) {
	this.kind = 'patch';
	Thing.apply(this);
	this.root = this;
	this.handlers = handlers || null;
	this.things = {};

	this.input = new PortIn();
	this.input.name = 'patch input';
	this.input.index = 'input';
	this.input.patch = this;
	
	this.output = new PortOut();
	this.output.name = 'patch output';
	this.output.index = 'output';
	this.output.patch = this;
	
	this.raise('thing_added',this.input);
	this.raise('thing_added',this.output);
	
};
Thing.kinds.patch = Patch;

Patch.prototype.__proto__ = Thing.prototype;
Patch.prototype.thing = function(t) {
	switch(t) {
		case 'patch': return this;
		case 'input': return this.input;
		case 'output': return this.output;
		default: return this.things[t];
	}
}
Patch.prototype.rename = function(name) {
	Thing.prototype.rename.apply(this,arguments);
	this.msg('patch_renamed',this,name);
	this.msg('rename','patch',name);
}
Patch.prototype.addInput = function (name,def,type,extra)  {
	var pin = this._addInput(name,def,type,extra);
	this.input._addOutput(name,def,type,extra);
	return pin;
}
Patch.prototype.addOutput = function (name,def,type,extra)  {
	this.output._addInput(name,def,type,extra);
	var pin = this._addOutput(name,def,type,extra);
	return pin;
}
Patch.prototype.renameInput = function(name1,name2) {
	var pin = this._renameInput(name1,name2);
	this.input._renameOutput(name1,name2);
	return pin;
}
Patch.prototype.renameOutput = function(name1,name2) {
	var pin = this._renameOutput(name1,name2);
	this.output._renameInput(name1,name2);
	return pin;
}
Patch.prototype._setInput = function(name,val,circular) {
	this.inputs[name].value = this.__setInput(name,val);
	this.input.outputs[name].dirty = true;
};
Patch.prototype.setOutput = function(name,val){
};
Patch.prototype.__evalOutput = function(name) {
	return this.output.inputs[name].value;
};

Patch.prototype.evalOutputs = function() {
	this.evalAll();
	this._evalOutputs();
}
Patch.prototype.evalAll = function() {
	for (var i=0; i<this.tsorted.length;i++) {
		this.tsorted[i].evalOutputs();
	}
}
Patch.prototype.evalFrom = function(thing) {
	for (var i = this.tsorted.indexOf(thing); i<this.tsorted.length;i++) {
		this.things[i].evalOutputs();
	}
}
Patch.prototype.setInputType = function(name,type) {
	this._setInputType(name,type);
	this.input._setOutputType(name,type);
}
Patch.prototype.setOutputType = function(name,type) {
	this._setOutputType(name,type);
	this.output._setInputType(name,type);
}
Patch.prototype.setInputExtra = function(name,prop,val) {
	this._setInputExtra(name,prop,val);
	this.input._setOutputExtra(name,prop,val);
}
Patch.prototype.removeInput = function(name) {
	this._removeInput(name);
	this.input._removeOutput(name);
}
Patch.prototype.setOutputExtra = function(name,prop,val) {
	this._setOutputExtra(name,prop,val);
	this.output._setInputExtra(name,prop,val);
}
Patch.prototype.removeInput = function(name) {
	this._removeInput(name);
	this.input._removeOutput(name);
}
Patch.prototype.removeOutput = function(name) {
	this._removeOutput(name);
	this.output._removeInput(name);
}

Patch.prototype._deserialize = function(o) {
	this.input.x = o.input.x;
	this.input.y = o.input.y;
	this.output.x = o.output.x;
	this.output.y = o.output.y;
	Thing.prototype._deserialize.apply(this,[o]);
	
	this.msg('thing_added',this.input);
	this.msg('thing_added',this.output);

//	this.input._deserialize(o.input);
//	this.output._deserialize(o.output);

	
	var remap = {
		input: this.input,
		output:this.output
	};
	
	for (var i in o.things) {
		var thing = Thing.deserialize(o.things[i]);
		remap[i] = thing;
		this.addThing(thing);
	}
	for (var i in o.connections) {
		var xc = o.connections[i];
		//console.log(xc,remap[xc.fromThing]);
		remap[xc.fromThing].outputs[xc.fromPin].connect(remap[xc.toThing].inputs[xc.toPin]);
	}
	//this.addThing(this.input);
	//this.addThing(this.output);
}
Patch.timerOutputs = [];
Patch.addTimer = function(output) {
	arrayAddItem(Patch.timerOutputs,output);
}
Patch.removeTimer = function (output) {
	var pos = Patch.timerOutputs.indexOf(output);
	if (pos>-1) Patch.timerOutputs.splice(pos,1);
}
Patch.time = null ;
Patch.elapsed = null;
Patch.running = false;
Patch.play = function() {
	var reqAnim = window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.requestAnimationFrame;
	
	if (Patch.running) return;
	Patch.time = (new Date()).valueOf();
	//var counter = 0, time = Patch.time;
	Patch.running = true;
	(function run(timestamp) {
		if (!Patch.running) return;
		Patch.elapsed = timestamp - Patch.time;
		Patch.time = timestamp;
		for (var i in Patch.timerOutputs) {
			Patch.timerOutputs[i].dirty=true;
		}
		gui.patch.evalAll();
		/*counter++;
		if (counter==100) {
			console.log('framerate', counter / (timestamp - time)*1000);
			time = timestamp;
			counter = 0;
		}*/
		reqAnim(run);
	})();
}
Patch.stop = function() {
	Patch.running = false;
}


Patch.prototype.serialize = function() {
	var me = this;
	var o = Thing.prototype.serialize.apply(this);
	o.input = this.input.serialize();
	o.output = this.output.serialize();
	o.things = {};
	o.connections = [];
	for (var i in this.things) {
		o.things[i] = this.things[i].serialize();
		this.things[i].eachInput(function(pin,name) {
			if (pin.incoming) o.connections.push({
				fromThing: pin.incoming.thing.index,
				fromPin: pin.incoming.name,
				toThing: i,
				toPin: name,
			});
		})
	}
	this.output.eachInput(function(pin,name) {
		if (pin.incoming) o.connections.push({
			fromThing: pin.incoming.thing.index,
			fromPin: pin.incoming.name,
			toThing: 'output',
			toPin: name,
		});
	})
	return o;
}
