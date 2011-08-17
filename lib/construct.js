var Parent = function(){};
Parent.new = function() {
	var me = new this;
	me.construct();
}
Parent.prototype = {
	construct: function() {
		this.isParent = true;
		this.name = 'parent';
	},
	log: function() {
		console.log('parent');
	}
}

var child = function();
Child.prototype = {};
for (var i in ) {

}
Child.prototype.constructor = Child;
