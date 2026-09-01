/* ============================================================
   components/pin-setup-flow.js — reusable "type a new 6-digit PIN
   twice, must match" flow built on top of components/pin-pad.js.
   Used by:
     - change-pin.html   (after the current PIN is verified)
     - manage-users.html (setting/resetting a user's PIN — no
       "current PIN" check there, an owner is doing it)

   renderPinSetupFlow(mountId, { userLabel, onConfirmed, onCancel })
     - onConfirmed(pin) is called once the two entries match.
     - onCancel() is called if the user backs out of the FIRST step
       (backing out of the confirm step just restarts step 1).
   ============================================================ */
function renderPinSetupFlow(mountId, { userLabel, onConfirmed, onCancel }) {
  let firstPin = null;

  function stepOne() {
    firstPin = null;
    renderPinPad(mountId, {
      userLabel: userLabel ? `${userLabel} — ตั้งรหัส PIN ใหม่` : 'ตั้งรหัส PIN ใหม่',
      onComplete: async (pin) => {
        firstPin = pin;
        stepTwo();
        return true;
      },
      onCancel
    });
  }

  function stepTwo() {
    renderPinPad(mountId, {
      userLabel: userLabel ? `${userLabel} — ยืนยัน PIN อีกครั้ง` : 'ยืนยัน PIN อีกครั้ง',
      onComplete: async (pin) => {
        if (pin !== firstPin) return false; // shakes, then re-draws this same step for a retry
        await onConfirmed(pin);
        return true;
      },
      onCancel: stepOne // back out of confirm -> start over, don't silently keep the old firstPin
    });
  }

  stepOne();
}
