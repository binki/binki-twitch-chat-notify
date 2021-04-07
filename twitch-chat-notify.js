(async () => {
  if (!(await window.Notification.requestPermission()) === 'granted') {
    return;
  }
  const target = document.querySelector('*[data-test-selector=chat-scrollable-area__message-container]');
  let lastSeenText = '';
  let isBlurred = false;
  const mo = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      switch (mutation.type) {
        case 'childList': {
          const currentText = target.lastChild.textContent;
          if (currentText !== lastSeenText) {
            lastSeenText = currentText;
            // Some people might claim that document.hidden is sufficient. However, with my workflow,
            // I never minimize windows even if they are not actually visible to me. So I need to use
            // blur. If an API telling me that some component is actually on-screen instead of covered
            // is available, let me know!
            if (window.document.hidden || isBlurred) {
              new window.Notification(currentText);
            }
          }
          break;
        }
      }
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