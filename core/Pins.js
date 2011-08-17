///////////////////////
// H E L P E R S
//////////////////////

var arrayAddItem = function (array,item) {
    var i = array.indexOf(item);
    if (i==-1) {
        array.push(item);
        return array.length-1;
    } else return i;
};

var arrayRemoveItem = function (array,item) {
	var pos = array.indexOf(item);
    if(pos>-1) array.splice(pos,1);
};

///////////////////////
// I N P U T
//////////////////////
var Input = function(thing,name,def,type,extra) {
    thing.inputs[name]=this;
    this.thing = thing;
    this.parent = thing;
    this.name = name;
    this.$name = '$'+name;
    this.type = type || 'value';
    this.incoming = null;
    this.value = def || null;
    this.extra = extra || {};
    this.dep={};
}

Input.prototype = {
	connect: function(output) {
		this.disconnect();
		this.incoming = output;
		arrayAddItem(this.incoming.outgoing,this);
		this.thing.raise('connected',output,this);
		this.set(output.value);
	},
	disconnect: function() {
		if (this.incoming) {
		    var output = this.incoming;
		    arrayRemoveItem(output.outgoing,this);
		    this.incoming = null;
		    this.thing.raise('disconnected',output,this);
		}
	},
	set: function(value) {
		return this.thing.setInput(this.name,value,[]);
	},
	get: function(value) {
		return this.thing.getInput(this.name);
	},
	cast: function(value) { return value; }, 
	rename: function(name) {
		return this.thing.renameInput(this.name,name);
	},
	setType: function(type) {
		return this.thing.setInputType(this.name,type);
	},
	setExtra: function(name,value) {
		return this.thing.setInputExtra(this.name,name,value);
	},
	remove: function() {
		return this.thing.removeInput(this.name);
	}
}
///////////////////////
// O U T P U T
//////////////////////

var Output = function(thing,name,fn,type,extra) {
    thing.outputs[name]=this;
    this.dirty = true;
    this.thing = thing;
    this.parent = thing;
    this.name = name;
    this.$name = name;
    this.type = type || 'value';
    this.outgoing = [];
    this.value = null;
    this.extra = extra || {};
    this.set(fn);
}

Output.prototype = {
	set: function(fn) {
		this.thing.setOutput(this.name,fn);
	},
	get: function(value) {
		return this.thing.getOutput(this.name);
	},
	cast: function(val) {
		return val;
	},
	connect: function(input) {
		input.connect(this);
	},
	disconnect: function () {
		while(this.outgoing.length) this.outgoing.pop().disconnect(); 
	},
	eval: function() {
		this.thing.evalOutput(this.name,[]);
	},
	rename: function(name) {
		return this.thing.renameOutput(this.name,name);
	},
	setType: function(type) {
		return this.thing.setOutputType(this.name,type);
	},
	setExtra: function(name,value) {
		return this.thing.setOutputExtra(this.name,name,value);
	},
	remove: function() {
		return this.thing.removeOutput(this.name);
	}
}
