chrome.browserAction.onClicked.addListener(function() {

	var extensionKey = document.URL.split("/")[2];
	var url = 'chrome-extension://' + extensionKey + '/interact.html';

	chrome.tabs.query({url : url}, function(tab) {
		if (tab.length === 0) {
			chrome.tabs.create({url:'interact.html'});
		} else {
			chrome.tabs.update(tab[0].id, {selected: true});
		}
	});

});
