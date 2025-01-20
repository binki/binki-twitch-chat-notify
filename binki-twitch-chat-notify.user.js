// ==UserScript==
// @name     binki-twitch-chat-notify
// @version  1.5
// @grant    none
// @author   Nathan Phillip Brink (binki) (@ohnobinki)
// @homepageURL https://github.com/binki/binki-twitch-chat-notify/
// @include  https://www.twitch.tv/*
// @include  https://twitch.tv/*
// @require https://github.com/binki/binki-userscript-when-element-query-selector-async/raw/0a9c204bdc304a9e82f1c31d090fdfdf7b554930/binki-userscript-when-element-query-selector-async.js
// ==/UserScript==
(async () => {
  if (await window.Notification.requestPermission() !== 'granted') {
    return;
  }
  // In mod view, the components of the page load lazily. So wait for the chat area to show up.
  // On normal pages, by the time our script runs, the necessary element is already created, so this
  // isn‘t necessary.
  const target = await whenElementQuerySelectorAsync(document.body, '*[data-test-selector=chat-scrollable-area__message-container]');
  let lastSeenText = '';
  let isBlurred = false;
  const mo = new MutationObserver(mutations => {
    try {
      for (const mutation of mutations) {
        switch (mutation.type) {
          case 'childList': {
            const lineElement = target.lastChild.querySelector('.chat-line__message');
            const currentText = lineElement ? lineElement.textContent : undefined;
            if (lineElement && currentText !== lastSeenText) {
              console.log('line message');
              lastSeenText = currentText;
              // Some people might claim that document.hidden is sufficient. However, with my workflow,
              // I never minimize windows even if they are not actually visible to me. So I need to use
              // blur. If an API telling me that some component is actually on-screen instead of covered
              // is available, let me know!
              if (window.document.hidden || isBlurred) {
                // Extract slightly nicer formatted message.
                const maybeTimeStampElement = lineElement.querySelector('[data-test-selector=chat-timestamp]');
                // If the timeStampElement doesn’t exist, the user probably disabled it (issue #3).
                const maybeTimeStamp = maybeTimeStampElement ? maybeTimeStampElement.textContent : null;
                // has srcset which we could parse instead of using src
                const badgeElement = lineElement.querySelector('img.chat-badge');
                const badgeSrc = badgeElement === null ? undefined : badgeElement.src;
                const userNameElement = lineElement.querySelector('[data-test-selector=message-username]');
                const userName = userNameElement.textContent;
                const firstMessageElement = lineElement.querySelector('.chat-line__username-container').nextSibling.nextSibling.firstChild;
                const messageText = (function concatMessage(currentElement) {
                  if (currentElement === null) return '';
                  return (() => {
                    const foundImage = currentElement.querySelector('img.chat-image');
                    return foundImage ? ` ${foundImage.alt} ` : currentElement.textContent;
                  })() + concatMessage(currentElement.nextSibling);
                })(firstMessageElement);
                const avatarElement = document.querySelector('.channel-info-content .tw-image-avatar, .mosaic-root .tw-image-avatar');
                const avatarSrc = avatarElement === null ? undefined : avatarElement.src;
                const notification = new window.Notification(`${maybeTimeStamp ? maybeTimeStamp + ' ' : ''}<${userName}> ${messageText}`, {
                  image: badgeSrc,
                  icon: avatarSrc,
                });
              }
            }
            break;
          }
        }
      }
    } catch (ex) {
      console.error(ex);
      console.error('mutations', mutations);
    }
  });
  const cleanups = [];
  mo.observe(target, {
    childList: true,
  });
  cleanups.push(() => mo.disconnect());
  const b = document.createElement('button');
  // Need z-index greater than 1000 because Twitch (non-mod) uses a z-index of 1000.ㅋㅋㅋ
  b.setAttribute('style', 'position: absolute; z-index: 1001; background: rgba(0,0,0,0.5);');
  b.textContent='Unnotify';
  b.onclick=() => {
    for (const cleanup of cleanups) {
      cleanup();
    }
  };
  document.body.append(b);
  cleanups.push(() => b.remove());
  const registerHandlerWithCleanup = (target, eventName, handler) => {
    target.addEventListener(eventName, handler, false);
    cleanups.push(() => target.removeEventListener(eventName, handler, false));
  };
  registerHandlerWithCleanup(window.document, 'blur', () => isBlurred = true);
  registerHandlerWithCleanup(window.document, 'focus', () => isBlurred = false);
})();
