var Transport = Class.extend({
	init: function(freshbooks) {
		this.freshbooks = freshbooks;
	},

	validate: function() {
		var requiredFields = this.getRequiredFields();
		for (var i = 0; i < requiredFields.length; i++) {
			if (requiredFields[i] === "") {
				return false;
			}
		}
		return true;
	},

	getRequiredFields: function() {
		return [];
	},

	getAuthorization: function() {
		return "";
	},

	makeAPIRequest: function(xml, complete, error, contentType, responseType) {
		if (this.validate()) {
			contentType =  typeof contentType  !== 'undefined' || contentType !== "" ? contentType  : "application/x-www-form-urlencoded";

			var xhr = new XMLHttpRequest();
			xhr.open('POST', this.url, true);
			xhr.setRequestHeader('FB-User-Agent', "FreshBooks API Playground");
			xhr.setRequestHeader('Authorization', this.getAuthorization());
			xhr.setRequestHeader('content-type',  contentType);

			if (typeof responseType !== "") {
				xhr.responseType = responseType;
			}

			xhr.onreadystatechange = complete;
			xhr.onError = error;

			xhr.send(xml);
		}
	}

});