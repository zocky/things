GUI = function(patch){
    var gui = this;
    this.$container = $('#patches');
    this.$tab = $('<button class="patch-tab"></div>')
    .appendTo('#tabs')
    .click(function() {
    	gui.setFocus();
    });
    
    this.$wrap = $('<div class="patch-wrap"></div>').appendTo(this.$container);
	this.$toolbar = $(
		'<div class="toolbar patch-toolbar">'
	+	'<button title="close patch [ctrl-Q]" class="patch-close"><img src="gui/img/patch-close.png"/></button>'
	+	'<span class="patch-toolbar-separator"></span>'
	+	'<button title="save all [ctrl+S]" class="patch-save"><img src="gui/img/save.png"/></button>'
	+	'<button title="revert to last saved [ctrl+U]" class="patch-revert"><img src="gui/img/revert.png"/></button>'
	+	'<span class="patch-toolbar-separator"></span>'
	+	'<button title="undo [ctrl+Z]" class="patch-undo"><img src="gui/img/undo.png"/></button>'
	+	'<button title="redo [ctrl+Y]" class="patch-redo"><img src="gui/img/redo.png"/></button>'
	+	'<span class="patch-toolbar-separator"></span>'
	+	'<button title="cut [ctrl+X]" class="patch-cut"><img src="gui/img/cut.png"/></button>'
	+	'<button title="copy [ctrl+C]" class="patch-copy"><img src="gui/img/copy.png"/></button>'
	+	'<button title="paste [ctrl+V]" class="patch-paste"><img src="gui/img/paste.png"/></button>'
	+	'<span class="patch-toolbar-separator"></span>'
	+	'<button title="delete [del]" class="patch-delete"><img src="gui/img/delete.png"/></button>'
	+	'<button title="duplicate [ctrl+D]" class="patch-duplicate"><img src="gui/img/duplicate.png"/></button>'
	+	'<span class="patch-toolbar-separator"></span>'
	+	'<button title="insert blank pipe [ctrl+I]" class="patch-new-pipe"><img src="gui/img/new-pipe.png"/></button>'
	+	'<button title="insert blank node [ctrl+O]" class="patch-new-node"><img src="gui/img/new-node.png"/></button>'
	+	'<button title="insert blank patch [ctrl+P]" class="patch-new-patch"><img src="gui/img/new-patch.png"/></button>'
	+	'<span class="patch-toolbar-separator"></span>'
	+	'<button title="pack to patch [ctrl+G]" class="patch-pack"><img src="gui/img/pack.png"/></button>'
	+	'<button title="unpack patch [ctrl+shift+G]" class="patch-unpack"><img src="gui/img/unpack.png"/></button>'
	+	'<button title="open patch [double-click]" class="patch-close"><img src="gui/img/patch-open.png"/></button>'
	+	'</div>'
	).appendTo(this.$wrap);

	this.$runToolbar = $(
		'<div class="toolbar run-toolbar">'
	+	'<button title="play" class="run-play"><img src="gui/img/play.png"/></button>'
	+	'<button title="pause" class="run-pause"><img src="gui/img/pause.png"/></button>'
	+	'</div>'
	).appendTo(this.$wrap);


	this.$thingMenu = $(
		'<div class="menu" id="menu-thing">'
	+	'<div class="menu-item thing-rename">rename thing <span class="menu-thing-name">thing</span></div>'
	+	'<div class="menu-item thing-lib-save">save <span class="menu-thing-name">thing</span> to library</div>'
	+	'<span class="menu-separator"></span>'
	+	'<div class="menu-item thing-delete">delete thing <span class="menu-thing-name">thing</span></div>'
	+	'</div>'
	).appendTo('#menus');


    this.$wrap.data('gui',this);
	this.$canvas = $('<div class="patch-canvas"></div>').appendTo(this.$wrap);
	this.$thingContainer = $('<div class="things"></div>').appendTo(this.$canvas);
	this.$connectionContainer = $('<svg class="connections"></svg>').appendTo(this.$canvas);
    this.registerEvents();
    this.setFocus();
    if (patch) {
		this.stateStack = [];
		this.stateStackPointer = -1;
    	this.load(patch);
		this.pushState();
    }
    else {
    	this.new();
    };
}
GUI.prototype.setFocus = function() {
	$('#tabs .patch-tab').removeClass('selected');
	this.$tab.addClass('selected');
	$('#patches > .patch-wrap').removeClass('selected');
	this.$wrap.addClass('selected');
	GUI.focusedGUI = this;
    this.offset = this.$canvas.offset();
}
GUI.prototype.load = function(patch) {
	this.init();
	this.patch = patch;
	this.patch.handlers = this;
	this.$tab.text(patch.name);
	var gui = this;
	this.patch_thing_added(patch.input);
	this.patch_thing_added(patch.output);
	for (var i in patch.things) {
		this.patch_thing_added(patch.things[i]);
	}
	for (var i in patch.things) {
		patch.things[i].eachInput(function(pin,name) {
			if (pin.incoming) gui.patch_connected(pin.incoming,pin);
		});
	}
	patch.output.eachInput(function(pin,name) {
		if (pin.incoming) gui.patch_connected(pin.incoming,pin);
	});
}
GUI.prototype.save = function(name) {
	var gui = this;
	window.localStorage[name] = JSON.stringify(this.patch.serialize());
	$.get('/w/api.php?format=json&action=query&meta=userinfo',function(data){
		var user = data.query.userinfo.name;
		var title = 'User:'+user+'/Patch/'+name;
		$.get('/w/api.php?format=json&action=query&prop=info&intoken=edit&titles='+title,function(data){
			var token;
			for (var i in data.query.pages) {
				token = data.query.pages[i].edittoken;
			};
			var args = {
				action:'edit',
				title: title,
				text: JSON.stringify(gui.patch.serialize(),null,'    '),
				summary: 'patch',
				token: token,
				format: 'json'
			};
			$.post('/w/api.php', args, function(data) {console.log(data)});
		},'json');
	},'json');
}
GUI.prototype.open = function(name) {
	this.new();
	var gui = this;
	$.get('/w/api.php?format=json&action=query&meta=userinfo',function(data){
		var user = data.query.userinfo.name;
		var title = 'User:'+user+'/Patch/'+name;
		$.get('/w/index.php?action=raw&title='+title,function(data){
			gui.patch._deserialize(data);
			gui.$tab.text(gui.patch.name);
			gui.pushState();
			console.log(title);
		},'json');
	},'json');
}

GUI.prototype.init = function() {
	if (this.patch) this.patch.handlers = null;
	this.deselectAllThings();
	this.$thingContainer.empty();
	this.$connectionContainer.empty();	
	GUI.hideEditor();
	this.hideMenu();	
	this.connections={};
	this.$things = {};
	this.$inputs={};
	this.$outputs={};
	this.zTop = 0;
}    
GUI.prototype.new =  function() {
	this.init(); 
	this.stateStack = [];
	this.stateStackPointer = -1;
	this.patch = new Patch(this);
	this.$tab.text(this.patch.name);
}

GUI.prototype.close = function() {
	var gui = this;
	var $prev = gui.$wrap.prev();
	if ($prev.length) {
		$prev.data('gui').setFocus();
		gui.$thingContainer.undelegate();
		gui.$tab.remove();
		gui.$connectionContainer.remove();
		try {
			gui.$wrap.remove();
		} catch(e) {
			gui.$wrap.remove();
		}
		gui.patch.handlers = null;
		gui.init();
	}
}

GUI.prototype.pushState = function() {
	this.stateStackPointer++;
	this.stateStack = this.stateStack.slice(0,this.stateStackPointer);
	this.stateStack.push(this.patch.serialize());
	
	if(this.stateStackPointer>30) {
		this.stateStack.shift();
		this.stateStackPointer--;
	}
}

GUI.prototype.undo = function (){
	return this.restoreState(-1);
}

GUI.prototype.redo = function (){
	return this.restoreState(1);
}

GUI.prototype.restoreState = function (d){
	var n = this.stateStackPointer + d;
	if (n<0 || n>=this.stateStack.length) return;
	this.stateStackPointer = n;
	var state = this.stateStack[n];
	var index = this.patch.index;
	var parent = this.patch.patch;
	var me = this.patch;
	var patch = Thing.deserialize(state);
	var oldthings = {};
	for (var i in me.things) oldthings[i]=me.things[i];
	var clones = me.getClones( patch.things, {
		beforeThings: function(clones) {
			me.addThings(clones);
		},
		thing: function(thing,clone) {
			if (thing.handlers) new GUI(clone);
		},
		brokenIn: function(pin,clone,other) {
			me.input.outputs[other.name].connect(clone);
		},
		brokenOut: function(pin,clone,others) {
			for (var i in others) me.output.inputs[others[i].name].connect(clone);
		}
	});
	me.removeThings(oldthings);	
}

GUI.hideEditor = function(cancel) {
	if (cancel) GUI.editorClose();
	GUI.editorApply = null;
	GUI.editorClose = null;
	var top = $(window).height();
	$('#texteditor').animate({top:top},200);
}
GUI.showEditor = function(name,value,mode,cbApply,cbClose) {
	GUI.hideEditor();
	GUI.editor.setValue('');
	GUI.editor.setOption('mode',mode);
	GUI.editor.setValue(value);
	GUI.editorApply = cbApply;
	GUI.editorClose = cbClose;
	var top = Math.max(300, $('body').height()-300);
	$('#texteditor').animate({top:top},200);
	this.editor.focus();
	$('#texteditor').one('blur', function(){
		GUI.hideEditor(true);
	});
}

GUI.init = function() {
	$('#texteditor').append(
		'<div class="texteditor-toolbar">'
	+  		'<button class="texteditor-apply">apply</button>'
	+  		'<button class="texteditor-close">close</button>'
	+	'</div>'
	+	'<div id="texteditor-container"></div>'
	);
	GUI.editor = CodeMirror($('#texteditor-container').get(0),{
		mode: 'javascript',
		tabMode: 'shift',
		enterMode: 'keep',
		onKeyEvent: function(ed,e) {
			e.which == 13 && e.ctrlKey && GUI.editorApply && GUI.editorApply(GUI.editor.getValue());
			e.stopPropagation();
		}
	});
	$('#texteditor .texteditor-apply').click(function() {
		GUI.editorApply && GUI.editorApply(GUI.editor.getValue());
		//GUI.hideEditor();
	});
	$('#texteditor .texteditor-close').click(function() {
		GUI.editorClose && GUI.editorClose();
		GUI.hideEditor();
	});
	$(window).resize(function(e) {
		$('#texteditor').css('top',$(window).height()-$('#texteditor').height());
	});
	$('#libs')
	.delegate('.lib-item','dragstart', function(e,dd) {
		var $this = $(this);
		var o = $this.offset();
		var $clone = $this
		.clone()
		.addClass('dragging')
		.css({
			position: 'fixed',
			zIndex: '1000',
			top: o.top,
			left: o.left,
			width: $this.width()+8,
			height: $this.height()+8
		})
		.appendTo('body');
		return $clone;
	})
	.delegate('.lib-item','drag', function(e,dd) {
         $( dd.proxy ).css({
            top: dd.offsetY,
            left: dd.offsetX
         });
	})	
	.delegate('.lib-item','dragend', function(e,dd) {
		gui.patch.addThing(Thing.fromLib($(this).text()),gui.mouseX,gui.mouseY);
		$(dd.proxy).fadeOut(function(){$(dd.proxy).remove()});
	});
	
	GUI.hideEditor();
	GUI.loadLib();
}
GUI.saveToLib = function(thing,name) {
	Thing.saveToLib(thing,name,function() {GUI.loadLib()});
}
GUI.loadLib = function() {
	var $lib = $('#libs');
	$lib.empty();
	Thing.loadLib(function () {
		for (var i in Thing.lib) {
			$lib.append('<div class="lib-item">'+i+'</div>');
		}
	});
}
$(GUI.init);


