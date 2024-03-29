// ==UserScript==
// @name        dtf/tj favourites counter
// @version     4
// @namespace   https://github.com/Suvitruf/dtf-scripts
// @updateURL   https://github.com/Suvitruf/dtf-scripts/raw/master/favourites/favourites_count.meta.js
// @downloadURL https://github.com/Suvitruf/dtf-scripts/raw/master/favourites/favourites_count.user.js
// @description Добавляет счётчики добавления в избранное
// @author      Suvitruf
// @include     *://*.dtf.ru*
// @include     *://dtf.ru/*
// @include     *://*.tjournal.ru*
// @include     *://tjournal.ru/*
// @grant       none
// ==/UserScript==
(function () {
    startChecker();
})();

let lastBlock;

function startChecker() {
    setInterval(function () {
        const itemsBlocks = document.getElementsByClassName('content-footer__item');
        if (!itemsBlocks || !itemsBlocks.length)
            return;

        let favBlock;
        for (const item of itemsBlocks) {
            const favMarkers = item.getElementsByClassName('favorite_marker__action');
            if (favMarkers && favMarkers.length) {
                favBlock = favMarkers[0];
                break;
            }
        }

        if (!favBlock)
            return;

        const dataBlocks = document.getElementsByClassName('l-hidden entry_data');
        if (!dataBlocks || !dataBlocks.length)
            return;

        const dataBlock = dataBlocks[0];

        if (dataBlock !== null && (lastBlock === null || lastBlock !== favBlock)) {
            lastBlock = favBlock;
            getCount(dataBlock, favBlock);
        }
    }, 3000);
}

function getCount(dataBlock, favBlock) {
    const count = JSON.parse(dataBlock.dataset.articleInfo).favorites;

    let counter = document.getElementById('favorite_suvitruf_counter');
    if (!counter) {
        counter           = document.createElement('div');
        counter.id        = 'favorite_suvitruf_counter';
        counter.innerText = count;
        counter.classList.add("comments_counter__count__value");
        counter.classList.add("comments_counter");
        favBlock.parentNode.onclick = () => {
            let intCount = parseInt(counter.innerText);
            counter.innerText = counter.parentNode.classList.contains('favorite_marker--active') ? intCount + 1 : intCount - 1;
        }
        favBlock.parentNode.appendChild(counter);
    }
}
