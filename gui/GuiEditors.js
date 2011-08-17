GUI.editors = {
	expr: function($where,value,change,cancel) {
		GUI.showEditor('',value||'','javascript',change,cancel);
	},
	name: function($where,value,change,cancel) {
		var gui = this;
		var $input = $('<input type="text"/>')
		.val(value)
		.change( function() {
			change(this.value.replace(/^\$/,''));
		})
		.blur( function() {
			cancel();
		});
		$where.html($input);
		$input.focus();
		$input.get(0).selectionStart = 0;
		$input.get(0).selectionEnd = $input.val().length;
	},
	type: function($where,value,change,cancel) {
		var $input = $('<select size="8" style="display:block;position:absolute;height:auto;width:auto;z-index:10"/>');
		for (var i in GUI.types) {
			$input.append('<option>'+i+'</option>');
		}
		$input
		.val(value)
		.mousedown( function(e) {
			e.stopPropagation();
		})
		.change( function() {
			change (this.value);
		})
		.blur( function() {
			cancel();
		});
		$where.append($input);
		$input.focus();
	}
}
