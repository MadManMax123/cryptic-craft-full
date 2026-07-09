/**
 * NULL SYSTEM — node_9 :: yield_pass()
 * Call this function from the browser console.
 */

(function () {

  /* ── Overlay markup ── */
  function buildOverlay() {
    const ov = document.createElement('div');
    ov.id = 'yp-overlay';
    ov.innerHTML = `
      <div id="yp-panel">
        <div id="yp-topbar">
          <span id="yp-label">null::helper // yield_pass output</span>
          <button id="yp-close" title="close">✕</button>
        </div>
        <div id="yp-body">
          <img id="yp-gif" src="/tomato.webp" alt="helper signal" />
          <p id="yp-caption">// helper signal decoded — examine carefully</p>
        </div>
      </div>
    `;
    document.body.appendChild(ov);

    /* Close handlers */
    document.getElementById('yp-close').addEventListener('click', destroyOverlay);
    ov.addEventListener('click', e => { if (e.target === ov) destroyOverlay(); });
    document.addEventListener('keydown', escClose);
  }

  function destroyOverlay() {
    const ov = document.getElementById('yp-overlay');
    if (!ov) return;
    ov.classList.add('yp-fade-out');
    document.removeEventListener('keydown', escClose);
    setTimeout(() => ov.remove(), 400);
  }

  function escClose(e) {
    if (e.key === 'Escape') destroyOverlay();
  }

  /* ── Styles injected once ── */
  function injectStyles() {
    if (document.getElementById('yp-styles')) return;
    const s = document.createElement('style');
    s.id = 'yp-styles';
    s.textContent = `
      #yp-overlay {
        position: fixed;
        inset: 0;
        z-index: 99999;
        background: rgba(0, 0, 0, 0.78);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: ypFadeIn .35s ease forwards;
        backdrop-filter: blur(4px);
      }

      #yp-overlay.yp-fade-out {
        animation: ypFadeOut .4s ease forwards;
      }

      @keyframes ypFadeIn  { from { opacity: 0; } to { opacity: 1; } }
      @keyframes ypFadeOut { from { opacity: 1; } to { opacity: 0; } }

      #yp-panel {
        position: relative;
        width: min(520px, 92vw);
        border-radius: 16px;
        border: 1px solid rgba(95, 240, 255, 0.28);
        background: linear-gradient(180deg, rgba(10,16,30,.98), rgba(6,9,18,.99));
        box-shadow:
          0 0 0 1px rgba(255,255,255,.03),
          0 0 60px rgba(95,240,255,.08),
          0 32px 80px rgba(0,0,0,.7);
        overflow: hidden;
        animation: ypSlideUp .35s cubic-bezier(.22,.68,0,1.2) forwards;
      }

      @keyframes ypSlideUp {
        from { transform: translateY(18px); opacity: 0; }
        to   { transform: translateY(0);    opacity: 1; }
      }

      #yp-panel::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(95,240,255,.5), transparent);
      }

      #yp-topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 14px;
        border-bottom: 1px solid rgba(95,240,255,.1);
        background: rgba(95,240,255,.04);
      }

      #yp-label {
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: .65rem;
        letter-spacing: .16em;
        color: rgba(95,240,255,.65);
        text-transform: uppercase;
      }

      #yp-close {
        background: transparent;
        border: 1px solid rgba(95,240,255,.18);
        border-radius: 6px;
        color: rgba(95,240,255,.45);
        font-size: .7rem;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: .18s;
        font-family: monospace;
        line-height: 1;
      }

      #yp-close:hover {
        border-color: rgba(95,240,255,.55);
        color: rgba(95,240,255,.9);
        box-shadow: 0 0 8px rgba(95,240,255,.15);
      }

      #yp-body {
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 14px;
      }

      #yp-gif {
        max-width: 100%;
        max-height: 360px;
        border-radius: 10px;
        border: 1px solid rgba(95,240,255,.14);
        box-shadow:
          0 0 32px rgba(95,240,255,.06),
          0 8px 32px rgba(0,0,0,.55);
        display: block;
      }

      #yp-caption {
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: .68rem;
        color: rgba(130,160,220,.5);
        letter-spacing: .1em;
        text-align: center;
      }
    `;
    document.head.appendChild(s);
  }

  /* ── The public function ── */
  window.yield_pass = function () {
    if (document.getElementById('yp-overlay')) return; // already open
    injectStyles();
    buildOverlay();
    /* Subtle console acknowledgement */
    console.log('%c// null::helper signal transmitted', 'color:#5ff0ff;font-family:monospace;');
  };


})();
