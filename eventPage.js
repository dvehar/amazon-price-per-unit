chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if (tab.url.indexOf('amazon.com') != -1) {
		chrome.pageAction.show(tabId);
	} else {
		chrome.pageAction.hide(tabId);
	}
});