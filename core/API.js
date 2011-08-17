/*
SYNOPSIS:

BROWSER-RUN:
var client = new Things.Client();
var server = new Things.Server();
try {
	var root = Things.loadPatch('root');
} catch(e) {
	var root = new Patch();
}
server.openPatch(patch);
*/
var Things = {};
Things.patches = {}
Things.getPatch = function() {
}
Things.loadPatch = function(name) {
	return patch.index;
}
Things.savePatch = function(p,name) {
}

Things.Server = function() {
	this.clients = [];
	this.patches = {};
	this.patchAPI = Things.Server.patchAPI;
	this.serverAPI = Things.Server.serverAPI;
}
Things.Server.prototype = {
	openPatch: function(patch) {
		this.serverAPI.open.apply(this,[patch.index]);
	},
	closePatch: function(patch) {
		this.serverAPI.close.apply(this,[patch.index]);
	},
	connect: function(client) {
		if (this.clients.indexOf(client)!=--1) this.clients.push(client);
	},
	disconnect: function(client) {
		var i = this.clients.indexOf(client); 
		if(i!=-1) this.clients.splice(i,1);
	},
	cancel: function(patch) {
		this.items[patch.index].buffer.push(msg);
	}
	buffer: function(patch,msg) {
		this.items[patch.index].buffer.push(msg);
	},
	send: function(msg,patch) {
		for (var i in this.clients) {
			this.client.send({
				cmd: patch,
				patch: patch.index,
				messages: this.items[patch.index].buffer
			});
		}
		this.cancel(patch);
	},
	receive: function(data) {
		if (data.cmd == 'patch') {
			try {
				var item = this.items[data.patch]; 
				if (!item) throw ('unknown patch');
				var undo = [];
				for (var i in data.messages) {
					var msg = data.messages[i];
					var cmd = msg.shift();
					var undoMethod = this.patchAPI[cmd].apply(item.patch,msg);
					undo.push(undoMethod);
				}
				item.undo.push(undo);
			} catch (e) {
				this.send(patch,['error',String(e)]);
			}
		} else {
			try {
				var cmd = data.shift();
				this.serverAPI[cmd].apply(patch,data);
			} catch (e) {
				this.client.send(['error',String(e)]);
			}
		}
	}
};
Things.Server.serverAPI = {
	open: function(index) {
		if (this.patches[index]) throw('already open');
		
		var patch = Things.patches[index];
		if (!patch) throw('no such patch');

		this.items[patch.index]={
			patch: patch,
			buffer: [],
			undo: []
		};
		patch.addListener(this);
	},
	close: function(index) {
		if (this.patches[index]) throw('no such patch open');
		delete this.items[index];
		patch.removeListener(this);
	}
};
Things.Server.patchAPI = {
	pack: function(tt) {
		var things = {};
		for (var i in tt) things[tt[i]]=this.things[tt[i]];
		this.pack(things); 
	},
	unpack: function(p) {
		var patch = this.things[p];
		this.unpack(p); 
	},
	add_thing: function(kind) {
		var thing new Thing.kinds[kind];
		this.addThing(thing);
		var t = thing.index;
		return function() {
			this.thing(t).remove();
		}
	},
	rename: function(t) {
		var thing = this.thing(t);
		var oldname = thing.name;
		thing.rename(name);
		return function() {
			this.thing(t).rename(oldname);
		}
	},
	move_thing: function(t,x,y) {
		var oldx = thing.x, oldy = thing.y;
		this.thing(t).move(x,y);
		return function() {
			this.thing(t).move(oldx,oldy);
		}
	},
	remove_thing: function(t) {
		var me = this;
		var incoming = {};
		var outgoing = {};
		var thing = this.thing(t);
		thing.eachInput(function(pin,name) {
			incoming[name] = [pin.incoming.thing.index, pin.incoming.name];
		});
		thing.eachInput(function(pin,name) {
			outgoing[name] = [];
			for (var i in pin.outgoing) {
				outgoung.push[pin.outgoing[i].thing.index, pin.outgoing[i].name];
			}
		});
		me.removeThing(thing);
		return function() {
			me.addThing(thing);
			for (var i in incoming) {
				var p = incoming[i];
				if (p) me.thing(p[0]).outputs[p[1]].connect(thing.inputs[i]);
			}
			for (var i in outgoing) {
				for (var j in outgoing[i]) {
					var p = outgoing[i][j];
					me.thing(p[0]).inputs[p[1]].connect(thing.outputs[i]);
				}
			}
		}
	}
	add_input: function(t,name) {
		var pin = this.thing(t).addInput(name||'input');
		var newname = pin.name;
		return function() {
			this.thing(t).removeInput(newname);
		}
	},
	add_output: function(t,name) {
		var pin = this.thing(t).addOutput(name||'output');
		var newname = pin.name;
		return function() {
			this.thing(t).removeOutput(newname);
		}
	},
	set_input: function(t,name,value) {
		var thing = this.thing(t);
		var oldvalue = thing.getInput(name);
		thing.setInput(name,value);		
		return function() {
			this.thing(t).setInput(name,oldvalue);
		}
	},
	set_output: function(t,name) {
		var thing = this.thing(t);
		var oldvalue = thing.getOutput(name);
		thing.setOutput(name,value);		
		return function() {
			this.thing(t).setOutput(name,oldvalue);
		}
	},
	set_input_type: function(t,name,type) {
		var thing = this.thing(t);
		var oldtype = thing.inputs[name].type;
		thing.setInputType(name,type);		
		return function() {
			this.thing(t).setInputType(name,type);
		}
	},
	set_output_type: function(t,name) {
		var thing = this.thing(t);
		var oldtype = thing.outputs[name].type
		thing.setOutputType(name,value);		
		return function() {
			this.thing(t).setOutputType(name,oldtype);
		}
	},
	set_input_extra: function(t,name,prop,value) {
		var thing = this.thing(t);
		var oldval = thing.inputs[name].extra[prop];
		thing.setInputExtra(name,prop,value);		
		return function() {
			this.thing(t).setInputExtra(name,prop,value);
		}
	},
	set_output_extra: function(t,name,prop,value) {
		var thing = this.thing(t);
		var oldval = thing.outputs[name].extra[prop];
		thing.setOutputExtra(name,prop,value);		
		return function() {
			this.thing(t).setOutputExtra(name,prop,value);
		}
	},
	rename_input: function(t,name1,name2){
		var pin = this.thing(t).renameInput(name1,name2);
		var oldname = name1, newname = pin.name;
		return function() {
			this.thing(t).renameInput(newname,oldname);
		}
	},
	rename_output: function(t,name1,name2){
		var pin = this.thing(t).renameInput(name1,name2);
		var oldname = name1, newname = pin.name;
		return function() {
			this.thing(t).renameOutput(newname,oldname);
		}
	},
	remove_input: function(t,name){
		var thing = this.thing(t);
		var pin = thing.input[name];
		var type = pin.type;
		var value = pin.getInput(name);
		var extra = {}; for (var i in pin.extra) extra[i]=pin.extra[i];
		thing.removeInput(name);
		return function() {
			this.thing(t).addInput(name,value,type,extra);
		}
	},
	remove_output: function(t,name) {
		var thing = this.thing(t);
		var pin = thing.output[name];
		var type = pin.type;
		var value = pin.getOutput(name);
		var extra = {}; for (var i in pin.extra) extra[i]=pin.extra[i];
		thing.removeOutput(name);
		return function() {
			this.thing(t).addOutput(name,value,type,extra);
		}
	},
	connect: function(t1,n1,t2,p2) {
		var pin1 = this.thing(t1).outputs[n1];
		var pin2 = this.thing(t2).inputs[n2];
		var t3 = pin2.incoming && pin2.incoming.thing.index;
		var n3 = pin2.incoming && pin2.incoming.name;
		pin1.connect(pin2);
		return function() {
			var pin2 = this.thing(t2).inputs[n2];
			pin2.disconnect;
			if (t3) {
				pin2.connect(this.thing(t3).outputs[n3]);
			}
		}
	},
	disconnect: function(t1,n1,t2,p2) {
		var pin1 = this.thing(t1).outputs[n1];
		var pin2 = this.thing(t2).inputs[n2];
		pin1.discconnect(pin2);
		return function() {
			var pin1 = this.thing(t1).outputs[n1];
			var pin2 = this.thing(t2).inputs[n2];
			pin1.connect(pin2);
		}
	},
}


