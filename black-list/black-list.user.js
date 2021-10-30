// ==UserScript==
// @name        Separate blacklist
// @version     1
// @namespace   https://github.com/Suvitruf/dtf-scripts
// @description Раздельный ЧС для постов, репостов и комментариев
// @author      Apanasik aka Suvitruf
// @updateURL   https://github.com/Suvitruf/dtf-scripts/raw/master/black-list/black-list.meta.js
// @downloadURL https://github.com/Suvitruf/dtf-scripts/raw/master/black-list/black-list.user.js
// @include     *://*.dtf.ru*
// @include     *://dtf.ru/*
// @include     *://*.tjournal.ru*
// @include     *://tjournal.ru/*
// @include     *://*.vc.ru*
// @include     *://vc.ru/*
// @grant       GM_addStyle
// @grant       GM.setValue
// @grant       GM.getValue
// @grant       unsafeWindow
// ==/UserScript==

GM_addStyle(`
    #black_list_icon_block {
        cursor: pointer;
    }
    
    .black_list_users {
        --image-size: 36px;
        --image-radius: 6px;
        --grid-gap: 16px;
        height: 420px;
        overflow: auto;
    }

    .black-list-item {
        display: -ms-flexbox;
        display: flex;
        -ms-flex-align: center;
        align-items: center;
        min-width: 0;
        position: relative;
        padding: 12px 0;
    }
    .black-list-item__main {
        -ms-flex: 1;
        flex: 1;
        display: -ms-flexbox;
        display: flex;
        -ms-flex-align: center;
        align-items: center;
        min-width: 0;
    }
    .black-list-item__image:not(:last-child) {
        margin-right: 12px;
    }

    .black-list-item__image {
        -ms-flex-negative: 0;
        flex-shrink: 0;
        width: var(--image-size);
        height: var(--image-size);
        background-color: #dedede;
        border-radius: var(--image-radius);
        -webkit-box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1);
        box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1);
        background-position: 50% 50%;
        background-repeat: no-repeat;
        background-size: cover;
    }
    
    .black-list-item__label-container {
        -ms-flex: 1;
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .black-list-item__label {
        font-size: 18px;
        line-height: 1.45em;
        font-weight: 500;
    }
    
    .black-list-item-checkbox {
        width: 20px;
        height: 20px;
    }
    
    .black-list-item-checkboxes, .black-list-item-checkboxes-header {
        width: 120px;
        display: flex;
    }
    
    .black-list-item-del {
        width: 30px;
    }
    
    .black-list-item-checkbox-header-item {
        width: 30px;
        height: 20px;
        padding: 5px;
        display: block;
    }
    .black-list-item-checkboxes-header {
        margin-right: 30px;
    }
    
    .black-list-item-checkboxes-and-del {
        display: flex;
    }
    
    .comment-black-listed {
        color: #595959;
    }
`);

const userRx = /\/u\/([0-9]*)/;

function getApiUserUrl(id) {
    return `https://api.${document.location.host}/v1.9/user/${id}`;
}

function getDefaultUserState() {
    return {
        p: 1,
        r: 1,
        c: 1
    };
}


async function getUserInfo(id) {
    try {
        const user = await fetch(getApiUserUrl(id));

        return user.json();
    } catch (e) {
        console.error('cant get user', e);

        return null;
    }
}

async function getBlackList() {
    return GM.getValue('dtfBlackListLivesMatter', {blackList: []});
}

function setBlackList(list) {
    GM.setValue('dtfBlackListLivesMatter', list);
}

function checkPostBlockToHide(block, list, type) {
    const href = block.getAttribute('href');

    const rx = userRx.exec(href);

    if (!rx || !rx.length)
        return;

    const blockedUser = list.blackList.find(u => u.id == rx[1]);
    if (!blockedUser || blockedUser.state[type] === 0)
        return;

    if (block.parentNode && block.parentNode.parentNode && block.parentNode.parentNode.parentNode && block.parentNode.parentNode.parentNode.parentNode) {
        block.parentNode.parentNode.parentNode.parentNode.style.display = 'none';
    }
}

async function checkArticles(list) {
    const contentBlocks = document.querySelectorAll('a[class*="content-header-author"][class*="content-header__item"]');
    for (const block of contentBlocks) {
        checkPostBlockToHide(block, list, 'p');
    }
}

async function checkReposts(list) {
    const contentBlocks = document.querySelectorAll('a[class*="content-header-repost__name"]');
    for (const block of contentBlocks) {
        checkPostBlockToHide(block, list, 'r');
    }
}

async function checkComments(list) {
    const contentBlocks = document.querySelectorAll('a[class*="comment__avatar"]');
    for (const block of contentBlocks) {
        const href = block.getAttribute('href');

        const rx = userRx.exec(href);
        if (!rx || !rx.length)
            continue;

        const blockedUser = list.blackList.find(u => u.id == rx[1]);
        if (!blockedUser || blockedUser.state.c === 0)
            continue;

        if (block.parentNode && block.parentNode.parentNode) {
            block.parentNode.parentNode.innerHTML = '<div class="comment__text comment-black-listed"><p>Комментарий скрыт</p></div>';
        }
    }
}

async function checkPosts() {
    const list = await getBlackList();

    await checkArticles(list);
    await checkComments(list);
    await checkReposts(list);
}

function createBlackListedUsersHeader() {
    const row     = document.createElement('div');
    row.innerHTML = `<div class="black-list-item">
        <div class="black-list-item__main">
        </div>
        <div class="etc-control v-etc v-etc--right">
            <div class="black-list-item-checkboxes-header">
                <span class="black-list-item-checkbox-header-item">П</span>
                <span class="black-list-item-checkbox-header-item">Р</span>
                <span class="black-list-item-checkbox-header-item">К</span>
            </div>
            <div class="black-list-item-del">
            </div>
        </div>
    </div>`;

    return row;
}

function onUserStateChanged(type, checked, userId) {
    getBlackList()
        .then(list => {
            const users = list.blackList.filter(u => u.id === userId);
            if (users.length) {
                users[0].state[type] = checked ? 1 : 0;
            }
            setBlackList(list);
        });
}

function onUserDeleted(userId) {
    getBlackList()
        .then(list => {
            list.blackList = list.blackList.filter(u => u.id !== userId);
            setBlackList(list);

            const userBlock = document.getElementById(`black_list_item_${userId}`);
            if (userBlock)
                userBlock.remove();
        });
}

function createBlackListedUserRow(user) {
    const row     = document.createElement('div');
    row.innerHTML = `<div class="black-list-item" id="black_list_item_${user.id}">
        <a href="https://dtf.ru/u/${user.id}" class="black-list-item__main">
            <div class="black-list-item__image" data-src="" style="background-image: url('${user.ava}');" lazy="loaded"></div>
            <div class="black-list-item__label-container"><span class="black-list-item__label">${user.name}</span>
            </div>
        </a>
        <div class="black-list-item-checkboxes-and-del">
            <div class="black-list-item-checkboxes">
                <input type="checkbox" class="black-list-item-checkbox" onchange="onUserStateChanged('p', this.checked, ${user.id})" ${user.state.p === 1 ? 'checked' : ''} value="">
                <input type="checkbox" class="black-list-item-checkbox" onchange="onUserStateChanged('r', this.checked, ${user.id})" ${user.state.r === 1 ? 'checked' : ''} value="">
                <input type="checkbox" class="black-list-item-checkbox" onchange="onUserStateChanged('c', this.checked, ${user.id})" ${user.state.c === 1 ? 'checked' : ''} value="">
            </div>
            <div class="black-list-item-del">
                <span onclick="onUserDeleted(${user.id})">X</span>
            </div>
        </div>
    </div>`;

    return row;
}

function createBlackListedUsersBlock() {
    const root     = document.createElement('div');
    root.innerHTML = `
        <div>
            <div>
                <div id="black_list_users" class="black_list_users">
                    
                </div> 
            </div>
        </div>
    `;

    return root;
}

async function addToBlackList(profile) {
    const list = await getBlackList();
    const user = list.blackList.find(u => u.id === profile.id);
    if (user) {
        user.ava  = profile.avatar_url;
        user.name = profile.name;

    } else {
        const u = {
            id:    profile.id,
            ava:   profile.avatar_url,
            name:  profile.name,
            state: getDefaultUserState()
        };
        list.blackList.push(u);

        const blackListContainer = document.getElementById('black_list_users');
        blackListContainer.appendChild(createBlackListedUserRow(u, list));
    }

    const inp = document.getElementById('search-user-input');
    if (inp)
        inp.value = '';

    setBlackList(list);
}

function tryToAddUserToBlockList(url) {
    const rx = userRx.exec(url);

    if (!rx || !rx.length)
        return;

    getUserInfo(rx[1])
        .then(user => {
            if (user && user.result) {
                return addToBlackList(user.result);
            }
        })
        .then();
}

function createSearchUserBox() {
    const root     = document.createElement('div');
    root.innerHTML = `
        <div data-v-dfc10b28="" class="v-field--text settings-list-subsites__input v-field v-field--default">
            <div class="v-field__wrapper">
                <label class="v-text-input v-text-input--default"><input type="text" id="search-user-input" minLength="3" pattern="." autoComplete="nope" class="v-text-input__input" placeholder="Ссылка"> </label>
            </div>
        </div>`;

    window.addEventListener('keydown', (event) => {
        const inp = document.getElementById('search-user-input');

        if (event.code === 'Enter') {
            const text = inp.value;
            if (!text)
                return;

            tryToAddUserToBlockList(text);
        }
    }, true);

    return root;
}

function initBlackListPanel() {
    const root            = document.createElement('div');
    root.style.width      = '100%';
    root.style.height     = 'calc(100vh)';
    root.style.position   = 'fixed';
    root.style['z-index'] = '9999';
    root.style.background = '#00000088';
    root.style.display    = 'none';
    root.style.top        = '0';
    root.style.left       = '0';

    const panel            = document.createElement('div');
    panel.style.width      = '500px';
    panel.style.height     = '500px';
    panel.style['margin']  = '0 auto';
    panel.style.background = '#fff';
    panel.style.padding    = '20px';
    panel.style.position   = 'fixed';
    panel.style.top        = '0';
    panel.style.left       = '0';
    panel.style.right      = '0';
    panel.style.bottom     = '0';
    panel.addEventListener('click', function (e) {
        e.stopPropagation();
    });

    panel.appendChild(createSearchUserBox());
    panel.appendChild(createBlackListedUsersBlock());

    const bg           = document.createElement('div');
    bg.style.width     = '100%';
    bg.style.height    = '100%';
    bg.style['margin'] = '0 auto';

    bg.addEventListener('click', function () {
        console.log('wtf');
        root.style.display = 'none';
    });
    root.appendChild(bg);
    root.appendChild(panel);

    return root;
}

function createBlackListPanelAndIcon() {
    const panel = initBlackListPanel();

    const root                = document.createElement('div');
    root.id                   = 'black_list_icon_block';
    root.style.display        = 'flex';
    root.style['align-items'] = 'center';

    const text     = document.createElement('p');
    text.id        = 'black_list_text';
    text.innerHTML = 'BL';

    text.addEventListener('click', function () {
        panel.style.display = '';//panel.style.display ? '' : 'none';
    });

    root.appendChild(panel);
    root.appendChild(text);

    return root;
}

async function fillBlockedList() {
    const list      = await getBlackList();
    const blackList = list.blackList;

    const blackListContainer = document.getElementById('black_list_users');

    blackListContainer.appendChild(createBlackListedUsersHeader());
    for (const user of blackList) {
        blackListContainer.appendChild(createBlackListedUserRow(user, blackList));
    }
}

async function addSettingsButton() {
    let settingsButton = document.querySelectorAll('div[class*="site-header-messenger"]');
    while (!settingsButton || !settingsButton.length) {
        await new Promise(resolve => {
            setTimeout(resolve, 200);
        });
        settingsButton = document.querySelectorAll('div[class*="site-header-messenger"]');
    }

    const chatIcon      = settingsButton[0];
    const headerBLock   = chatIcon.parentNode;
    const blackListIcon = createBlackListPanelAndIcon();
    fillBlockedList();

    headerBLock.insertBefore(blackListIcon, chatIcon);
}

async function checkBlackList() {
    checkPosts();
    setInterval(() => {
        new Promise(checkPosts)
            .catch(er => {
                console.error(er);
            });
    }, 5000);
}

addSettingsButton()
    .catch(er => {
        console.error(er);
    });

checkBlackList()
    .catch(er => {
        console.error(er);
    });

if (!unsafeWindow.onUserDeleted) {
    unsafeWindow.onUserDeleted = onUserDeleted;
}

if (!unsafeWindow.onUserStateChanged) {
    unsafeWindow.onUserStateChanged = onUserStateChanged;
}

// слишком часто прокает эта херота
// в идеале нужно, конечно, setInterval выпилить, а это допилить и фильтры добавить
// а то пока что оно вешает браузер, т. к. много раз DOM перебирает
// addEventListener('DOMContentLoaded', function () {
//     console.log('DOMContentLoaded');
//     checkPosts();
// });
//
// addEventListener('DOMNodeInserted', function () {
//     console.log('DOMNodeInserted');
//     checkPosts();
// });
