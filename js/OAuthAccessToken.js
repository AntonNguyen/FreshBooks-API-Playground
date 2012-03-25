var OAuthAccessToken = OAuth.extend({
	init: function(freshbooks, callback, verifierToken, verifier) {
		this._super(freshbooks);
		this.url = freshbooks.getAccessTokenURI();
		this.callback = callback;
		this.verifierToken = verifierToken;
		this.verifier = verifier;
	},

	getRequiredFields: function() {
		return [this.url,
				this.freshbooks.consumerKey,
				this.freshbooks.consumerSecret,
				this.callback,
				this.verifierToken,
				this.verifier];
	},

	getAuthorization: function() {
		return this.getOAuthHeader(this.freshbooks.consumerKey,
								   this.freshbooks.consumerSecret,
								   this.verifierToken,
								   "",
								   this.callback,
								   this.verifier)
	}

});