var PortIn = function() {
	this.kind = 'portin';
	Thing.apply(this);
};
Thing.kinds.portin = PortIn;
PortIn.prototype.__proto__ = Thing.prototype;

PortIn.prototype.addInput = undefined;
PortIn.prototype.addOutput = function (name,def,type,extra)  {
	return this.patch.addInput(name,def,type,extra);
}
PortIn.prototype.getInput = undefined
PortIn.prototype.__setInput = undefined;
PortIn.prototype._setInput = undefined;
PortIn.prototype.setInput = undefined;
PortIn.prototype.setOutput = function(name,val) {
};
PortIn.prototype.__evalOutput = function(name) {
	return this.patch.inputs[name].value;
};
PortIn.prototype.renameInput = undefined;

PortIn.prototype.renameOutput = function(name1,name2) {
	this.patch.renameInput(name1,name2);
};
PortIn.prototype.setInputType = undefined;

PortIn.prototype.setOutputType = function(name,type) {
	this.patch.setInputType(name,type);
};
PortIn.prototype.setInputExtra = undefined;
PortIn.prototype.setOutputExtra = function(name,prop,value) {
	this.patch.setInputExtra(name,prop,value);
};
PortIn.prototype.removeInput = undefined;
PortIn.prototype.removeOutput = function(name) {
	this.patch.removeInput(name);
};

///////////////////////////////////////////

var PortOut = function() {
	this.kind = 'portout';
	Thing.apply(this);
};
Thing.kinds.portout = PortOut;
PortOut.prototype.__proto__ = Thing.prototype;

PortOut.prototype.addOutput = PortOut.prototype._addOutput = undefined;
PortOut.prototype.addInput = function (name,def,type,extra)  {
	return this.patch.addOutput(name,def,type,extra);
}
PortOut.prototype.getOutput = undefined
PortOut.prototype._setOutput = undefined;
PortOut.prototype.setOutput = function() {
};

PortOut.prototype.setOutput = undefined;
PortOut.prototype.__evalOutput = undefined;
PortOut.prototype.evalOutput = undefined;
PortOut.prototype.renameOutput = undefined;

PortOut.prototype.setInput = function(name,val) {
	if (this.inputs[name].value === val) return;
	this._setInput(name,val);
	this.patch.outputs[name].dirty = true;
    this.raise('input_updated',this.inputs[name]);
}

PortOut.prototype.renameInput = function(name1,name2) {
	this.patch.renameOutput(name1,name2);
};
PortOut.prototype.setOutputType = undefined;

PortOut.prototype.setInputType = function(name,type) {
	this.patch.setOutputType(name,type);
};
PortOut.prototype.setOutputExtra = undefined;
PortOut.prototype.setInputExtra = function(name,prop,value) {
	this.patch.setOutputExtra(name,prop,value);
};
PortOut.prototype.removeOutput = undefined;
PortOut.prototype.removeInput = function(name) {
	this.patch.removeOutput(name);
};


