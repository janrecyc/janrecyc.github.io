const connectBtn = document.getElementById('connect-btn');
let connected = false;

if (connectBtn) {
  connectBtn.addEventListener('click', () => {
    connected = !connected;
    connectBtn.textContent = connected ? 'ตัดการเชื่อมต่อ' : 'เชื่อมต่อ';
    document.querySelector('.status-title').textContent = connected
      ? 'คุณได้รับการปกป้องแล้ว'
      : 'คุณไม่ได้รับการปกป้อง';
    document.querySelector('.pulse-dot').style.borderColor = connected ? '#2fe6a7' : '#f06c9b';
  });
}
