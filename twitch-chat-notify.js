(async () => {
  if (!(await window.Notification.requestPermission()) === 'granted') {
    return;
  }
  const target = document.querySelector('*[data-test-selector=chat-scrollable-area__message-container]');
  let lastSeenText = '';
  let isBlurred = false;
  const mo = new MutationObserver(mutations => {
    try {
      for (const mutation of mutations) {
        switch (mutation.type) {
          case 'childList': {
            const lineElement = target.lastChild;
            const currentText = lineElement.textContent;
            if (currentText !== lastSeenText) {
              lastSeenText = currentText;
              // Some people might claim that document.hidden is sufficient. However, with my workflow,
              // I never minimize windows even if they are not actually visible to me. So I need to use
              // blur. If an API telling me that some component is actually on-screen instead of covered
              // is available, let me know!
              if (window.document.hidden || isBlurred) {
                // Extract slightly nicer formatted message.
                const timeStampElement = lineElement.querySelector('[data-test-selector=chat-timestamp]');
                // If the timeStampElement doesn’t exist, it probably isn’t a message.
                if (timeStampElement) {
                  const timeStamp = timeStampElement.textContent;
                  // has srcset which we could parse instead of using src
                  const badgeElement = lineElement.querySelector('img.chat-badge');
                  const badgeSrc = badgeElement === null ? undefined : badgeElement.src;
                  const userName = lineElement.querySelector('[data-test-selector=message-username]').textContent;
                  const chatMessageSeparatorElement = lineElement.querySelector('[data-test-selector=chat-message-separator]');
                  const messageText = (function concatMessage(currentElement) {
                    if (currentElement === null) return '';
                    return (() => {
                      const foundImage = currentElement.querySelector('img.chat-image');
                      return foundImage ? ` ${foundImage.alt} ` : currentElement.textContent;
                    })() + concatMessage(currentElement.nextSibling);
                  })(chatMessageSeparatorElement.nextSibling);
                  const avatarElement = document.querySelector('.channel-info-content .tw-image-avatar, .mosaic-root .tw-image-avatar');
                  const avatarSrc = avatarElement === null ? undefined : avatarElement.src;
                  const notification = new window.Notification(`${timeStamp} <${userName}> ${messageText}`, {
                    image: badgeSrc,
                    icon: avatarSrc,
                  });
                }
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