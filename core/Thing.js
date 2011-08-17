var randomString = function() {
    return '_'+((Math.random() * 0x1000000 + 0x1000000) | 0).toString(16).substr(1)
    	  + ((Math.random() * 0x1000000 + 0x1000000) | 0).toString(16).substr(1)
    	  + ((Math.random() * 0x1000000 + 0x1000000) | 0).toString(16).substr(1)
    	  + ((Math.random() * 0x1000000 + 0x1000000) | 0).toString(16).substr(1);
}

var Thing = function() {
	this.name = 'new '+this.kind;
	this.index = randomString();
    this.extra = {};
    this.inputs = {};
    this.outputs = {};
    this.x = 0;
    this.y = 0;
};
Thing.prototype.raise = function(a,b,c,d,e,f) {
	this.patch && this.patch.msg(a,b,c,d,e,f);
}

Thing.prototype.rename = function(name) {
	this.name=name;
	this.raise('thing_renamed',this,name);
	this.raise('rename_thing',this.index,name);
}

Thing.prototype.addInput = Thing.prototype._addInput = function (name,def,type,extra)  {
	if (this.inputs[name]) {
		var i = 1;
		while (this.inputs[name+i]) i++;
		name = name + i;
	}
    var pin = new Input(this,name,def,type,extra);
    this.raise('input_added',this.inputs[name]);
	this.raise('add_input',this.index,name,pin.get(),pin.type,pin.extra);
    return this.inputs[name];
};
Thing.prototype.addOutput = Thing.prototype._addOutput = function(name,expr,type,extra) {
	if (this.outputs[name]) {
		var i = 1;
		while (this.outputs[name+i]) i++;
		name = name + i;
	}
	var pin = new Output(this,name,expr,type,extra);
    //this.evalOutput(name);
	this.raise('output_added',this.outputs[name]);
	this.raise('add_output',this.index,name,pin.get(),pin.type,pin.extra);
    return this.outputs[name];
};
Thing.prototype.getInput = Thing.prototype._getInput= function(name) {
    return this.inputs[name] && this.inputs[name].value;
};
Thing.prototype.getOutput = Thing.prototype._getOutput = function(name) {
    return this.outputs[name].value;
};
Thing.prototype.__setInput = function(name,val) {
	return this.inputs[name].cast(val);
}
Thing.prototype._setInput = function(name,val,circular) {
	this.inputs[name].value = this.__setInput(name,val);
    //this.raise('update_input',this.index,name,pin.value);
};
Thing.prototype.setInput = function(name,val,circular) {
	
	var pin = this.inputs[name];
	/*if (circular instanceof Array) {
		if (circular.indexOf(this) > -1) {
		    this.raise('circular', this.inputs[name]);
		    pin.disconnect();
		    return false;
		}
	} else circular = [];*/
    if (val === pin.get()) return true;
	/*circular.push(this);*/
	this._setInput(name,val,circular);
    this.raise('input_updated',this.inputs[name]);
    //circular.pop();
    return true;
};
Thing.prototype.setOutput = Thing.prototype._setOutput = function(name,fn) {
	this.outputs[name].fn = fn;
	this.outputs[name].dirty = true;
	//this.evalOutputs();
};
Thing.prototype.__evalOutput = function(name) {
	var fn = this.outputs[name].fn;
	try {
		var value = this.outputs[name].cast(fn.apply(this));
	} catch (e) {
		var value = e;
	}
	return value;
};
Thing.prototype.evalOutput = Thing.prototype._evalOutput = function(name) {
	var value = this.__evalOutput(name);	
    if (value == this.outputs[name].value) return;    
    this.outputs[name].value=value;
    this.raise('output_updated',this.outputs[name]);
    this.raise('update_output',this.index,name,this.outputs[name].value);
	this.outputs[name].value = value;
	for (var j in this.outputs[name].outgoing) this.outputs[name].outgoing[j].set(value);
	this.outputs[name].dirty = false;
};
Thing.prototype.evalOutputs = Thing.prototype._evalOutputs =function() {
	for (var name in this.outputs) {
		if (this.outputs[name].dirty) {
			this.evalOutput(name);
		}
	}
}
Thing.prototype.renameInput = Thing.prototype._renameInput = function(name1,name2) {
	var input = this.inputs[name1];
	var value = input.value;
	var type = input.type;
	var incoming = input.incoming;
	var extra = input.extra;

	this.removeInput(name1);
	var newpin = this.addInput(name2,value,type,extra);
	if (incoming) incoming.connect(newpin);
    return newpin;  
};

Thing.prototype.renameOutput = Thing.prototype._renameOutput = function(name1,name2) {
	var oldpin = this.outputs[name1];
	var value = oldpin.value;
	var type = oldpin.type;
	var extra = oldpin.extra;
	var outgoing = []; for (var i in oldpin.outgoing) outgoing.push(oldpin.outgoing[i]); 
	this.removeOutput(name1);
	var newpin = this.addOutput(name2,value,type,extra);
	for (var i in outgoing) newpin.connect(outgoing[i]);
    return newpin;  
};
Thing.prototype.setInputType = Thing.prototype._setInputType = function(name,type) {
	var input = this.inputs[name];
	input.type = type;
	input._type = Thing.types[type] || Thing.types.value;
	input.cast =  input._type.cast || Thing.types.value.cast;
	this.setInput(name,input.value);
	this.raise('input_changed',input);
	this.raise('set_input_type',this.index,name,type);
};
Thing.prototype.setOutputType = Thing.prototype._setOutputType = function(name,type) {
	var output = this.outputs[name]
	output.type = type;
	output._type = Thing.types[type] || Thing.types.value;
	output.cast =  output._type.cast || Thing.types.value.cast;
	this.evalOutput(name);
    this.raise('output_changed',output);
	this.raise('set_output_type',this.index,name,type);
};
Thing.prototype.setOutputExtra = Thing.prototype._setOutputExtra = function(name,prop,value) {
	var output = this.outputs[name];
	output.extra[prop] = value;
    this.raise('output_changed',this.outputs[name]);
	this.raise('set_output_extra',this.index,name,prop,value);
};
Thing.prototype.setInputExtra = Thing.prototype._setInputExtra = function(name,prop,value) {
	var input = this.inputs[name];
	input.extra[prop]=value;
	this.raise('input_changed',input);
	this.raise('set_input_extra',this.index,name,prop,value);
};
Thing.prototype.removeInput = Thing.prototype._removeInput = function(name) {
    this.inputs[name].disconnect();
	this.raise('input_removed',this.inputs[name]);
	this.raise('remove_input',this.index,name);
    this.setInput(name,undefined,[]);
    delete this.dep[name];
    delete this['$'+name];
    delete this.inputs[name];
};
Thing.prototype.removeOutput = Thing.prototype._removeOutput = function(name) {
    this.outputs[name].disconnect();
    this.raise('output_removed',this.outputs[name]);
	this.raise('remove_output',this.index,name);
    delete this.outputs[name];
};
Thing.prototype.eachInput = Thing.prototype._eachInput = function(fn) {
	for (var i in this.inputs) fn(this.inputs[i],i);
};
Thing.prototype.eachOutput = Thing.prototype._eachOutput = function(fn) {
	for (var i in this.outputs) fn(this.outputs[i],i);
}



////// UTILS //////////

Thing.prototype.remove = Thing.prototype._remove = function() {
	this.patch.removeThing(this);
};
Thing.prototype.disconnect = Thing.prototype._disconnect = function() {
    this.eachInput(function(pin) {
    	pin.disconnect();
    });
    this.eachOutput(function(pin) {
    	pin.disconnect();
    	console.log(pin.name);
    });
};
Thing.prototype.__defineGetter__('$',function() {
    var ret={};
    for (var i in this.outputs) {
        ret[i]=this.getOutput(i)
    };
    return ret;
});
////// S E R I A L I Z A T I O N /////////

Thing.prototype.serialize = function() {
	var me = this;
	var o = {
		name: this.name,
		kind: this.kind,
		type: this.type,
		x: this.x,
		y: this.y,
		extra:this.extra
	};
	o.inputs = {};
	this.eachInput(function(pin,name) {
		o.inputs[name] = me.serializeInput(name);
	});
	o.outputs = {};
	this.eachOutput(function(pin,name) {
		o.outputs[name] = me.serializeOutput(name);
	});
	return o;
}
Thing.prototype.serializeInput = function(name) {
	var pin = this.inputs[name];
	return {
		value: pin.incoming ? undefined : pin.value,
		type: pin.type,
		extra: pin.extra
	};
};
Thing.prototype.serializeOutput = function(name) {
	var pin = this.outputs[name];
	return {
		type: pin.type,
		extra: pin.extra
	};
};


////// D E S E R I A L I Z A T I O N /////////
Thing.kinds = {};
Thing.fromLib = function(type) {
	return Thing.deserialize({type:type});
}
Thing.deserialize  = function(x) {
	if (x.type) {
		var x = $.extend(true,{},Thing.lib[x.type],x);
	}
	var Kind = Thing.kinds[x.kind];
	var t = new Kind();
	t._deserialize(x);
	return t;
};
Thing.prototype._deserialize = function(o) {
	this.name = o.name;
	this.type = o.type;
	this.x = o.x;
	this.y = o.y;
	this.extra = o.extra;
	if (this.setInput) {
		for (var i in o.inputs) {
			this._deserializeInput(i,o.inputs[i]);
		}
	}
	if (this.setOutput) {
		for (var i in o.outputs) {
			this._deserializeOutput(i,o.outputs[i]);
		}
	}
}
Thing.prototype._deserializeOutput = function(name,o) {
	return this.addOutput(name,null,o.type,o.extra);
};
Thing.prototype._deserializeInput = function(name,o) {
	return this.addInput(name,o.value,o.type,o.extra);
}
/////// C L O N I N G //////////

Thing.clone = function(thing) {
	return Thing.deserialize(thing.serialize());
}
Thing.prototype.clone = function() {
	return Thing.clone(this);
}
//////// OTHER /////////
Thing.types = {
	value: {
		cast: function(val){return val;}
	}
}

Thing.lib = {};
Thing.saveToLib = function(thing,name,cb) {
	var gui = this;
	var obj = thing.serialize();
	obj.name = name || thing.name;
	obj.type = null;
	obj.extra.develop = false;
	obj.extra.minimized = true;
	var title = 'Things/lib/'+obj.name;
	$.get('/w/api.php?format=json&action=query&prop=info&intoken=edit&titles='+title,function(data){
		var token;
		for (var i in data.query.pages) {
			token = data.query.pages[i].edittoken;
		};
		var args = {
			action:'edit',
			title: title,
			text: JSON.stringify(obj,null,'    '),
			summary: 'patch',
			token: token,
			format: 'json'
		};
		$.post('/w/api.php', args, function(data) {
			Thing.lib[data.name]=obj;
			cb && cb();
		});
	},'json');
}
Thing.loadLib = function (cb) {
	Thing.lib = {};
	$.get('/w/api.php?action=query&generator=allpages&gaplimit=500&gapprefix=Things/lib/&prop=revisions&rvprop=content&format=json', 
	function(data) {
		var pages = data.query.pages;
		for (var i in pages) {
			console.log(pages[i].title);
			var name = pages[i].title.replace(/^Things.lib./,'');
			if (!name) continue;
			Thing.lib[name] = JSON.parse(pages[i].revisions[0]['*']);
		};
		cb && cb();
	},'json');
}
