// ==UserScript==
// @name         Plurk Lib
// @description  A library for Plurk
// @version      0.1.0a
// @license      MIT
// @namespace    https://github.com/stdai1016
// @include      https://www.plurk.com/*
// @exclude      https://www.plurk.com/_comet/*
// @exclude      https://www.plurk.com/Premium/*
// ==/UserScript==

/* jshint esversion: 6 */

const plurklib = (function () { // eslint-disable-line
  'use strict';
  /* class */

  class PlurkObserver {
    /**
     *  @param {Function} callback
     */
    constructor (callback) {
      this._observe = false;
      this._mo_tl = new MutationObserver(function (mrs) {
        const records = [];
        mrs.forEach(mr => {
          const pr = { type: 'plurk', plurks: [] };
          mr.addedNodes.forEach(node => {
            const plurk = Plurk.analysisNode(node);
            if (plurk) pr.plurks.push(plurk);
          });
          if (pr.plurks.length) records.push(pr);
        });
        callback(records);
      });
      this._mo_resp = new MutationObserver(function (mrs) {
        const records = [];
        mrs.forEach(mr => {
          const pr = { type: 'plurk', plurk: [] };
          mr.addedNodes.forEach(node => {
            const plurk = Plurk.analysisNode(node);
            if (plurk) pr.plurks.push(plurk);
          });
          if (pr.plurks.length) records.push(pr);
        });
        callback(records);
      });
    }

    observe (options = { plurk: false }) {
      if (options?.plurk) {
        this._observe = true;
        getElementAsync('#timeline_cnt .block_cnt') // timeline
          .then(tl => this._mo_tl.observe(tl, { childList: true }));
        getElementAsync('#cbox_response .list') // pop window
          .then(list => this._mo_resp.observe(list, { childList: true }));
        getElementAsync('#form_holder .list') // responses in timeline
          .then(list => this._mo_resp.observe(list, { childList: true }));
        getElementAsync('#plurk_responses .list') // responses in article
          .then(list => this._mo_resp.observe(list, { childList: true }));
      }
      if (!this._observe) throw Error();
    }

    disconnect () {
      this._mo_tl.disconnect();
      this._mo_resp.disconnect();
    }
  }

  class Plurk {
    /**
     * @param {object} pdata
     */
    constructor (pdata) {
      Plurk.ATTRIBUTES.forEach(a => { this[a] = pdata[a]; });
    }

    get isMute () { return this.is_unread === 2; }

    get isResponse () { return this.id === this.plurk_id; }

    get isReplurk () {
      return !this.isResponse && this.user_id !== this.owner_id;
    }

    /**
     *  @param {HTMLElement} node
     *  @returns {Plurk}
     */
    static analysisNode (node) {
      if (!node.classList.contains('plurk')) return null;
      return new Plurk(analysisNode(node));
    }
  }

  Plurk.ATTRIBUTES = [
    'owner_id',
    'plurk_id',
    'user_id',
    'posted',
    'replurker_id',
    'id',
    'qualifier',
    'content',
    // 'content_raw',
    // 'lang',
    'response_count',
    // 'responses_seen',
    // 'limited_to',
    // 'excluded',
    // 'no_comments',
    'plurk_type',
    'is_unread',
    'last_edited',
    'porn',
    // 'publish_to_followers',
    // 'coins',
    // 'has_gift',
    'replurked',
    // 'replurkers',
    'replurkers_count',
    'replurkable',
    // 'favorers',
    'favorite_count',
    'anonymous',
    // 'responded',
    'favorite'
    // 'bookmark',
    // 'mentioned'
  ];

  function getElementAsync (selectors, target, timeout = 100) {
    return new Promise((resolve, reject) => {
      const i = setTimeout(function () {
        stop();
        const el = target.querySelector(selectors);
        if (el) resolve(el);
        else reject(Error(`get "${selectors}" timeout`));
      }, timeout);
      const mo = new MutationObserver(r => r.forEach(mu => {
        const el = mu.target.querySelector(selectors);
        if (el) { stop(); resolve(el); }
      }));
      mo.observe(target, { childList: true, subtree: true });
      function stop () { clearTimeout(i); mo.disconnect(); }
    });
  }

  /**
   *  @param {HTMLElement} node
   *  @returns {object}
   */
  function analysisNode (node) {
    const user = node.querySelector('.td_qual a.name') ||
                 node.querySelector('.user a.name');
    const posted = node.querySelector('.posted');
    const isResponse = node.classList.contains('response');
    const isReplurk = !isResponse && user.dataset.uid !== node.dataset.uid;
    return {
      target: node,
      owner_id: parseInt(node.dataset.uid),
      plurk_id: parseInt(node.dataset.pid),
      user_id: getPageUserData().id,
      posted: (new Date(posted.dataset.posted)).toUTCString(),
      replurker_id: isReplurk ? parseInt(user.dataset.uid) : null,
      id: parseInt(node.id.substr(1)),
      qualifier: (function () {
        return ':';
      })(),
      content: node.querySelector('.text_holder .text_holder') ||
               node.querySelector('.text_holder'),
      // content_raw,
      // lang,
      response_count: parseInt(node.querySelector('.response_count')),
      // responses_seen,
      // limited_to,
      // excluded,
      // no_comments,
      plurk_type: (function () {
        if (node.dataset.uid === '99999') return 4;
        if (node.querySelector('.private')) return 1;
        return 0;
      })(),
      is_unread: (function () {
        if (node.classList.contains('mute')) return 2;
        if (node.classList.contains('new')) return 1;
        return 0;
      })(),
      last_edited: posted.dataset.edited
        ? (new Date(posted.dataset.edited)).toUTCString()
        : null,
      porn: node.classList.contains('porn'),
      // publish_to_followers,
      // coins,
      // has_gift,
      replurked: node.classList.contains('replurk'),
      // replurkers,
      replurkers_count: parseInt(node.querySelector('a.replurk')?.innerText || 0),
      replurkable: node.querySelector('a.replurk') !== null,
      // favorers,
      favorite_count: parseInt(node.querySelector('a.like')?.innerText || 0),
      anonymous: node.dataset.uid === '99999',
      // responded,
      favorite: node.classList.contains('favorite')
      // bookmark,
      // mentioned
    };
  }

  /**
   *  @returns {object}
   */
  function getUserData () {
    if (window.GLOBAL) return window.GLOBAL.session_user; // eslint-disable-line
    return null;
  }

  /**
   *  @returns {object}
   */
  function getPageUserData () {
    // eslint-disable-next-line
    if (window.GLOBAL?.page_user) return window.GLOBAL.page_user;
    return null;
  }

  /* ## API */
  /**
   *  @param {string} path
   *  @param {object} options
   *  @returns {Promise<any>}
   */
  async function callApi (path, options = null) {
    options = options || {};
    let body = '';
    for (const k in options) {
      body += `&${encodeURIComponent(k)}=${encodeURIComponent(options[k])}`;
    }
    body = body.substr(1);
    const init = { method: 'POST', credentials: 'same-origin' };
    if (body.length) {
      init.body = body;
      init.headers = { 'content-type': 'application/x-www-form-urlencoded' };
    }
    path = path.startsWith('/') ? path : '/' + path;
    const resp = await fetch(`https://www.plurk.com${path}`, init);
    return resp.ok ? resp.json() : {};
  }

  /* ### Notifications */
  /**
   *  @param {number} limit
   *  @param {string|number|Date} offset
   *  @returns {Promise<object>}
   */
  async function getNotificationsMixed2 (limit = 20, offset = null) {
    const options = { limit: limit };
    if (offset) options.offset = (new Date(offset)).toISOString();
    return callApi('/Notifications/getMixed2', options);
  }

  /* ### Responses */
  async function getResponses (plurkId, from = 0) {
    return callApi('/Responses/get',
      { plurk_id: plurkId, from_response_id: from });
  }
  /* ### Users */
  async function fetchUserAliases () {
    return callApi('/Users/fetchUserAliases');
  }
  /**
   *  @param {number|string} userIdOrNickName
   *  @returns {Promise<object>}
   */
  async function fetchUserInfo (userIdOrNickName) {
    let id = null;
    if (/^\d+$/.test(`${userIdOrNickName}`)) id = `${userIdOrNickName}`;
    else {
      const resp = await fetch(`https://www.plurk.com/${userIdOrNickName}`);
      const html = resp.ok ? (await resp.text()) : '';
      const doc = (new DOMParser()).parseFromString(html, 'text/html');
      for (const scr of doc.head.querySelectorAll('script:not([src])')) {
        const i = scr.textContent.indexOf('"page_user"');
        if (i < 0) continue;
        const text = scr.textContent.substr(i, 128);
        id = text.match(/"id" *: *(\d+) *,/)?.[1];
        if (id) break;
      }
    }
    return callApi('/Users/fetchUserInfo', { user_id: id });
  }

  /**
   *  @param {number} userId
   *  @returns {Promise<string[]>}
   */
  async function getCustomCss (userId = null) {
    userId = userId || getPageUserData().id;
    const url = `https://www.plurk.com/Users/getCustomCss?user_id=${userId}`;
    const rules = await (await fetch(url)).text();
    return rules.split(/\r?\n/);
  }

  return {
    Plurk: Plurk,
    PlurkObserver: PlurkObserver,
    getUserData: getUserData,
    getPageUserData: getPageUserData,
    callApi: callApi,
    getNotificationsMixed2: getNotificationsMixed2,
    fetchUserAliases: fetchUserAliases,
    fetchUserInfo: fetchUserInfo,
    getResponses: getResponses,
    getCustomCss: getCustomCss
  };
})();
