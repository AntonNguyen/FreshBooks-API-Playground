var OAuth = Transport.extend({
	init: function(freshbooks, callback) {
		this._super(freshbooks);
		this.url = freshbooks.getResourceURL();
	},

	getRequiredFields: function() {
		return [this.url, 
				this.freshbooks.consumerKey,
				this.freshbooks.consumerKeySecret,
				this.freshbooks.accessToken,
				this.freshbooks.accessTokenSecret];
	},

	getAuthorization: function() {
		return this.getOAuthHeader(this.freshbooks.consumerKey, this.freshbooks.consumerSecret, 
								   this.freshbooks.accessToken, this.freshbooks.accessTokenSecret, "", "");
	},

	getOAuthHeader: function(consumer, consumersecret, token, tokensecret, callback, verifier) {
		var header = 'OAuth realm="",oauth_version="1.0",oauth_consumer_key="' + consumer +'",oauth_timestamp="'+ this.getTimestamp() +'",oauth_nonce="'+ this.getNonce() +'",oauth_signature_method="PLAINTEXT"';

		// Add the consumer secret and access token secret
		header += ',oauth_signature="' + consumersecret + '%2526';
		if (tokensecret != "") {
			header += tokensecret;
		}
		header += '"';

		// Adding the token
		if (token != "") {
			header += ',oauth_token="'+ token + '"';
		}

		// Callback for getting a request token
		if (callback != "") {
			header += ',oauth_callback="'+ callback + '"';
		}

		// Verifier for getting access tokens
		if (verifier != "") {
			header += ',oauth_verifier="'+ verifier + '"';
		}

		return header;
	},

	// From Netflix's oauth implementation
	getTimestamp: function() {
		var t = (new Date()).getTime();
		return Math.floor(t / 1000);
	},

	// From Netflix's oauth implementation
	getNonce: function() {
		var nonceLength = 15;
		var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
		var result = "";
		for (var i = 0; i < nonceLength; ++i) {
		var rnum = Math.floor(Math.random() * chars.length);
			result += chars.substring(rnum, rnum+1);
		}
		return result;
	},

});