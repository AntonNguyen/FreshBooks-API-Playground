var newLine = '\r\n';
var currentResource = "";
var currentResourceMethods = "";
var formerResource = "";

var currentMethod = "";
var formerMethod = "";
var fb = null;

$(document).ready(function() {
	fb = new FreshBooks();
	detectOAuthCallbackAttempt();

	loadData();
	loadAuthPref();
	toggleCurl();
	toggleOAuthConnect();
	hljs.initHighlightingOnLoad();

	// Load up all the API Calls
	$.each(apiResources, function(key, val) {
		$('#resources').append('<li><a class="resources" href="#" alt="' + key + '">' + key + '</a></li>');
	});

	/*
	 * All our event handlers
	 */
	$('#sendRequest').click(function() {
		makeServerRequest();
		return false;
	});

	$('#curl').click(function() {
		if (localStorage['showcurl'] == "false") {
			localStorage['showcurl'] = "true";
		} else {
			localStorage['showcurl'] = "false";
		}

		toggleCurl();
		return false;
	});

	$('#switch').click(function() {
		if (localStorage['authPref'] == "token") {
			localStorage['authPref'] = "oauth";
		} else {
			localStorage['authPref'] = "token";
		}

		updateCodeDisplay();
		loadAuthPref();
		return false;
	});

	$('#connect').click(function() {
		getOAuthRequestToken();
	});

	$('#boxclose').click(function(){
		hideBox();
	});

	$('.authentication').live("keyup", function() {
		saveData();
		updateCodeDisplay();
		toggleOAuthConnect();
	});

	$('a.resources').live("click", function() {
		selectResource(this);
	});

	$('a.methods').live("click", function() {
		selectMethod(this);
	});

	$('a.duplicate').live("click", function() {
		var parent = $(this).parent();
		var copyElement = $(this).siblings('div')[0];

		$(parent).append(copyElement.outerHTML);
	});

	// Update the curl command on every text change
	$('input.fields').live("keyup", function() {
		updateCodeDisplay();
	});

	// Add an empty xml tag
	$('label').live("click", function() {
		if ($(this).hasClass('include')) {
			$(this).removeClass("include");
		} else {
			$(this).addClass("include");
		}

		updateCodeDisplay();
	});

	/*
	 * All our key bindings
	 */
	$(document).bind('keydown', 'return', makeServerRequest);
	$(document).bind('keydown', 'esc', hideBox);

	$(document).bind('keydown', 'alt+ctrl+h', function() {
		cycleAnchor('resources', 'prev');
	});

	$(document).bind('keydown', 'alt+ctrl+l', function() {
		cycleAnchor('resources', 'next');
	});

	$(document).bind('keydown', 'alt+ctrl+j', function() {
		cycleAnchor('methods', 'prev');
	});

	$(document).bind('keydown', 'alt+ctrl+k', function() {
		cycleAnchor('methods', 'next');
	});
});

function cycleAnchor(anchorClass, direction) {
	var anchorsToCycle = $('a.' + anchorClass);
	var anchorIndex = 0;
	var selectedAnchor = null;

	for (var i = 0; i <= anchorsToCycle.length; i++) {
		if ($(anchorsToCycle[i]).hasClass('selected')) {
			anchorIndex = i;
			break;
		}
	}

	if (direction == 'prev') {
		if (anchorIndex == 0) {
			selectedAnchor = $('a.' + anchorClass + ':last')[0];
		} else {
			selectedAnchor = anchorsToCycle[anchorIndex - 1];
		}
	} else {
		if (anchorIndex == anchorsToCycle.length - 1 || $('a.' + anchorClass + '.selected').length == 0) {
			selectedAnchor = $('a.' + anchorClass + ':first')[0];
		} else {
			selectedAnchor = anchorsToCycle[anchorIndex + 1];
		}
	}

	$(selectedAnchor).focus();

	if (anchorClass == "resources") {
		selectResource(selectedAnchor);
	} else {
		selectMethod(selectedAnchor);
	}
}

function hideBox() {
	$('#box').animate({'top':'-100px'},500,function(){
		$('#overlay').fadeOut('fast');
	});
	$('#box').hide();
}

// Recursively traverses the json object building the html form
function exploreFields(root, level) {
	var fields = "";

	$.each(root, function(key, val) {
		if (typeof val == "object") {

			if (typeof key == "string" ) {
				fields += '<div class="fields" alt="' + key + '">';
				fields += '<h3>' + key + '</h3>';

				// Enable element duplication
				if (key == 'lines' || key == 'gateways' || key == 'contacts' || (key == 'staff' && level == 1) || key == 'tasks') {
					fields += '<a href="#" class="duplicate">Add more</a>';
				}
			}

			fields += exploreFields(val, level + 1);

			if (typeof key == "string" ) {
				fields +='</div>';
			}
		} else {
			fields += '<div class="fieldgroup"><label>' + val + '</label>';
			fields += '<input class="fields" type="text" alt="' + val + '"></input></div>';
		}
	});

	return fields;
}

function selectResource(resource) {
	formerResource = currentResource;
	currentMethod = "";

	$('a.resources').removeClass("selected");
	$(resource).addClass("selected");

	//Get the selected element
	currentResource = $(resource).attr("alt");
	currentResourceMethods = apiResources[currentResource];

	// Clear any methods/resources and add the new ones
	$('#methods').html("");
	$('#fields').html("");
	var numMethods = 0;
	$.each(currentResourceMethods, function(key, val) {
		$('#methods').append('<li><a class="methods" href="#" alt="' + key + '">' + key + '</a></li>');
		numMethods++;
	});

	if (numMethods == 1) {
		selectMethod($('a.methods')[0]);
	}
}

function selectMethod(method) {
	if (!method) {
		return;
	}

	var elementID = "";
	var elementIDValue = "";

	if (currentMethod !== 'create') {
		// extracttract the current id entered
		$('input.fields').each(function() {
			if ($(this).attr('alt').indexOf("_id") >= 0) {
				elementID = $(this).attr('alt');
				elementIDValue = $(this).val();
				return false;
			}
		});
	}

	$('a.methods').removeClass("selected");
	$(method).addClass("selected");

	formerMethod = currentMethod
	currentMethod = $(method).attr("alt");

	//Extract the fields from the selected method
	$('#fields').html(exploreFields(currentResourceMethods[currentMethod], 0));

	$('#currentCurlCommand').html(currentResource + '.' + currentMethod);

	updateCodeDisplay();

	$('#fields input:first').focus();

	// Attempt to extract the newly created object id and auto-populate it anywhere its used
	if (formerMethod == 'create') {
		var fieldName = "";
		var newID = "";

		$('#response code').each(function() {
			if ($(this).text().indexOf("_id") >= 0) {
				fieldName = $(this).text();
				newID = $(this).next().text();
				newID = newID.replace("<", "").replace(">", "").replace("/", "");
				return false;
			}
		});

		// Inject the id into the get parameter
		$('input.fields').each(function() {
			if ($(this).attr('alt') == fieldName) {
				$(this).val(newID);
			}
		});
	} else {
		// Inject the id into the get parameter
		$('input.fields').each(function() {
			if ($(this).attr('alt') == elementID) {
				$(this).val(elementIDValue);
			}
		});
		// Reset the values, so that it doesn't populate unknowingly
		elementID = "";
		elementIDValue = "";
	}
}

function updateCodeDisplay() {
	var code = createRequest();
	displayCode('request', code);
	generateCurlCommand(fb, code);
}

function createRequest() {
	var command = "";

	if (currentResource !== "" && currentMethod !== "") {
		command += '<request method="' + currentResource + '.' + currentMethod + '">';
		command += parseFields($('#fields'), 1);
		command += newLine + '</request>';
	}

	return command;
}

// Traverses the parent element in the DOM until it reaches the bottom, to build the curl commands
function parseFields(parent, level) {
	parent = parent[0];

	var xml = "";
	var tempParseResult = "";

	$.each($(parent).children(), function() {
		// fieldgroup divs contains the input
		if ($(this).hasClass("fieldgroup")) {
			var input = $("input", this)[0];
			var label = $("label", this)[0];

			if ($(input).val() !== "") {
				xml += newLine + tabs(level) + '<' + $(input).attr("alt") + '>';
				xml += $(input).val();
				xml += '</' + $(input).attr("alt") + '>';
				$(label).removeClass("include");
			} else {
				if ($(label).hasClass("include")) {
					xml += newLine + tabs(level) + '<' + $(input).attr("alt") + '>';
					xml += '</' + $(input).attr("alt") + '>';
				}
			}
		// All other divs contains a subgrouping
		} else if ($(this).is("div")) {
			tempParseResult = parseFields($(this), level + 1);

			if (tempParseResult !== "") {
				xml += newLine + tabs(level) + '<' + $(this).attr("alt") + '>';
				xml += '' + tempParseResult;
				xml += newLine + tabs(level) + '</' + $(this).attr("alt") + '>';
			}
		}
	});

	return xml;
}

function tabs(count) {
	var tabs = "";
	for (var i = 0; i < count; i++) {
		tabs += '\t';
	}

	return tabs;
}

function makeServerRequest() {
	var xmlRequest = createRequest();
	var transport = null;

	if (isTokenAuth()) {
		transport = new Token(fb);
	} else {
		transport = new OAuth(fb);
	}

	if (!transport.validate()) {
		// TODO: display Error
		return;
	}

	$('#response').hide();
	$('#loader').show();

	var successFn = function(xhr, status) {
		$('#loader').hide();
		if (xhr.target.status==200) {
			displayCode('response', xhr.target.responseText);
		} else if (xhr.target.status==401) {
			displayCode('response', "Authorization failed");
		} else {
			displayCode('response', "Unable to connect to server");
		}
	};

	var errorFn = function() {
		$('#loader').hide();
		displayCode('response', "Unable to connect to server");
	};

	var contentType = "";
	var responseType = "";

	if (currentMethod.toLowerCase() == 'getpdf') {
		contentType = "application/pdf";
		responseType = "arraybuffer";
		displayCode('response', 'PDF Downloading..');

		successFn = function(xhr) {
			if (xhr.target.readyState==4 && xhr.target.status==200) {
				var bb = new window.WebKitBlobBuilder();
				bb.append(this.response);

				var blob = bb.getBlob(contentType);
				var blobURL = window.webkitURL.createObjectURL(blob);
				window.open(blobURL);
			}
			$('#loader').hide();
			displayCode('response', "Download complete!");
		};

	} else if (currentResource == 'receipt' && currentMethod == 'get') {
		contentType = "image/xyz";
		responseType = "arraybuffer";
		displayCode('response', 'Image Downloading..');

		successFn = function(xhr) {
			if (xhr.target.readyState==4 && xhr.target.status==200) {
				var bb = new window.WebKitBlobBuilder();
				bb.append(this.response);

				var blob = bb.getBlob(contentType);
				var blobURL = window.webkitURL.createObjectURL(blob);

				$('#receipt').attr("src", blobURL);
				$('#overlay').fadeIn('fast',function(){
					$('#box').show();
					$('#box').animate({'top':'160px'},500);
				});
			}
			$('#loader').hide();
			displayCode('response', "Download complete!");
		};
	}

	transport.makeAPIRequest(xmlRequest, successFn, errorFn, contentType, responseType);
}

function generateCurlCommand(freshbooks, code) {
	var apiURL = freshbooks.getResourceURL();
	var command = "";

	if (isTokenAuth()) {
		var apiToken = freshbooks.token;
		command = "curl -k -u " + apiToken + ":X " + apiURL + " -d '" + code.replace(/[\n\r\t]/g, '') + "'";
	} else {
		var oauth = new OAuth(fb);
		command = "curl -k -H 'Authorization : " + oauth.getAuthorization() + "' " + apiURL + " -d '" + code.replace(/[\n\r\t]/g, '') + "'";
	}
	$('#curlCommand').html(command);
}

function displayCode(sectionID, code) {
	var sectionJQ = "#" + sectionID + ' code';
	var highlightedCode = hljs.highlight('xml', code);
	$(sectionJQ).html(highlightedCode.value);

	$('#' + sectionID).show();
}

function htmlencode(str) {
    return str.replace(/[&<>"']/g, function($0) {
        return "&" + {"&":"amp", "<":"lt", ">":"gt", '"':"quot", "'":"#39"}[$0] + ";";
    });
}

function saveData() {
	fb.subdomain =         $('#apiURL').val().trim();
	fb.token =             $('#apiToken').val().trim();
	fb.consumerKey =       $('#consumerKey').val().trim();
	fb.consumerSecret =    $('#consumerSecret').val().trim();
	fb.accessToken =       $('#accessToken').val().trim();
	fb.accessTokenSecret = $('#accessTokenSecret').val().trim();
	fb.save();
}

function loadData() {
	$('#apiURL').val(fb.subdomain);
	$('#apiToken').val(fb.token);
	$('#consumerKey').val(fb.consumerKey);
	$('#consumerSecret').val(fb.consumerSecret);
	$('#accessToken').val(fb.accessToken);
	$('#accessTokenSecret').val(fb.accessTokenSecret);
}

function loadAuthPref() {
	if (localStorage['authPref'] == "token") {
		$('#authTitle').text("Token User");
		$('#oauthCredentials').hide();
		$('#tokenCredentials').show();
	} else {
		$('#authTitle').text("OAuth User");
		$('#oauthCredentials').show();
		$('#tokenCredentials').hide();
	}
}

function toggleOAuthConnect() {
	if (fb.accessToken == "" && fb.accessTokenSecret == "") {
		$('#connect').show();
	} else {
		$('#connect').hide();
	}
}

function toggleCurl() {
	if (localStorage['showcurl'] == "false") {
		$('#curl').text("Show Curl Request");
		$('#curlCommand').hide();
	} else {
		$('#curl').text("Hide Curl Request");
		$('#curlCommand').show();
	}
}

function isTokenAuth() {
	return localStorage['authPref'] == "token";
}

function getExtensionURL() {
	var url = document.URL.split("?");
	url = url[0];
	return url.replace("#", "");
}

/*
 * Methods for handling the OAuth Dance
 */
function detectOAuthCallbackAttempt() {

	// Look for verifiers
	var querystring = window.location.href.split("?");
	if (querystring.length > 1) {
		querystring = querystring[1].split("&");
		var token = "";
		var verifier = "";

		for (var i = 0; i < querystring.length; i++) {
			var keypair = querystring[i].split("=");
			if (keypair[0].toLowerCase() == "oauth_verifier") {
				verifier = keypair[1];
			}

			if (keypair[0].toLowerCase() == "oauth_token") {
				token = keypair[1];
			}
		}

		requestAccessToken(token, verifier);
	}
}

function getOAuthRequestToken() {
	var xmlRequest = createRequest();
	var transport = new OAuthRequestToken(fb, getExtensionURL());

	if (!transport.validate()) {
		// TODO: display Error
		return;
	}

	$('#response').hide();
	$('#loader').show();

	var successFn = function(xhr, status) {
		if (xhr.target.readyState==4 && xhr.target.status==200) {
			var parameters = xhr.target.responseText.split("&");
			for (var i = 0; i < parameters.length; i++) {
				var keypair = parameters[i].split("=");
				if (keypair[0].toLowerCase() == "oauth_token") {
					chrome.tabs.create({
						url:fb.getAuthorizeTokenURI(keypair[1])
					});

					chrome.tabs.getCurrent(function(tab) {
						chrome.tabs.remove(tab.id);
					});
				}
			}
		}
	};

	var errorFn = function() {
		$('#loader').hide();
		displayCode('response', xhr.target.responseText);
	};

	transport.makeAPIRequest(xmlRequest, successFn, errorFn, "", "");
}

function requestAccessToken(token, verifier) {
	var xmlRequest = createRequest();
	var transport = new OAuthAccessToken(fb, "/", token, verifier);

	if (!transport.validate()) {
		// TODO: display Error
		return;
	}

	$('#response').hide();
	$('#loader').show();

	var successFn = function(xhr, status) {
		if (xhr.target.readyState==4 && xhr.target.status==200) {
			// search for access_token and access_token_secret
			var parameters = xhr.target.responseText.split("&");
			for (var i = 0; i < parameters.length; i++) {
				var keypair = parameters[i].split("=");
				if (keypair[0].toLowerCase() == "oauth_token") {
					fb.accessToken = keypair[1];
				}

				if (keypair[0].toLowerCase() == "oauth_token_secret") {
					fb.accessTokenSecret = keypair[1];
				}
			}
			fb.save();
		}
		window.location = getExtensionURL();
	};

	var errorFn = function() {
		$('#loader').hide();
		displayCode('response', xhr.target.responseText);
	};

	transport.makeAPIRequest(xmlRequest, successFn, errorFn, "", "");
}