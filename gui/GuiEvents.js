$.fn.flashOpacity = function() {
	var j = this;
	this
	.css({opacity:1})
	.animate(
		{opacity:0.5},
		500,
		function() {
			this.style.opacity=null;
		}
	);
}

GUI.prototype.registerEvents = function () {
	this.registerGlobalEvents();
	this.registerBackgroundEvents();
	this.registerThingEvents();
	this.registerPinEvents();
	this.registerConnectorEvents();
}

GUI.prototype.registerBackgroundEvents = function() {
	var gui = this;
	var $selection =
	$('<div></div>')
	.addClass('selection')
	.css({
		position:'absolute',
		background:'rgba(255,255,200,0.3)',
		border:'#ffa solid 1px',
		borderRadius:'3px',
		zIndex:100000
	});
	var dragging = false;
	var panning = false;
	var ox = 0;
	var oy = 0;
	this.$connectionContainer
	.mousedown(function(e,d) {
		dragging = false;
		panning = false;
		e.preventDefault();
	})
	.drag('init',function(e,d) {
		if (e.which == 3) return false;
	},{which:0})
	.drag('start',function(e,d) {
		dragging = true;
		if (gui.altKey || e.which == 2) {
			panning = true;
			gui.$canvas.addClass('gui-panning');
			ox = gui.$canvas.scrollLeft();
			oy = gui.$canvas.scrollTop();
		} else {
			$selection
			.css({
				left: d.startX,
				top: d.startY,
				width:0,
				height:0,
			})
			.appendTo(gui.$canvas);
			ox = gui.$canvas.scrollLeft() - gui.offset.left;
			oy = gui.$canvas.scrollTop() - gui.offset.top;
		}
	},{which:0})
	.drag(function(e,d) {
		if (panning) {
			gui.$canvas.scrollLeft(ox-d.deltaX);
			gui.$canvas.scrollTop(oy-d.deltaY);
		} else {
			$selection.css({
				left: Math.min(d.startX,d.startX+d.deltaX)+ox,
				top: Math.min(d.startY,d.startY+d.deltaY)+oy,
				height: Math.abs(d.deltaY),
				width: Math.abs(d.deltaX)
			})
		}
	},{which:0})
	.drag('end',function(e,d) {
		if (panning) {
			gui.$canvas.removeClass('gui-panning');
		} else {
			$selection.remove();
			var l = Math.min(d.startX,d.startX+d.deltaX);
			var r = l + Math.abs(d.deltaX) + 1;
			var t = Math.min(d.startY,d.startY+d.deltaY);
			var b = t + Math.abs(d.deltaY) + 1;
			var things = gui.findThingsRect(l,t,r,b);
			if (gui.shiftKey) {
				for (var i in things) {
					gui.selectThing(things[i]);
				}
			} else if (gui.ctrlKey) {
				for (var i in things) {
					gui.deselectThing(things[i]);
				}
			} else {
				gui.deselectAllThings();
				gui.selectThings(things);
			}
		}
	},{which:0})
	.click(function() {
		if (!dragging)  {
    		gui.deselectAllThings();
    		gui.deselectPin();
    		$(':focus').blur();
    	}
    });	
}
GUI.prototype.registerThingEvents = function() {
	var gui = this;
	var dragging = false;
    var dragged;
    var $dragged;
    var draggedConnections;
	var lastX;
	var lastY;
    this.$thingContainer
    .delegate('.thing ','contextmenu',function(e,d) {
    	var $this = $(this);
    	var thing = $this.closest('.thing').data('thing');
		var menu = [];

		menu.push($this.is('.minimized') ? 'show details' : 'hide details', {
			label: "rename thing",
			action: function() {
				gui.pushState();
				gui.toggleMinimizeThing(thing);
			},
		});

		
		menu.push({
			label: "rename thing",
			action: function() {
				gui.editThingName(thing);
			},
		});
		if ($this.is('.selected')) {
			var n = 0;
	    	for (var i in gui.selectedThings);
		}

		menu.push('-');
		if (thing.type) {
			menu.push({
				label: "make unique",
				action: function() {
					gui.pushState();
					thing.type = undefined;
					//TODO: make handlers for thing changes, and redraw the damn thing
					 $this.closest('.thing').removeClass('instance').addClass('unique');
				},
			});
		} else {
			if ($this.is('.edit')) {
				menu.push({
					label: "save to library",
					action: function() {
						var name = prompt('saving to library\nchoose a name',thing.name);
						if(name) GUI.saveToLib(thing,name);
					},
				});
				menu.push('-');
				menu.push({
					label: "add input",
					action: function() {
						var pin = thing.addInput('input');
						gui.editPinName(pin);
					},
				});
				menu.push({
					label: "add output",
					action: function() {
						var pin = thing.addOutput('output');
						gui.editPinName(pin);
					},
				});
			}
		}

		menu.push('-');
		menu.push({
			label: "remove thing",
			action: function() {
		   		gui.pushState();
				thing.remove();
			},
		});
		
		gui.showMenu(e.pageX-gui.offset.left,e.pageY-gui.offset.top,menu);
		e.stopPropagation();
		e.preventDefault();
    })
    .delegate('.thing ','mousedown',function(e,d) {
    	dragging = false;
    })
    .delegate('.thing ','dragstart',function(e,d) {
    	dragging = true;
    	var thing = $(this).closest('.thing').data('thing');
    	if (!gui.isThingSelected(thing)) {
    		gui.deselectAllThings();
    		gui.selectThing(thing);
    	}
    	var cc = [];
		for (var i in gui.selectedThings) {
			cc = cc.concat(gui.$thing(gui.selectedThings[i]).connections);
		}
		cc.reduce(function(a,b) {
			if (a.indexOf(b)==-1) a.push(b);
			return a;
		},[]);
		draggedConnections = cc;
		lastX = d.offsetX;
		lastY = d.offsetY; 

    })
   .delegate('.thing ','drag',function(e,d) {
   		var deltaX = d.offsetX - lastX;
   		var deltaY = d.offsetY - lastY;
   		lastX = d.offsetX;
   		lastY = d.offsetY;
   		for (var i in gui.selectedThings) {
   			var thing = gui.selectedThings[i];
   			thing.x += deltaX;
   			thing.y += deltaY;
   			gui.$thing(thing).$el.css({
				top: thing.y,
				left: thing.x
			});
		};
		gui.fixConnections(draggedConnections);
    })
   .delegate('.thing ','dragend',function(e,d) {
		gui.pushState();
	})
 	.delegate('.thing.selected .thing-name.display','mouseup',function(e) {
		if(dragging) return;
    	var thing = $(this).closest('.thing').data('thing');
    	gui.editThingName(thing);
    })
 	.delegate('.thing.kind-patch','dblclick',function(e) {
    	var thing = $(this).closest('.thing').data('thing');
    	new GUI(thing);
    })
	.delegate('.thing','click',function(e) {
		if(dragging) return;
		console.log('thing click');
    	var $thing = $(this).closest('.thing');
    	var thing = $thing.data('thing');
    	if (e.shiftKey) {
			$thing.css('z-index',++gui.zTop);
			gui.toggleSelectThing(thing);
	    } else {
			gui.deselectAllThings();
			$thing.css('z-index',++gui.zTop);
			gui.selectThing(thing);
		}
    	e.stopPropagation();
    })
   .delegate('.thing .thing-remove','click',function(e) {
    	var thing = $(this).closest('.thing').data('thing');
    	thing.remove();
		gui.pushState();
    	e.stopPropagation();
    })
   .delegate('.thing .thing-edit','click',function(e) {
    	var thing = $(this).closest('.thing').data('thing');
    	gui.toggleEditThing(thing);
    	e.stopPropagation();
		console.log('thing click');

    })
   .delegate('.thing .thing-minimize','click',function(e) {
    	var thing = $(this).closest('.thing').data('thing');
    	gui.toggleMinimizeThing(thing);
    	e.stopPropagation();
    })
   .delegate('.thing .thing-unminimize','click',function(e) {
    	var thing = $(this).closest('.thing').data('thing');
    	gui.toggleMinimizeThing(thing);
    	e.stopPropagation();
    })
   .delegate('.thing .thing-add-input','click',function(e) {
    	var thing = $(this).closest('.thing').data('thing');
    	var pin = thing.addInput('input');
    	gui.editPinName(pin);
    	e.stopPropagation();
    })
   .delegate('.thing .thing-add-output','click',function(e) {
    	var thing = $(this).closest('.thing').data('thing');
    	var pin = thing.addOutput('output');
    	gui.editPinName(pin);
    	e.stopPropagation();
    })
    .delegate('.thing .edit','keydown', function(e) {
    	e.stopPropagation();
    })
   .delegate('.thing .edit','keypress', function(e) {
    	e.stopPropagation();
    })
   .delegate('.thing .edit','keyup', function(e) {
    	e.stopPropagation();
    });
}

GUI.prototype.registerConnectorEvents = function () {
	var gui = this;
	this.$thingContainer    
    .delegate('.thing .pin.input .pin-connector','click', function(e) {
    	var pin = $(this).closest('.pin').data('pin');
		if (!gui.selectedPin) {
			gui.selectPin(pin);
		} else {
			if (gui.selectedPin instanceof Output) {
				gui.selectedPin.connect(pin);
				gui.pushState();
			}
			gui.deselectPin();
		}
	})
	.delegate('.thing .pin.output .pin-connector','click', function(e) {
    	var pin = $(this).closest('.pin').data('pin');
		if (!gui.selectedPin) {
			gui.selectPin(pin);
		} else {
			if (gui.selectedPin instanceof Input) {
				gui.selectedPin.connect(pin);
				gui.pushState();
			}
			gui.deselectPin();
		}
	})
}
GUI.prototype.registerPinEvents = function () {
	var gui = this;
	this.$thingContainer    
	.delegate('.thing.edit .pin .pin-type.display','click',function(e) {
    	var pin = $(this).closest('.pin').data('pin');
    	gui.editPinType(pin);
    })
	.delegate('.thing.edit .pin .pin-name.display','click',function(e) {
    	var pin = $(this).closest('.pin').data('pin');
    	gui.editPinName(pin);
    })
    .delegate('.thing.kind-node.edit .pin.output .pin-value.display','click',function(e) {
    	var pin = $(this).closest('.pin').data('pin');
    	gui.editOutput(pin);
    })
/*
    .delegate('.thing .pin.input.disconnected .pin-value.display','click',function(e) {
    	var pin = $(this).closest('.pin').data('pin');
    	gui.editInput(pin);
    })
*/    .delegate('.thing .pin.input.disconnected .pin-value.display','mouseenter',function(e) {
		var $this = $(this);
    	var pin = $this.closest('.pin').data('pin');
    	gui.editInput(pin);
    })
    .delegate('.thing .pin .pin-value','mouseenter',function(e) {
		var $this = $(this);
    	var pin = $this.closest('.pin').data('pin');
    	$this.attr('title',String(pin.value));
    })
    .delegate('.thing .pin.input.disconnected .pin-value.edit:not(:has(:focus))','mouseleave',function(e) {
    	var pin = $(this).closest('.pin').data('pin');
    	gui.displayPinValue(pin);
    })
/**/
    .delegate('.thing .pin-hide','click',function(e) {
    	var pin = $(this).closest('.pin').data('pin');
    	pin.setExtra('hidden',!pin.extra.hidden);
		gui.pushState();
    })
    .delegate('.thing .pin-hide-value','click',function(e) {
    	var pin = $(this).closest('.pin').data('pin');
    	pin.setExtra('hideValue',!pin.extra.hideValue);
		gui.pushState();
    })
    .delegate('.thing .pin .pin-remove','click',function(e) {
    	var pin = $(this).closest('.pin').data('pin');
    	pin.remove();
		gui.pushState();
    })
	.delegate('.thing.display .pin','contextmenu',function(e,d) {
		var $this = $(this);
    	var pin = $this.closest('.pin').data('pin');
    	var menu = [];
    	if ($this.is('.disconnected')) {
			menu.push({
				label: "disconnect",
				action: function() {
					gui.pushState();
					pin.disconnect;
				},
			})
		}
    	if ($this.is('.normal')) {
			menu.push({
				label: pin.extra.hideValue ? "show value" : "hide value",
				action: function(){
					gui.pushState();
					pin.setExtra('hideValue', !pin.extra.hideValue);
				}
			});
		}
		gui.showMenu(e.pageX-gui.offset.left,e.pageY-gui.offset.top,menu);
		e.stopPropagation();
		e.preventDefault();
    })
	.delegate('.thing.edit .pin','contextmenu',function(e,d) {
		var $this = $(this);
    	var pin = $this.closest('.pin').data('pin');
    	var kind = $this.is('.input') ? 'input' : 'output';
    	var menu = [];
    	menu.push({
			label: "disconnect",
			action: function() {
				gui.pushState();
				pin.disconnect();
			},
		});
		menu.push('-');
		if (!$this.closest('.thing').is('.minimized')) {
			menu.push({
				label: "rename pin",
				action: function(){
					gui.editPinName(pin);
				}
			});
			menu.push({
				label: "change pin type",
				action: function(){
					gui.editPinType(pin);
				}
			});
		}
		if (kind=='input') menu.push({
			label: 'edit value',
			action: function(){
				gui.editInput(pin);
			}
		}); else if (pin.thing.kind == 'node') menu.push({
			label: 'edit expression',
			action: function(){
				gui.pushState();
				gui.editOutput(pin);
			}
		});
		menu.push('-');
		menu.push({
			label: pin.extra.hideValue ? "show value" : "hide value",
			action: function(){
				gui.pushState();
				pin.setExtra('hideValue', !pin.extra.hideValue);
			}
		});
		menu.push({
			label: pin.extra.hidden ? "show pin" : "hide pin",
			action: function() {
				pin.setExtra('hidden', !pin.extra.hidden);
			},
		});
		menu.push({
			label: pin.extra.hideConnector ? "show connector" : "hide connector",
			action: function() {
				pin.setExtra('hideConnector', !pin.extra.hideConnector);
			},
		});
		menu.push('-');
		menu.push({
			label: "remove pin",
			action: function(){
				gui.pushState();
				pin.remove();				
			}
		});

		gui.showMenu(e.pageX-gui.offset.left,e.pageY-gui.offset.top,menu);
		e.stopPropagation();
		e.preventDefault();
    })
}
GUI.prototype.registerGlobalEvents = function() {
	var gui = this;
    $(document)
	.keyup(function(e) {
		if(GUI.focusedGUI != gui) return;
    	switch(e.which) {
    	case 17: 
    		gui.ctrlKey = false;
    		gui.$wrap.removeClass('gui-ctrl');
    		break;
    	case 16: 
    		gui.shiftKey = false;
    		gui.$wrap.removeClass('gui-shift');
    		break;
    	case 18:
    		gui.altKey = false;
    		gui.$wrap.removeClass('gui-alt');
    		break;
    	}
    })
    .keydown(function(e){
		if(GUI.focusedGUI != gui) return;
		//if(e.target!=window) return;
    	switch(e.which) {
    	case 16: 
    		gui.shiftKey = true;
    		gui.$wrap.addClass('gui-shift');
    		break;
    	case 17: 
    		gui.ctrlKey = true;
    		gui.$wrap.addClass('gui-ctrl');
    		break;
    	case 18:
    		gui.altKey = true;
    		gui.$wrap.addClass('gui-alt');
    		break;
    	case 46:
    		gui.patch.removeThings(gui.selectedThings);
	   		gui.pushState();
    		break;
    	}
    	if (gui.ctrlKey) { 
    		switch (e.which) {
			case 67:
				// C - copy
				gui.patch.copyThings(gui.selectedThings);
				break;
			case 68:
				// D - duplicate
				var things = gui.patch.duplicateThings(gui.selectedThings,gui.mouseX,gui.mouseY);
				gui.pushState();
				gui.deselectAllThings();
				gui.selectThings(things);
				break;
			case 71:
				// G - pack/unpack
				if (gui.shiftKey) {
					for (var i in gui.selectedThings) {
						if (gui.selectedThings[i].kind == 'patch') {
							var things = gui.patch.unpack(gui.selectedThings[i],gui.mouseX,gui.mouseY);
							gui.deselectAllThings();
							gui.selectThings(things);
						}
					}
				} else {
					var patch = gui.patch.pack(gui.selectedThings,gui.mouseX,gui.mouseY);
					gui.deselectAllThings();
					gui.selectThing(patch);
				}
				gui.pushState();
				break;
			case 86:
				// V - paste
				gui.deselectAllThings();
				var things = gui.patch.pasteThings(gui.mouseX,gui.mouseY);
				gui.selectThings(things);
				gui.pushState();
				break;
			case 88:
				//X - cut
				gui.patch.cutThings(gui.selectedThings);
				gui.pushState();
				break;
			case 89:
				//Y - redo
				gui.redo();
				break;
			case 90:
				//Z - undo
				gui.undo();
				break;
			case 77: 
				//M - add node
				gui.deselectAllThings();
				var p = gui.patch.addThing(new Node,gui.mouseX,gui.mouseY);
				p.addInput('a',0);
				p.addInput('b',0);
				p.addOutput('output','$a+$b');
				gui.selectThing(p);
				gui.pushState();
				break;
			case 83:
				// S - save
				localStorage.test = JSON.stringify(gui.patch.serialize());
				gui.$toolbar.find('.patch-save').flashOpacity();
				break;
			case 79:
				// O - open
				gui.new();
				gui.patch._deserialize(JSON.parse(localStorage.test));
				break;
			default: 
				return;
			}
			e.preventDefault();
		}
    })
    .mousemove( function(e) {
    	gui.mouseX = e.pageX-gui.offset.left+gui.$canvas.scrollLeft();
    	gui.mouseY = e.pageY-gui.offset.top+gui.$canvas.scrollTop();

		if (gui.shiftKey != e.shiftKey) gui.$wrap.toggleClass('gui-shift',gui.shiftKey=e.shiftKey);
		if (gui.ctrlKey != e.ctrlKey) gui.$wrap.toggleClass('gui-ctrl',gui.ctrlKey=e.ctrlKey);
		if (gui.altKey != e.altKey) gui.$wrap.toggleClass('gui-alt',gui.altKey=e.altKey);
    })
    .mousewheel( function(e,delta) {
    	if (!e.shiftKey) return;
    	var $p = $('.patch-canvas');
    	$p.css('font-size',parseInt($p.css('font-size'))+delta);
    	gui.fixConnections(gui.connections);
    	e.preventDefault();
    });
    
    this.$wrap
	.delegate('.patch-toolbar .patch-close','click',function() {
		gui.close();
	})
	.delegate('.patch-toolbar .patch-save','click',function() {
		$(this).flashOpacity();
		gui.save('root');
	})
	.delegate('.patch-toolbar .patch-revert','click',function() {
		gui.patch.root.handlers.open('root');
	})
	.delegate('.patch-toolbar .patch-undo','click',function() {
		gui.undo();
	})
	.delegate('.patch-toolbar .patch-redo','click',function() {
		gui.redo();
	})
	.delegate('.patch-toolbar .patch-cut','click',function() {
		gui.patch.cutThings(gui.selectedThings);
		gui.pushState();
	})
	.delegate('.patch-toolbar .patch-copy','click',function() {
		gui.patch.copyThings(gui.selectedThings);
	})
	.delegate('.patch-toolbar .patch-paste','click',function() {
		gui.deselectAllThings();
		var things = gui.patch.pasteThings(gui.mouseX,gui.mouseY);
		gui.selectThings(things);
		gui.pushState();
	})
	.delegate('.patch-toolbar .patch-duplicate','click',function() {
		var things = gui.patch.duplicateThings(gui.selectedThings,gui.mouseX,gui.mouseY);
		gui.deselectAllThings();
		gui.selectThings(things);
		gui.pushState();
	})
	.delegate('.patch-toolbar .patch-new-node','click',function() {
		gui.deselectAllThings();
		var p = gui.patch.addThing(new Node,gui.mouseX,gui.mouseY);
		gui.selectThing(p);
		gui.editThingName(p);
		gui.pushState();
	})
	.delegate('.patch-toolbar .patch-new-patch','click',function() {
		gui.deselectAllThings();
		var p = gui.patch.addThing(new Patch,gui.mouseX,gui.mouseY);
		gui.selectThing(p);
		gui.editThingName(p);
		gui.pushState();
	})
	.delegate('.patch-toolbar .patch-new-pipe','click',function() {
		gui.deselectAllThings();
		var p = gui.patch.addThing(new Pipe,gui.mouseX,gui.mouseY);
		gui.selectThing(p);
		gui.editThingName(p);
		gui.pushState();
	})
	.delegate('.patch-toolbar .patch-pack','click',function() {
		var patch = gui.patch.pack(gui.selectedThings,gui.mouseX,gui.mouseY);
		gui.deselectAllThings();
		gui.selectThing(patch);
		gui.pushState();
	})
	.delegate('.patch-toolbar .patch-unpack','click',function() {
		for (var i in gui.selectedThings) {
			if (gui.selectedThings[i].kind == 'patch') {
				var things = gui.patch.unpack(gui.selectedThings[i],gui.mouseX,gui.mouseY);
				gui.deselectAllThings();
				gui.selectThings(things);
			}
		}
		gui.pushState();
	})
	.delegate('.patch-toolbar .patch-lib-save','click',function() {
		var thing = null;
		for (var i in gui.selectedThings) {
			if (thing) return;
			thing = gui.selectedThings[i];
		}
		if (!thing) return;
		var name = prompt('saving to library\nchoose a name',thing.name);
		if(name) GUI.saveToLib(thing,name);
	})
	.delegate('.patch-toolbar .patch-open','click',function() {
		for (var i in gui.selectedThings) {
			if (gui.selectedThings[i].kind == 'patch') {
		    	new GUI(thing);
			}
		}
	})
	.delegate('.patch-toolbar .patch-delete','click',function() {
   		gui.patch.removeThings(gui.selectedThings);
   		gui.pushState();
	})
	.delegate('.run-play','click',function() {
		Patch.play();
	})
	.delegate('.run-toolbar .run-pause','click',function() {
		Patch.stop();
	});
	$('#menus').mousedown(function(e){if(e.target==this) gui.hideMenu()});
}
