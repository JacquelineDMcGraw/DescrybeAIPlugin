document.addEventListener('DOMContentLoaded', function() {
    const closeButton = document.getElementById('closeButton');
    const removeButton = document.getElementById('removeButton');
    let isRemoving = false;

    if (closeButton) {
        closeButton.addEventListener('click', () => window.close());
    }

    if (removeButton) {
        removeButton.addEventListener('click', () => {
            isRemoving = !isRemoving;
            removeButton.textContent = isRemoving ? 'Done Removing' : 'Remove';
            updateRemoveMode(isRemoving);
        });
    }

    requestSavedItems();

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === 'updateAllSavedItems') {
            updateAllLists(request.savedItems);
        }
    });
});



function requestSavedItems() {
    chrome.runtime.sendMessage({ action: 'requestSavedItems' })
        .then((response) => {
            if (response && response.savedItems) {
                updateAllLists(response.savedItems);
            }
        })
        .catch(error => console.error("Error sending message:", error));
}


function updateRemoveMode(enable) {
    const items = document.querySelectorAll('#savedItemsList li');
    items.forEach(item => {
        const existingRemoveIcon = item.querySelector('.removeIcon');
        if (enable && !existingRemoveIcon) {
            const removeIcon = document.createElement('span');
            removeIcon.className = 'removeIcon';
            removeIcon.textContent = '☒ ';
            removeIcon.style.cursor = 'pointer';
            removeIcon.style.color = 'red';
            removeIcon.style.marginRight = '5px';
            removeIcon.addEventListener('click', removeItem);
            item.prepend(removeIcon);
        } else if (!enable && existingRemoveIcon) {
            existingRemoveIcon.removeEventListener('click', removeItem);
            existingRemoveIcon.remove();
        }
    });
}

function removeItem(event) {
    event.stopPropagation();
    const listItem = event.target.closest('li');
    if (!listItem) return;

    const link = listItem.querySelector('a');
    const title = link.textContent;
    const url = link.href;
    chrome.runtime.sendMessage({ action: 'remove', url, title }, () => {
        listItem.remove();
    });
}

function updateAllLists(allSavedItems) {
    const list = document.getElementById('savedItemsList');
    list.innerHTML = '';
    Object.keys(allSavedItems).forEach(query => {
        const items = allSavedItems[query];
        if (items && items.length > 0) {
            updateList(query, items);
        }
    });
}

function updateList(query, savedItems) {
    const list = document.getElementById('savedItemsList');
    let existingHeader = Array.from(list.children).find(child => child.textContent.includes(query));
    if (savedItems.length === 0 && existingHeader) {
        existingHeader.nextElementSibling.remove();
        existingHeader.remove();
    } else if (existingHeader) {
        const itemList = existingHeader.nextElementSibling;
        itemList.innerHTML = '';
        savedItems.forEach(item => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = item.url;
            link.textContent = item.title;
            link.target = '_blank';
            listItem.appendChild(link);
            itemList.appendChild(listItem);
        });
    } else {
        const [header, itemList] = createTabHeader(query, savedItems);
        list.appendChild(header);
        list.appendChild(itemList);
    }
}

function createTabHeader(query, savedItems) {
    const header = document.createElement('h2');
    header.style.cursor = 'pointer';
    const arrow = document.createElement('span');
    arrow.textContent = '▼';
    arrow.style.marginRight = '8px';
    arrow.style.color = '#f34661';
    header.appendChild(arrow);
    const headerTitle = document.createTextNode(query);
    header.appendChild(headerTitle);
    header.addEventListener('click', function() {
        const itemList = this.nextElementSibling;
        itemList.style.display = itemList.style.display === 'none' ? 'block' : 'none';
        arrow.textContent = itemList.style.display === 'none' ? '▲' : '▼';
    });
    const itemList = document.createElement('ul');
    itemList.style.display = 'block';
    savedItems.forEach(item => {
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.href = item.url;
        link.textContent = item.title;
        link.target = '_blank';
        listItem.appendChild(link);
        itemList.appendChild(listItem);
    });
    return [header, itemList];
}