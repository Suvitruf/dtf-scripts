// ==UserScript==
// @name        Отображение счётчиков количества статей и комментариев в профилях участников
// @version     3
// @namespace   https://github.com/Suvitruf/dtf-scripts
// @description Возвращаем количество постов и комментариев в профиле
// @author      Apanasik aka Suvitruf
// @updateURL   https://github.com/Suvitruf/dtf-scripts/raw/master/profile-counters/profile-counters.meta.js
// @downloadURL https://github.com/Suvitruf/dtf-scripts/raw/master/profile-counters/profile-counters.user.js
// @include     *://*.dtf.ru*
// @include     *://dtf.ru/*
// @include     *://*.tjournal.ru*
// @include     *://tjournal.ru/*
// @include     *://*.vc.ru*
// @include     *://vc.ru/*
// ==/UserScript==

const profileRx = /\/u\/([0-9]*)-([A-Za-z]|[0-9]|-)*(\/entries|\/comments|\/favourites|\/votes|\/drafts|\/updates|\/donates|\/details|)+/;
const userIdRx  = /\/u\/([0-9]*)/;

let dataSet = false;

function setCounter(urlPart, label, value) {
    const tabBlock = document.querySelector(`a[href*="${urlPart}"][class*="v-tab"]`);
    if (!tabBlock)
        return;

    tabBlock.firstChild.innerHTML = `<span class="v-tab__label">${label}<span class="v-tab__counter">${value}</span></span>`;
}

async function loadProfileViaAPI(id, host) {
    // я не смог вытащить этих данных из текущей страницы
    // поэтому пока единственным решением вижу её скачать вручную и спарсить
    const profile = await fetch(`https://api.${host}/v1.9/user/${id}`);
    if (profile.status !== 200)
        return;

    const rawData = await profile.json();

    // может быть 403 ошибка, если, к примеру, администрация скрыла профиль
    // профиль того же Олегоси не получить через api
    if (rawData.error) {
        console.error('cant load profile info: ', rawData.message);

        return;
    }

    const json = rawData.result;

    if (!json || !json.counters)
        return;

    const postsCount    = json.counters.entries;
    const commentsCount = json.counters.comments;

    setCounter('entries', 'Статьи', postsCount);
    setCounter('comments', 'Комментарии', commentsCount);

    dataSet = true;
}


async function loadProfileAsIs(id, host) {
    // я не смог вытащить этих данных из текущей страницы
    // поэтому пока единственным решением вижу её скачать вручную и спарсить
    const profile = await fetch(`https://${host}/u/${id}`);
    if (profile.status !== 200)
        return;

    const rawData = await profile.text();

    const data  = rawData.match(/<textarea(.*?){(.*?)<\/textarea>/gms);
    const raw   = data[0];
    let jsonStr = raw.substr(raw.indexOf('{'));
    jsonStr     = jsonStr.substr(0, jsonStr.lastIndexOf('}') + 1);
    const json  = JSON.parse(jsonStr.replace(/&quot;/g, '"'));

    if (!json.header || !json.header.tabs || !json.header.tabs.length)
        return;

    for (const tab of json.header.tabs) {
        if (tab.label === `Черновики`)
            continue;

        const tabBlock = document.querySelector(`a[href*="${tab.url}"][class*="v-tab"]`);
        if (!tabBlock)
            continue;

        tabBlock.firstChild.innerHTML = `<span class="v-tab__label">${tab.label}<span class="v-tab__counter">${tab.counter}</span></span>`;
    }
}

async function loadProfile(id, host) {
    console.log('loadProfile', id);
    try {
        await loadProfileViaAPI(id, host);
    } catch (e) {
        console.error(e);
        await loadProfileAsIs(id, host);
    }

    dataSet = true;
}

function clear() {
    dataSet = false;
}

async function checkIfProfile() {
    // получаем текущий адрес и проверяем на то, что это профиль
    const location = document.location;
    const href     = location.href;

    // не какая-либо страница юзера
    const uIndex = href.indexOf('/u/');
    // явно не профиль
    if (uIndex === -1) {
        clear();
        return;
    }

    const lastSlash = href.lastIndexOf('/');
    // какая-то юзерская страница, но не корневая
    if (lastSlash !== uIndex + 2) {
        const rx = profileRx.exec(href);

        // скорей всего конкретный пост
        if (!(rx && rx.length && rx.length >= 4 && rx[3])) {
            clear();
            return;
        }
    }

    // сюда попали, если это корневая страница профиля или одна из дополнительных (комменты, закладки и т. п).

    // проверяем, если уже устанавливали счётчики, чтоб лишний раз не нагружать страницу
    if (dataSet)
        return;

    // вытаскиваем id юзера
    const id = userIdRx.exec(href);

    await loadProfile(id[1], location.host);
}

async function checkProfile() {
    checkIfProfile();
    // хрен знает, как сделать, чтоб проверялка работала только при открытии профиля
    setInterval(() => {
        new Promise(checkIfProfile)
            .catch(er => {
                console.error(er);
            });
    }, 3000);
}

checkProfile()
    .catch(er => {
        console.error(er);
    });