// ==UserScript==
// @name        dtf/tj reply with quote
// @version     1
// @namespace   https://github.com/Suvitruf/dtf-scripts
// @updateURL   https://github.com/Suvitruf/dtf-scripts/raw/master/reply-with-quote/reply-with-quote.meta.js
// @downloadURL https://github.com/Suvitruf/dtf-scripts/raw/master/reply-with-quote/reply-with-quote.user.js
// @description Добавляет кнопку для ответа с цитатой
// @author      Suvitruf
// @include     *://*.dtf.ru*
// @include     *://dtf.ru/*
// @include     *://*.tjournal.ru*
// @include     *://tjournal.ru/*
// @grant       none
// ==/UserScript==

function getNestedElementsByClassName(className, node = document) {
    let nodeArray = [];
    if (node.classList && node.classList.contains(className)) {
        nodeArray.push(node);
    }
    if (node.children) {
        for (let i = 0; i < node.children.length; i++) {
            nodeArray = nodeArray.concat(getNestedElementsByClassName(className, node.children[i]));
        }
    }
    return nodeArray;
}

function formatText(text) {
    if (!text)
        return '';
    return '> ' + text.replaceAll('\n', '\n> ');
}

function addReplyButtons() {
    const replyButtons = document.getElementsByClassName('comments__item__reply');
    if (!replyButtons || !replyButtons.length)
        return;

    const newButtons = [];
    for (const button of replyButtons) {
        const copyButton = button.cloneNode(true);
        const children   = copyButton.childNodes;

        for (const child in children) {
            if (!children.hasOwnProperty(child))
                continue;

            const item = children[child];
            if (item.nodeName.toLowerCase() !== 'span')
                continue;

            item.innerHTML = 'Ответить с цитатой';
        }

        newButtons.push({
            button: copyButton,
            parent: button.parentNode
        });
    }

    for (const button of newButtons) {
        const parent = button.parent;
        parent.appendChild(button.button);

        const contentNodes = parent.getElementsByClassName('comments__item__text');
        if (!contentNodes || !contentNodes.length)
            continue;

        const rootNode = parent.parentNode.parentNode;
        const text     = contentNodes[0].innerText;

        button.button.addEventListener('click', function () {
            // при клике на "ответить" создаётся инпут
            // мне лень копаться в инвентах и что-то там переопределять, поэтому просто ждём какое-то время
            // через которое это поле явно уже будет создано
            setTimeout(function () {
                const contentInputs = getNestedElementsByClassName('content_editable', rootNode);
                if (!contentInputs || !contentInputs.length)
                    return;

                const placeholders = getNestedElementsByClassName('thesis__placeholder', rootNode);
                if (placeholders && placeholders.length) {
                    placeholders[0].parentNode.removeChild(placeholders[0]);
                }

                contentInputs[0].innerText = formatText(text);
            }, 30);
        });
    }
}

addReplyButtons();