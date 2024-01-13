let savedItems = {};
let isPanelOpen = false;

function saveState() {
    const data = JSON.stringify({ isPanelOpen, savedItems });
    chrome.storage.local.set({ data });
}

function loadStateAndSendMessage() {
    chrome.storage.local.get(['data'], function (result) {
        if (result.data) {
            const state = JSON.parse(result.data);
            isPanelOpen = state.isPanelOpen;
            savedItems = state.savedItems;
        }

        if (isPanelOpen) {
            openSidePanel();
        }
        sendSavedItemsToSidebar();
    });
}

function sendSavedItemsToSidebar() {
    chrome.runtime.sendMessage(chrome.runtime.id, {
        action: 'updateAllSavedItems',
        savedItems
    });
}

function openSidePanel(tab) {
    isPanelOpen = true;
    chrome.sidePanel.open({ windowId: tab.windowId }, () => {
        sendSavedItemsToSidebar();
    });

    saveState();
}

function closeSidePanel() {
    isPanelOpen = false;
    chrome.sidePanel.close();
    saveState();
}

chrome.runtime.onInstalled.addListener(() => {
    loadStateAndSendMessage();
});

chrome.runtime.onStartup.addListener(() => {
    loadStateAndSendMessage();
});

chrome.action.onClicked.addListener((tab) => {
    if (isPanelOpen) {
        closeSidePanel();
    } else {
        openSidePanel(tab);
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (['add', 'remove'].includes(request.action)) {
        const query = request.query || 'default';
        savedItems[query] = savedItems[query] || [];
        if (request.action === 'add') {
            savedItems[query].push({ url: request.url, title: request.title });
        } else if (request.action === 'remove') {
            savedItems[query] = savedItems[query].filter(item => item.url !== request.url);
        }
        saveState();
        sendSavedItemsToSidebar();
        sendResponse({ savedItems: savedItems[query] });
    } else if (request.action === 'requestSavedItems') {
        sendResponse({ savedItems: savedItems });
    }
    return true;
});
