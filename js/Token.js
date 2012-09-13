var Token = Transport.extend({
	init: function(freshbooks, callback) {
		this._super(freshbooks);
		this.url = freshbooks.getResourceURL();
	},

	getRequiredFields: function() {
		return [this.url, this.freshbooks.token];
	},

	getAuthorization: function() {
		return this.makeBaseAuth(this.freshbooks.token, 'X');
	},

	makeBaseAuth: function(username, password) {
		var tok = username + ':' + password;
		var hash = window.btoa(tok);
		return "Basic " + hash;
	}

});