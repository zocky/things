var Pipe = function() {
	this.kind = 'pipe';
	Thing.apply(this);
};
Thing.kinds.pipe = Pipe;
Pipe.prototype.__proto__ = Thing.prototype;

Pipe.prototype.addInput = function (name,def,type,extra)  {
	var pin = this._addInput(name,def,type,extra); 
    this._addOutput(pin.name,null,type,extra);
    this.outputs[pin.name].value = def; 
    return pin;
}
Pipe.prototype.addOutput = function(name,def,type,extra) {
	var pin = this.addInput(name,def,type,extra);
	return this.outputs[pin.name];
}
Pipe.prototype.removeInput = function(name) {
	this._removeInput(name);
	this._removeOutput(name);
}
Pipe.prototype.removeOutput = Pipe.prototype.removeInput;
Pipe.prototype.renameInput = function(name1,name2) {
	this._renameOutput(name1,name2);
	return this._renameInput(name1,name2);
}
Pipe.prototype.renameOutput = function(name1,name2) {
	this.renameInput(name1,name2);
	return this.outputs[name2];
}
Pipe.prototype._setInput = function(name,val,circular) {
	this.inputs[name].value = this.__setInput(name,val);
	this.evalOutput(name,circular);
}
Pipe.prototype.__evalOutput = function(name) {
	return this.getInput(name);
}
Pipe.prototype.serialize = function() {
	var o = Thing.prototype.serialize.apply(this);
	o.pins = {};
	var pipe = this;
	this.eachInput(function(pin,name) {
		o.pins[name] = pipe.serializeInput(name);
	});
	return o;
}
Pipe.prototype._deserialize = function(o) {
	Thing.prototype._deserialize.apply(this,[o]);
	for (var i in this.inputs) {
		this._deserializeInput(i,this.inputs[i]);
	}
}

