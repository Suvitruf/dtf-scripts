// ==UserScript==
// @name        dtf counter
// @version     1
// @namespace   https://github.com/Suvitruf/dtf-scripts
// @description Добавляет счётчики на страницу редактирования статьи
// @author      Suvitruf
// @updateURL   https://github.com/Suvitruf/dtf-scripts/blob/master/counter/dtf_counter.meta.js
// @downloadURL https://github.com/Suvitruf/dtf-scripts/blob/master/counter/dtf_counter.user.js
// @include     *://*.dtf.ru*
// @include     *://dtf.ru/*
// @grant       none
// ==/UserScript==
(function () {
    addBlock();
    startCounter();
})();

/***
 * Стартуем таймер, который раз в секунду будет пересчитывать.
 */
function startCounter() {
    setInterval(function () {
        const countersBlock = document.getElementById('counters_block');
        // я хз, почему на dtf не ловятся события смены адреса типа popstate, HashChangeEvent и т.п.
        // приходится по таймеру проверять текущий адрес
        if (!isWriting()) {
            // и если не черновик, то скрывать запись
            countersBlock.style.display = 'none';

            return;
        }
        countersBlock.style.display = '';

        const block      = document.getElementsByClassName('ce-block__content');
        const paragraphs = document.getElementsByClassName('ce-paragraph');

        if (block && block.length) {
            let words   = 0;
            let letters = 0;

            for (let element of block) {
                const txt      = element.textContent || element.innerText || '';
                const counters = calc(txt);

                words += counters.words;
                letters += counters.letters;
            }

            const wordsCounter     = document.getElementById('words_counter');
            wordsCounter.innerHTML = 'Слов: ' + words;

            const lettersCounter     = document.getElementById('letters_counter');
            lettersCounter.innerHTML = 'Букв: ' + letters;

            const paragraphsCounter     = document.getElementById('paragraphs_counter');
            paragraphsCounter.innerHTML = 'Параграфов: ' + paragraphs.length;
        }
    }, 1000);
}

/***
 * Проверяем, находимся ли в режиме редактирования статьи.
 * @returns {boolean} true, если на странице редактирования статьи
 */
function isWriting() {
    return window.location.href.indexOf('/writing') > 0;
}

function addBlock() {
    const postWrapper = document.getElementById('page_wrapper');

    const countersBlock             = document.createElement('div');
    countersBlock.id                = 'counters_block';
    countersBlock.style.height      = '100%';
    countersBlock.style.position    = 'absolute';
    countersBlock.style.paddingLeft = '200px';

    const wordsCounter = document.createElement('p');
    wordsCounter.id    = 'words_counter';

    const lettersCounter = document.createElement('p');
    lettersCounter.id    = 'letters_counter';

    const paragraphsCounter = document.createElement('p');
    paragraphsCounter.id    = 'paragraphs_counter';

    countersBlock.appendChild(wordsCounter);
    countersBlock.appendChild(lettersCounter);
    countersBlock.appendChild(paragraphsCounter);

    postWrapper.insertAdjacentElement('afterend', countersBlock);
}

function calc(txt) {
    const words   = countWords(txt);
    const letters = countLetters(txt);

    return {words, letters};
}

function countWords(s) {
    // https://stackoverflow.com/questions/18679576/counting-words-in-string
    s = s.replace(/(^\s*)|(\s*$)/gi, '');//exclude  start and end white-space
    s = s.replace(/[ ]{2,}/gi, ' ');//2 or more space to 1
    s = s.replace(/\n /, '\n'); // exclude newline with a start spacing
    return s.split(' ').filter(function (str) {
        return str != '';
    }).length;
}

function countLetters(s) {
    // учитываем русские и английские символы
    return s.replace(/[^a-zA-Zа-яА-Я]/g, '').length;
}