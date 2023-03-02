const WHITELIST_PARAM = "unblockia=true";
const TO_INTERCEPT_STRINGS = ["vuukle", "securepubads", "adnxs.com", "criteo", "google", "doubleclick", "pagead2", 'ampproject', 'rubicon'];
const SCRIPT_TAG = 'SCRIPT';
const IFRAME_TAG = 'IFRAME';
const LINK_TAG = 'LINK';

function addUnblockiaTrueToUrl(url) {
  const u = url.startsWith("//") ? 'https:' + url : url;
  try {
    const formattedUrl = new URL(u);
    if (!formattedUrl.search.includes(WHITELIST_PARAM)) {
      if (!formattedUrl.search) {
        return u + '?' + WHITELIST_PARAM
      } else {
        return u + '?' + WHITELIST_PARAM
      }
    }
  } catch (e) { // redextremadura sobreescribe URL y no puedo hacer new URL
     if (!u.includes(WHITELIST_PARAM)) {
       return u + '?' + WHITELIST_PARAM
     }
  }
}

function initProxies() {
  try {

    const sendBeaconProxy = navigator.sendBeacon;
    navigator.sendBeacon = function() {
      if (arguments[0].includes('bidder.criteo')) {
        arguments[0] = addUnblockiaTrueToUrl(arguments[0])
      }
      return sendBeaconProxy.apply(this, arguments);
    };

    const appendChildProxy = window.HTMLElement.prototype.appendChild;
    window.HTMLElement.prototype.appendChildOld = window.HTMLElement.prototype.appendChild;
    window.HTMLElement.prototype.appendChild = function() {
      if (arguments[0].tagName === LINK_TAG) {
        arguments[0].href = addUnblockiaTrueToUrl(arguments[0].href)
      }
      if ([SCRIPT_TAG, IFRAME_TAG].includes(arguments[0].tagName)) {
        if (arguments[0].src && arguments[0].src !== 'about:blank' && !arguments[0].src.includes('pubstack')) {
          arguments[0].src = addUnblockiaTrueToUrl(arguments[0].src)
        }
      }
      return appendChildProxy.apply(this, arguments);
    };
    window.HTMLElement.prototype.insertBeforeproxyOld = window.HTMLElement.prototype.insertBefore;
    const insertBeforeproxy = window.HTMLElement.prototype.insertBefore;
    window.HTMLElement.prototype.insertBefore = function() {
      if (arguments[0].tagName === LINK_TAG) {
        arguments[0].href = addUnblockiaTrueToUrl(arguments[0].href)
      }
      if ([SCRIPT_TAG, IFRAME_TAG].includes(arguments[0].tagName)) {

        if (arguments[0].src && arguments[0].src !== 'about:blank') {
          const url = new URL(arguments[0].src);
          if (!url.search) {
            arguments[0].src = arguments[0].src + '?' + WHITELIST_PARAM
          } else {
            arguments[0].src = arguments[0].src + '&' + WHITELIST_PARAM
          }
        }
      }
      return insertBeforeproxy.apply(this, arguments);
    };

    const appendProxy = window.HTMLElement.prototype.append;
    window.HTMLElement.prototype.appendOld = window.HTMLElement.prototype.append;
    window.HTMLElement.prototype.append = function() {
      if (arguments[0].tagName === LINK_TAG) {
        arguments[0].href = addUnblockiaTrueToUrl(arguments[0].href)
      }
      if ([SCRIPT_TAG, IFRAME_TAG].includes(arguments[0].tagName)) {
        if (arguments[0].src && arguments[0].src !== 'about:blank') {
          const url = new URL(arguments[0].src);
          if (!url.search) {
            arguments[0].src = arguments[0].src + '?' + WHITELIST_PARAM
          } else {
            arguments[0].src = arguments[0].src + '&' + WHITELIST_PARAM
          }
        }
      }
      return appendProxy.apply(this, arguments);
    };

    const proxiedOpen = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.openOld = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function() {
      let newArg = arguments[1];
      if (TO_INTERCEPT_STRINGS.some(x => arguments[1].includes(x))) {
        newArg = addUnblockiaTrueToUrl(arguments[1]);
      }
      return proxiedOpen.apply(this, [arguments[0], newArg]);
    };

  } catch (e) {
  }
}
