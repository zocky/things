Patch.prototype.msg=function(a,b,c,d,e,f,g,h,i) {
	if (a=='connected'||a=='disconnected') this.tsorted = this.tsort();
    this.handlers && this.handlers['patch_'+a] && this.handlers['patch_'+a].apply(this.handlers,[b,c,d,e,f,g,h,i]);
}

Patch.prototype.addThing = function (t,x,y)  {
	if (this.things[t.index]) throw('unexpected');
	t.index = randomString();
	t.patch = this;
	t.root = this.root;
	if(!isNaN(x)) t.x = x;
	if(!isNaN(y)) t.y = y;
	this.things[t.index] = t;
	this.msg('add_thing',t.index,t.kind,t.type,t.name,t.x,t.y,t.extra);
	this.msg('thing_added',t);
    this.tsorted = this.tsort();
	return t;
}
Patch.prototype.addThings = function (things,x,y)  {
	var top = Infinity;
	var left = Infinity;
	for (var i in things) {
		if (things[i].x < left) left = things[i].x; 
		if (things[i].y < top) top = things[i].y; 
	}
	this.addThingsDelta(things,x-left,y-top);
}
Patch.prototype.addThingsDelta = function (things,dx,dy)  {
	for (var i in things) {
		this.addThing(things[i],things[i].x+dx,things[i].y+dy);
	}
}

Patch.prototype.tsort = function() {
	var visited = {};
	var sorted = [];
	function visit(t) {
		if (!visited[t.index]) {
			visited[t.index] = true;
			for (var i in t.outputs) {
				for (var j in t.outputs[i].outgoing) {
					visit(t.outputs[i].outgoing[j].thing)
				}
			}
			sorted.push(t);
		}
	}
	visit (this.output);
	for (var i in this.things) visit(this.things[i]);
	visit (this.input);
	return sorted.reverse();
}


Patch.prototype.removeThing = function (t)  {
	t.disconnect();
	this.msg('thing_removed',t);
	delete this.things[t.index];
	return t;
}
Patch.prototype.removeThings = function(things) {
	for (var i in things) this.removeThing(things[i]);
}

Patch.prototype.getClones = function(things,handlers) {
	var remap = {};
	var ret = {};
	var brokenIn = [];
	var brokenOut = [];
    for (var i in things) {
		var t = things[i];
		var clone = things[i].clone();
		remap[t.index] = clone;
		ret[clone.index] = clone;
	}
	handlers.beforeThings && handlers.beforeThings(ret);
	for (var i in things) {
		var thing = things[i];
		var thingClone = remap[i];
		handlers.thing && handlers.thing(thing, thingClone);
		thing.eachInput(function(pin,name) {
			var other = pin.incoming;
			if (other) {
				var pinClone = thingClone.inputs[name];
				var otherThingClone = remap[other.thing.index]; 
				if (!otherThingClone) {
					brokenIn.push([pin,pinClone,other]);
				} else {
					var otherPinClone = otherThingClone.outputs[other.name];
					pinClone.connect(otherPinClone);
				}
			}
		});
		thing.eachOutput(function(pin,name) {
			var others = [];
			var pinClone = thingClone.outputs[name];
			for (var k in pin.outgoing) {
				var other = pin.outgoing[k];
				var otherThingClone = remap[other.thing.index];
				if (!otherThingClone) {
					if (!others.length) {
						brokenOut.push([pin,pinClone,others]);
					}
					others.push(other);
				} else {
					var otherPinClone = otherThingClone.inputs[other.name];
					pinClone.connect(otherPinClone);
				}
			}
		});
	}
//	console.log(brokenIn,brokenOut);
	handlers.afterThings && handlers.afterThings(ret);
	if (handlers.brokenIn) {
		for (var i in brokenIn) {
			handlers.brokenIn.apply(this,brokenIn[i]);
		}
	}
	if (handlers.brokenOut) {
		for (var i in brokenOut) {
			handlers.brokenOut.apply(this,brokenOut[i]);
		}
	}
	return ret;
}
Patch.prototype.pack = function(things,x,y) {
	var me = this;
	var patch =new Patch();
    this.addThing(patch,x,y);
	this.getClones( things, {
		beforeThings: function(clones) {
			patch.addThings(clones);
		},
		brokenIn: function(pin,clone,other) {
			var name = pin.thing.name+'_$'+pin.name;
			var input = patch.addInput(pin.name,pin.value,pin.type,pin.extra);
			var output = patch.input.outputs[input.name];
			other.disconnect(pin);
			other.connect(input);
			output.connect(clone);
		},
		brokenOut: function(pin,clone,others) {
			var name = pin.thing.name+'_'+pin.name;
			var output = patch.addOutput(name,pin.value,pin.type,pin.extra);
			var input = patch.output.inputs[output.name];
			for (var i in others) {
				others[i].disconnect(pin);
				others[i].connect(output);
				input.connect(clone);
			}
		}
	});
	this.removeThings(things);
	return patch;
}

Patch.prototype.unpack = function(patch,x,y) {
	var me = this;
	var clones = this.getClones( patch.things, {
		beforeThings: function(clones) {
			me.addThings(clones,x,y);
		},
		brokenIn: function(pin,clone,other) {
			var input = patch.inputs[other.name];
			input.incoming.connect(clone);
			pin.disconnect();
		},
		brokenOut: function(pin,clone,others) {
			for (var i in others) {
				var other = others[i];
				var output = patch.outputs[other.name];
				for (var j in output.outgoing) {
					output.outgoing[j].connect(clone);
				}
				output.disconnect();
			}
		}
	});
	this.removeThing(patch);
	return clones;
}

Patch.prototype.copyThings = function(things) {
	var me = this;
	var patch =new Patch();
	var clones = this.getClones( things, {
		beforeThings: function(clones) {
			patch.addThings(clones);
		},
		brokenIn: function(pin,clone,other) {
		},
		brokenOut: function(pin,clone,others) {
		}
	});
	Patch.clipboard = patch;
	return clones;
}
Patch.prototype.cutThings = function(things) {
	var clones = this.copyThings(things);
	this.removeThings(things);
	return clones;
}
Patch.prototype.pasteThings = function(x,y) {
	var me = this;
	return this.getClones( Patch.clipboard.things, {
		beforeThings: function(clones) {
			me.addThings(clones,x,y);
		},
	});
}
Patch.prototype.duplicateThings = function(things,x,y) {
	var me = this;
	var patch =new Patch();
	var clones = this.getClones( things, {
		beforeThings: function(clones) {
			me.addThings(clones,x,y);
		},
		brokenIn: function(pin,clone,other) {
			other.connect(clone);
		},
		brokenOut: function(pin,clone,others) {
		}
	});
	return clones;
}

