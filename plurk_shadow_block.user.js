// ==UserScript==
// @name         Plurk shadow block
// @name:zh-tw   噗浪隱形黑名單
// @version      0.1.0
// @description  Shadow blocks user (only blocks on responses and timeline of yourself)
// @description:zh-tw 隱形封鎖使用者（只是會在回應和在河道上看不到被封鎖者的發文、轉噗，其他正常）
// @match        https://www.plurk.com/*
// @require      https://code.jquery.com/jquery-3.5.1.min.js
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        window.onurlchange
// ==/UserScript==

/* jshint esversion: 6 */
/* global $ */

(function () {
  'use strict';
  /* ======= storage ======= */
  const DEFAULT_VALUE = {
    replurk: true,
    response: true,
    blocklist: []
  };
  Object.keys(DEFAULT_VALUE).forEach(k => {
    if (typeof GM_getValue(k) !== typeof DEFAULT_VALUE[k]) {
      GM_setValue(k, DEFAULT_VALUE[k]);
    }
  });
  function valueGetSet (key, val = null) {
    if (val != null) GM_setValue(key, val);
    return GM_getValue(key);
  }

  /* ============== */
  GM_addStyle(
    '.blocked {display:none}' +
    '.resp-hidden-show {background:#f5f5f9;color:#afb8cc;' +
    '  font-weight:normal;vertical-align:top;transform:scale(0.9);opacity:0;}' +
    '.resp-hidden-show.show {opacity:1}' +
    '.response-status:hover .resp-hidden-show {opacity:1}' +
    '.resp-hidden-show:hover {background:#afb8cc;color:#fff}'
  );

  if (window.location.pathname.match(/^\/p\/[A-Za-z\d]+$/)) {
    // responses
    const respMo = new MutationObserver(responseMutationHandler);
    respMo.observe($('#plurk_responses .list')[0], { childList: true });
    makeButton($('#plurk_responses>.response_box'));
    // pop window
    const cboxMo = new MutationObserver(responseMutationHandler);
    cboxMo.observe($('#cbox_response .list')[0], { childList: true });
    makeButton($('#cbox_response>.response_box'));
  } else if ($('#nav-account>span').text() ===
      window.location.pathname.substr(1)) {
    // timeline
    const cntMo = new MutationObserver(responseMutationTimeline);
    cntMo.observe($('div.block_cnt')[0], { childList: true });
    const formMo = new MutationObserver(responseMutationHandler);
    formMo.observe($('#form_holder .list')[0], { childList: true });
    makeButton($('#form_holder>.response_box'));
    // pop window
    const cboxMo = new MutationObserver(responseMutationHandler);
    cboxMo.observe($('#cbox_response .list')[0], { childList: true });
    makeButton($('#cbox_response>.response_box'));
  }

  function responseMutationTimeline (records) {
    records.forEach(mu => {
      mu.addedNodes.forEach(node => {
        const up = $(node).find('.td_img>.p_img a')[0].href.split('/').pop();
        const u0 = $(node).find('.td_qual a.name')[0].href.split('/').pop();
        if (onBlockList(up) || onBlockList(u0)) {
          node.classList.add('shadow-block', 'blocked');
        }
      });
    });
  }

  function responseMutationHandler (records) {
    records.forEach(mu => {
      const $btn = $(mu.target).parent().find('.resp-hidden-show');
      let nBlock = 0;
      mu.addedNodes.forEach(node => {
        if (!node.classList.contains('plurk')) return;
        const u0 = $(node).find('a.name')[0].href.split('/').pop();
        if (onBlockList(u0)) {
          nBlock += 1;
          node.classList.add('shadow-block');
          if (!$btn.hasClass('show')) node.classList.add('blocked');
        }
      });
      if ($btn.hasClass('blocked') && nBlock) $btn.removeClass('blocked');
      if (mu.target.children.length === 0) {
        $btn.removeClass('show').addClass('blocked').text('顯示被封鎖的回應');
      }
    });
  }

  function makeButton ($responseBox) {
    const $formBtn = $('<div>顯示被封鎖的回應</div>').on('click', function () {
      $formBtn.toggleClass('show');
      this.innerText = this.innerText.replace(/.{2}/,
        $formBtn.hasClass('show') ? '隱藏' : '顯示');
      $responseBox.children('.list').children('.shadow-block')
        .toggleClass('blocked');
    }).addClass(['resp-hidden-show', 'button', 'small-button', 'blocked'])
      .insertAfter($responseBox.find('.response-only-owner'));
  }

  function onBlockList (user) {
    return valueGetSet('blocklist').includes(user);
  }
})();
