let isRemoving = false; 

document.addEventListener('DOMContentLoaded', function() {
    const closeButton = document.getElementById('closeButton');
    const removeButton = document.getElementById('removeButton');

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
            console.log('Received saved items:', request.savedItems); 
            updateAllLists(request.savedItems);
        }
    });
});

function requestSavedItems() {
    chrome.runtime.sendMessage({ action: 'requestSavedItems' })
        .then((response) => {
            if (response && response.savedItems) {
                console.log('Received saved items on request:', response.savedItems); 
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

    Object.keys(allSavedItems).forEach(query => {
        const items = allSavedItems[query];
        if (items && items.length > 0) {
            updateOrAddList(query, items);
        }
    });

    const headers = Array.from(list.getElementsByTagName('h2'));
    headers.forEach((header, index) => {
        const itemList = header.nextElementSibling;
        if (itemList.style.display !== 'block' && index === headers.length - 1) {
            
            itemList.style.display = 'block';
            header.querySelector('span').textContent = '▼';
        } else if (itemList.style.display !== 'none') {
            
            itemList.style.display = 'block';
            header.querySelector('span').textContent = '▼';
        } else {
           
            itemList.style.display = 'none';
            header.querySelector('span').textContent = '▲';
        }
    });
}


function updateOrAddList(query, savedItems) {
    const list = document.getElementById('savedItemsList');
    let existingHeader = Array.from(list.children).find(child => child.textContent.includes(query));

    if (!existingHeader) {
        
        const [header, itemList] = createTabHeader(query, savedItems);
        list.appendChild(header);
        list.appendChild(itemList);
        updateItemList(itemList, savedItems); 
    } else {
        
        const itemList = existingHeader.nextElementSibling;
        updateItemList(itemList, savedItems);
    }
}

function updateItemList(itemList, savedItems) {
    itemList.innerHTML = '';
    savedItems.forEach(item => {
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.href = item.url;
        link.target = '_blank';

        const itemContent = document.createElement('div');

        if (item.title.includes('has abstract')) {
            const titleText = item.title.replace('has abstract', '').trim();
            const titleSpan = document.createElement('span');
            titleSpan.textContent = titleText;
            titleSpan.className = 'underline';

            link.appendChild(titleSpan);

            const abstractIndicator = document.createElement('span');
            abstractIndicator.innerHTML = '<br>✨ has abstract';
            abstractIndicator.className = 'text-xs font-light';

            itemContent.appendChild(link);
            itemContent.appendChild(abstractIndicator);
        } else {
            link.textContent = item.title;
            itemContent.appendChild(link);
        }

        if (isRemoving) {
            const removeIcon = document.createElement('span');
            removeIcon.className = 'removeIcon';
            removeIcon.textContent = '☒ ';
            removeIcon.style.cursor = 'pointer';
            removeIcon.style.color = 'red';
            removeIcon.style.marginRight = '5px';
            removeIcon.addEventListener('click', removeItem);
            listItem.prepend(removeIcon);
        }

        listItem.appendChild(itemContent);
        itemList.appendChild(listItem);
    });
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
    itemList.style.display = 'none';
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
