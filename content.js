const style = document.createElement('style');
style.innerHTML = `.marg { margin: 10px; }`;
document.head.appendChild(style);

function getSearchQuery() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('q') || 'default';
}

let currentQuery = getSearchQuery();
let savedItemsForQuery = [];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateAllSavedItems') {
        savedItemsForQuery = request.savedItems[currentQuery] || [];
        updateCheckboxesForQuery();
    }
});

function requestSavedItemsAndUpdateCheckboxes() {
    chrome.runtime.sendMessage(chrome.runtime.id, { action: 'requestSavedItems', query: currentQuery }, (response) => {
        if (response) {
            savedItemsForQuery = response.savedItems[currentQuery] || [];
            updateCheckboxesForQuery();
        }
    });
}

function updateCheckboxesForQuery() {
    const divs = document.querySelectorAll('.overflow-hidden.mt-6.bg-white.shadow.sm\\:rounded-lg');
    divs.forEach(div => {
        const checkbox = div.querySelector('input[type="checkbox"]');
        if (checkbox) {
            const title = div.querySelector('a').textContent.trim();
            checkbox.checked = isItemSaved(title);
        }
    });
}

function addCheckboxes() {
    let searchQuery = getSearchQuery();
    if (currentQuery !== searchQuery) {
        currentQuery = searchQuery;
        requestSavedItemsAndUpdateCheckboxes();
    }

    document.querySelectorAll('.overflow-hidden.mt-6.bg-white.shadow.sm\\:rounded-lg').forEach(div => {
        if (!div.querySelector('input[type="checkbox"]')) {
            const wrapperDiv = document.createElement('div');
            wrapperDiv.style.display = 'flex';
            wrapperDiv.style.alignItems = 'flex-start';
            wrapperDiv.style.justifyContent = 'space-between';
            wrapperDiv.style.width = '100%';

            while (div.firstChild) {
                wrapperDiv.appendChild(div.firstChild);
            }

            const checkbox = document.createElement('input');
            checkbox.className = 'h-4 w-4 marg rounded border-gray-300 text-indigo-600 focus:ring-indigo-500';
            checkbox.type = 'checkbox';

            checkbox.addEventListener('click', function() {
                const titleElement = wrapperDiv.querySelector('a') || wrapperDiv.querySelector('h3') || wrapperDiv;
                const title = titleElement.textContent.trim();
                const url = titleElement.href || window.location.href;

                const messageData = {
                    action: checkbox.checked ? 'add' : 'remove',
                    url: url,
                    title: title,
                    query: currentQuery
                };

                chrome.runtime.sendMessage(messageData);
            });

            const titleElement = wrapperDiv.querySelector('a') || wrapperDiv.querySelector('h3') || wrapperDiv;
            const title = titleElement.textContent.trim();
            checkbox.checked = isItemSaved(title);

            wrapperDiv.appendChild(checkbox);
            div.appendChild(wrapperDiv);
        }
    });
}

function isItemSaved(title) {
    return savedItemsForQuery.some(item => item.title === title);
}

function observeDynamicChanges() {
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                addCheckboxes();
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

function setup() {
    if (document.readyState === "loading") {
        document.addEventListener('DOMContentLoaded', () => {
            requestSavedItemsAndUpdateCheckboxes();
            observeDynamicChanges();
        });
    } else {
        requestSavedItemsAndUpdateCheckboxes();
        observeDynamicChanges();
    }
}

setup();

function checkForURLChange() {
    let searchQuery = getSearchQuery();
    if (searchQuery !== currentQuery) {
        addCheckboxes();
    }
}

function requestSavedItemsAndUpdateCheckboxes(query) {
    chrome.runtime.sendMessage({ action: 'requestSavedItems', query }, (response) => {
        if (response && response.savedItems) {
            savedItemsForQuery = response.savedItems[currentQuery] || [];
        } else {
            savedItemsForQuery = [];
        }
        updateCheckboxesForQuery();
    });
}


document.addEventListener('DOMContentLoaded', () => {
    addCheckboxes();
});
