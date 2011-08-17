//////////// T H I N G S ////////////


GUI.prototype.$thing = function(thing) {
	if (!this.$things[thing.index]) {
		$el = $(
				'<div class="thing display">'
			+		'<div class="thing-header">'
			+			'<div class="thing-buttons">'
			+				'<div class="thing-button thing-edit">E</div>'
			+				'<div class="thing-button thing-minimize">▼</div>'
			+				'<div class="thing-button thing-unminimize">◀</div>'
			+			'</div>'
			+			'<div class="thing-name display"></div>'
			+		'</div>'
			+		'<div class="thing-pins">'
			+			'<div class="thing-inputs"></div>'
			+			'<div class="thing-outputs"></div>'
			+		'</div>'
			+		'<span style="clear:both;"></span>'
			+	'</div>'
		)
		.addClass('kind-'+thing.kind)
		.attr('id','thing-'+thing.index)
		.toggleClass('edit',!!thing.extra.develop)
		.toggleClass('display',!thing.extra.develop)
		.toggleClass('normal',!thing.extra.minimized);
		
		if(thing.type) {
			 $el.addClass('instance','type-'+thing.type);
		} else {
			 $el.addClass('unique');
		}
		$thing = {
			thing: thing,
			$el: $el,
			connections: [],
			$inputs :$el.find('.thing-inputs'),
			$outputs: $el.find('.thing-outputs'),
			$name: $el.find('.thing-name')
		}
		$el.data('thing',thing);
		$el.data('$thing',$thing);
		this.$things[thing.index] = $thing;
	}
	return this.$things[thing.index];
}

GUI.prototype.xpatch_add_thing = function(t,kind,type,name,x,y,extra) {
	var gui = this;
	this.$things[t] = this.dumpThing(t,kind,type,name,x,y,extra);
	this.$things[t].$el.appendTo(this.$thingContainer);
	this.displayThingName(t,name);
}


GUI.prototype.patch_thing_added = function(thing) {
	var gui = this;
	this.$thing(thing).$el.appendTo(this.$thingContainer);
	thing.eachInput(function(pin,name) {
		gui.patch_input_added(pin);
	});
	thing.eachOutput(function(pin,name) {
		gui.patch_output_added(pin);
	});
	this.displayThingName(thing);
	this.toggleMinimizeThing(thing,thing.extra.minimized);
	this.$thing(thing).$el.css({
		left: Math.max(thing.x,0)/12+"em",
		top: Math.max(thing.y,0)/12+"em"
	})
}

GUI.prototype.xpatch_remove_thing = function(t) {
	var gui = this;
	//if (thing.handlers) thing.handlers.close();
	this.$things[t].$el.remove();
	delete this.$things[t];
}

GUI.prototype.patch_thing_removed = function(thing) {
	var gui = this;
	if (thing.handlers) thing.handlers.close();
	
	thing.eachInput(function(pin,name) {
		gui.patch_input_removed(pin);
	});
	thing.eachOutput(function(pin,name) {
		gui.patch_output_removed(pin);
	});
	this.$things[thing.index].$el.remove();
	delete this.$things[thing.id];
}
GUI.prototype.patch_thing_renamed = function(thing) {
	this.displayThingName(thing);
}
GUI.prototype.patch_patch_renamed = function(thing) {
	this.displayPatchName();
}

//////////// P I N S ////////////

GUI.prototype.pin_id = function(pin) {
	return pin.parent.index+'|'+pin.name;
}
GUI.prototype.dumpPin = function(pin) {
	var $el =  $(
			'<div class="pin disconnected">'
		+		'<div class="pin-connector" title="'+pin.name+'"></div>'
		+		'<div class="pin-name display"></div>'
		+		'<div class="pin-type thing-editor display"></div>'
		+		'<div class="pin-value display"></div>'
		+	'</div>'
	)
	.addClass('type-'+pin.type,GUI.types[pin.type] && GUI.types[pin.type].classes)
	.data('pin',pin);
	if (pin.extra.hidden) $el.addClass('hidden');
	if (pin.extra.hideConnector) $el.addClass('hideConnector');
	return {
		pin: pin,
		$el: $el,
		$name: $el.find('.pin-name'),
		$type: $el.find('.pin-type'),
		$value: $el.find('.pin-value'),
		$connector: $el.find('.pin-connector')
	}
};

GUI.prototype.$pin = function(pin) {
	if (pin instanceof Input) return this.$input(pin);
	return this.$output(pin);
}
/////// I N P U T S ///////////
GUI.prototype.$input = function(pin) {
	var id = this.pin_id(pin);
	if (!this.$inputs[id]) {
		var $pin = this.dumpPin(pin);
		$pin.$el.addClass('input');
		$pin.kind = 'input';
		this.$inputs[id] = $pin;
		this.displayPinValue(pin);
		this.displayPinName(pin);
		this.displayPinType(pin);
	}
	return this.$inputs[id];
}
GUI.prototype.patch_input_added = function(pin) {
	var $pin = this.$input(pin);
	this.$thing(pin.parent).$inputs.append($pin.$el);
	gui.fixThingConnections(pin.thing);
}
GUI.prototype.patch_input_changed = function(pin) {
	var $old =this.$input(pin).$el;
	delete this.$inputs[this.pin_id(pin)];
	$old.replaceWith(this.$input(pin).$el);
}
GUI.prototype.patch_input_updated = function(pin) {
	this.displayPinValue(pin);
}
GUI.prototype.patch_input_removed = function(pin) {
	this.$input(pin).$el.remove();
	delete this.$inputs[this.pin_id(pin)];
}
/////// O U T P U T S  ///////////
GUI.prototype.$output = function(pin) {
	var id = this.pin_id(pin);
	if (!this.$outputs[id]) {
		var $pin = this.dumpPin(pin);
		$pin.kind = 'output';
		$pin.$el.addClass('output');
		this.$outputs[id] = $pin;
		this.displayPinValue(pin);
		this.displayPinName(pin);
		this.displayPinType(pin);
	}
	return this.$outputs[id];
}

GUI.prototype.patch_output_added = function(pin) {
	var $pin = this.$output(pin);
	this.$thing(pin.parent).$outputs.append($pin.$el);
	gui.fixThingConnections(pin.thing);
}
GUI.prototype.patch_output_changed = function(pin) {
	var $old =this.$output(pin).$el;
	delete this.$outputs[this.pin_id(pin)];
	$old.replaceWith(this.$output(pin).$el);
}
GUI.prototype.patch_output_updated = function(pin) {
	this.displayPinValue(pin);
}
GUI.prototype.patch_output_removed = function(pin) {
	this.$output(pin).$el.remove();
	delete this.$outputs[this.pin_id(pin)];
}

////// C O N N E C T I O N S /////////
GUI.prototype.connection_id = function (from,to) {
	return this.pin_id(from)+'||'+this.pin_id(to);
}
GUI.prototype.connection = function(from,to) {
	var id = this.connection_id(from,to);
	if (!this.connections[id]) {
		var gui = this;
		var connection = $(document.createElementNS('http://www.w3.org/2000/svg','path'))
		.attr({
			'class': 'connection',
			'stroke-width': 1,
			'stroke-linecap': 'square',
			'stroke': 'black',
			'fill': 'none'
		})
		.click(function() {
			if (gui.ctrlKey) {
				gui.pushState();
				from.disconnect(to);
			}
		})
		.get(0);

		connection.from = from; 
		connection.to = to; 
		this.$output(from).$el.addClass('connected').removeClass('disconnected');
		this.$input(to).$el.addClass('connected').removeClass('disconnected');
	
		this.connections[id] = connection;
	}
	return this.connections[id];
}
GUI.prototype.patch_connected = function(from,to) {
	if (!this.$outputs[this.pin_id(from)] || ! this.$inputs[this.pin_id(to)]) return;
	var connection = this.connection(from,to);
	this.$connectionContainer.append(connection);
	arrayAddItem(this.$thing(from.parent).connections, connection);
	arrayAddItem(this.$thing(to.parent).connections, connection);
	this.fixConnection(connection);
}
GUI.prototype.patch_disconnected = function(from,to) {
	var connection = this.connection(from,to);
	console.log('disc',from,to);
	
	arrayRemoveItem(this.$thing(from.parent).connections,connection);
	arrayRemoveItem(this.$thing(to.parent).connections,connection);

	$(connection).remove();
	
	if(from.outgoing.length==0) this.$output(from).$el.removeClass('connected').addClass('disconnected');
	this.$input(to).$el.removeClass('connected').addClass('disconnected');
	delete this.connections[this.connection_id(from,to)];
}
GUI.prototype.fixConnection = function(c) {
	var oo = this.offset;
	var left = this.$canvas.scrollLeft()-oo.left;
	var top = this.$canvas.scrollTop()-oo.top;
	
	var $r1 = this.$output(c.from).$connector;
	var $r2 = this.$input(c.to).$connector;
	var o1 = $r1.offset();
	var o2 = $r2.offset();
	var x1 = Math.round(o1.left + $r1.width() + left);
	var y1 = Math.round(o1.top + $r1.height()/2 + top);
	var x2 = Math.round(o2.left + left);
	var y2 = Math.round(o2.top + $r2.height()/2 + top);
	var dx = 50;
	var d = Math.sqrt( (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1) );
	if (x2>x1 && x2-x1<=dx * 2) {
		dx = (x2-x1)/2;
		$(c).attr({
			d: 	 'M'+x1+','+y1
				+'C'+(x1+dx)+','+y1
				+','+(x2-dx-5)+','+y2
				+','+(x2-5)+','+y2
				+'L'+x2+','+y2
//				+'L'+(x2-5)+','+(y2-1.5)
//				+'L'+(x2-5)+','+(y2+1.5)
//				+'L'+(x2)+','+(y2)
		})
	}
	else if (x2 > x1+dx ) {
		$(c).attr({
			d: 	 'M'+x1+','+y1
				+'C'+(x1+dx)+','+y1
				+','+(x2-dx)+','+y2
				+','+(x2-5)+','+y2
				+'L'+x2+','+y2
//				+'L'+(x2-5)+','+(y2-2)
//				+'L'+(x2-5)+','+(y2+2)
//				+'L'+(x2)+','+(y2)
			
		})
	} else {
		var st = this.$canvas.scrollTop();
		var $t1 = $r1.closest('.thing');
		var t1 = $t1.offset();
		t1.height = $t1.height();
		t1.top= top+t1.top;

		var $t2 = $r2.closest('.thing');
		var t2 = $t2.offset();
		t2.top= top+t2.top;
		t2.height = $t2.height(); 

		var $p1 = $r1.closest('.thing-outputs');
		var p1 = $p1.offset();
		p1.top = top+p1.top;
		p1.height = $p1.height(); 

		var $p2 = $r2.closest('.thing-inputs');
		var p2 = $p2.offset();
		p2.top = top+p2.top;
		p2.height = $p2.height(); 

		var fromTop1 = Math.round(o1.top - p1.top + top);
		var fromBottom1 = Math.round(p1.top + p1.height - o1.top - top);
		var fromTop2 = Math.round(o2.top - p2.top +top);
		var fromBottom2 = Math.round(p2.top + p2.height - o2.top - top);

		console.log(fromTop1,fromTop2,fromBottom1,fromBottom2);
		console.log(t1.top,t1.height,t2.top,t2.height);
		x1+=0.5;
		x2+=0.5;
		if (y2 > y1 ) { // going down
			var xx1 = x1+fromBottom1/2+10;
			var xx2 = x2-fromTop2/2-10;
			var yy	= t1.top + t1.height + fromBottom1/2+10;
			
			var dy = 1;
		} else {
			var xx1 = x1+fromTop1/2+10;
			var xx2 = x2-fromBottom2/2-10;
			var yy	= t1.top-fromTop1/2-10;
			var dy = -1;
		}
		
		console.log(y1,y2,yy,t1.top + t1.height);
		$(c).attr({
			d: 	 'M'+	(x1)	+' '+	(y1)
				+'L'+	(xx1-1)	+' '+	(y1)
				+'T'+	(xx1)	+' '+	(y1+dy)
				+'L'+	(xx1)	+' '+	(yy-dy)
				+'T'+	(xx1-1)	+' '+	(yy)
				+'L'+	(xx2+1)	+' '+	(yy)
				+'T'+	(xx2)	+' '+	(yy+dy)
				+'L'+	(xx2)	+' '+	(y2-dy)
				+'T'+	(xx2+1)	+' '+	(y2)
				+'L'+	(x2)	+' '+	(y2)
		})
	}
}
GUI.prototype.fixConnections = function(cc) {
	for (var i in cc) {
		this.fixConnection(cc[i]);
	}
}
GUI.prototype.fixThingConnections = function(thing) {
	this.fixConnections(this.$thing(thing).connections);
}
/////// O T H E R ///////////
GUI.prototype.patch_circular = function() {
	console.log('circular');
};
