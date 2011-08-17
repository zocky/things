var Base = {};
Base.prototype = {
	extend: function(parent,instance,klass) {
		var fn = function() {this.construct.apply(this,arguments)};
		fn.prototype.__proto__ = parent.prototype;
		fn.__proto__ = parent;
		fn.prototype.constructor = fn;
		fn.parent = parent;
		for (var i in instance) {
			fn.prototype[i] = instance[i];
			fn.prototype[i].base = function() {
				fn.parent.prototype[i].apply(this,arguments);
			}
		}
		for (var i in klass) {
			fn.prototype[i].base = function() {
				fn.parent[i].apply(this,arguments);
			}
		}
		return fn;
	}
}

var Foo = Base.extend
