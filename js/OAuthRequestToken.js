var OAuthRequestToken = OAuth.extend({
	init: function(freshbooks, callback) {
		this._super(freshbooks);
		this.url = freshbooks.getRequestTokenURI();
		this.callback = callback;
	},

	getRequiredFields: function() {
		return [this.url,
				this.freshbooks.consumerKey,
				this.freshbooks.consumerSecret];
	},

	getAuthorization: function() {
		return this.getOAuthHeader(this.freshbooks.consumerKey,
								   this.freshbooks.consumerSecret,
								   "",
								   "",
								   this.callback,
								   "");
	}

});