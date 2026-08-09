// ══════════════════════════════════════════
//  sort.js — Logic for sort.html (คัดแยก)
//  ScrapPOS
// ══════════════════════════════════════════

// ══════════════════════════════════════════
//  DEMO DATA
// ══════════════════════════════════════════
const DEMO_ITEMS = [
  {id:1,  name:'เหล็กหนัก',          icon:'ph-wrench',        buy_price:4.50, sell_price:5.80, stock_qty:4200, cat:'metal'},
  {id:2,  name:'เหล็กบาง',           icon:'ph-pipe',          buy_price:2.80, sell_price:3.50, stock_qty:1800, cat:'metal'},
  {id:3,  name:'ทองแดง',             icon:'ph-coins',         buy_price:195,  sell_price:215,  stock_qty:320,  cat:'metal'},
  {id:4,  name:'อลูมิเนียม',         icon:'ph-steps',         buy_price:42,   sell_price:50,   stock_qty:960,  cat:'metal'},
  {id:5,  name:'สแตนเลส',            icon:'ph-gear-six',      buy_price:18,   sell_price:22,   stock_qty:550,  cat:'metal'},
  {id:6,  name:'กระดาษหนังสือพิมพ์', icon:'ph-newspaper',     buy_price:2.20, sell_price:2.80, stock_qty:3000, cat:'paper'},
  {id:7,  name:'กระดาษลัง',          icon:'ph-package',       buy_price:2.50, sell_price:3.20, stock_qty:5200, cat:'paper'},
  {id:8,  name:'กระดาษขาว',          icon:'ph-file-text',     buy_price:3.00, sell_price:3.80, stock_qty:1100, cat:'paper'},
  {id:9,  name:'พลาสติกขาว',         icon:'ph-cube',          buy_price:8.50, sell_price:11,   stock_qty:780,  cat:'plastic'},
  {id:10, name:'ขวด PET',            icon:'ph-flask',         buy_price:6.00, sell_price:8.00, stock_qty:620,  cat:'plastic'},
  {id:11, name:'แก้วใส',             icon:'ph-square',        buy_price:1.20, sell_price:1.60, stock_qty:2100, cat:'glass'},
  {id:12, name:'สายไฟทองแดง',        icon:'ph-plug-charging', buy_price:85,   sell_price:100,  stock_qty:180,  cat:'electric'},
  {id:13, name:'มอเตอร์เก่า',        icon:'ph-lightning',     buy_price:25,   sell_price:32,   stock_qty:95,   cat:'electric'},
];

// ══════════════════════════════════════════
//  ICON / COLOR HELPERS
// ══════════════════════════════════════════
const CAT_COLOR = {
  glass:        {bg:'#E3F2FD', fg:'#1565C0'},
  'beer-crate': {bg:'#FDE8C8', fg:'#C06000'},
  steel:        {bg:'#E8EDF8', fg:'#3A6CC8'},
  plastic:      {bg:'#E8F5E9', fg:'#2E7D32'},
  paper:        {bg:'#FFF3E0', fg:'#E07A20'},
  copper:       {bg:'#FFF3E0', fg:'#B45309'},
  electronics:  {bg:'#FFF9C4', fg:'#F57F17'},
  metal:        {bg:'#E8EDF8', fg:'#3A6CC8'},
  electric:     {bg:'#FFF9C4', fg:'#F57F17'},
  default:      {bg:'#F3F0FF', fg:'#5E35B1'},
};

function itemColor(cat){ return CAT_COLOR[cat]||CAT_COLOR.default; }

function renderIcon(icon, cat, size=26){
  const c = itemColor(cat);
  const pill = (cls) =>
    `<span class="ph-icon-wrap" style="background:${c.bg};color:${c.fg};width:${size+16}px;height:${size+16}px;font-size:${size}px;"><i class="${cls}"></i></span>`;
  if(!icon || icon.trim()==='') return '';
  const s = icon.trim();
  if(s.startsWith('ph-fill ')) return pill(s);
  if(s.startsWith('ph ph-'))   return pill('ph-fill '+s.slice(3));
  if(s.startsWith('ph-'))      return pill('ph-fill '+s);
  return `<span class="ph-icon-wrap" style="background:${c.bg};width:${size+16}px;height:${size+16}px;font-size:${size}px;">${s}</span>`;
}

// ══════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════
let ALL_ITEMS    = [];
let CATS         = [];
let selectedFrom = null;   
let fromKg       = 0;      
let selectedTos  = {};     
let activeCat    = 'all';
let q1           = '';
let currentStep  = 1;

let kgMode       = 'from';
let kgTargetId   = null;   
let kgBuffer     = '';

function catLabel(s){ return CATS.find(c=>c.slug===s)?.label||s; }
function catIcon(s){  return CATS.find(c=>c.slug===s)?.icon||''; }

// ══════════════════════════════════════════
//  SUPABASE
// ══════════════════════════════════════════
// เดิมยิง REST ไปที่ Supabase ผ่าน fetch() — ตอนนี้เปลี่ยนไปเรียก
// localRest() ที่อ่าน/เขียน SQLite ในเครื่องแทน
async function sbFetch(path, opts={}){
  return localRest(path, opts);
}

// ══════════════════════════════════════════
//  LOAD
// ══════════════════════════════════════════
async function loadCats(){
  try{ const r=await sbFetch('categories?select=slug,label,icon&order=id'); if(r&&r.length) CATS=r; }catch(_){}
}

function renderCatBar(){
  const bar=document.getElementById('cat-bar');
  const catIconHtml = (icon) => {
    if(!icon) return '';
    if(icon.startsWith('ph-fill ')) return `<i class="${icon}"></i> `;
    if(icon.startsWith('ph ph-'))   return `<i class="ph-fill ${icon.slice(3)}"></i> `;
    if(icon.startsWith('ph-'))      return `<i class="ph-fill ${icon}"></i> `;
    return icon+' ';
  };
  bar.innerHTML='<button class="cat-btn on" data-cat="all">ทั้งหมด</button>'
    +CATS.map(c=>`<button class="cat-btn" data-cat="${c.slug}">${catIconHtml(c.icon)}${c.label}</button>`).join('');
  bar.querySelectorAll('.cat-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      bar.querySelectorAll('.cat-btn').forEach(b=>b.classList.toggle('on',b===btn));
      activeCat=btn.dataset.cat; renderGrid1();
    });
  });
}

async function loadItems(){
  const grid=document.getElementById('grid-1');
  grid.innerHTML=`<div class="grid-loading"><i class="ph ph-spinner-gap spin" style="font-size:28px;"></i><span style="font-size:13px;">กำลังโหลด...</span></div>`;
  
  if(!SUPABASE_READY){
    ALL_ITEMS=DEMO_ITEMS;
    document.getElementById('config-banner').style.display='flex';
    renderCatBar(); renderGrid1(); return;
  }
  
  document.getElementById('config-banner').style.display='none';
  try{
    await loadCats(); renderCatBar();
    ALL_ITEMS=await sbFetch('items?select=id,name,icon,buy_price,sell_price,stock_qty,cat&order=cat,name')||[];
    renderGrid1();
  }catch(err){
    grid.innerHTML=`<div class="grid-loading"><i class="ph ph-warning-circle" style="font-size:28px;color:var(--red);"></i><span style="font-size:13px;color:var(--red);">โหลดไม่สำเร็จ</span></div>`;
    toast('❌ '+err.message,'error');
  }
}

// ══════════════════════════════════════════
//  STEP 1 — เลือกวัตถุดิบ
// ══════════════════════════════════════════
function renderGrid1(){
  const grid=document.getElementById('grid-1');
  let list=ALL_ITEMS;
  if(activeCat!=='all') list=list.filter(x=>x.cat===activeCat);
  if(q1) list=list.filter(x=>x.name.includes(q1));
  if(!list.length){ grid.innerHTML=`<div class="grid-loading"><i class="ph ph-magnifying-glass" style="font-size:28px;"></i><span style="font-size:13px;">ไม่พบสินค้า</span></div>`; return; }

  grid.innerHTML=list.map(item=>{
    const nid  = Number(item.id);
    const sel  = selectedFrom && Number(selectedFrom.id)===nid;
    const stock= Number(item.stock_qty||0);
    const oos  = stock<=0;
    const cls  = oos?'empty':stock<100?'low':'ok';
    return `
    <div class="item-card ${sel?'selected':''} ${oos?'oos':''}" onclick="selectFrom(${nid})">
      <div class="card-check"><i class="ph ph-check-bold"></i></div>
      <div class="card-icon">${renderIcon(item.icon,item.cat,24)}</div>
      <div class="card-name">${item.name}</div>
      <div class="card-stock ${cls}">
        <i class="ph ph-stack-simple" style="font-size:9px;"></i>
        ${oos?'หมดสต๊อก':stock.toLocaleString('th-TH')+' กก.'}
      </div>
    </div>`;
  }).join('');
}

function selectFrom(id){
  id=Number(id);
  const item=ALL_ITEMS.find(x=>Number(x.id)===id);
  if(!item) return;
  if(Number(item.stock_qty||0)<=0){ toast('สต๊อกหมด','error'); return; }
  selectedFrom=item;
  selectedTos={};
  fromKg=0;
  renderGrid1();
  document.getElementById('bar-idle').style.display='none';
  document.getElementById('bar-selected').style.display='';
  document.getElementById('bar-item-icon').innerHTML=renderIcon(item.icon,item.cat,22);
  document.getElementById('bar-item-name').textContent=item.name;
  const stock=Number(item.stock_qty||0);
  document.getElementById('bar-item-stock').textContent=`สต๊อกคงเหลือ ${stock.toLocaleString('th-TH')} กก.`;
  document.getElementById('from-weight-display').textContent='0';
  document.getElementById('btn-next-1').disabled=true;
}

function openFromKgModal(){
  if(!selectedFrom) return;
  kgMode='from'; kgTargetId=null;
  kgBuffer=fromKg>0?String(fromKg):'';

  const item=selectedFrom;
  document.getElementById('kg-item-icon').innerHTML=renderIcon(item.icon,item.cat,24);
  document.getElementById('kg-item-name').textContent=item.name;
  const stock=Number(item.stock_qty||0);
  document.getElementById('kg-item-sub').textContent=`สต๊อก ${stock.toLocaleString('th-TH')} กก.`;
  document.getElementById('kg-subtotal-label').textContent='สต๊อกคงเหลือ';

  const pre=document.getElementById('kg-presets');
  pre.innerHTML=[10,50,100,200,500,1000].map(v=>`<button class="kg-preset-btn" onclick="setPreset(${v})">${v>=1000?v/1000+' ตัน':v+' กก.'}</button>`).join('');

  updateKgDisplay();
  openModal();
}

function openToKgModal(id){
  id=Number(id);
  const item=ALL_ITEMS.find(x=>Number(x.id)===id);
  if(!item) return;
  kgMode='to'; kgTargetId=id;
  kgBuffer=selectedTos[id]&&selectedTos[id].kg>0?String(selectedTos[id].kg):'';

  document.getElementById('kg-item-icon').innerHTML=renderIcon(item.icon,item.cat,24);
  document.getElementById('kg-item-name').textContent=item.name;
  document.getElementById('kg-item-sub').textContent=`฿${Number(item.sell_price).toFixed(2)} / กก.`;
  document.getElementById('kg-subtotal-label').textContent='ยอด';

  const pre=document.getElementById('kg-presets');
  pre.innerHTML=[0.5,1,2,5,10,20,50].map(v=>`<button class="kg-preset-btn" onclick="setPreset(${v})">${v} กก.</button>`).join('');

  updateKgDisplay();
  openModal();
}

function openModal(){
  document.getElementById('kg-backdrop').classList.add('open');
  document.getElementById('kg-modal').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeKgModal(){
  document.getElementById('kg-backdrop').classList.remove('open');
  document.getElementById('kg-modal').classList.remove('open');
  document.body.style.overflow='';
}

function updateKgDisplay(){
  const numEl =document.getElementById('kg-display-num');
  const subEl =document.getElementById('kg-subtotal');
  const btnEl =document.getElementById('kg-confirm-btn');
  const lblEl =document.getElementById('kg-confirm-label');
  const warnEl=document.getElementById('kg-stock-warning');
  const warnTx=document.getElementById('kg-stock-warning-text');

  const val=parseFloat(kgBuffer)||0;
  numEl.textContent=kgBuffer||'0';

  let overLimit=false;
  if(kgMode==='from'){
    const stock=Number(selectedFrom?.stock_qty||0);
    const remain=stock-val;
    subEl.textContent=remain>=0?`${remain.toFixed(2)} กก.`:'เกินสต๊อก';
    subEl.style.color=remain<0?'var(--red)':'var(--primary)';
    overLimit=val>stock;
    if(overLimit&&val>0){ warnTx.textContent=`เกินสต๊อก (มี ${stock.toLocaleString('th-TH')} กก.)`; warnEl.classList.add('show'); }
    else warnEl.classList.remove('show');
    lblEl.textContent=val>0&&!overLimit?`ยืนยัน ${val} กก.`:'ยืนยัน';
  } else {
    const item=kgTargetId?ALL_ITEMS.find(x=>Number(x.id)===kgTargetId):null;
    const price=item?Number(item.sell_price):0;
    const sub=val*price;
    subEl.textContent=sub>0?`฿${sub.toFixed(2)}`:'฿0';
    subEl.style.color='var(--primary)';
    warnEl.classList.remove('show');
    lblEl.textContent=val>0?`ยืนยัน ${val} กก. = ฿${sub.toFixed(2)}`:'ยืนยัน';
  }

  btnEl.disabled=val<=0||overLimit;
}

// numpad
function kpNum(n,e){
  if(kgBuffer.length>=8) return;
  kgBuffer=(kgBuffer===''||kgBuffer==='0')?n:kgBuffer+n;
  rippleKey(e); updateKgDisplay();
}
function kpDot(e){
  if(kgBuffer.includes('.')) return;
  kgBuffer=(kgBuffer||'0')+'.';
  rippleKey(e); updateKgDisplay();
}
function kpBack(e){
  kgBuffer=kgBuffer.slice(0,-1);
  rippleKey(e); updateKgDisplay();
}
function setPreset(v){
  kgBuffer=String(v); updateKgDisplay();
  const el=document.getElementById('kg-display-num');
  el.style.transform='scale(1.1)'; setTimeout(()=>{el.style.transform='scale(1)';},120);
}
function rippleKey(e){
  if(!e||!e.currentTarget) return;
  const btn=e.currentTarget;
  const r=document.createElement('span'); r.className='ripple';
  const s=Math.max(btn.offsetWidth,btn.offsetHeight);
  r.style.cssText=`width:${s}px;height:${s}px;left:${s/2}px;top:${s/2}px;margin:-${s/2}px;`;
  btn.appendChild(r); setTimeout(()=>r.remove(),400);
}

function confirmKg(){
  const val=parseFloat(kgBuffer);
  if(!val||val<=0){ closeKgModal(); return; }

  if(kgMode==='from'){
    fromKg=val;
    document.getElementById('from-weight-display').textContent=val%1===0?val:val.toFixed(2);
    document.getElementById('btn-next-1').disabled=false;
    closeKgModal();
  } else {
    const id=Number(kgTargetId);
    if(selectedTos[id]) selectedTos[id].kg=val;
    const valEl=document.getElementById(`wi-val-${id}`);
    if(valEl) valEl.textContent=val%1===0?val:val.toFixed(2);
    updateTotalYield();
    closeKgModal();
  }
}

// ══════════════════════════════════════════
//  STEP 2 — เลือกผลลัพธ์
// ══════════════════════════════════════════
function renderGrid2(){
  document.getElementById('s2-icon').innerHTML=renderIcon(selectedFrom.icon,selectedFrom.cat,20);
  document.getElementById('s2-name').textContent=selectedFrom.name;
  document.getElementById('s2-kg').textContent=`${fromKg} กก.`;

  const list=ALL_ITEMS.filter(x=>Number(x.id)!==Number(selectedFrom.id));
  const grid=document.getElementById('grid-2');
  if(!list.length){ grid.innerHTML=`<div class="grid-loading" style="grid-column:1/-1;"><i class="ph ph-package" style="font-size:28px;"></i><p>ไม่มีสินค้าอื่น</p></div>`; return; }

  const cats=[...new Set(list.map(x=>x.cat))];
  grid.innerHTML=cats.map(cat=>{
    const items=list.filter(x=>x.cat===cat);
    const cLabel=catLabel(cat)||cat;
    const cIcon=catIcon(cat)||'';
    return `
    <div style="grid-column:1/-1;padding-top:6px;">
      <div style="font-size:11px;font-weight:600;color:var(--ink3);letter-spacing:1px;text-transform:uppercase;padding:0 4px 6px;">${cIcon} ${cLabel}</div>
    </div>
    ${items.map(item=>{
      const nid=Number(item.id);
      const sel=!!selectedTos[nid];
      return `
      <div class="result-card ${sel?'selected':''}" id="rc-${nid}" onclick="toggleTo(${nid})">
        <div class="card-check"><i class="ph ph-check-bold"></i></div>
        <div class="result-icon">${renderIcon(item.icon,item.cat,22)}</div>
        <div class="result-name">${item.name}</div>
        <div class="result-price">฿${Number(item.sell_price).toFixed(2)}<span class="result-price-unit">/กก.</span></div>
      </div>`;
    }).join('')}`;
  }).join('');

  updateStep2Footer();
}

function toggleTo(id){
  id=Number(id);
  const item=ALL_ITEMS.find(x=>Number(x.id)===id);
  if(!item) return;
  if(selectedTos[id]) delete selectedTos[id];
  else selectedTos[id]={item,kg:0};
  const card=document.getElementById(`rc-${id}`);
  if(card) card.classList.toggle('selected',!!selectedTos[id]);
  updateStep2Footer();
}

function updateStep2Footer(){
  const count=Object.keys(selectedTos).length;
  document.getElementById('btn-next-2').disabled=count===0;
  const wrap=document.getElementById('sel-count-wrap');
  wrap.style.display=count>0?'inline-flex':'none';
  document.getElementById('sel-count-text').textContent=`${count} ชนิด`;
}

// ══════════════════════════════════════════
//  STEP 3 — ใส่น้ำหนักผลลัพธ์
// ══════════════════════════════════════════
function renderStep3(){
  const totalCard=document.getElementById('total-card'); 
  document.getElementById('s3-icon').innerHTML=renderIcon(selectedFrom.icon,selectedFrom.cat,20);
  document.getElementById('s3-name').textContent=selectedFrom.name;
  document.getElementById('s3-kg').textContent=`${fromKg} กก.`;

  const wrap=document.getElementById('weight-wrap');

  const rowsHtml=Object.values(selectedTos).map(t=>{
    const nid=Number(t.item.id);
    const kgDisp=t.kg>0?(t.kg%1===0?t.kg:t.kg.toFixed(2)):0;
    return `
    <div class="weight-item" id="wi-${nid}">
      <div class="wi-icon">${renderIcon(t.item.icon,t.item.cat,20)}</div>
      <div class="wi-info">
        <div class="wi-name">${t.item.name}</div>
        <div class="wi-price">฿${Number(t.item.sell_price).toFixed(2)}/กก.</div>
      </div>
      <button class="wi-weight-btn" onclick="openToKgModal(${nid})">
        <span class="wi-weight-val" id="wi-val-${nid}">${kgDisp}</span>
        <span class="wi-weight-unit">กก.</span>
        <i class="ph ph-pencil-simple wi-weight-icon"></i>
      </button>
      <button class="wi-del" onclick="removeTo(${nid})"><i class="ph ph-trash-simple"></i></button>
    </div>`;
  }).join('');

  wrap.innerHTML=rowsHtml;
  wrap.appendChild(totalCard);
  updateTotalYield();
}

function removeTo(id){
  id=Number(id);
  delete selectedTos[id];
  const el=document.getElementById(`wi-${id}`);
  if(el) el.remove();
  updateTotalYield();
  if(!Object.keys(selectedTos).length){ closeKgModal(); toast('กรุณาเลือกผลลัพธ์อย่างน้อย 1 ชนิด','error'); goStep(2); }
}

function updateTotalYield(){
  let total=0;
  Object.values(selectedTos).forEach(t=>{ total+=(t.kg||0)*Number(t.item.sell_price); });
  document.getElementById('total-val').textContent='฿'+total.toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
  document.getElementById('btn-save').disabled=!Object.values(selectedTos).some(t=>t.kg>0);
}

// ══════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════
function goStep(n){
  document.getElementById(`panel-${currentStep}`).classList.remove('active');
  document.getElementById(`panel-${n}`).classList.add('active');
  currentStep=n;
  
  ['sp-1','sp-2','sp-3'].forEach((id,i)=>{
    const pill=document.getElementById(id);
    pill.className='step-pill'+(i+1<n?' done':i+1===n?' active':'');
  });
  document.getElementById('sp-label').textContent=`ขั้น ${n}/3`;
  
  if(n===2) renderGrid2();
  if(n===3) renderStep3();
}

// ══════════════════════════════════════════
//  SAVE
// ══════════════════════════════════════════
async function saveSort(){
  const results=Object.values(selectedTos).filter(t=>t.kg>0);
  if(fromKg<0.1){ toast('กรอกน้ำหนักวัตถุดิบอย่างน้อย 0.1 กก.','error'); return; }
  if(fromKg>Number(selectedFrom.stock_qty||0)){ toast(`❌ สต๊อกมีแค่ ${Number(selectedFrom.stock_qty).toLocaleString('th-TH')} กก.`,'error'); return; }
  if(!results.length){ toast('กรุณาใส่น้ำหนักผลลัพธ์อย่างน้อย 1 ชนิด','error'); return; }

  const btn=document.getElementById('btn-save');
  btn.disabled=true;
  btn.innerHTML='<i class="ph ph-spinner-gap spin"></i> กำลังบันทึก...';

  if(!SUPABASE_READY){
    await new Promise(r=>setTimeout(r,700));
    const fi=ALL_ITEMS.find(x=>Number(x.id)===Number(selectedFrom.id));
    if(fi) fi.stock_qty=Math.max(0,Number(fi.stock_qty)-fromKg);
    results.forEach(t=>{ const ti=ALL_ITEMS.find(x=>Number(x.id)===Number(t.item.id)); if(ti) ti.stock_qty=Number(ti.stock_qty||0)+t.kg; });
    const summary=results.map(t=>`${t.item.name} +${t.kg}กก.`).join(', ');
    toast(`✅ ${selectedFrom.name} −${fromKg}กก. → ${summary}`,'success');
    btn.disabled=false;
    btn.innerHTML='<i class="ph ph-check-circle"></i> บันทึก';
    setTimeout(resetAll,1800);
    return;
  }

  try{
    const result=await sbFetch('rpc/record_sort',{
      method:'POST',
      body:{p_from_item_id:selectedFrom.id,p_from_item_name:selectedFrom.name,p_from_kg:fromKg,
        p_results:results.map(t=>({item_id:t.item.id,item_name:t.item.name,kg:t.kg,sell_price:Number(t.item.sell_price)}))},
      prefer:'return=representation',
    });
    if(!result||!result.success) throw new Error('RPC ไม่สำเร็จ');
    const summary=results.map(t=>`${t.item.name} +${t.kg}กก.`).join(', ');
    toast(`✅ ${selectedFrom.name} −${fromKg}กก. → ${summary}`,'success');
    setTimeout(resetAll,1800);
  }catch(err){
    toast('❌ '+err.message,'error');
    btn.disabled=false;
    btn.innerHTML='<i class="ph ph-check-circle"></i> บันทึก';
  }
}

// ══════════════════════════════════════════
//  RESET
// ══════════════════════════════════════════
function resetAll(){
  selectedFrom=null; selectedTos={}; fromKg=0;
  activeCat='all'; q1='';
  document.getElementById('search-1').value='';
  document.getElementById('bar-idle').style.display='';
  document.getElementById('bar-selected').style.display='none';
  document.getElementById('btn-next-1').disabled=true;
  renderCatBar();
  goStep(1);
  renderGrid1();
}

// ══════════════════════════════════════════
//  EVENTS
// ══════════════════════════════════════════
document.getElementById('search-1').addEventListener('input',e=>{
  q1=e.target.value.trim(); renderGrid1();
});

let _ty=0;
document.getElementById('kg-modal').addEventListener('touchstart',e=>{_ty=e.touches[0].clientY;},{passive:true});
document.getElementById('kg-modal').addEventListener('touchmove',e=>{ if(e.touches[0].clientY-_ty>70) closeKgModal(); },{passive:true});

function toast(msg,type=''){
  const el=document.getElementById('toast');
  el.textContent=msg; el.className=type?`show ${type}`:'show';
  clearTimeout(toast._t); toast._t=setTimeout(()=>{el.className='';},2400);
}

// ══════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════
(async()=>{
  window.AUTH={user:{email:'local@device'},logout:()=>{}};
  loadItems();
})();