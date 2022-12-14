// ==UserScript==
// @name        dtf/tj dislikes counter
// @version     4
// @namespace   https://github.com/Suvitruf/dtf-scripts
// @updateURL   https://github.com/Suvitruf/dtf-scripts/raw/master/dislikes/dislikes_count.meta.js
// @downloadURL https://github.com/Suvitruf/dtf-scripts/raw/master/dislikes/dislikes_count.user.js
// @description Добавляет счётчики дизлайков в посты
// @author      Suvitruf
// @include     *://*.dtf.ru*
// @include     *://dtf.ru/*
// @include     *://*.tjournal.ru*
// @include     *://tjournal.ru/*
// @grant       none
// ==/UserScript==
const postIdRx = /\/([0-9]*)/;

let lastLocation;

(function () {
    startChecker()
        .catch();
})();

async function startChecker() {
    setInterval(async function () {
        const itemsBlocks = document.getElementsByClassName('l-hidden entry_data');
        if (!itemsBlocks || !itemsBlocks.length)
            return;

        const dataBlock = itemsBlocks[0];
        const info =  dataBlock.attributes.getNamedItem("data-article-info");
        const location = document.location;

        if(!info  || (lastLocation === location.href))
            return;

        const value = JSON.parse(info.value);
        const likes = value.likes;

        const lastSlash = location.href.lastIndexOf('/');
        const id = postIdRx.exec(location.href.substring(lastSlash));
        const post = await fetch(`https://api.dtf.ru/v1.9/entry/${id[1]}`);
        if (post.status !== 200)
            return;

        lastLocation = location.href;

        const data = await post.json();
        const likesSum = data.result.likes.summ;

        setCounters(likes, likesSum, location);

    }, 2000);
}

function setCounters(likes, likesSum, location){
    const itemsBlocks = document.getElementsByClassName('content-footer__item');
    if (!itemsBlocks || !itemsBlocks.length)
        return;

    let likesSpan;
    for (const item of itemsBlocks) {
        const likesBlock = item.getElementsByClassName('like-button__count');
        if (likesBlock && likesBlock.length) {
            likesSpan = likesBlock[0];
            break;
        }
    }

    if (!likesSpan)
        return;

    likesSpan.innerHTML = likes + '/' + (likesSum - likes);
}