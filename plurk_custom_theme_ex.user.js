/** Plurk Custom Theme EX - userscript for expanding Plurk custom theme
 *
 *  This tool will read CSS rules from
 *  `https://www.plurk.com/Users/getCustomCss?user_id=${uid}`, and insert rules
 *  which start with class selector `._ex_` to HTML head.
 *
 *  How to use it:
 *  1. To use the expand theme, insert `._ex_ ` in front of the selector
 *    for your homepage, or insert `._ex_._global_ ` for global.
 *  2. This tool can read other users expand css when you visit their
 *    homepage. To one-time enable this feature, goto someone's homepage,
 *    open the web console and enter `ENABLE_CUSTOM_CSS_EX_FROM_OTHERS`.
 */

// ==UserScript==
// @name         Plurk Custom Theme EX
// @description  Expand Plurk custom theme
// @version      0.2.3
// @license      MIT
// @namespace    https://github.com/stdai1016
// @match        https://www.plurk.com/*
// @exclude      https://www.plurk.com/_comet/*
// @grant        none
// ==/UserScript==

/* jshint esversion: 6 */

(function () {
  'use strict';

  /** Insert CSS rules to HEAD
   *  @param uid user id
   */
  async function updateCustomCssExFrom (uid) {
    function filter (r) {
      const ss = Array.from(r.split('{')[0].split(','), s => s.trim());
      return ss.some(s => s.startsWith('._lc_ ._ex_'));
    }
    function convert (r) {
      const i = r.indexOf('{');
      let ss = Array.from(r.substr(0, i).split(','), s => s.trim());
      ss = Array.from(ss.filter(filter), s => {
        s = s.substr('._lc_ ._ex_'.length);
        if (!s.startsWith('._global_ ')) s = `._home_${s}`;
        else s = s.substr('._global_ '.length);
        return s;
      });
      return ss.length ? `${ss.join(', ')} ${r.substr(i)}` : '';
    }
    const url = `https://www.plurk.com/Users/getCustomCss?user_id=${uid}`;
    const rules = (await (await fetch(url)).text()).split(/\r?\n/);
    const rulesEx = Array.from(rules.filter(filter), convert);
    (document.getElementById(`plurkCustomCssEx-${uid}`) || (function () {
      const style = document.createElement('style');
      style.type = 'text/css';
      style.id = `plurkCustomCssEx-${uid}`;
      document.head.appendChild(style);
      return style;
    })()).innerHTML = rulesEx.join('\n');
  }

  /* ======= Area Judgment ======= */
  const NAV_IMG_URL = /^https:\/\/avatars\.plurk\.com\/(\d+)-\w+\.\w+$/;
  const CSS_LNK_URL = /^https:\/\/.+\/getCustomCss\?user_id=(\d+)/;
  const link = document.head.querySelector('#theme-custom');
  const meta = document.head.querySelector('meta[property="og:image"]');
  const img = document.body.querySelector('#nav-account img');

  function _g1 (m) { return m ? m[1] : null; } // return group 1 if match
  const tid = (link ? _g1(link.href.match(CSS_LNK_URL)) : null) ||
    _g1(meta.content.match(NAV_IMG_URL));
  const uid = img ? _g1(img.src.match(NAV_IMG_URL)) : null;
  console.debug(`timeline id: ${tid}, user id: ${uid}`);

  if (tid) {
    if (tid === uid) {
      document.body.classList.add('_home_');
      (new MutationObserver(r => r.forEach(m => updateCustomCssExFrom(tid))))
        .observe(link, { attributes: true, attributeFilter: ['href'] });
    } else if (window.localStorage.getItem(`plurkCustomCssEx-${tid}`) ||
        window.localStorage.getItem('plurkCustomCssEx-forever')) {
      window.localStorage.removeItem(`plurkCustomCssEx-${tid}`);
      updateCustomCssExFrom(tid);
    } else {
      function _eccefo (forever) {
        if (window.confirm('Are you sure to enable this feature?')) {
          // eslint-disable-next-line camelcase,no-undef
          const k = forever ? 'forever' : user_id;
          window.localStorage.setItem(`plurkCustomCssEx-${k}`, 1);
          location.reload();
        }
      }
      (function () {
        // set as global function
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.innerHTML = [
          _eccefo.toString(),
          `var user_id = ${tid};`,
          'Object.defineProperty(window, "ENABLE_CUSTOM_CSS_EX_FROM_OTHERS",',
          '  { get: function () { _eccefo(); } });',
          'Object.defineProperty(',
          '  window,',
          '  "ENABLE_CUSTOM_CSS_EX_FROM_OTHERS_FOREVER",',
          '  { get: function () { _eccefo(true); } }',
          ');'
        ].join('\r\n');
        document.head.appendChild(script);
      })();
    }
  }
  if (uid) updateCustomCssExFrom(uid);
})();
