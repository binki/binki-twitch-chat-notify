(async () => {
  if (!(await window.Notification.requestPermission()) === 'granted') {
    return;
  }
  const target = document.querySelector('*[data-test-selector=chat-scrollable-area__message-container]');
  let lastSeenText = '';
  const mo = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      switch (mutation.type) {
        case 'childList': {
          const currentText = target.lastChild.textContent;
          if (currentText !== lastSeenText) {
            lastSeenText = currentText;
            new window.Notification(currentText);
          }
          break;
        }
      }
    }
  });
  mo.observe(target, {
    childList: true,
  });
  const b = document.createElement('button');
  b.setAttribute('style', 'position: absolute; z-index: 1; background: rgba(0,0,0,0.5);');
  b.textContent='Unnotify';
  b.onclick=() => {
    b.remove();
    mo.disconnect();
  };
  document.body.append(b);
})();