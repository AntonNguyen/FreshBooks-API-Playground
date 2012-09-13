var FreshBooks = Class.extend({
	init: function() {
		if (!localStorage['isInitialized']) {
			localStorage['isInitialized'] = true;
			this.reset();
		} else {
			this.load();
		}
	},

	load: function() {
		this.subdomain = localStorage['subdomain'];
		this.apiKey = localStorage['apiKey'];
		this.token = localStorage['token'];
		this.consumerKey = localStorage['consumerKey'];
		this.consumerSecret = localStorage['consumerSecret'];
		this.accessToken = localStorage['accessToken'];
		this.accessTokenSecret = localStorage['accessTokenSecret'];
	},

	save: function() {
		var hostname = this.subdomain.match("(https|http)?(://)?([a-zA-Z0-9\.\-]*)?(/.*)?");

		// Only save if we find a subdomain value
		if (hostname[3]) {
			// If only a subdomain is provided, we automatically append '.freshbooks.com'
			this.subdomain = hostname[3];
			if (this.subdomain.indexOf(".") < 0) {
				this.subdomain = this.subdomain + ".freshbooks.com";
			}
			localStorage['subdomain'] = this.subdomain;
		} else {
			localStorage['subdomain'] = "";
		}

		localStorage['apiKey'] = this.apiKey;
		localStorage['token'] = this.token;
		localStorage['consumerKey'] = this.consumerKey;
		localStorage['consumerSecret'] = this.consumerSecret;
		localStorage['accessToken'] = this.accessToken;
		localStorage['accessTokenSecret'] = this.accessTokenSecret;
	},

	reset: function() {
		this.subdomain = "";
		this.apiKey = "";
		this.token = "";
		this.consumerKey = "";
		this.consumerSecret = "";
		this.accessToken = "";
		this.accessTokenSecret = "";
		this.save();
	},

	getResourceURL: function() {
		return this.getURL('/api/2.1/xml-in');
	},

	getRequestTokenURI: function() {
		return this.getURL('/oauth/oauth_request.php');
	},

	getAuthorizeTokenURI: function(token) {
		return this.getURL('/oauth/oauth_authorize.php?oauth_token=' + token);
	},

	getAccessTokenURI: function() {
		return this.getURL('/oauth/oauth_access.php');
	},

	getURL: function(path) {
		return this.subdomain !== "" ? "https://" + this.subdomain + path : "";
	}

});