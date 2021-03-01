// ==UserScript==
// @name         Plurk shadow block
// @name:zh-tw   噗浪隱形黑名單
// @version      0.2.0
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

  if (window.location.pathname.match(/^\/p\/[A-Za-z]\w+$/)) {
    // responses
    const respMo = new MutationObserver(responseMutationHandler);
    respMo.observe($('#plurk_responses .list')[0], { childList: true });
    makeButton($('#plurk_responses>.response_box'));
    // pop window
    const cboxMo = new MutationObserver(responseMutationHandler);
    cboxMo.observe($('#cbox_response .list')[0], { childList: true });
    makeButton($('#cbox_response>.response_box'));
  } else if (window.location.pathname === '/Friends/') {
    $('<li><a void="">隱形黑名單</a></li>').on('click', function () {
      window.history.pushState('', document.title, '/Friends/');
      $('#pop-window-tabs>ul>li').removeClass('current');
      this.classList.add('current');
      const $content = $('#pop-window-inner-content .content_inner').empty();
      $content.append(
        '<div class="note">在回應區和自己的河道上看不到被封鎖者的發文、轉噗</div>',
        '<div class="dashboard">' +
        ' <div class="search_box"><input><button>新增</button></div>' +
        ' <div class="empty">目前沒有任何人在黑名單中</div>' +
        '</div>');
      const $holder = $('<div class="item_holder"></div>').appendTo($content);
      const usersInfo = [];
      valueGetSet('blocklist').forEach(id => usersInfo.push(getUserInfo(id)));
      if (usersInfo.length) {
        $content.find('.dashboard .empty').addClass('blocked');
      }
      Promise.all(usersInfo).then(infomations => infomations.forEach(info => {
        makeBlockedUserItem(info, $holder);
      }));
      $content.find('.search_box>button').on('click', function () {
        const m = this.parentElement.children[0].value.match(/^[A-Za-z]\w+$/);
        if (m) {
          const blocklist = valueGetSet('blocklist');
          blocklist.push(m[0]);
          valueGetSet('blocklist', blocklist);
          this.parentElement.children[0].value = '';
          $content.find('.dashboard .empty').addClass('blocked');
          getUserInfo(m[0]).then(info => makeBlockedUserItem(info, $holder));
        } else { window.alert('帳號格式不正確'); }
      });
    }).appendTo('#pop-window-tabs>ul');
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

  function makeBlockedUserItem (info, holder) {
    const $u = $('<div class="user_item user_blocked_users_item"></div>');
    $u.append(
      '<a class="user_avatar" target="_blank">' +
        '<img class="profile_pic" src="' + info.img + '"></img></a>',
      '<div class="user_info">' +
      '  <a class="user_link" target="_blank">' + info.name + '</a>' +
      '  <span class="nick_name">@' + info.id + '</span>' +
      '  <div class="more_info"><br></div>' +
      '</div>',
      '<div class="user_action"><a void="" data-id="' + info.id + '" ' +
        'class="friend_man icon_only pif-user-blocked has_block" ' +
        'title="移除"></a></div>'
    );
    $u.find('a:not(.has_block)').attr('href', '/' + info.id);
    $u.find('a.has_block').on('click', function () {
      const blocklist = valueGetSet('blocklist');
      for (let i = 0; i < blocklist.length; ++i) {
        if (blocklist[i] === this.dataset.id) {
          blocklist.splice(i, 1);
          valueGetSet('blocklist', blocklist);
          $u.remove();
          break;
        }
      }
    });
    $u.appendTo(holder);
  }

  function getUserInfo (id) {
    return new Promise((resolve, reject) => {
      try {
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'document';
        xhr.onload = function () {
          const h = xhr.responseXML.head;
          const title = h.querySelector('[property="og:title"]').content;
          const img = h.querySelector('[property="og:image"]').content;
          const name =
            (title.match(/(.+) \[.+\]/) || title.match(/(.+) - Plurk/))[1];
          resolve({ id: id, name: name, img: img });
        };
        xhr.onerror = function () {
          resolve({ id: id, name: id, img: null });
        };
        xhr.open('GET', 'https://www.plurk.com/' + id);
        xhr.send();
      } catch (e) { resolve({ id: id, name: id, img: null }); }
    });
  }

  function onBlockList (user) {
    return valueGetSet('blocklist').includes(user);
  }
})();
