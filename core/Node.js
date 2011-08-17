///////////////////////
// N O D E
//////////////////////

var Node = function() {
	this.kind = 'node';
	Thing.apply(this,arguments);
    this.dep = {};
    this.current_ = null; 
};
Node.prototype.__proto__ = Thing.prototype;
Thing.kinds.node = Node;

Node.prototype.__defineGetter__('$$time',function() {
    if (this.current_) Patch.addTimer(this.outputs[this.current_]);
    return Patch.time;
});
Node.prototype.__defineGetter__('$$elapsed',function() {
    if (this.current_) Patch.addTimer(this.outputs[this.current_]);
    return Patch.elapsed;
});

Node.prototype.defineInputGetter = function(name) {
    this.__defineGetter__('$'+name,function() {
	    if (this.current_) this.dep[name][this.current_]=true;
        return this.getInput(name);
    });
}

Node.prototype.removeInputGetter = function(name) {
	delete this[$+name];
}

Node.prototype.addInput = function (name,def,type,extra)  {
	var pin = this._addInput(name,def,type,extra);
    this.dep[pin.name]={};
	this.defineInputGetter(pin.name);
	return pin;
}
Node.prototype.removeInput = function(name) {
    delete this.dep[name];
	this.removeInputGetter(name);
	return this._removeInput(name);
}
Node.prototype._setInput = function(name,val,circular) {
    this.inputs[name].value = this.__setInput(name,val);
    for (var i in this.dep[name]) {
        this.outputs[i].dirty=true;
    }
    return true;
}
Node.prototype.removeOutput = function(name) {
    for (var i in this.dep) {
        delete this.dep[i][name];
    }
    this._removeOutput(name);
}


Node.prototype.setOutput = function(name,expr) {
	var output = this.outputs[name];
	if(typeof(expr)=='function') throw('');
	try {
		var fn = new Function('','with (this) return('+expr+');');
	} catch(e) {
		try {
			var fn = new Function('','with (this) {'+expr+'};');
		}
		catch(f) {
			var fn = function() { return f };
		}
	}
	this.outputs[name].expr = expr;
    for (var i in this.dep) {
        delete this.dep[i][name];
    }
    Patch.removeTimer(this.outputs[name]);
	this._setOutput(name,fn);
}

Node.prototype.evalOutput = function(name) {
    if (this.current_!=null) this.raise('unexpected', this, name);
    this.current_ = name;
    var value = this._evalOutput(name);
    this.current_ = null;
    return value;
}
Node.prototype.getOutput = function(name) {
	return this.outputs[name].expr;
}
Node.prototype.serializeOutput = function(name) {
	var o = Thing.prototype.serializeOutput.apply(this,[name]);
	o.expr = this.outputs[name].expr;
	return o;
};
Node.prototype._deserializeOutput = function(name,o) {
	return this.addOutput(name,o.expr,o.type,o.extra);
};

