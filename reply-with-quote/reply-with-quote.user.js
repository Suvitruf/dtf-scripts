// ==UserScript==
// @name        dtf/tj reply with quote
// @version     4
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
    const replyButtons = document.querySelectorAll('div[class*="comments__item__reply"]:not(.already_added_reply_quote)'); // check by class if it has already been added

    if (!replyButtons || !replyButtons.length)
        return;

    const newButtons = [];
    for (const button of replyButtons) {
        button.classList.add('already_added_reply_quote'); // add the class to prevent recursion buttons
        const copyButton = button.cloneNode(true);
        copyButton.style.cssText = "-moz-user-select: -moz-none; -khtml-user-select: none; -webkit-user-select: none; -ms-user-select: none; user-select: none;"; // add styles to prevent the selection from unselect but it will be still unselect
        const children   = copyButton.childNodes;
        for (const child in children) {
            if (!children.hasOwnProperty(child))
                continue;

            const item = children[child];
            if (item.nodeName.toLowerCase() !== 'span')
                continue;
            item.innerHTML = 'Цитата';
        }

        newButtons.push({
            button:         copyButton,
            originalButton: button
        });
    }

    for (const button of newButtons) {
        const parent = button.originalButton.parentNode;
        button.originalButton.after(button.button);

        const contentNodes = parent.getElementsByClassName('comments__item__text');
        if (!contentNodes || !contentNodes.length)
            continue;

        const rootNode = parent.parentNode.parentNode;

        button.button.addEventListener('click', function () {
            const text = window.getSelection().toString() || contentNodes[0].innerText; // if we have selected text - get it otherwise get all the text of comment
            window.getSelection().removeAllRanges(); // just remove selected text after

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

// Welp, don't override AJAX request cuz it's shit idea. Just set listener :)
addEventListener('DOMContentLoaded', function() {
    addReplyButtons();
});

addEventListener('DOMNodeInserted', function() {
    addReplyButtons();
});
