// ==UserScript==
// @name         Plurk show alias name
// @name:zh-TW   噗浪暱稱顯示工具
// @description  Show alias name of each user under display name (alias naming is a paid service of plurk).
// @description:zh-TW 在每個使用者的暱稱下面顯示別名（別名功能屬於噗浪的付費服務）
// @version      0.1.1
// @license      MIT
// @namespace    https://github.com/stdai1016
// @match        https://www.plurk.com/*
// @exclude      https://www.plurk.com/_comet/*
// @exclude      https://www.plurk.com/settings/*
// @exclude      https://www.plurk.com/Friends/*
// @exclude      https://www.plurk.com/API*
// @grant        none
// ==/UserScript==

/* jshint esversion: 6 */

(function () {
  'use strict';
  function addPlurkHandler (handler) {
    if (!handler || typeof handler !== 'function') throw new TypeError();
    _handlerList.push(handler);
  }
  const _handlerList = [];
  const moPlurk = new MutationObserver(function (records) {
    records.forEach(mr => mr.addedNodes.forEach(node => {
      if (node.classList.contains('plurk') && !node.plurkShowAliasName) {
        node.plurkShowAliasName = true;
        const user = node.querySelector('.td_qual a.name') ||
            node.querySelector('.user a.name');
        const plurk = {
          target: node,
          user_id: user.dataset.uid,
          owner_id: node.dataset.uid,
          is_response: node.classList.contains('response')
        };
        plurk.replurked = !plurk.is_response && plurk.user_id !== plurk.owner_id;
        for (const f of _handlerList) setTimeout(f, 0, plurk);
      }
    }));
  });
  // pop window
  const cbox = document.querySelector('#cbox_response .list');
  if (cbox) moPlurk.observe(cbox, { childList: true });
  if (location.pathname.match(/^\/p\/[0-9A-Za-z]+$/)) {
    // responses
    const resp = document.querySelector('#plurk_responses .list');
    if (resp) moPlurk.observe(resp, { childList: true });
  } else if (location.pathname.match(/^\/[A-Za-z]\w+/)) {
    // timeline
    const timeline = document.querySelector('div.block_cnt');
    if (timeline) moPlurk.observe(timeline, { childList: true });
    const form = document.querySelector('#form_holder .list');
    if (form) moPlurk.observe(form, { childList: true });
  }

  // =================================
  const style = document.createElement('style');
  style.id = `plurkShowAliasName-${GM_info.script.lastModified}`;
  style.innerHTML = [
    '.alias-name {font-size:1rem; color:#888}',
    '.td_qual .alias-name {display:block}'
  ].join('\n');
  document.head.insertBefore(style, document.getElementById('theme-custom'));

  async function getUserAliasesAsync () {
    const resp = await fetch('https://www.plurk.com/Users/fetchUserAliases',
      { credentials: 'same-origin', method: 'POST' });
    return resp.ok ? resp.json() : {};
  }
  getUserAliasesAsync().then(aliasData => {
    addPlurkHandler(function (plurk) {
      if (plurk.user_id in aliasData) {
        const alias = document.createElement('span');
        alias.classList.add('alias-name');
        alias.innerText = aliasData[plurk.user_id];
        alias.insertAdjacentHTML('beforeend', '<span>&nbsp;</span>');
        plurk.target.querySelector('.td_qual').appendChild(alias);
      }
      if (plurk.replurked && plurk.owner_id in aliasData) {
        const alias = document.createElement('span');
        alias.classList.add('alias-name', 'replurk');
        alias.innerText = `\xA0(${aliasData[plurk.owner_id]})`;
        const owner = plurk.target.querySelector('.td_cnt>.text_holder .name');
        owner.parentElement.insertBefore(alias, owner.nextElementSibling);
      }
    });
  });
})();
