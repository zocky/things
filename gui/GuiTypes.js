GUI.prototype.showValue = function(val) {
	return String(val);
}
GUI.types = {
	value: {
		display: function($where,value) {
			$where.text(this.showValue(value));
			if (!Patch.running) $where.attr('title',this.showValue(value));
			
		},
		edit: function($where,value,change,cancel) {
			var $input = $('<input type="text"/>')
			.val(String(value))
			.change( function() {
				change(this.value=='' || isNaN(this.value) ? this.value || this.value : parseFloat(this.value));
				this.blur();
			})
			.blur( function() {
				cancel();
			})
			$where.html($input);
		}
	},
	html: {
		display: function($where,value) {
			$where.html(value);
			if(!Patch.running) $where.attr('title',this.showValue(value));
			
		},
		edit: function($where,value,change,cancel) {
			var $input = $('<input type="text"/>')
			.val(String(value))
			.change( function() {
				change(this.value);
				this.blur();
			})
			.blur( function() {
				cancel();
			})
			$where.html($input);
		}
	},
	code: {
		display: function($where,value) {
			$where.text('(code)');
			$where.attr('title',this.showValue(value));
		},
		edit: GUI.editors.expr
	},
	float: {
		display: function($where,value) {
			$where[0].innerHTML=Number(value).toFixed(2);
			//$where.attr('title',parseInt(value));
		},
		edit: function($where,value,change,cancel) {
			var $input = $('<input type="text"/>')
			.val(value)
			.change( function() {
				change(parseInt(this.value));
			})
			.blur( function() {
				cancel();
			});
			$where.html($input);
		}
	},
	integer: {
		display: function($where,value) {
			$where.text(parseInt(value));
			$where.attr('title',parseInt(value));
		},
		edit: function($where,value,change,cancel) {
			var $input = $('<input type="text"/>')
			.val(value)
			.change( function() {
				change(parseInt(this.value));
			})
			.blur( function() {
				cancel();
			});
			$where.html($input);
		}
	},
	image: {
		display: function($where,value) {
			if (value instanceof Image) {
				$where.html(
					$('<div style="width:150px;height:150px;line-height:150px;border:solid 1px silver;text-align:left;"></div>')
					.append($(value).clone().css({maxWidth:150,maxHeight:150}))
				);
				$where.attr('title','image ('+value.width+'×'+value.height+')');
			} else {
				$where.html(this.showValue(value));
				$where.attr('title',this.showValue(value));
			}
		},
		big:true
	},
	canvas: {
		display: function($where,value) {
			if (value instanceof HTMLCanvasElement) {
				$where.html(
					$('<div style="border:solid 1px silver;text-align:left;background:black"></div>')
					.append($(value).css({maxWidth:400,maxHeight:300}))
				);
				$where.attr('title','canvas ('+value.width+'×'+value.height+')');
			} else {
				$where.html(this.showValue(value));
				$where.attr('title',this.showValue(value));
			}
		},
		big:true
	},
	htmlElement: {
		display: function($where,value) {
			if (value instanceof HTMLElement) {
				$where.html(
					($(value).css({maxWidth:150,maxHeight:150}))
				);
				$where.attr('title','htmlElement ('+value.width+'×'+value.height+')');
			} else {
				$where.html(this.showValue(value));
				$where.attr('title',this.showValue(value));
			}
		},
		big:true
	},
	boolean: {
		display: function($where,value) {
			var $input = $('<input type="checkbox"/>');
			$input.attr('disabled','disabled');
			if (value) $input.attr('checked','checked');
			$where.html($input);
		},
		edit: function($where,value,change,cancel) {
			var $input = $('<input type="checkbox"/>');
			if (value) $input.attr('checked','checked');
			$input
			.blur( function(e) {
				cancel();
			})
			.change( function(e) {
				change(!!$(this).attr('checked'));
			});
			$where.html($input);
		},
		reedit: true
	},
	slider: {
		display: function($where,pin) {
			var $input = $where.find('>input [type=range]');
			if ($input.length == 0 ) {
				$input = $('<input type="range"/>')
				.change( function(e) {
					pin.set(this.value,true);
					gui.display_pin_value(pin);
				});
				$where.html($input);
			}
			$input.val(pin.value)
		},
		edit: function($where,pin) {
		},
	}
};
