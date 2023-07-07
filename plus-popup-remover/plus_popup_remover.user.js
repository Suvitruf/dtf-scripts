// ==UserScript==
// @name        dtf/tj plus popup remover
// @version     2
// @namespace   https://github.com/Suvitruf/dtf-scripts
// @description Вырезает надоедливое окно о покупке плюса
// @author      Apanasik Andrei
// @updateURL   https://github.com/Suvitruf/dtf-scripts/raw/master/plus-popup-remover/plus_popup_remover.meta.js
// @downloadURL https://github.com/Suvitruf/dtf-scripts/raw/master/plus-popup-remover/plus_popup_remover.user.js
// @include     *://*.dtf.ru*
// @include     *://dtf.ru/*
// @include     *://*.tjournal.ru*
// @include     *://tjournal.ru/*
// @grant       none
// ==/UserScript==

(function () {
    subOnChanges();
})();

function getPopup() {
    let plusPopup = document.querySelector('.plus-sheet');
    if (plusPopup)
        return plusPopup;

    plusPopup = document.querySelector('.plus-sheet__gradient');

    return plusPopup;
}

function subOnChanges() {
    // корневой контейнер
    const container = document.querySelector('.app--content-entry');

    const observer = new MutationObserver(() => {
        let plusPopup = getPopup();

        // если на странице есть попап
        if (plusPopup) {
            // возвращаем основной скрол на странице
            container.style = '';

            // вырезаем попап
            container.removeChild(plusPopup.parentNode.parentNode.parentNode);
        }
    });
    const config   = {
        characterData: false,
        attributes:    true,
        childList:     true,
        subtree:       false,
    };

    // подписываемся на его изменения
    observer.observe(container, config);
}