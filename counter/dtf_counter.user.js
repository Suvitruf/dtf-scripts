// ==UserScript==
// @name        dtf counter
// @version     1
// @namespace   https://github.com/Suvitruf/dtf-scripts
// @description Добавляет счётчики на страницу редактирования статьи
// @author      Suvitruf
// @updateURL   https://github.com/Suvitruf/dtf-scripts/raw/master/counter/dtf_counter.meta.js
// @downloadURL https://github.com/Suvitruf/dtf-scripts/raw/master/counter/dtf_counter.user.js
// @include     *://*dtf.ru/u/*/drafts?writing=*
// @grant       none
// ==/UserScript==
(function () {
    waitForElm('.editor-cp-tabs').then((elem) => {
        addBlock(elem);
        startCounter();
    });
})();

/***
 * Ожидание появления элемента по selector'у
 * https://stackoverflow.com/questions/5525071/how-to-wait-until-an-element-exists
 */

function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

/***
 * Стартуем таймер, который раз в секунду будет пересчитывать.
 */

function startCounter() {
    setInterval(function () {
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

function addBlock(parent) {
    const countersContent             = document.createElement('div');
    countersContent.className         = 'editor-cp-tab__content';
    countersContent.id                = 'counters_block'

    const counterMenu = document.createElement('div');
    ['words_counter', 'letters_counter', 'paragraphs_counter'].forEach((id) => {
        const pElem = document.createElement('p');
        pElem.id = id;
        counterMenu.appendChild(pElem);
    });
    countersContent.appendChild(counterMenu);

    const countersDiv     = document.createElement('div');
    countersDiv.className = 'editor-cp-tab';
    countersDiv.id        = 'counter_div'

    countersDiv.addEventListener("click", () => {
        const counterBlock = document.getElementById('counter_div');
        counterBlock.className = counterBlock.className === 'editor-cp-tab'
                                    ? 'editor-cp-tab editor-cp-tab--active'
                                    : 'editor-cp-tab';
    });

    const countersLabel     = document.createElement('div');
    countersLabel.className = 'editor-cp-tab__label';

    const label     = document.createElement('span');
    label.innerText = 'Статистика';
    countersLabel.appendChild(label);

    countersDiv.appendChild(countersLabel);
    countersDiv.appendChild(countersContent);

    parent.insertAdjacentElement('beforeend', countersDiv);
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