(function () {
  const BLOCK = [
    'keydown',
    'keyup',
    'keypress',
    'input',
    'beforeinput',
    'compositionstart',
    'compositionupdate',
    'compositionend',
    'paste',
    'cut',
    'copy',
  ];

  function kill(e) {
    // Allow ArrowUp and ArrowDown
    if (
      e.type.startsWith('key') &&
      (e.key === 'ArrowUp' || e.key === 'ArrowDown')
    ) {
      return true; // let it pass
    }

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    return false;
  }

  BLOCK.forEach(function (type) {
    document.addEventListener(type, kill, { capture: true, passive: false });
    window.addEventListener(type, kill, { capture: true, passive: false });
  });

  document.addEventListener(
    'focus',
    function (e) {
      var t = e.target;
      if (
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        t instanceof HTMLSelectElement ||
        t.isContentEditable
      ) {
        t.blur();
      }
    },
    { capture: true }
  );
})();