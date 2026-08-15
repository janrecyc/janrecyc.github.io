/* ============================================================
   components/pin-pad.js — a numeric keypad (1-9, 0, backspace)
   with 6 dot indicators that fill in as digits are entered.
   Auto-submits at the 6th digit by calling onComplete(pin), which
   must return a Promise<boolean>. On false, the dots shake and
   reset. No text input element anywhere — entirely button-driven.

   renderPinPad(mountId, { userLabel, onComplete, onCancel })
   ============================================================ */
function renderPinPad(mountId, { userLabel, onComplete, onCancel }) {
  const mount = document.getElementById(mountId);
  if (!mount) return;

  let entered = '';
  let busy = false; // block input while verifying / during the error animation

  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

  function draw() {
    mount.innerHTML = `
      ${userLabel ? `<div class="pin-user-label">${userLabel}</div>` : ''}
      <div class="pin-dots" id="pin-dots">
        ${Array.from({ length: 6 }).map((_, i) => `<span class="pin-dot ${i < entered.length ? 'filled' : ''}"></span>`).join('')}
      </div>
      <div class="pin-keypad">
        ${KEYS.map(k => {
          if (k === '') return '<span></span>';
          if (k === 'back') return '<button type="button" class="pin-key pin-key-back" data-key="back" aria-label="ลบ">⌫</button>';
          return `<button type="button" class="pin-key" data-key="${k}">${k}</button>`;
        }).join('')}
      </div>
      <button type="button" class="pin-cancel">ยกเลิก</button>
    `;

    mount.querySelectorAll('.pin-key').forEach(btn => {
      btn.addEventListener('click', () => handleKey(btn.dataset.key));
    });
    mount.querySelector('.pin-cancel').addEventListener('click', () => {
      entered = '';
      onCancel();
    });
  }

  async function handleKey(key) {
    if (busy) return;

    if (key === 'back') {
      entered = entered.slice(0, -1);
      draw();
      return;
    }

    if (entered.length >= 6) return;
    entered += key;
    draw();

    if (entered.length === 6) {
      busy = true;
      const pin = entered;
      const ok = await onComplete(pin);
      if (!ok) {
        shakeAndReset();
      }
      busy = false;
    }
  }

  function shakeAndReset() {
    const dotsEl = mount.querySelector('#pin-dots');
    if (dotsEl) dotsEl.classList.add('pin-error');
    setTimeout(() => {
      entered = '';
      draw();
    }, 400);
  }

  draw();
}
