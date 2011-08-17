////// DISPLAY & EDIT ///////

GUI.prototype.displayThingName = function(t) {
	var $thing = this.$thing(t);
	$thing.$name
	.addClass('display')
	.removeClass('edit')
	.text(t.name);
}
GUI.prototype.displayPatchName = function() {
	this.$tab.text(this.patch.name);
}
GUI.prototype.editPatchName = function() {
	this.$tab.text(this.patch.name);
	var gui = this;
	GUI.editors.name.apply(this,[this.$tab,this.patch.name,function(value) {
		gui.pushState();
		gui.patch.rename(value);
	}, function() {
		gui.displayPatchName();
	}]);
}
GUI.prototype.editThingName = function(thing) {
	var gui = this;
	var $thing = this.$thing(thing);
	$thing.$name.addClass('edit').removeClass('display');
	GUI.editors.name.apply(this,[$thing.$name,thing.name,function(value) {
		gui.pushState();
		thing.rename(value);
	}, function() {
		gui.displayThingName(thing);
	}]);
}

GUI.prototype.displayPinName = function(pin) {
	var $pin = this.$pin(pin);
	$pin.$name
	.addClass('display')
	.removeClass('edit')
	.html(pin instanceof Input ? '<span class="thing-editor">$</span>' + pin.name : pin.name);
}
GUI.prototype.editPinName = function(pin) {
	var gui = this;
	var $pin = this.$pin(pin);
	
	$pin.$name
	.addClass('edit')
	.removeClass('display');
	
	GUI.editors.name.apply(this,[$pin.$name,pin.name,function(value) {
		gui.pushState();
		pin.rename(value);
	}, function() {
		gui.displayPinName(pin);
	}]);
}

GUI.prototype.displayPinType = function(pin) {
	var gui = this;
	var $pin = this.$pin(pin);
	$pin.$type
	.addClass('display')
	.removeClass('edit')
	.html(pin.type);
}
GUI.prototype.editPinType = function(pin) {
	var gui = this;
	var $pin = this.$pin(pin);
	$pin.$type.addClass('edit').removeClass('display');
	GUI.editors.type.apply(this,[$pin.$type,pin.type,function(value) {
		gui.pushState();
		pin.setType(value);
		gui.patch.evalAll();
	}, function() {
		gui.displayPinType(pin);
	}]);
}


GUI.prototype.displayPinValue = function(pin) {
	if (pin.thing.patch != this.patch) return;
	if (!pin.parent.extra.develop && (pin.extra.hidden || pin.extra.hideValue)) return;
	var type = GUI.types[pin.type] || GUI.types.value; 
	var $pin = this.$pin(pin);
	$pin.$value
	.addClass('display')
	.removeClass('edit');
	if ( type && type.display) {
		type.display.apply(this,[$pin.$value,pin.value]);
	} else {
		GUI.types.value.display.apply(this,[$pin.$value,pin.value]);
	}
	if (type.big) {
		//gui.fixThingConnections(pin.parent);
		$pin.$value.addClass('big');
	}
}
GUI.prototype.editInput = function(pin) {
	if (pin.incoming) return;
	var gui = this;
	var type = GUI.types[pin.type];
	if (type && !type.edit) return;
	var $pin = this.$pin(pin);
	$pin
	.$value
	.removeClass('display')
	.addClass('edit');
	if (type) {
		type.edit.apply(this,[$pin.$value,pin.value,function(value) {
			gui.pushState();
			pin.set(value);
			if (type.reedit) {
				gui.editInput(pin);
			}
		}, function() {
			gui.displayPinValue(pin);
		}]);	
	} else {
		GUI.types.value.edit.apply(this,[$pin.$value,pin.value,function(value) {
			gui.pushState();
			pin.set(value);
			gui.patch.evalAll();
		}]);
	}
}
GUI.prototype.editOutput = function(pin) {
	var $pin = this.$pin(pin);
	$pin.$value.removeClass('display').addClass('edit');
	GUI.editors.expr.apply(this,[$pin.$value,pin.expr,function(value) { 
		gui.pushState();
		pin.set(value);
		gui.patch.evalAll();
		gui.displayPinValue(pin);
	}, function() {
		gui.displayPinValue(pin);
	}]);	
}

//// SELECTION ////


GUI.prototype.selectThing = function(thing) {
	this.selectedThings[thing.index] = thing;
	this.$thing(thing).$el.addClass('selected');
}
GUI.prototype.selectThings = function(things) {
	for (var i in things) {
		this.selectThing(things[i]);
	}
}
GUI.prototype.deselectThing = function(thing) {
	delete this.selectedThings[thing.index];
	this.$thing(thing).$el.removeClass('selected');
}
GUI.prototype.isThingSelected = function(thing) {
	return !!this.selectedThings[thing.index];
}
GUI.prototype.toggleSelectThing = function(thing) {
	if (this.isThingSelected(thing)) this.deselectThing(thing);
	else this.selectThing(thing);
}
GUI.prototype.deselectAllThings = function() {
	this.selectedThings = {};
	this.$thingContainer.find('.thing.selected').removeClass('selected');
}
GUI.prototype.findThingsRect = function(l,t,r,b) {
	var found = {};
	for (var i in this.$things) {
		var $thing = this.$things[i];
		var thing = $thing.thing;
		var o = $thing.$el.offset();
		if(
			o.left > l && o.left + $thing.$el.width() < r 
		&&	o.top > t && o.top + $thing.$el.height() < b 
		) found[thing.index]=thing;
	}
	return found;
}	

/// PIN SELECTION ///

GUI.prototype.selectPin = function(pin) {
	this.deselectPin();
	this.selectedPin = pin;
	this.$pin(pin).$el.addClass('selected');
}

GUI.prototype.deselectPin = function() {
	if (!this.selectedPin) return;
	this.$pin(this.selectedPin).$el.removeClass('selected');
	this.selectedPin = null;
}

//// EDIT THING ////
GUI.prototype.toggleEditThing = function(thing) {
	var $thing = this.$thing(thing);
	var width = $thing.$el.width();
	if (thing.extra.develop) {
		thing.extra.develop = false;
		$thing.$el.addClass('display').removeClass('edit');
	} else {
		thing.extra.develop = true;
		$thing.$el.addClass('edit').removeClass('display');
	}
	var delta = $thing.$el.width()-width;
	thing.x-=delta;
	$thing.$el.css('left',thing.x);
	this.fixThingConnections(thing);
}

GUI.prototype.toggleMinimizeThing = function(thing, toggle) {
	var set = arguments.length>1 ? toggle : !thing.extra.minimized;
	var $thing = this.$thing(thing);
	var width = $thing.$el.width();
	if (set) {
		$thing.$el.addClass('minimized').removeClass('normal');
		$thing.$name.css('top',($thing.$el.height()-$thing.$name.height())/2+1);
		thing.extra.minimized = true;
	} else {
		$thing.$el.addClass('normal').removeClass('minimized');
		thing.extra.minimized = false;
		$thing.$name.css('top',0);
	}
	console.log(toggle);
	var delta = $thing.$el.width()-width;
	this.fixThingConnections(thing);
}
///////// M E N U S /////////
GUI.prototype.showMenu = function(x,y,menu) {
	var me = this;
	var $menu = $('<div class="menu"></div>');
	for (var i in menu) {
		if (menu[i]=='-') {
			$('<div class="menu-separator"></div>').appendTo($menu);
		} else {
			(function(item) {
				$('<div class="menu-item">'+item.label+'</div>').click(function(e) {
					console.log('wtf');
					item.action.apply(this,arguments);
					me.hideMenu();
					e.stopPropagation();
					e.preventDefault();
				}).appendTo($menu);
			})(menu[i])
		}
	}
	$menu.css({left:x+this.offset.left,top:y+this.offset.top}).appendTo('#menus');
	$('#menus').css('display','block');
}

GUI.prototype.hideMenu = function() {
	$('#menus').css('display','none').empty();
}
