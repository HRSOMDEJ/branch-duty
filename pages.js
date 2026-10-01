/* =====================================================================
   ระบบจัดการเวร ศ.สาขาฯ — หน้าของบุคลากร และงานศูนย์
   my · booking · schedule · branch · plan · entry · followup
   ===================================================================== */
var PAGES = {};

/* ---------- ส่วนประกอบร่วม ---------- */
function brTabs(id, ids, val, onPick){
  return '<div class="br-tabs" id="' + id + '" role="tablist">' + ids.map(function(b){ var x = brOf(b); return '<button type="button" role="tab" class="br-tab' + (b === val ? ' on' : '') + '" data-b="' + b + '" style="--bc:' + esc(x.color) + '"><i></i>' + esc(x.name) + '</button>'; }).join('') + '</div>';
}
function bindBrTabs(id, cb){ $$('#' + id + ' .br-tab').forEach(function(t){ t.onclick = function(){ $$('#' + id + ' .br-tab').forEach(function(x){ x.classList.toggle('on', x === t); }); cb(t.dataset.b); }; }); }
function dateTh(d){ return TH_DF[dowOf(d)] + ' ' + thDate(d); }
function stepper(st){
  // 30 ก.ย. 69 ลดเหลือ 4 ขั้น (เสนอหัวหน้าฝ่าย/HR ตรวจ ทำนอกระบบ)
  var steps = [['OPEN', 'บันทึก'], ['SUBMITTED', 'ศูนย์ส่ง'], ['VERIFIED', 'ปิดรอบ'], ['SENT_HR', 'ส่ง HR']];
  var idx = { OPEN: 0, RETURNED: 0, SUBMITTED: 1, VERIFIED: 2, PROPOSED: 2, SENT_HR: 3, HR_CHECKED: 3 }[st] || 0;
  return '<ol class="stepper' + (st === 'RETURNED' ? ' ret' : '') + '">' + steps.map(function(s, i){ return '<li class="' + (i < idx ? 'done' : i === idx ? 'cur' : '') + '"><i>' + (i < idx ? '<b class="bi bi-check-lg"></b>' : i + 1) + '</i><span>' + (i === 0 && st === 'RETURNED' ? 'ถูกตีกลับ' : s[1]) + '</span></li>'; }).join('') + '</ol>';
}
/** เลือกไฟล์แล้วอัปโหลดใบลืมสแกน */
function attachForm(dutyId, done){
  var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*,application/pdf';
  inp.onchange = function(){
    var f = inp.files[0]; if (!f) return;
    if (f.size > 8 * 1024 * 1024) return alertBox('ไฟล์ใหญ่เกินไป', 'แนบได้ไม่เกิน 8 MB', 'warning');
    var rd = new FileReader();
    rd.onload = function(){ api('uploadAttachment', { dutyId: dutyId, fileName: f.name, mimeType: f.type || 'application/octet-stream', data: String(rd.result).split(',')[1] }, { block: 'กำลังแนบไฟล์…' }).then(function(){ notify('แนบใบลืมสแกนเรียบร้อย'); if (done) done(); }).catch(function(){}); };
    rd.readAsDataURL(f);
  };
  inp.click();
}
function viewAttach(id, onDeleted){
  api('getAttachment', { id: id }, { block: 'กำลังเปิดไฟล์…' }).then(function(f){
    fileViewer(f, { onDelete: onDeleted ? function(){ confirmBox('ลบไฟล์แนบ', 'ลบไฟล์ ' + f.fileName + ' ?', 'ลบไฟล์', true).then(function(ok){ if (ok) api('deleteAttachment', { id: id }).then(function(){ MDL.hide(); notify('ลบไฟล์แล้ว'); onDeleted(); }).catch(function(){}); }); } : null });
  }).catch(function(){});
}

/* ================= เวรและค่าตอบแทนของฉัน ================= */
PAGES.my = function(){
  var ym = S.ym || S.boot.ym;
  mount(pageHead('งานของฉัน', 'สวัสดี ' + esc(S.boot.me.name.split(' ').slice(1, 2).join(' ') || S.boot.me.name), 'เวร ชั่วโมง และค่าตอบแทนของท่านทุกศูนย์ ข้อมูลส่วนตัวเห็นเฉพาะท่านเท่านั้น',
    '<button class="btn btn-brand" onclick="go(\'booking\')"><i class="bi bi-calendar2-plus"></i> ลงบันทึกตารางเวร</button>') +
    '<div class="filters">' + ymSelect('myYm', ym, 12, 1) + '</div><div id="myBody">' + skeleton(6) + '</div>');
  $('myYm').onchange = function(){ S.ym = this.value; loadMy(); };
  loadMy();
};
function loadMy(){
  var ym = $('myYm').value;
  apiView('getMyMonth', { ym: ym }, function(r){ if (!$('myYm') || $('myYm').value !== ym) return; drawMy(r); }).catch(function(){});
}
function loadMyFresh(){ var ym = $('myYm') && $('myYm').value; if (!ym) return; api('getMyMonth', { ym: ym }, { fresh: true, quiet: true }).then(function(r){ if ($('myYm') && $('myYm').value === ym) drawMy(r); }).catch(function(){}); }
function drawMy(r){
  if (!$('myBody')) return;
  var t = r.total, today = r.today;
  var next = r.items.filter(function(d){ return d.date >= today && d.workStatus !== 'ABSENT'; })[0];
  var h = '<div class="hero-my">' +
    '<div class="hy-main"><div class="hy-l">ค่าตอบแทนที่ยืนยันแล้ว · ' + esc(thYm(r.ym)) + '</div><div class="hy-v"><span data-v="' + (t.amount + t.mealAmount) + '" class="cu">' + money(t.amount + t.mealAmount) + '</span> <small>บาท</small></div>' +
    '<div class="hy-s">ตามตารางทั้งเดือน ประมาณ <b>' + money(t.plannedAmount + t.mealAmount) + '</b> บาท · ค่าชั่วโมง ' + money(t.amount) + ' + ค่าอาหาร ' + money(t.mealAmount) + '</div></div>' +
    '<div class="hy-next">' + (next ? '<div class="hy-l">เวรถัดไป</div><div class="hy-nd">' + esc(dateTh(next.date)) + '</div><div>' + brChip(next.branchId) + ' ' + esc(posShort(next.posName)) + ' · ' + slotTag(next.slot) + ' ' + esc(next.timeIn + '–' + next.timeOut) + '</div>' : '<div class="hy-l">เวรถัดไป</div><div class="hy-nd">ยังไม่มีเวร</div><a href="#" onclick="go(\'booking\');return false" class="hy-a">ลงบันทึกตารางเวรเลย →</a>') + '</div></div>';
  h += '<div class="kpis">' + kpi('calendar-check', 'ic-brand', 'เวรในเดือนนี้', t.duties) + kpi('clock-history', 'ic-ok', 'ชั่วโมงที่ยืนยันแล้ว (จากตาราง ' + hrs(t.planned) + ')', t.hours, 1) +
    kpi('cup-hot', 'ic-warn', 'วันที่ได้ค่าอาหาร', t.meal) + kpi('exclamation-octagon', t.red ? 'ic-bad' : 'ic-mute', 'รายการต้องแก้ไข', t.red) + '</div>';
  var brs = Object.keys(t.byBranch);
  if (brs.length > 1) h += '<div class="br-split">' + brs.map(function(b){ var x = t.byBranch[b]; return '<div class="bs" style="--bc:' + esc(brOf(b).color) + '"><b>' + esc(brName(b)) + '</b><span>' + x.n + ' เวร · ' + hrs(x.hours) + ' ชม. · ' + money(x.amount) + ' บาท</span></div>'; }).join('') + '</div>';
  if (!r.items.length) h += '<div class="card">' + empty('calendar-x', 'เดือนนี้ยังไม่มีเวรของท่าน') + '</div>';
  else {
    h += '<div class="card"><div class="card-h"><h3>รายการเวร</h3><span class="sub">' + r.items.length + ' รายการ</span></div><div class="duty-list">';
    var last = '';
    r.items.forEach(function(d){
      if (d.date !== last) { h += '<div class="dl-date' + (d.date === today ? ' today' : '') + '"><b>' + (+d.date.slice(8)) + '</b><span>' + TH_DF[dowOf(d.date)] + '</span></div>'; last = d.date; }
      var st = d.workStatus === 'ABSENT' ? '<span class="pill p-mute">ไม่ได้ปฏิบัติงาน</span>' : d.workStatus === 'WORKED' ? '<span class="pill p-ok">ยืนยันแล้ว</span>' : d.bookStatus === 'PENDING' ? '<span class="pill p-warn">รอศูนย์ยืนยัน</span>' : d.date < today ? '<span class="pill p-slate">รอเจ้าหน้าที่ยืนยัน</span>' : '<span class="pill p-info">ตามตาราง</span>';
      var needDoc = d.flags.indexOf('NO_SCAN') >= 0 || d.flags.indexOf('NO_IN') >= 0;
      var locked = r.periods[d.branchId] && ['VERIFIED', 'PROPOSED', 'SENT_HR', 'HR_CHECKED'].indexOf(r.periods[d.branchId]) >= 0;
      h += '<div class="dl-item' + (d.workStatus === 'ABSENT' ? ' off' : '') + '" style="--bc:' + esc(brOf(d.branchId).color) + '">' +
        '<div class="dl-main"><div class="dl-t">' + slotTag(d.slot) + ' <b>' + esc(d.timeIn + '–' + d.timeOut) + '</b> ' + brChip(d.branchId) + ' <span class="small-muted">' + esc(posShort(d.posName)) + ' · ใบที่ ' + d.lineNo + '</span></div>' +
        '<div class="dl-s">' + st + ' ' + (d.scanStatus && d.date < today ? scanPill(d.scanStatus) : '') + (d.scanIn ? ' <span class="small-muted">สแกน ' + esc(d.scanIn) + (d.scanOut && d.scanOut !== d.scanIn ? '–' + esc(d.scanOut) : '') + '</span>' : '') + ' ' + flagChips(d.flags.filter(function(f){ return f !== 'NOT_CONFIRMED' && f !== 'PENDING_BOOK'; }), 3, d.stopNote) + '</div></div>' +
        '<div class="dl-pay">' + (d.payType === 'HOURLY' ? '<b>' + hrs(d.workStatus === 'WORKED' ? d.hours : d.planned) + '</b> ชม.<small>' + money(d.workStatus === 'WORKED' ? d.amount : d.planned * d.rate) + ' บาท</small>' : d.payType === 'FULLTIME' ? '<b>Full Time</b><small>' + (d.meal ? 'ค่าอาหาร ' + money(brOf(d.branchId).mealRate) : 'ในเวลาราชการ') + '</small>' : '<b>—</b><small>ไม่จ่ายรายชั่วโมง</small>') + '</div>' +
        '<div class="dl-act">' + d.attachIds.map(function(a, i){ return '<button class="btn btn-sm btn-ghost" onclick="viewAttach(\'' + a + '\',' + (locked ? 'null' : 'loadMyFresh') + ')"><i class="bi bi-paperclip"></i> ใบที่ ' + (i + 1) + '</button>'; }).join('') +
        (needDoc && !locked ? '<button class="btn btn-sm btn-soft" onclick="attachForm(\'' + d.id + '\',loadMyFresh)"><i class="bi bi-upload"></i> แนบใบลืมสแกน</button>' : '') +
        (d.bookStatus === 'PENDING' ? '<button class="btn btn-sm btn-danger-soft" onclick="myCancel(\'' + d.id + '\')"><i class="bi bi-x-lg"></i> ยกเลิก</button>' : '') + '</div></div>';
    });
    h += '</div></div>';
  }
  $('myBody').innerHTML = h;
  $$('#myBody .cu').forEach(function(el){ el.dataset.d = 2; countUp(el); });
  animateKpis();
}
function myCancel(id){
  confirmBox('ยกเลิกเวรที่ลงไว้', 'ยกเลิกเวรนี้? (ยกเลิกเองได้เฉพาะเวรที่ศูนย์ยังไม่ยืนยัน ในช่วงเปิดลงตารางเวร)', 'ยกเลิกเวร', true).then(function(ok){
    if (ok) { savingChip(1); api('cancelBooking', { id: id }).then(function(){ savingChip(-1, true); notify('ยกเลิกเวรแล้ว'); loadMyFresh(); }).catch(function(){ savingChip(-1, false); }); }
  });
}

/* ================= ลงบันทึกตารางเวร ================= */
var BK = null;
PAGES.booking = function(){
  var ym = S.bkYm || addYm(S.boot.ym, S.boot.today.slice(8) >= '10' ? 1 : 0);
  var brs = S.boot.branches.map(function(b){ return b.id; });
  var br = S.bkBr || (S.boot.me.branches && S.boot.me.branches[0] && brs.indexOf(S.boot.me.branches[0]) >= 0 ? S.boot.me.branches[0] : curBr());
  mount(pageHead('งานของฉัน', 'ลงบันทึกตารางเวร', 'แตะช่วงเวรที่ยังว่างเพื่อลงตารางเวร · เวรที่ลงเองจะ "รอศูนย์ยืนยัน" · ยกเลิกเองได้ในช่วงเปิดลงตารางเวร') +
    '<div class="filters">' + ymSelect('bkYm', ym, 2, 2) + '<div class="flex-grow-1"><label class="form-label">ศูนย์</label>' + brTabs('bkBr', brs, br) + '</div><div id="bkPosW"></div></div>' +
    '<div id="bkHead"></div><div id="bkBody">' + skeleton(8) + '</div>');
  $('bkYm').onchange = function(){ S.bkYm = this.value; loadBooking(); };
  bindBrTabs('bkBr', function(b){ S.bkBr = b; S.bkPos = null; loadBooking(); });
  S.bkBr = br;
  loadBooking();
};
function loadBooking(fresh){
  var ym = $('bkYm').value, br = S.bkBr, ok = function(b){ return $('bkBody') && $('bkYm').value === ym && S.bkBr === br && b.ym === ym && b.branchId === br; };
  // หลังบันทึก (fresh) โหลดข้อมูลล่าสุดตรง ๆ · เปิดหน้า/เปลี่ยนศูนย์ แสดงข้อมูลที่จำไว้ทันที แล้วอัปเดตเบื้องหลัง
  if (fresh) return api('getBookingBoard', { ym: ym, branchId: br }, { fresh: true, quiet: true }).then(function(b){ if (ok(b)) drawBooking(b); }).catch(function(){ if (BK && ok(BK)) drawBooking(BK); });
  apiView('getBookingBoard', { ym: ym, branchId: br }, function(b){ if (ok(b)) drawBooking(b); }).catch(function(){});
}
/* 30 ก.ย. 69 ลงตารางเวร/ยกเลิกแบบไม่ต้องรอ: ช่องเปลี่ยนเป็น "ของฉัน" ทันที (กะพริบ = กำลังบันทึก) แล้วระบบบันทึกเบื้องหลัง */
function bkOptimistic(k, add){
  var c = BK && BK.cells[k]; if (!c) return;
  if (add) { c.n++; c.people = c.people.concat([{ id: '_tmp', mine: add === 'me', pending: true, line: c.n, name: add === 'me' ? S.boot.me.name : add, times: '' }]); }
  else { c.n = Math.max(0, c.n - 1); c.people = c.people.filter(function(p){ return !p.mine; }); }
  drawBooking(BK);
  var el = document.querySelector('#bkBody .bslot[data-k="' + CSS.escape(k) + '"]'); if (el) el.classList.add('saving');
}
function bkSave(action, payload, k, add, msg){
  var snap = JSON.stringify(BK);
  bkOptimistic(k, add); savingChip(1);
  api(action, payload).then(function(){ savingChip(-1, true); notify(msg); loadBooking(true); })
    .catch(function(){ savingChip(-1, false); var b = JSON.parse(snap); if ($('bkBody') && S.bkBr === b.branchId) drawBooking(b); });
}
function drawBooking(b){
  if (!$('bkBody')) return;
  BK = b;
  var pos = b.positions;
  if (!S.bkPos || !pos.some(function(p){ return p.id === S.bkPos; })) {
    var mj = S.boot.myJobs || [];
    var mine = pos.filter(function(p){ return mj.indexOf(p.jobId) >= 0; })[0];
    S.bkPos = (mine || pos[0] || {}).id || '';
  }
  $('bkPosW').innerHTML = pos.length ? '<label class="form-label" for="bkPos">ตำแหน่ง</label><select class="form-select" id="bkPos" data-search>' + pos.map(function(p){ return '<option value="' + p.id + '"' + (p.id === S.bkPos ? ' selected' : '') + '>' + esc(posShort(p.name)) + '</option>'; }).join('') + '</select>' : '';
  enhanceSelects($('bkPosW'));
  if ($('bkPos')) $('bkPos').onchange = function(){ S.bkPos = this.value; drawBooking(BK); };
  var w = b.window;
  $('bkHead').innerHTML = '<div class="wbanner ' + (b.windowState === 'OPEN' ? 'wb-ok' : '') + '">' + windowPill(b.windowState) + '<span>ช่วงลงตารางเวรเดือน ' + esc(thYm(b.ym)) + ' : <b>' + esc(thDateFull(w.openFrom)) + ' – ' + esc(thDateFull(w.openTo)) + '</b></span>' +
    (b.status !== 'OPEN' ? statusPill(b.status) : '') + (b.manage ? '<span class="pill p-violet nodot"><i class="bi bi-person-gear"></i> ท่านเป็นผู้ดูแลศูนย์นี้ · ลงเวรแทนผู้อื่นได้</span>' : '') + '</div>';
  if (!pos.length) { $('bkBody').innerHTML = '<div class="card">' + empty('person-x', 'ศูนย์นี้ไม่มีตำแหน่งที่ตรงกับงานของท่าน หากต้องการขึ้นเวร กรุณาติดต่อผู้ดูแลศูนย์') + '</div>'; return; }
  var P = pos.filter(function(p){ return p.id === S.bkPos; })[0];
  var h = '<div class="bk-grid"><div class="card"><div class="card-h"><h3>' + esc(posShort(P.name)) + ' · ' + esc(brName(b.branchId)) + '</h3><span class="sub">' + esc(slotL('D').s) + ' ' + esc(P.day.join(' / ')) + (P.eve.length ? ' · ' + esc(slotL('E').s) + ' ' + esc(P.eve.join(' / ')) : '') + '</span><span class="ms-auto">' + dayLegend() + '</span></div><div class="card-b"><div class="cal">';
  TH_D.forEach(function(d){ h += '<div class="dh">' + d + '</div>'; });
  var first = dowOf(b.dates[0].date);
  for (var i = 0; i < first; i++) h += '<div></div>';
  b.dates.forEach(function(x){
    var past = x.date < S.boot.today;
    h += '<div class="day ' + dk(x.color) + (x.date === S.boot.today ? ' today' : '') + (x.kind === 'CLOSED' ? ' closed' : '') + (past ? ' past' : '') + '"><div class="dn"><span>' + x.d + '</span>' + (x.color !== 'WORK' && x.color !== 'WEEKEND' ? '<span class="dpill dk-' + x.color + '" title="' + esc(x.note) + '">' + esc(x.note || (S.boot.dayColors[x.color] || {}).name || '').slice(0, 12) + '</span>' : '') + '</div>';
    ['D', 'E'].forEach(function(s){
      var c = b.cells[P.id + '|' + x.date + '|' + s];
      if (!c) return;
      var mine = c.people.filter(function(p){ return p.mine; })[0];
      var full = c.n >= c.q;
      h += '<button type="button" class="bslot' + (mine ? ' mine' : full ? ' full' : '') + (mine && mine.pending ? ' pend' : '') + '" data-k="' + esc(P.id + '|' + x.date + '|' + s) + '"' + (past && !b.manage ? ' disabled' : '') + '>' +
        '<span class="bs-l">' + esc(slotL(s).s) + '</span><span class="bs-n">' + c.n + '/' + c.q + '</span><span class="bs-bar"><i style="width:' + Math.min(100, c.q ? c.n / c.q * 100 : 100) + '%"></i></span>' + (mine ? '<i class="bi bi-person-check-fill bs-me"></i>' : '') + '</button>';
    });
    h += '</div>';
  });
  h += '</div></div></div><div class="card bk-mine"><div class="card-h"><h3><i class="bi bi-person-badge"></i> เวรของฉันเดือนนี้</h3><span class="sub">' + b.mine.length + ' เวร</span></div><div class="card-b">' +
    (b.mine.length ? b.mine.map(function(m){ return '<div class="bm" style="--bc:' + esc(brOf(m.branchId).color) + '"><b>' + esc(dateTh(m.date)) + '</b><span>' + brChip(m.branchId) + ' ' + esc(posShort(posName(m.positionId))) + ' ' + slotTag(m.slot) + ' ' + esc(m.times) + '</span>' + (m.pending ? '<span class="pill p-warn">รอศูนย์ยืนยัน</span>' : m.worked ? '<span class="pill p-ok">ปฏิบัติงานแล้ว</span>' : '<span class="pill p-info">ยืนยันแล้ว</span>') + '</div>'; }).join('') : empty('calendar-heart', 'ยังไม่มีเวร แตะช่องที่ยังว่างในปฏิทินเพื่อลงตารางเวร')) +
    '</div></div></div>';
  $('bkBody').innerHTML = h;
  $$('#bkBody .bslot').forEach(function(el){ el.onclick = function(){ openSlot(el.dataset.k); }; });
}
function openSlot(k){
  var b = BK, c = b.cells[k], sp = k.split('|'), P = b.positions.filter(function(p){ return p.id === sp[0]; })[0], s = sp[2], date = sp[1];
  var mine = c.people.filter(function(p){ return p.mine; })[0];
  var times = s === 'D' ? P.day : P.eve;
  var body = '<div class="slot-sum" style="--bc:' + esc(brOf(b.branchId).color) + '"><div><b>' + esc(dateTh(date)) + '</b><div>' + brChip(b.branchId) + ' ' + esc(posShort(P.name)) + ' · ' + slotTag(s) + ' ' + esc(slotL(s).name) + '</div></div><div class="ss-q"><b>' + c.n + '</b>/' + c.q + '<small>คน</small></div></div>' +
    '<div class="small-muted mb-1">ผู้ลงเวรช่วงนี้</div><div class="ss-people">' + (c.people.length ? c.people.map(function(p){ return '<div class="ssp' + (p.mine ? ' me' : '') + '"><span class="ln">ใบที่ ' + p.line + '</span><b>' + esc(p.name) + '</b><small>' + esc(p.times) + '</small>' + (p.pending ? '<span class="pill p-warn">รอยืนยัน</span>' : '') + (b.manage && !p.worked ? '<button class="btn btn-sm btn-link text-danger p-0 ms-auto" onclick="slotRemove(\'' + p.id + '\',\'' + esc(p.name) + '\')">นำออก</button>' : '') + '</div>'; }).join('') : '<div class="small-muted">ยังไม่มีผู้ลงเวร</div>') + '</div>' +
    (times.length > 1 ? '<label class="form-label mt-3" for="slTime">เวลาปฏิบัติงาน</label><select class="form-select" id="slTime">' + times.map(function(t){ return '<option>' + esc(t) + '</option>'; }).join('') + '</select>' : '');
  var btns = [{ text: 'ปิด', cls: 'btn-ghost' }];
  if (b.canBook) {
    if (mine && mine.pending) btns.push({ text: '<i class="bi bi-x-lg"></i> ยกเลิกเวรของฉัน', cls: 'btn-danger-soft', onClick: function(){ bkSave('cancelBooking', { id: mine.id }, k, false, 'ยกเลิกเวรแล้ว'); } });
    if (b.manage && c.n < c.q) btns.push({ text: '<i class="bi bi-person-plus"></i> ลงเวรแทน', cls: 'btn-soft', onClick: function(){ var t = $('slTime') ? $('slTime').value : times[0];
      setTimeout(function(){ pickPerson('ลงเวรแทน · ' + dateTh(date), P.jobId).then(function(pp){ if (pp) bkSave('book', { positionId: P.id, date: date, slot: s, times: t, empCode: pp.c }, k, pp.n, 'ลงเวร ' + pp.n + ' แล้ว'); }); }, 300); } });
    if (!mine && c.n < c.q && (S.boot.myJobs || []).indexOf(P.jobId) >= 0) btns.push({ text: '<i class="bi bi-calendar2-check"></i> ลงตารางเวรนี้', cls: 'btn-brand', onClick: function(){ var t = $('slTime') ? $('slTime').value : times[0];
      bkSave('book', { positionId: P.id, date: date, slot: s, times: t }, k, 'me', 'ลงตารางเวรเรียบร้อย รอศูนย์ยืนยัน'); } });
  }
  modal('ช่วงเวร', body, btns);
}
function slotRemove(id, name){
  MDL.hide();
  promptBox('นำ ' + name + ' ออกจากตาราง', 'เหตุผล (บันทึกในประวัติ)', 'เช่น แลกเวร / ลงผิด').then(function(r){ if (r) { savingChip(1); api('cancelBooking', { id: id, reason: r }).then(function(){ savingChip(-1, true); notify('นำออกจากตารางแล้ว'); loadBooking(true); }).catch(function(){ savingChip(-1, false); }); } });
}

/* ================= ส่วนร่วม ชุด 07: เลือกศูนย์/ตำแหน่ง แสดงเป็นช่วงแยกตามศูนย์ ================= */
function allBrIds(){ return S.boot.branches.map(function(b){ return b.id; }); }
/** วางช่วงของแต่ละศูนย์ใน host · คืน id ของกล่องแต่ละศูนย์ = host + '_' + รหัสศูนย์ */
function brSecs(host, brs){
  $(host).innerHTML = brs.length ? brs.map(function(b){ return '<section class="br-sec" data-b="' + esc(b) + '"><h3 class="br-sec-h">' + brDot(b) + '</h3><div id="' + host + '_' + b + '">' + skeleton(3) + '</div></section>'; }).join('') : empty('funnel', 'ยังไม่ได้เลือกศูนย์ / ตำแหน่ง');
}
/** กรองตาราง (getScheduleGrid) ให้เหลือเฉพาะตำแหน่งที่เลือก */
function gridPick(g, brs){
  var sel = pickSel(brs);
  g.positions = (g.positions || []).filter(function(p){ return sel.indexOf(p.id) >= 0; });
  g.rows = (g.rows || []).filter(function(r){ return sel.indexOf(r.pid) >= 0; });
  return g;
}
function pickPids(brs){ return pickIsAll(brs) ? [] : pickSel(brs); }

/* ================= ตารางเวรรวม (ดูอย่างเดียว) ================= */
PAGES.schedule = function(){
  var brs = allBrIds();
  pickDefault(brs, S.scBr || curBr());
  mount(pageHead('งานของฉัน', 'ตารางเวรรวม', 'ตารางเวรของศูนย์รายเดือน ' + esc(slotL('D').s) + ' = ' + esc(slotL('D').name) + ' · ' + esc(slotL('E').s) + ' = ' + esc(slotL('E').name) + ' · เลือกดูทีละใบเซ็นชื่อได้',
    has('BRANCH') ? '<button class="btn btn-ghost" onclick="scPrint(this)"><i class="bi bi-printer"></i> พิมพ์ตารางเวร</button>' : '') +
    '<div class="filters">' + ymSelect('scYm', S.ym || S.boot.ym, 36, 2) + pickButton('scPick', brs, 'ศูนย์ / ตำแหน่งที่จะดู') + '</div>' + dayLegend() + recLegend() + '<div id="scBody" class="mt-2">' + skeleton(8) + '</div>');
  $('scYm').onchange = function(){ S.ym = this.value; loadSchedule(); };
  pickBind('scPick', brs, loadSchedule);
  loadSchedule();
};
function loadSchedule(){
  var ym = $('scYm').value, brs = pickBrs(allBrIds()), k = ym + '|' + brs.join(',');
  S.scKey = k;
  apiView('getScheduleGrids', { ym: ym, branchIds: brs }, function(r){ if (!$('scYm') || S.scKey !== k) return; drawSchedule(r); }).catch(function(){});
}
function drawSchedule(r){
  if (!$('scBody')) return;
  brSecs('scBody', r.grids.map(function(g){ return g.branchId; }));
  r.grids.forEach(function(g){
    var h = $('scBody_' + g.branchId); if (!h) return;
    if (g.error) { h.innerHTML = '<div class="wbanner"><i class="bi bi-exclamation-triangle"></i> ' + esc(g.error) + '</div>'; return; }
    gridPick(g, allBrIds());
    g.rows.forEach(function(x){ x.editable = false; });
    SheetGrid({ host: h, dates: g.dates, rows: g.rows, quota: g.quota, positions: g.positions, lineKey: 'sc|' + g.branchId });
    if (g.archived) h.insertAdjacentHTML('afterbegin', '<div class="wbanner"><i class="bi bi-archive"></i> ข้อมูลย้อนหลังจากคลังข้อมูล (ดูอย่างเดียว)</div>');
  });
}
/** พิมพ์ตารางเวรตามศูนย์/ตำแหน่งที่เลือก (เฉพาะศูนย์ที่ตนดูแล) */
function scPrint(btn){
  var brs = pickBrs(allBrIds()), mine = isCentral() ? brs : brs.filter(function(b){ return myBrs().indexOf(b) >= 0; });
  if (!mine.length) return alertBox('พิมพ์ไม่ได้', 'ศูนย์ที่เลือกไม่ใช่ศูนย์ที่คุณดูแล', 'info');
  if (mine.length < brs.length) notify('พิมพ์เฉพาะศูนย์ที่คุณดูแล: ' + mine.map(brName).join(', '), 'info');
  api('printDoc', { doc: 'hours', docType: 'duty', kind: 'check', ym: $('scYm').value, branchIds: mine, positionIds: pickPids(allBrIds()) }, { btn: btn, block: 'กำลังเตรียมตารางเวร…' }).then(printBRDoc).catch(function(){});
}

/* ================= แดชบอร์ดศูนย์ ================= */
PAGES.branch = function(){
  var brs = myBrs(), br = curBr();
  mount(pageHead('งานศูนย์', 'แดชบอร์ดศูนย์', 'ภาพรวมเวร ช่องว่าง และสิ่งที่ต้องทำของศูนย์') +
    (brs.length > 1 ? '<div class="filters"><div class="flex-grow-1"><label class="form-label">ศูนย์</label>' + brTabs('dbBr', brs, br) + '</div></div>' : '') + '<div id="dbBody">' + skeleton(8) + '</div>');
  if (brs.length > 1) bindBrTabs('dbBr', function(b){ setBr(b); loadBranchBoard(); });
  loadBranchBoard();
};
function loadBranchBoard(){
  var br = curBr(), ym = S.boot.ym;
  var st = { a: null, b: null }, draw = function(){ if (st.a && S.page === 'branch' && curBr() === br) drawBranchBoard(st.a, st.b); };
  apiView('getBranchBoard', { ym: ym, branchId: br }, function(d){ st.a = d; draw(); }).catch(function(){});
  apiView('getBranchBoard', { ym: addYm(ym, -1), branchId: br }, function(d){ st.b = d; draw(); }, { quiet: true }).catch(function(){});
}
function drawBranchBoard(d, prev){
  if (!$('dbBody')) return;
  var s = d.summary, b = brOf(d.branchId);
  var h = '<div class="br-hero" style="--bc:' + esc(b.color) + '"><div><div class="eyebrow">' + esc(b.fullName || b.name) + '</div><h2>' + esc(thYm(d.ym)) + '</h2>' + stepper(d.status) + '</div>' +
    '<div class="brh-k"><div><b>' + fmt(s.total) + '</b><span>เวรทั้งเดือน</span></div><div><b>' + hrs(s.hours) + '</b><span>ชั่วโมงที่ยืนยัน</span></div><div><b>' + money(s.amount) + '</b><span>บาท</span></div></div></div>';
  if (prev && ['OPEN', 'RETURNED'].indexOf(prev.status) >= 0) {
    var ps = prev.summary;
    h += '<div class="cta' + (prev.status === 'RETURNED' ? ' cta-bad' : '') + '"><div class="cta-ic"><i class="bi bi-send"></i></div><div class="flex-grow-1"><b>รอบเดือน ' + esc(thYm(prev.ym)) + ' ' + (prev.status === 'RETURNED' ? 'ถูกตีกลับ: ' + esc(prev.period.reason) : 'รอส่งให้ฝ่าย') + '</b><div class="small-muted">' + fmt(ps.total) + ' เวร · ยืนยันแล้ว ' + fmt(ps.worked) + ' · รอยืนยัน ' + fmt(ps.toConfirm) + ' · ต้องแก้ไข ' + fmt(ps.red) + ' · ส่งภายในวันที่ ' + esc(thDate(prev.window.deadline)) + '</div></div>' +
      '<button class="btn btn-ghost" onclick="S.enYm=\'' + prev.ym + '\';pickEnsure(\'' + d.branchId + '\');go(\'entry\')"><i class="bi bi-ui-checks-grid"></i> ตรวจรายการ</button><button class="btn btn-brand" onclick="submitBr(\'' + prev.ym + '\',\'' + d.branchId + '\',this)"><i class="bi bi-send-check"></i> ส่งให้ฝ่าย</button></div>';
  } else if (prev) h += '<div class="wbanner"><i class="bi bi-check2-circle"></i> รอบเดือน ' + esc(thYm(prev.ym)) + ' : ' + statusPill(prev.status) + '</div>';
  h += '<div class="kpis">' + kpi('hourglass-split', 'ic-warn', 'รอยืนยันการปฏิบัติงาน', s.toConfirm) + kpi('exclamation-octagon', s.red ? 'ic-bad' : 'ic-mute', 'รายการต้องแก้ไข', s.red) + kpi('person-plus', 'ic-info', 'เวรเดือนหน้ารอศูนย์ยืนยัน', d.pendingNext) + kpi('cup-hot', 'ic-ok', 'ค่าอาหาร (วัน)', s.meal) + '</div>';
  h += '<div class="grid-2"><div class="card"><div class="card-h"><h3><i class="bi bi-sun"></i> วันนี้ · ' + esc(dateTh(S.boot.today)) + '</h3><span class="sub">' + d.today.length + ' เวร</span></div><div class="card-b">' +
    (d.today.length ? d.today.map(function(x){ return '<div class="td-row"><span class="td-t">' + slotTag(x.slot) + ' ' + esc(x.timeIn + '–' + x.timeOut) + '</span><b>' + esc(x.name) + '</b><span class="small-muted">' + esc(posShort(x.posName)) + '</span></div>'; }).join('') : empty('moon-stars', 'วันนี้ไม่มีเวร')) + '</div></div>' +
    '<div class="card"><div class="card-h"><h3><i class="bi bi-person-exclamation"></i> ช่องเวรที่ยังว่าง (14 วัน)</h3><button class="btn btn-sm btn-soft ms-auto" onclick="pickEnsure(\'' + d.branchId + '\');go(\'plan\')">จัดตารางเวร</button></div><div class="card-b gap-list">' +
    (d.gaps.length ? d.gaps.map(function(g){ return '<div class="gp"><b>' + esc(thDate(g.date)) + '</b><span>' + esc(posShort(g.name)) + ' ' + slotTag(g.slot) + '</span><span class="pill p-warn nodot">ขาด ' + g.need + '</span></div>'; }).join('') : empty('check2-all', 'กรอบเวรครบทุกช่องแล้ว')) + '</div></div></div>';
  if (d.redItems.length) h += '<div class="card mt-3"><div class="card-h"><h3><i class="bi bi-exclamation-octagon text-danger"></i> รายการต้องแก้ไข</h3><button class="btn btn-sm btn-ghost ms-auto" onclick="go(\'followup\')">ดูทั้งหมด</button></div><div class="card-b">' +
    d.redItems.slice(0, 12).map(function(x){ return '<div class="td-row"><span class="td-t">' + esc(thDate(x.date)) + '</span><b>' + esc(x.name) + '</b>' + flagChips(x.flags.filter(function(f){ return flagLevel(f) === 'R'; }), 3, x.stopNote) + '</div>'; }).join('') + '</div></div>';
  $('dbBody').innerHTML = h;
  animateKpis();
}
function submitBr(ym, br, btn){
  confirmBox('ส่งให้ฝ่าย', 'ยืนยันส่งข้อมูลรอบเดือน ' + thYm(ym) + ' ของศูนย์' + brName(br) + ' ให้เจ้าหน้าที่กลางตรวจ\nหลังส่งแล้วศูนย์จะแก้ไขไม่ได้ (เว้นแต่ถูกตีกลับ)\nอย่าลืมส่งใบบันทึกเวลาฉบับกระดาษด้วย', 'ส่งให้ฝ่าย').then(function(ok){
    if (ok) api('submitBranch', { ym: ym, branchId: br }, { btn: btn }).then(function(){ Swal.fire({ icon: 'success', title: 'ส่งให้ฝ่ายเรียบร้อย', text: 'เจ้าหน้าที่กลางจะตรวจและแจ้งผลในระบบ', confirmButtonText: 'รับทราบ' }); go(S.page); }).catch(function(){});
  });
}

/* ================= จัดตารางเวร (ผู้ดูแลศูนย์) ================= */
var PL = {};
function plDirty(){ return Object.keys(PL).filter(function(b){ return PL[b] && PL[b].hasDirty(); }); }
function plGuard(then){
  var d = plDirty(); if (!d.length) return then();
  confirmBox('ยังไม่ได้บันทึกตาราง', 'มีช่องที่แก้ไขแต่ยังไม่บันทึก (' + d.map(brName).join(', ') + ')\nถ้าเปลี่ยนแล้วการแก้ไขจะหายไป', 'เปลี่ยนโดยไม่บันทึก', true).then(function(ok){ if (ok) then(false); });
}
PAGES.plan = function(){
  var brs = myBrs();
  var ym = S.plYm || addYm(S.boot.ym, S.boot.today.slice(8) >= '10' ? 1 : 0);
  pickDefault(brs, curBr());
  mount(pageHead('งานศูนย์', 'จัดตารางเวร', 'พิมพ์ตัวย่อในช่องแบบ Google Sheet · ยืนยันเวรที่บุคลากรลงเอง · เลือกใบเซ็นชื่อแล้วเพิ่มเวร ชื่อจะลงใบนั้น',
    '<button class="btn btn-ghost" onclick="plPrint(this)"><i class="bi bi-printer"></i> พิมพ์ใบบันทึกเวลา</button>') +
    '<div class="filters">' + ymSelect('plYm', ym, 3, 2) + pickButton('plPick', brs, 'ศูนย์ / ตำแหน่ง') + '</div>' +
    dayLegend() + recLegend() + '<div id="plBody" class="mt-2">' + skeleton(8) + '</div>');
  LEAVE_GUARD = function(){ return plDirty().length ? 'มีช่องในตารางเวรที่แก้ไขแต่ยังไม่บันทึก' : ''; };
  $('plYm').dataset.o = ym;
  $('plYm').onchange = function(){ var v = this.value; plGuard(function(){ S.plYm = v; $('plYm').dataset.o = v; loadPlan(); }); if (plDirty().length) setSel('plYm', $('plYm').dataset.o); };
  var pb = $('plPick'); pickBind('plPick', brs, loadPlan);
  var open = pb.onclick; pb.onclick = function(){ plGuard(function(){ open(); }); };
  loadPlan();
};
function loadPlan(){
  var ym = $('plYm').value, brs = pickBrs(myBrs()), k = ym + '|' + brs.join(',');
  S.plKey = k; PL = {};
  api('getScheduleGrids', { ym: ym, branchIds: brs }).then(function(r){
    if (!$('plBody') || S.plKey !== k) return;
    brSecs('plBody', brs);
    r.grids.forEach(drawPlan);
  }).catch(function(){});
}
function drawPlan(g){
  var b = g.branchId, host = $('plBody_' + b); if (!host) return;
  if (g.error) { host.innerHTML = '<div class="wbanner"><i class="bi bi-exclamation-triangle"></i> ' + esc(g.error) + '</div>'; return; }
  gridPick(g, myBrs());
  host.innerHTML = '<div id="plHead_' + b + '"></div><div id="plGrid_' + b + '"></div>';
  $('plHead_' + b).innerHTML = (g.pendingCount ? '<div class="cta"><div class="cta-ic"><i class="bi bi-person-check"></i></div><div class="flex-grow-1"><b>มีเวรที่บุคลากรลงเอง รอยืนยัน ' + g.pendingCount + ' รายการ (ทั้งศูนย์)</b><div class="small-muted">ช่องที่มีเส้นประสีส้ม · ตรวจแล้วกดยืนยันทั้งตารางครั้งเดียว</div></div>' + (g.editable ? '<button class="btn btn-brand" onclick="plConfirm(\'' + b + '\',this)"><i class="bi bi-check2-all"></i> ยืนยันเวรทั้งหมด</button>' : '') + '</div>' : '') +
    (!g.editable ? '<div class="wbanner">' + statusPill(g.status) + ' รอบเดือนนี้แก้ไขตารางไม่ได้ในสถานะปัจจุบัน</div>' : '');
  g.rows.forEach(function(r){ r.editable = g.editable; });
  var G = PL[b] = SheetGrid({ host: 'plGrid_' + b, dates: g.dates, rows: g.rows, quota: g.quota, positions: g.positions, canAdd: g.editable, lineKey: 'pl|' + b,
    onAddRow: function(pid){ var P = g.positions.filter(function(p){ return p.id === pid; })[0];
      pickPerson('เพิ่มบุคลากรใน ' + posShort(P.name) + ' · ' + brName(b), P.jobId, 'เพิ่มแถวแล้วพิมพ์ตัวย่อในช่องวันที่ต้องการ').then(function(pp){ if (!pp) return;
        var ex = g.rows.filter(function(r){ return r.pid === pid && r.empCode === pp.c; })[0];
        if (ex) { if (!ex._show) { G.showRow(ex); G.render(); notify('แสดงแถวของ ' + pp.n + ' แล้ว พิมพ์ตัวย่อในช่องวันที่ต้องการ', 'info'); } else notify('มีรายชื่อนี้ในตำแหน่งนี้แล้ว', 'info'); return; }
        g.rows.push({ key: pid + '|' + pp.c, pid: pid, empCode: pp.c, name: pp.n, hrPos: pp.h, partTime: !!pp.pt, stop: pp.ds || '', stopNote: pp.x ? 'พ้นสภาพแล้ว' : '', cells: {}, st: {}, pend: {}, ln: {}, editable: true, _show: true });
        G.render(); }); },
    onSave: function(list, btn){ api('saveScheduleGrid', { ym: g.ym, branchId: b, changes: list }, { btn: btn, block: 'กำลังบันทึกตาราง…' }).then(function(r){
      var bad = r.results.filter(function(x){ return !x.ok || x.warn; });
      if (bad.length) resultBox('บันทึกตาราง ' + brName(b), r.results); else notify('บันทึกตาราง' + brName(b) + 'แล้ว (เพิ่ม ' + r.added + ' · ลบ ' + r.removed + ')');
      drawPlan(r.grid); }).catch(function(){}); } });
}
function plConfirm(b, btn){ api('confirmBookings', { ym: $('plYm').value, branchId: b }, { btn: btn }).then(function(r){ notify('ยืนยันเวรแล้ว ' + r.confirmed + ' รายการ'); if (!plDirty().length) loadPlan(); else notify('ตารางที่ยังไม่บันทึกยังอยู่ · บันทึกแล้วตารางจะอัปเดต', 'info'); }).catch(function(){}); }
function plPrint(btn){
  modal('พิมพ์ใบบันทึกเวลาการปฏิบัติงาน', '<div class="small-muted mb-2">แบบฟอร์ม FM-HRM-032/01 · 1 หน้า/เดือน/ตำแหน่ง/ใบที่ · ช่องที่ไม่มีกรอบเวรเป็นสีเทาทึบ</div>' +
    '<div class="mb-2"><b>พิมพ์:</b> ' + esc(pickSummary(myBrs())) + '<div class="small-muted">เปลี่ยนได้ที่ปุ่ม "ศูนย์ / ตำแหน่ง" ด้านบน</div></div>' +
    '<div class="form-check mt-3"><input class="form-check-input" type="checkbox" id="ppBlank"><label class="form-check-label" for="ppBlank">ใบเปล่า (ไม่ใส่รายชื่อตามตาราง)</label></div>',
    [{ text: 'ยกเลิก', cls: 'btn-ghost' }, { text: '<i class="bi bi-printer"></i> พิมพ์ / บันทึก PDF', cls: 'btn-brand', onClick: function(){
      if (plDirty().length) notify('ตารางที่ยังไม่บันทึกจะไม่อยู่ในใบที่พิมพ์', 'info');
      api('printDoc', { doc: 'sign', ym: $('plYm').value, branchIds: pickBrs(myBrs()), positionIds: pickPids(myBrs()), blank: $('ppBlank').checked }, { block: 'กำลังเตรียมใบบันทึกเวลาสำหรับพิมพ์…' }).then(printBRDoc).catch(function(){}); } }]);
}

/* ================= บันทึกการปฏิบัติงาน =================
 * ชุด 07: เลือกศูนย์/ตำแหน่ง (หลายศูนย์เปิดต่อกันเป็นใบ ๆ) · แก้เป็น "ร่าง" ทุกอย่าง (เปลี่ยนตัว เวลา ไม่มา เพิ่มคน ตรงตามใบ)
 * แล้วกด "บันทึก (n)" ครั้งเดียว → saveEntryBatch · ออกจากหน้าโดยยังไม่บันทึก ระบบเตือน */
var EN = { list: [], sheet: 0, view: 'sheet', filter: 'all', dr: null };
function enDrNew(){ return { upd: {}, abs: {}, res: {}, unc: {}, conf: {}, add: [] }; }
EN.dr = enDrNew();
function enDrN(){ var r = EN.dr; return Object.keys(r.upd).length + Object.keys(r.abs).length + Object.keys(r.res).length + Object.keys(r.unc).length + Object.keys(r.conf).length + r.add.length; }
function enHasDr(id){ var r = EN.dr; return !!(r.upd[id] || r.abs[id] != null || r.res[id] || r.unc[id] || r.conf[id]); }
/** ถามก่อนทิ้งร่าง · then() เรียกเมื่อไม่มีร่าง หรือผู้ใช้ยืนยันทิ้ง */
function enGuard(then, undo){
  var n = enDrN(); if (!n) return then();
  confirmBox('ยังไม่ได้บันทึก', 'มีรายการที่แก้ไขแต่ยังไม่บันทึก ' + n + ' รายการ\nถ้าเปลี่ยนแล้วการแก้ไขจะหายไป (กด "บันทึก" ก่อน หากต้องการเก็บไว้)', 'ทิ้งการแก้ไข', true).then(function(ok){ if (ok) { EN.dr = enDrNew(); enBar(); then(); } else if (undo) undo(); });
}
PAGES.entry = function(){
  var brs = myBrs();
  var ym = S.enYm || (S.boot.today.slice(8) <= '10' ? addYm(S.boot.ym, -1) : S.boot.ym);
  S.enYm = null; EN.dr = enDrNew(); EN.list = [];
  pickDefault(brs, curBr());
  EN.view = store('bd_env') || 'sheet';
  mount(pageHead('งานศูนย์', 'บันทึกการปฏิบัติงาน', 'ระบบเติมรายการจากตารางเวรให้แล้ว เทียบกับใบลงชื่อกระดาษ แล้วกด <b>"ตรงตามใบ"</b> แก้เฉพาะจุดที่ต่าง · แก้ได้หลายจุดแล้วกด <b>"บันทึก"</b> ครั้งเดียว',
    '<button class="btn btn-ghost" onclick="enSync(this)"><i class="bi bi-fingerprint"></i> ดึงสแกนล่าสุด</button>') +
    '<div class="filters">' + ymSelect('enYm', ym, 6, 0) + pickButton('enPick', brs, 'ศูนย์ / ตำแหน่ง') +
    '<div><label class="form-label">มุมมอง</label><div class="seg" id="enView"><button data-v="sheet"' + (EN.view === 'sheet' ? ' class="on"' : '') + '><i class="bi bi-file-earmark-text"></i> ดูเป็นใบ</button><button data-v="list"' + (EN.view === 'list' ? ' class="on"' : '') + '><i class="bi bi-list-ul"></i> ดูรวม</button></div></div></div>' +
    '<div id="enHead"></div><div id="enBody">' + skeleton(10) + '</div>');
  LEAVE_GUARD = function(){ return enDrN() ? 'มีรายการในหน้าบันทึกการปฏิบัติงานที่แก้ไขแต่ยังไม่บันทึก ' + enDrN() + ' รายการ' : ''; };
  $('enYm').dataset.o = ym;
  $('enYm').onchange = function(){ var v = this.value; enGuard(function(){ $('enYm').dataset.o = v; setSel('enYm', v); loadEntry(true); }, function(){ setSel('enYm', $('enYm').dataset.o); }); };
  var pb = $('enPick'); pickBind('enPick', brs, function(){ loadEntry(true); });
  var open = pb.onclick; pb.onclick = function(){ enGuard(function(){ open(); }); };
  $$('#enView button').forEach(function(b){ b.onclick = function(){ $$('#enView button').forEach(function(x){ x.classList.toggle('on', x === b); }); EN.view = b.dataset.v; store('bd_env', EN.view); drawEntry(); }; });
  enBar();
  loadEntry(true);
};
function loadEntry(reset){
  if (!$('enYm')) return;
  var ym = $('enYm').value, brs = pickBrs(myBrs()), k = ym + '|' + brs.join(',');
  S.enKey = k;
  if (reset) { EN.sheet = 0; EN.sel = {}; }
  var draw = function(r){ if (!$('enBody') || S.enKey !== k || r.ym !== ym) return; EN.list = r.list; drawEntry(); };
  // เปิดหน้า/เปลี่ยนตัวกรอง แสดงข้อมูลที่จำไว้ทันที · หลังบันทึก โหลดข้อมูลล่าสุดตรง ๆ
  if (reset) return apiView('getEntrySheets', { ym: ym, branchIds: brs }, draw).catch(function(){});
  return api('getEntrySheets', { ym: ym, branchIds: brs }, { fresh: true }).then(draw).catch(function(){});
}
function enSync(btn){
  var brs = pickBrs(myBrs()), ym = $('enYm').value, tot = { codes: 0, days: 0 };
  var run = brs.reduce(function(p, b){ return p.then(function(){ return api('syncBranchScans', { ym: ym, branchId: b }, { btn: btn, block: 'กำลังดึงข้อมูลสแกนจากระบบ HR · ' + brName(b) + '…', timeout: 300000 }).then(function(r){ tot.codes += r.codes; tot.days += r.days; }); }); }, Promise.resolve());
  run.then(function(){ notify('ดึงสแกนแล้ว ' + tot.codes + ' คน ' + tot.days + ' วัน' + (enDrN() ? ' · รายการที่แก้ไขยังอยู่ อย่าลืมกดบันทึก' : '')); loadEntry(); }).catch(function(){});
}
/** รายการของศูนย์ (รวมร่าง) */
function enOv(x){
  if (!enHasDr(x.id)) return x;
  var r = EN.dr, u = r.upd[x.id], y = Object.assign({}, x, { _dr: true });
  if (u) {
    if (u.empCode) { y.empCode = u.empCode; y.name = u.name; y.hrPos = u.hrPos || ''; y.partTime = !!u.pt; y.stopNote = u.x ? 'พ้นสภาพแล้ว' + (u.ds ? ' · วันสิ้นสุดตาม HR ' + thDate(u.ds) : '') : ''; y.scanStatus = ''; y.scanIn = ''; y.scanOut = ''; y.flags = []; }
    if (u.times) { var t = u.times.split('-'); y.timeIn = t[0]; y.timeOut = t[1]; }
    if ('payMode' in u) y.payMode = u.payMode;
    if ('earlyDecision' in u) { y.earlyDecision = u.earlyDecision; y.earlyReason = u.earlyReason; }
  }
  if (r.abs[x.id] != null) { y.workStatus = 'ABSENT'; y.note = r.abs[x.id]; }
  if (r.res[x.id] || r.unc[x.id]) y.workStatus = '';
  if (r.conf[x.id]) { y.workStatus = 'WORKED'; y.red = false; }
  return y;
}
function enItems(d){ return d.items.map(enOv).concat(EN.dr.add.filter(function(a){ return a.branchId === d.branchId; }).map(function(a){ return a.item; })); }
function enFind(id){ for (var i = 0; i < EN.list.length; i++) { var d = EN.list[i], x = enItems(d).filter(function(y){ return y.id === id; })[0]; if (x) return { d: d, x: x, o: d.items.filter(function(y){ return y.id === id; })[0] }; } return null; }
function enSel(){ return pickSel(myBrs()); }
function enPages(){
  var sel = enSel(), out = [];
  EN.list.forEach(function(d){ d.sheets.forEach(function(p){ if (sel.indexOf(p.positionId) < 0) return; for (var k = 1; k <= p.lines; k++) out.push({ d: d, p: p, k: k }); }); });
  return out;
}
/** แถบล่าง: จำนวนที่แก้ + ปุ่มบันทึกครั้งเดียว */
function enBar(){
  if (S.page !== 'entry') return;
  var n = enDrN();
  actionBar(n ? '<span class="cnt"><i class="bi bi-pencil-square"></i> แก้ไขแล้ว ' + n + ' รายการ (ยังไม่บันทึก)</span><button class="btn btn-sm btn-ghost" onclick="enDiscard()"><i class="bi bi-arrow-counterclockwise"></i> ยกเลิกที่แก้</button><button class="btn btn-sm btn-brand" id="enSaveBtn" onclick="enSave(this)"><i class="bi bi-save"></i> บันทึก (' + n + ')</button>' : null);
}
function enDiscard(){ confirmBox('ยกเลิกที่แก้', 'ยกเลิกการแก้ไขที่ยังไม่บันทึกทั้งหมด ' + enDrN() + ' รายการ', 'ยกเลิกที่แก้', true).then(function(ok){ if (ok) { EN.dr = enDrNew(); enBar(); drawEntry(); } }); }
function enRedraw(){ enBar(); drawEntry(); }
function drawEntry(){
  if (!$('enBody')) return;
  var sel = enSel(), all = [];
  EN.list.forEach(function(d){ enItems(d).forEach(function(x){ if (sel.indexOf(x.positionId) >= 0) all.push(x); }); });
  var s = { total: 0, worked: 0, pending: 0, red: 0, hours: 0, amount: 0, meal: 0 }, today = S.boot.today;
  all.forEach(function(x){
    if (x.workStatus === 'ABSENT') return;
    s.total++;
    if (x.workStatus === 'WORKED') s.worked++; else if (x.date <= today) s.pending++;
    if (x.red) s.red++;
    var est = x._dr && x.workStatus === 'WORKED' && !x._new;
    s.hours += est ? (+x.hours || +x.planned || 0) : (+x.hours || 0);
    s.amount += est ? (+x.amount || (x.payType === 'HOURLY' ? (+x.planned || 0) * (+x.rate || 0) : 0)) : (+x.amount || 0);
    s.meal += +x.meal || 0;
  });
  var pct = s.total ? Math.round(s.worked / s.total * 100) : 0, nd = enDrN();
  $('enHead').innerHTML = '<div class="en-sum"><div class="ens-l">' + EN.list.map(function(d){ return '<span class="me-2">' + brDot(d.branchId) + ' ' + statusPill(d.status) + (d.period.reason && d.status === 'RETURNED' ? ' <span class="small text-danger">เหตุผล: ' + esc(d.period.reason) + '</span>' : '') + '</span>'; }).join('') + '</div>' +
    '<div class="ens-k"><div><b>' + s.worked + '</b>/' + s.total + '<span>ยืนยันแล้ว</span></div><div class="' + (s.pending ? 'w' : '') + '"><b>' + s.pending + '</b><span>รอยืนยัน</span></div><div class="' + (s.red ? 'r' : '') + '"><b>' + s.red + '</b><span>ต้องแก้ไข</span></div><div><b>' + hrs(s.hours) + '</b><span>ชั่วโมง' + (nd ? ' (ประมาณ)' : '') + '</span></div><div><b>' + money(s.amount) + '</b><span>บาท' + (nd ? ' (ประมาณ)' : '') + '</span></div><div><b>' + s.meal + '</b><span>ค่าอาหาร (วัน)</span></div></div>' +
    '<div class="ens-bar"><i style="width:' + pct + '%"></i></div>' + (EN.list[0] && EN.list[0].lastScanSync ? '<div class="small-muted mt-1"><i class="bi bi-fingerprint"></i> ข้อมูลสแกนล่าสุด ' + esc(EN.list[0].lastScanSync) + (nd ? ' · <b class="text-warning">มีรายการแก้ไขที่ยังไม่บันทึก ' + nd + ' รายการ (กรอบเส้นประ)</b>' : '') + '</div>' : '') + '</div>';
  if (EN.view === 'list') return drawEntryList(all);
  // ใบ = ศูนย์ × ตำแหน่ง × ใบที่
  var pages = enPages();
  if (!pages.length) { $('enBody').innerHTML = '<div class="card">' + empty('file-earmark-x', 'ไม่มีเวรในเดือนนี้ (ศูนย์/ตำแหน่งที่เลือก)') + '</div>'; return; }
  if (EN.sheet >= pages.length) EN.sheet = pages.length - 1;
  var cur = pages[EN.sheet], d = cur.d, P = cur.p, k = cur.k, multi = EN.list.length > 1;
  var mine = enItems(d).filter(function(x){ return x.positionId === P.positionId && +x.lineNo === k; });
  var at = {}; mine.forEach(function(x){ var key = x.date + '|' + x.slot, o = at[key]; if (!o || o.workStatus === 'ABSENT' || x._new) at[key] = x; });
  var sheetItems = mine.filter(function(x){ return x.workStatus !== 'ABSENT'; });
  var todo = sheetItems.filter(function(x){ return x.workStatus !== 'WORKED' && x.date <= d.today; });
  var redOf = function(pg){ return pg.d.items.some(function(x){ return x.positionId === pg.p.positionId && +x.lineNo === pg.k && x.red && !EN.dr.conf[x.id]; }); };
  var h = '<div class="pv-bar"><button class="pv-nav" id="pvPrev" aria-label="ใบก่อนหน้า"' + (EN.sheet ? '' : ' disabled') + '><i class="bi bi-chevron-left"></i></button><div class="pv-where"><div class="pv-pos">' + (multi ? brDot(d.branchId) + ' ' : '') + esc(posShort(P.name)) + ' <span class="tag brand">ใบที่ ' + k + ' / ' + P.lines + '</span></div>' +
    '<div class="pv-sub">ใบ ' + (EN.sheet + 1) + ' จาก ' + pages.length + ' · รอยืนยัน ' + todo.length + ' · ต้องแก้ไข ' + sheetItems.filter(function(x){ return x.red; }).length + '</div><div class="pv-dots">' + pages.map(function(pg, i){ return '<i class="' + (i === EN.sheet ? 'on' : '') + (i && pg.k === 1 ? ' gap' : '') + (i && pg.d !== pages[i - 1].d ? ' gap2' : '') + (redOf(pg) ? ' bad' : '') + '" data-i="' + i + '" title="' + esc((multi ? brName(pg.d.branchId) + ' · ' : '') + posShort(pg.p.name) + ' ใบที่ ' + pg.k) + '"></i>'; }).join('') + '</div></div>' +
    '<div class="pv-tools">' + (d.editable && todo.length ? '<button class="btn btn-ok" id="enOkSheet"><i class="bi bi-check2-all"></i> ตรงตามใบ (' + todo.length + ')</button>' : '') + '</div><button class="pv-nav" id="pvNext" aria-label="ใบถัดไป"' + (EN.sheet < pages.length - 1 ? '' : ' disabled') + '><i class="bi bi-chevron-right"></i></button></div>';
  if (!d.editable) h += '<div class="wbanner">' + brDot(d.branchId) + ' ' + statusPill(d.status) + ' รอบเดือนนี้แก้ไขไม่ได้ในสถานะปัจจุบัน (ดูอย่างเดียว)</div>';
  h += '<div class="paper-stage"><div class="paper" id="enPaper"><div class="paper-top"><span class="paper-form">FM-HRM-032/01</span><span class="paper-no">ใบที่ <b>' + k + '</b></span></div>' +
    '<div class="paper-t">แบบบันทึกเวลาการปฏิบัติงาน (' + esc(brOf(d.branchId).fullName || brName(d.branchId)) + ')</div><div class="paper-s">ประจำเดือน ' + esc(thYm(d.ym)) + ' · ตำแหน่ง ' + esc(posShort(P.name)) + '</div>' +
    '<div class="tbl paper-tbl"><table class="table sheet-g"><thead><tr><th rowspan="2" class="sw-d">วันที่</th><th class="sw-s">' + esc(slotL('D').name) + ' ' + esc(P.day.join(' / ') || '') + '</th><th class="sw-s">' + esc(slotL('E').name) + ' ' + esc(P.eve.join(' / ') || '—') + '</th></tr></thead><tbody>';
  d.dates.forEach(function(x, i){
    var q = P.quota[i] || { D: 0, E: 0 };
    h += '<tr class="' + dk(x.color) + '"><td class="sw-d"><b>' + x.d + '</b> <small>' + TH_D[x.dow] + '</small>' + (x.color !== 'WORK' && x.color !== 'WEEKEND' && x.note ? '<div class="sw-note">' + esc(x.note) + '</div>' : '') + '</td>' +
      ['D', 'E'].map(function(s){ return sheetCell(at[x.date + '|' + s], x, s, k <= q[s], d.editable, P, k); }).join('') + '</tr>';
  });
  h += '</tbody></table></div><div class="paper-sign"><div><i></i>ผู้ตรวจสอบการลงเวลาปฏิบัติงาน</div><div><i></i>ผู้จัดการศูนย์บริการสุขภาพสาขา</div></div></div></div>';
  $('enBody').innerHTML = h;
  $('pvPrev').onclick = function(){ EN.sheet--; drawEntry(); $('enPaper').classList.add('flip-prev'); };
  $('pvNext').onclick = function(){ EN.sheet++; drawEntry(); $('enPaper').classList.add('flip-next'); };
  $$('.pv-dots i').forEach(function(el){ el.onclick = function(){ EN.sheet = +el.dataset.i; drawEntry(); }; });
  if ($('enOkSheet')) $('enOkSheet').onclick = function(){ enConfirm(todo.map(function(x){ return x.id; })); };
  $$('#enBody [data-cell]').forEach(function(el){ el.onclick = function(e){ if (e.target.closest('.sc-cf')) return; openDuty(el.dataset.cell); }; });
  $$('#enBody .sc-cf').forEach(function(el){ el.onclick = function(e){ e.stopPropagation(); enConfirm([el.dataset.id]); }; });
  $$('#enBody [data-add]').forEach(function(el){ el.onclick = function(){ var a = el.dataset.add.split('|'); enAdd(d.branchId, a[0], a[1], a[2], +a[3]); }; });
}
document.addEventListener('keydown', function(e){
  if (S.page !== 'entry') return;
  if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) { e.preventDefault(); if (enDrN() && $('enSaveBtn')) enSave($('enSaveBtn')); return; }
  if (EN.view !== 'sheet' || MDL && document.querySelector('.modal.show') || /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '')) return;
  if (e.key === 'ArrowRight' && $('pvNext') && !$('pvNext').disabled) $('pvNext').click();
  if (e.key === 'ArrowLeft' && $('pvPrev') && !$('pvPrev').disabled) $('pvPrev').click();
});
function sheetCell(x, day, s, inQuota, editable, P, k){
  if (!x || x.workStatus === 'ABSENT') {
    var ab = x && x.workStatus === 'ABSENT';
    if (day.kind === 'CLOSED') return '<td class="sc sc-off">ปิดศูนย์</td>';
    if (!inQuota && !ab) return '<td class="sc sc-dark"></td>';
    return '<td class="sc sc-empty' + (ab && x._dr ? ' sc-dr' : '') + '">' + (ab ? '<span class="sc-ab" data-cell="' + x.id + '"><i class="bi bi-person-x"></i> ' + esc(x.name) + ' <small>ไม่มา' + (x._dr ? ' · ยังไม่บันทึก' : '') + '</small></span>' : '') +
      (editable && day.date <= S.boot.today && (s === 'D' ? P.day.length : P.eve.length) ? '<button class="sc-add" data-add="' + P.positionId + '|' + day.date + '|' + s + '|' + (k || 0) + '"><i class="bi bi-plus-lg"></i> เพิ่ม</button>' : '') + '</td>';
  }
  var past = x.date <= S.boot.today;
  var cls = x.red ? 'bad' : x.workStatus === 'WORKED' ? 'ok' : past ? 'todo' : 'plan';
  return '<td class="sc sc-' + cls + (x._dr ? ' sc-dr' : '') + '" data-cell="' + x.id + '"' + (x._dr ? ' title="แก้ไขแล้ว ยังไม่บันทึก"' : '') + '><div class="sc-n"><b>' + esc(x.name) + '</b>' + (x.stopNote ? stopPill('', true) : '') + '<small class="tnum">' + esc(x.empCode) + (x.partTime ? ' · ชม.' : '') + '</small></div>' +
    '<div class="sc-m">' + (isStd(x, P) ? '' : '<span class="tag">' + esc(x.timeIn + '–' + x.timeOut) + '</span>') + (x.payType === 'HOURLY' ? '<span class="sc-h">' + hrs(x.workStatus === 'WORKED' && !x._dr ? x.hours : x.planned) + ' ชม.</span>' : x.payType === 'FULLTIME' ? '<span class="sc-h ft">FT' + (x.meal ? ' ☕' : '') + '</span>' : '') +
    (x.scanStatus && past ? '<span class="sc-scan ' + scanCls(x.scanStatus) + '" title="' + esc(x.scanStatus) + '"><i class="bi bi-fingerprint"></i>' + esc(x.scanOut || x.scanIn || '') + '</span>' : '') + (x.attachIds.length ? '<i class="bi bi-paperclip" title="มีใบลืมสแกน"></i>' : '') + (x._dr ? '<span class="dr-tag">' + (x._new ? 'เพิ่มใหม่' : 'แก้ไข') + '</span>' : '') + '</div>' +
    (x.flags.length ? '<div class="sc-f">' + flagChips(x.flags.filter(function(f){ return f !== 'NOT_CONFIRMED' && f !== 'LEGACY'; }), 2, x.stopNote) + '</div>' : '') +
    (editable && past && x.workStatus !== 'WORKED' ? '<button class="sc-cf" data-id="' + x.id + '" title="ตรงตามใบ"><i class="bi bi-check-lg"></i></button>' : x.workStatus === 'WORKED' ? '<i class="bi bi-check-circle-fill sc-done" title="' + (x._dr ? 'ยืนยัน (ยังไม่บันทึก)' : 'ยืนยันแล้ว') + '"></i>' : '') + '</td>';
}
function isStd(x, P){ var k = x.timeIn + '-' + x.timeOut; return (x.slot === 'D' ? P.day : P.eve).indexOf(k) >= 0; }
function scanCls(s){ var sc = S.boot.scan; return s === sc.OK || s === sc.OK_DOC ? 'ok' : s === sc.PENDING ? 'pend' : 'bad'; }
/** "ตรงตามใบ" → ร่าง (ช่องเป็นสีเขียวทันที) · บันทึกจริงเมื่อกด "บันทึก" */
function enConfirm(ids){
  var n = 0;
  ids.forEach(function(id){
    if (String(id).indexOf('new:') === 0) return;
    var f = enFind(id); if (!f || !f.d.editable || f.x.date > S.boot.today) return;
    if (EN.dr.unc[id]) { delete EN.dr.unc[id]; n++; return; }
    if (f.o.workStatus === 'WORKED' && !EN.dr.res[id]) return;
    if (EN.dr.abs[id] != null) return;
    EN.dr.conf[id] = 1; n++;
  });
  if (n) notify('ตรงตามใบ ' + n + ' รายการ · กด "บันทึก" เมื่อตรวจครบ', 'info');
  enRedraw();
}
/** เพิ่มผู้ปฏิบัติงานในช่องว่างของใบที่กำลังดู (ลงใบนั้น) → ร่าง */
function enAdd(b, pid, date, s, k){
  var P = posOf(pid) || {};
  var d = EN.list.filter(function(x){ return x.branchId === b; })[0], SP = d && d.sheets.filter(function(x){ return x.positionId === pid; })[0];
  pickPerson('เพิ่มผู้ปฏิบัติงาน · ' + dateTh(date) + ' · ' + slotL(s).name + (k ? ' · ใบที่ ' + k : ''), P.jobId, 'กรณีมาปฏิบัติงานจริงแต่ไม่ได้อยู่ในตาราง (เป็นยืนยันแล้ว · กด "บันทึก" เพื่อบันทึกจริง)').then(function(pp){
    if (!pp) return;
    var dup = enItems(d).some(function(x){ return x.date === date && x.slot === s && x.empCode === pp.c && x.workStatus !== 'ABSENT'; });
    if (dup) return alertBox('ซ้ำ', pp.n + ' มีเวร' + slotL(s).name + 'วันนี้แล้ว', 'info');
    var t = ((s === 'D' ? SP && SP.day : SP && SP.eve) || [])[0] || '-', tt = t.split('-'), key = 'a' + Date.now() + Math.floor(Math.random() * 1000);
    EN.dr.add.push({ key: key, branchId: b, positionId: pid, date: date, slot: s, empCode: pp.c, lineNo: k || 0, item: {
      id: 'new:' + key, _new: true, _dr: true, branchId: b, positionId: pid, posName: P.name, date: date, slot: s, lineNo: k || 0, empCode: pp.c, name: pp.n, hrPos: pp.h, partTime: !!pp.pt,
      stopNote: pp.x ? 'พ้นสภาพแล้ว' : '', timeIn: tt[0] || '', timeOut: tt[1] || '', workStatus: 'WORKED', flags: pp.x ? ['RESIGNED'] : [], attachIds: [], payType: '', planned: 0, hours: 0, amount: 0, meal: 0, scanStatus: '', red: false, source: 'BRANCH' } });
    enRedraw();
  });
}
/** รายละเอียดเวร + การดำเนินการ (เป็นร่างทั้งหมด ยกเว้นแนบใบลืมสแกน) */
function openDuty(id){
  var f = enFind(id); if (!f) return;
  var d = f.d, x = f.x, o = f.o;
  if (x._new) {
    return modal('รายการที่เพิ่ม (ยังไม่บันทึก)', '<div class="dd-h"><div><b>' + esc(x.name) + '</b> <span class="small-muted tnum">' + esc(x.empCode) + ' · ' + esc(x.hrPos || '') + '</span><div>' + esc(dateTh(x.date)) + ' · ' + slotTag(x.slot) + ' ' + esc(x.timeIn + '–' + x.timeOut) + (x.lineNo ? ' · ใบที่ ' + x.lineNo : '') + '</div></div></div>' +
      (x.stopNote ? '<div class="dd-stop mt-2"><i class="bi bi-person-dash"></i> ' + esc(x.stopNote) + ' · ลงเวรได้ ระบบติดธงส้มให้ตรวจ</div>' : '') + '<div class="small-muted mt-2">จะบันทึกเป็น "ยืนยันแล้ว" เมื่อกดปุ่ม "บันทึก" ด้านล่างจอ</div>',
      [{ text: 'ปิด', cls: 'btn-ghost' }, { text: '<i class="bi bi-trash"></i> เอารายการนี้ออก', cls: 'btn-danger-soft', onClick: function(){ EN.dr.add = EN.dr.add.filter(function(a){ return 'new:' + a.key !== id; }); enRedraw(); } }]);
  }
  var P = d.sheets.filter(function(s){ return s.positionId === x.positionId; })[0] || { day: [], eve: [] };
  var ed = d.editable, times = (x.slot === 'D' ? P.day : P.eve).slice();
  if (times.indexOf(x.timeIn + '-' + x.timeOut) < 0) times.unshift(x.timeIn + '-' + x.timeOut);
  var early = x.flags.indexOf('EARLY') >= 0 || x.flags.indexOf('EARLY_CUT') >= 0 || x.flags.indexOf('EARLY_PAY') >= 0;
  var body = (x._dr ? '<div class="wbanner"><i class="bi bi-pencil-square"></i> รายการนี้แก้ไขแล้ว ยังไม่บันทึก' + (x.empCode !== o.empCode ? ' · เดิม ' + esc(o.name) : '') + '</div>' : '') +
    '<div class="dd-h"><div><b>' + esc(x.name) + '</b> <span class="small-muted tnum">' + esc(x.empCode) + ' · ' + esc(x.hrPos) + '</span><div>' + esc(dateTh(x.date)) + ' · ' + slotTag(x.slot) + ' ' + esc(x.timeIn + '–' + x.timeOut) + ' · ใบที่ ' + x.lineNo + '</div></div>' +
    '<div class="dd-pay">' + (x.payType === 'HOURLY' ? '<b>' + hrs(x.workStatus === 'WORKED' && !x._dr ? x.hours : x.planned) + '</b> ชม.<small>' + money(x.amount || x.planned * x.rate) + ' บาท</small>' : x.payType === 'FULLTIME' ? '<b>Full Time</b><small>' + (x.meal ? 'ค่าอาหาร' : 'ไม่จ่ายรายชั่วโมง') + '</small>' : '<b>—</b>') + '</div></div>' +
    '<div class="dd-grid"><div><span>การปฏิบัติงาน</span>' + (x.workStatus === 'WORKED' ? '<span class="pill p-ok">ยืนยันแล้ว' + (EN.dr.conf[id] ? ' (ร่าง)' : '') + '</span> <small class="small-muted">' + esc(EN.dr.conf[id] ? '' : x.confirmedBy || '') + '</small>' : x.workStatus === 'ABSENT' ? '<span class="pill p-mute">ไม่มา</span> ' + esc(x.note) : '<span class="pill p-slate">รอยืนยัน</span>') + '</div>' +
    '<div><span>สแกนนิ้ว</span>' + scanPill(x.scanStatus) + (x.scanIn ? ' <small>' + esc(x.scanIn) + (x.scanOut && x.scanOut !== x.scanIn ? ' – ' + esc(x.scanOut) : '') + '</small>' : '') + '</div>' +
    '<div><span>กลุ่มการจ่าย</span>' + (x.partTime ? 'จ่ายรายชั่วโมงทุกช่วง' : 'บุคลากรประจำศูนย์') + (x.payMode ? ' <span class="tag">กำหนดรายเวร</span>' : '') + '</div>' +
    '<div><span>ที่มา</span>' + esc({ BOOK: 'ลงเอง', BRANCH: 'ผู้ดูแลศูนย์', CENTRAL: 'เจ้าหน้าที่กลาง', IMPORT: 'นำเข้าจากระบบเดิม', LEGACY: 'ระบบเดิม' }[x.source] || x.source) + '</div></div>' +
    (x.flags.length ? '<div class="mt-2">' + flagChips(x.flags, 8, x.stopNote) + '</div>' : '') +
    (x.stopNote ? '<div class="dd-stop mt-2"><i class="bi bi-person-dash"></i> ' + esc(x.stopNote) + '</div>' : '') +
    (x.attachIds.length ? '<div class="mt-2">' + x.attachIds.map(function(a, i){ return '<button class="btn btn-sm btn-ghost me-1" onclick="viewAttach(\'' + a + '\',' + (ed ? 'function(){loadEntry()}' : 'null') + ')"><i class="bi bi-paperclip"></i> ใบลืมสแกน ' + (i + 1) + '</button>'; }).join('') + '</div>' : '');
  if (ed && x.workStatus !== 'ABSENT') {
    body += '<hr><div class="row g-2"><div class="col-sm-6"><label class="form-label" for="ddTime">เวลา</label><select class="form-select" id="ddTime">' + times.map(function(t){ return '<option' + (t === x.timeIn + '-' + x.timeOut ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('') + '<option value="_">กำหนดเอง…</option></select></div>' +
      ((x.slot === 'D' && !x.partTime || x.payMode) && has('ADMIN') ? '<div class="col-sm-6"><label class="form-label" for="ddPay">การจ่ายเวรนี้</label><select class="form-select" id="ddPay"><option value="">ตามข้อมูลบุคลากร</option><option value="HOURLY"' + (x.payMode === 'HOURLY' ? ' selected' : '') + '>จ่ายรายชั่วโมง</option><option value="FULLTIME"' + (x.payMode === 'FULLTIME' ? ' selected' : '') + '>Full Time (ประจำศูนย์)</option></select></div>' : '') + '</div>';
    if (early) body += '<div class="early-box"><b><i class="bi bi-alarm"></i> สแกนออกก่อนเวลา (' + esc(x.scanOut) + ')</b><div class="seg mt-2" id="ddEarly"><button data-v="CUT"' + (x.earlyDecision === 'CUT' ? ' class="on"' : '') + '>ไม่จ่ายช่วงนี้</button><button data-v="PAY"' + (x.earlyDecision === 'PAY' ? ' class="on"' : '') + '>จ่ายเต็ม + เหตุผล</button><button data-v=""' + (!x.earlyDecision ? ' class="on"' : '') + '>ยังไม่ตัดสิน</button></div>' +
      '<textarea class="form-control mt-2" id="ddEarlyR" rows="2" placeholder="เหตุผล (บังคับ)">' + esc(x.earlyReason || '') + '</textarea></div>';
  }
  var btns = [{ text: 'ปิด', cls: 'btn-ghost' }], r = EN.dr;
  if (ed && enHasDr(id)) btns.push({ text: '<i class="bi bi-arrow-counterclockwise"></i> ยกเลิกที่แก้รายการนี้', cls: 'btn-ghost', onClick: function(){ delete r.upd[id]; delete r.abs[id]; delete r.res[id]; delete r.unc[id]; delete r.conf[id]; enRedraw(); } });
  if (ed) {
    if (x.workStatus === 'ABSENT') btns.push({ text: '<i class="bi bi-arrow-counterclockwise"></i> คืนรายการ', cls: 'btn-soft', onClick: function(){ if (r.abs[id] != null) delete r.abs[id]; else r.res[id] = 1; enRedraw(); } });
    else {
      btns.push({ text: '<i class="bi bi-person-x"></i> ไม่มา', cls: 'btn-danger-soft', onClick: function(){ setTimeout(function(){ promptBox('ไม่มาปฏิบัติงาน', 'เหตุผล', 'เช่น ลาป่วย / แลกเวร / ไม่มาตามตาราง').then(function(v){ if (!v) return; if (r.res[id]) delete r.res[id]; else r.abs[id] = v; delete r.conf[id]; delete r.unc[id]; enRedraw(); }); }, 250); } });
      btns.push({ text: '<i class="bi bi-arrow-left-right"></i> เปลี่ยนตัว', cls: 'btn-ghost', onClick: function(){ setTimeout(function(){ pickPerson('เปลี่ยนตัวผู้ปฏิบัติงาน', (posOf(x.positionId) || {}).jobId, 'แทน ' + x.name + ' · ' + dateTh(x.date) + ' (กด "บันทึก" เพื่อบันทึกจริง)').then(function(pp){ if (!pp) return;
        var u = r.upd[id] = r.upd[id] || {};
        if (pp.c === o.empCode) { delete u.empCode; delete u.name; delete u.hrPos; delete u.pt; delete u.x; delete u.ds; if (!Object.keys(u).length) delete r.upd[id]; }
        else { u.empCode = pp.c; u.name = pp.n; u.hrPos = pp.h; u.pt = !!pp.pt; u.x = pp.x || 0; u.ds = pp.ds || ''; }
        enRedraw(); }); }, 250); } });
      if (x.scanStatus && x.scanStatus !== S.boot.scan.OK && !(r.upd[id] && r.upd[id].empCode)) btns.push({ text: '<i class="bi bi-upload"></i> แนบใบลืมสแกน', cls: 'btn-ghost', onClick: function(){ attachForm(id, function(){ loadEntry(); }); } });
      btns.push({ text: '<i class="bi bi-check2-square"></i> ใช้ค่านี้', cls: 'btn-soft', onClick: function(){ ddSave(x, o); } });
      if (x.workStatus === 'WORKED') btns.push({ text: 'ยกเลิกการยืนยัน', cls: 'btn-ghost', onClick: function(){ ddSave(x, o, true); if (r.conf[id]) delete r.conf[id]; else r.unc[id] = 1; enRedraw(); } });
      else if (x.date <= S.boot.today) btns.push({ text: '<i class="bi bi-check2"></i> ตรงตามใบ', cls: 'btn-ok', onClick: function(){ ddSave(x, o, true); enConfirm([id]); } });
    }
  }
  modal('รายละเอียดเวร', body, btns, 'lg');
  if ($('ddEarly')) $$('#ddEarly button').forEach(function(b){ b.onclick = function(){ $$('#ddEarly button').forEach(function(y){ y.classList.toggle('on', y === b); }); }; });
  if ($('ddTime')) $('ddTime').onchange = function(){ if (this.value === '_') { var v = prompt('เวลา เช่น 16:00-19:30', x.timeIn + '-' + x.timeOut); if (v && /^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/.test(v.replace(/\s/g, ''))) { v = v.replace(/\s/g, ''); var op = document.createElement('option'); op.textContent = v; this.insertBefore(op, this.firstChild); this.value = v; } else { if (v) notify('รูปแบบเวลาไม่ถูกต้อง เช่น 16:00-19:30', 'info'); this.value = x.timeIn + '-' + x.timeOut; } } };
}
/** เก็บค่าที่แก้ในหน้าต่างรายละเอียดเป็นร่าง (เทียบกับค่าเดิมในฐานข้อมูล) */
function ddSave(x, o, quiet){
  var r = EN.dr, u = Object.assign({}, r.upd[x.id] || {}), ch = false;
  if ($('ddTime')) { var t = $('ddTime').value; if (t !== o.timeIn + '-' + o.timeOut) u.times = t; else delete u.times; ch = true; }
  if ($('ddPay')) { var pm = $('ddPay').value; if (pm !== (o.payMode || '')) u.payMode = pm; else delete u.payMode; ch = true; }
  if ($('ddEarly')) { var on = document.querySelector('#ddEarly button.on'); var v = on ? on.dataset.v : ''; var rs = $('ddEarlyR').value.trim();
    if (v === 'PAY' && !rs) { notify('กรุณาใส่เหตุผลที่จ่ายเต็ม', 'info'); return false; }
    if (v !== (o.earlyDecision || '') || rs !== (o.earlyReason || '')) { u.earlyDecision = v; u.earlyReason = rs; } else { delete u.earlyDecision; delete u.earlyReason; } ch = true; }
  if (!ch) return;
  if (Object.keys(u).length) r.upd[x.id] = u; else delete r.upd[x.id];
  if (!quiet) { notify(r.upd[x.id] ? 'เก็บการแก้ไขแล้ว · กด "บันทึก" เพื่อบันทึกจริง' : 'ไม่มีการเปลี่ยนแปลง', 'info'); enRedraw(); }
}
/** บันทึกร่างทั้งหมดครั้งเดียว */
function enSave(btn){
  var r = EN.dr, ops = [];
  Object.keys(r.upd).forEach(function(id){ var u = r.upd[id], o = { op: 'update', id: id }; ['empCode', 'times', 'payMode', 'earlyDecision', 'earlyReason'].forEach(function(k){ if (k in u) o[k] = u[k]; }); ops.push(o); });
  Object.keys(r.abs).forEach(function(id){ ops.push({ op: 'absent', id: id, reason: r.abs[id] }); });
  Object.keys(r.res).forEach(function(id){ ops.push({ op: 'restore', id: id }); });
  Object.keys(r.unc).forEach(function(id){ ops.push({ op: 'unconfirm', id: id }); });
  r.add.forEach(function(a){ ops.push({ op: 'add', key: a.key, positionId: a.positionId, date: a.date, slot: a.slot, empCode: a.empCode, lineNo: a.lineNo || '', worked: true }); });
  Object.keys(r.conf).forEach(function(id){ ops.push({ op: 'confirm', id: id }); });
  if (!ops.length) return;
  api('saveEntryBatch', { ops: ops }, { btn: btn, block: 'กำลังบันทึก ' + ops.length + ' รายการ…' }).then(function(res){
    var keep = enDrNew(), names = [];
    res.failed.forEach(function(f){
      if (f.op === 'confirm') keep.conf = r.conf;
      else if (f.op === 'add') keep.add = keep.add.concat(r.add.filter(function(a){ return a.key === f.key; }));
      else if (f.op === 'update') keep.upd[f.id] = r.upd[f.id];
      else if (f.op === 'absent') keep.abs[f.id] = r.abs[f.id];
      else if (f.op === 'restore') keep.res[f.id] = 1;
      else if (f.op === 'unconfirm') keep.unc[f.id] = 1;
      var it = f.op === 'add' ? (r.add.filter(function(a){ return a.key === f.key; })[0] || {}).item : (enFind(f.id) || {}).x;
      names.push((it ? it.name + ' ' + thDate(it.date) + ' ' + slotL(it.slot).name : 'ยืนยันการปฏิบัติงาน') + ': ' + f.error);
    });
    EN.dr = keep; enBar();
    var sk = res.results.filter(function(x){ return x.op === 'confirm' && x.skipped; })[0];
    if (names.length) alertBox('บันทึกแล้วบางส่วน', 'สำเร็จ ' + res.ok + ' รายการ · ไม่สำเร็จ ' + names.length + ' รายการ (ยังเก็บเป็นร่างไว้ให้แก้)\n\n' + names.join('\n'), 'warning');
    else notify('บันทึกแล้ว ' + res.ok + ' รายการ' + (sk ? ' (ข้ามวันที่ยังไม่ถึง ' + sk.skipped + ')' : ''));
    loadEntry();
  }).catch(function(){});
}
function drawEntryList(all){
  var f = EN.filter, today = S.boot.today, eds = {}; EN.list.forEach(function(d){ eds[d.branchId] = d.editable; });
  var multi = EN.list.length > 1;
  var test = function(x, k){ return k === 'todo' ? x.workStatus === '' && x.date <= today : k === 'red' ? x.red : k === 'abs' ? x.workStatus === 'ABSENT' : k === 'ok' ? x.workStatus === 'WORKED' : k === 'dr' ? x._dr : true; };
  var items = all.filter(function(x){ return test(x, f); }).sort(function(a, b){ return (a.branchId < b.branchId ? -1 : a.branchId > b.branchId ? 1 : 0) || (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.slot < b.slot ? -1 : a.slot > b.slot ? 1 : a.lineNo - b.lineNo)); });
  var cnt = function(k){ return all.filter(function(x){ return test(x, k); }).length; };
  var anyEd = EN.list.some(function(d){ return d.editable; });
  var tabs = [['all', 'ทั้งหมด'], ['todo', 'รอยืนยัน'], ['red', 'ต้องแก้ไข'], ['ok', 'ยืนยันแล้ว'], ['abs', 'ไม่มา']]; if (enDrN()) tabs.push(['dr', 'ยังไม่บันทึก']);
  var h = '<div class="d-flex gap-2 flex-wrap align-items-center mb-2"><div class="chips-tabs" id="enF">' + tabs.map(function(t){ return '<button class="ctab' + (f === t[0] ? ' on' : '') + '" data-f="' + t[0] + '">' + t[1] + '<span class="n">' + cnt(t[0]) + '</span></button>'; }).join('') + '</div>' +
    (anyEd ? '<button class="btn btn-ok btn-sm ms-auto" id="enOkSel" disabled><i class="bi bi-check2-all"></i> ตรงตามใบ (<span id="enSelN">0</span>)</button>' : '') + '</div>';
  h += '<div class="tbl"><table class="table table-hover"><thead><tr>' + (anyEd ? '<th style="width:34px"><input class="form-check-input" type="checkbox" id="enAll"></th>' : '') + '<th>วันที่</th>' + (multi ? '<th>ศูนย์</th>' : '') + '<th>ตำแหน่ง · ใบ</th><th>ช่วง</th><th>ผู้ปฏิบัติงาน</th><th>สแกน</th><th class="num">ชม.</th><th class="num">บาท</th><th>สถานะ</th></tr></thead><tbody>';
  items.slice(0, 1500).forEach(function(x){
    var can = eds[x.branchId] && x.workStatus === '' && x.date <= today;
    h += '<tr class="' + (x.red ? 'row-err' : '') + (x._dr ? ' row-dr' : '') + '" data-cell="' + x.id + '">' + (anyEd ? '<td>' + (can ? '<input class="form-check-input en-c" type="checkbox" data-id="' + x.id + '">' : '') + '</td>' : '') +
      '<td class="text-nowrap">' + esc(thDate(x.date)) + ' <small class="small-muted">' + TH_D[dowOf(x.date)] + '</small></td>' + (multi ? '<td>' + brDot(x.branchId) + '</td>' : '') + '<td>' + esc(posShort(x.posName)) + ' <span class="small-muted">ใบ ' + x.lineNo + '</span></td><td>' + slotTag(x.slot) + ' <small>' + esc(x.timeIn + '–' + x.timeOut) + '</small></td>' +
      '<td><div class="who"><b>' + esc(x.name) + '</b>' + (x.stopNote ? stopPill('', true) : '') + '<small>' + esc(x.empCode) + (x.partTime ? ' · จ่ายรายชั่วโมง' : '') + '</small></div></td><td>' + (x.date <= today ? scanPill(x.scanStatus) : '') + '</td>' +
      '<td class="num">' + (x.payType === 'HOURLY' ? hrs(x.workStatus === 'WORKED' && !x._dr ? x.hours : x.planned) : x.payType === 'FULLTIME' ? 'FT' : '-') + '</td><td class="num">' + (x.amount ? money(x.amount) : '') + '</td>' +
      '<td>' + (x.workStatus === 'WORKED' ? '<span class="pill p-ok">ยืนยันแล้ว</span>' : x.workStatus === 'ABSENT' ? '<span class="pill p-mute">ไม่มา</span>' : x.date <= today ? '<span class="pill p-slate">รอยืนยัน</span>' : '<span class="pill p-info">ตามตาราง</span>') + (x._dr ? ' <span class="dr-tag">' + (x._new ? 'เพิ่มใหม่' : 'แก้ไข') + '</span>' : '') + ' ' + flagChips(x.flags.filter(function(g){ return g !== 'NOT_CONFIRMED'; }), 2, x.stopNote) + '</td></tr>';
  });
  h += '</tbody></table></div>' + (items.length > 1500 ? '<div class="small-muted mt-1">แสดง 1,500 รายการแรก</div>' : '');
  $('enBody').innerHTML = items.length ? h : h + empty('check2-circle', 'ไม่มีรายการในกลุ่มนี้');
  $$('#enF .ctab').forEach(function(b){ b.onclick = function(){ EN.filter = b.dataset.f; drawEntry(); }; });
  var upd = function(){ var n = $$('.en-c:checked').length; if ($('enSelN')) { $('enSelN').textContent = n; $('enOkSel').disabled = !n; } };
  $$('.en-c').forEach(function(c){ c.onclick = function(e){ e.stopPropagation(); upd(); }; });
  if ($('enAll')) $('enAll').onchange = function(){ var v = this.checked; $$('.en-c').forEach(function(c){ c.checked = v; }); upd(); };
  if ($('enOkSel')) $('enOkSel').onclick = function(){ enConfirm($$('.en-c:checked').map(function(c){ return c.dataset.id; })); };
  $$('#enBody tr[data-cell]').forEach(function(tr){ tr.onclick = function(e){ if (e.target.closest('input')) return; openDuty(tr.dataset.cell); }; });
}

/* ================= รายงานติดตามปัญหา ================= */
PAGES.followup = function(){
  var brs = myBrs();
  pickDefault(brs, curBr());
  mount(pageHead('งานศูนย์', 'รายงานติดตามปัญหา', 'รายการที่ระบบตรวจพบ · สีแดง = ต้องแก้ก่อนปิดรอบ · สีส้ม = ข้อสังเกต',
    '<button class="btn btn-ghost" onclick="fuPrint(this)"><i class="bi bi-printer"></i> พิมพ์รายงาน</button>') +
    '<div class="filters">' + ymSelect('fuYm', S.fuYm || (S.boot.today.slice(8) <= '10' ? addYm(S.boot.ym, -1) : S.boot.ym), 6, 0) + pickButton('fuPick', brs, 'ศูนย์ / ตำแหน่ง') + '</div>' +
    '<div id="fuBody">' + skeleton(8) + '</div>');
  $('fuYm').onchange = function(){ S.fuYm = this.value; loadFu(); };
  pickBind('fuPick', brs, loadFu);
  S.fuTypes = S.fuTypes || [];
  loadFu();
};
var FU = null;
function loadFu(){
  var ym = $('fuYm').value, brs = pickBrs(myBrs()), k = ym + '|' + brs.join(',');
  S.fuKey = k;
  apiView('getFollowup', { ym: ym, branchIds: brs }, function(r){ if (!$('fuYm') || S.fuKey !== k) return; FU = r; drawFu(); }).catch(function(){});
}
/** แถวตามตำแหน่งที่เลือก + จำนวนต่อประเภท (คำนวณใหม่ในเครื่อง) */
function fuRows(){
  var sel = pickSel(myBrs()), all = FU.rows.filter(function(x){ return sel.indexOf(x.positionId) >= 0; }), counts = {};
  all.forEach(function(x){ x.hit.forEach(function(f){ counts[f] = (counts[f] || 0) + 1; }); });
  var types = Object.keys(counts).sort(function(a, b){ return (flagLevel(a) === 'R' ? 0 : 1) - (flagLevel(b) === 'R' ? 0 : 1) || counts[b] - counts[a]; });
  var ts = S.fuTypes.filter(function(t){ return types.indexOf(t) >= 0; });
  var rows = all.filter(function(x){ return !ts.length || x.hit.some(function(f){ return ts.indexOf(f) >= 0; }); });
  return { rows: rows, counts: counts, types: types, sel: ts };
}
function drawFu(){
  var r = FU; if (!r || !$('fuBody')) return;
  var o = fuRows(), rows = o.rows;
  var h = '<div class="issue-chips mb-3">' + o.types.map(function(t){ return '<button class="ichip ' + (flagLevel(t) === 'R' ? 'r' : 'o') + (o.sel.indexOf(t) >= 0 ? ' on' : '') + '" data-t="' + t + '">' + esc(flagText(t)) + ' <b>' + o.counts[t] + '</b></button>'; }).join('') + '</div>';
  if (!rows.length) h += '<div class="card">' + empty('emoji-smile', 'ไม่พบปัญหาตามเงื่อนไขที่เลือก') + '</div>';
  else {
    var byB = {}; rows.forEach(function(x){ (byB[x.branchId] = byB[x.branchId] || []).push(x); });
    var brs = allBrIds().filter(function(b){ return byB[b]; }), multi = brs.length > 1, shown = 0;
    brs.forEach(function(b){
      var list = byB[b].slice(0, Math.max(0, 1500 - shown)); shown += list.length;
      if (!list.length) return;
      h += (multi ? '<section class="br-sec"><h3 class="br-sec-h">' + brDot(b) + ' <span class="small-muted">' + byB[b].length + ' รายการ</span></h3>' : '') +
        '<div class="tbl"><table class="table table-hover"><thead><tr>' + (multi ? '' : '<th>ศูนย์</th>') + '<th>วันที่</th><th>ตำแหน่ง</th><th>ช่วง</th><th>ผู้ปฏิบัติงาน</th><th>สแกน</th><th>ปัญหา</th></tr></thead><tbody>' +
        list.map(function(x){ return '<tr>' + (multi ? '' : '<td>' + brDot(x.branchId) + '</td>') + '<td class="text-nowrap">' + esc(thDate(x.date)) + '</td><td>' + esc(posShort(x.posName)) + ' <small class="small-muted">ใบ ' + x.lineNo + '</small></td><td>' + slotTag(x.slot) + ' <small>' + esc(x.timeIn + '–' + x.timeOut) + '</small></td><td><div class="who"><b>' + esc(x.name) + '</b><small>' + esc(x.empCode) + '</small></div></td><td>' + scanPill(x.scanStatus) + (x.scanOut ? ' <small>' + esc(x.scanOut) + '</small>' : '') + '</td><td>' + flagChips(x.hit, 4, x.stopNote) + '</td></tr>'; }).join('') + '</tbody></table></div>' + (multi ? '</section>' : '');
    });
    if (rows.length > 1500) h += '<div class="small-muted mt-1">แสดง 1,500 รายการแรก จาก ' + rows.length + ' (พิมพ์รายงานได้ครบ)</div>';
  }
  $('fuBody').innerHTML = h;
  $$('#fuBody .ichip').forEach(function(b){ b.onclick = function(){ var t = b.dataset.t, i = S.fuTypes.indexOf(t); if (i >= 0) S.fuTypes.splice(i, 1); else S.fuTypes.push(t); drawFu(); }; });
}
function fuPrint(){
  var r = FU; if (!r) return;
  var o = fuRows(), order = {}; allBrIds().forEach(function(b, i){ order[b] = i; });
  var rows = o.rows.slice().sort(function(a, b){ return (order[a.branchId] - order[b.branchId]) || (a.date < b.date ? -1 : a.date > b.date ? 1 : 0); });
  printReport({ title: 'รายงานติดตามปัญหาการลงเวลา ศูนย์บริการสุขภาพสาขา', subtitle: 'รอบเดือน ' + thYm(r.ym), filters: pickSummary(myBrs()) + (o.sel.length ? ' · ' + o.sel.map(flagText).join(', ') : ' · ทุกประเภท'), count: rows.length, kind: 'followup',
    bodyHtml: prTable([{ t: 'วันที่', f: function(x){ return thDateNum(x.date); } }, { t: 'ตำแหน่ง', f: function(x){ return posShort(x.posName) + ' ใบ ' + x.lineNo; } },
      { t: 'เวลา', f: function(x){ return x.timeIn + '–' + x.timeOut; } }, { t: 'รหัส', f: function(x){ return x.empCode; } }, { t: 'ชื่อ-นามสกุล', f: function(x){ return x.name; } }, { t: 'สแกน', f: function(x){ return (x.scanStatus || '') + (x.scanOut ? ' ' + x.scanOut : ''); } },
      { t: 'ปัญหา', f: function(x){ return x.hit.map(flagText).join(', '); } }], rows, function(x){ return 'ศูนย์' + brName(x.branchId); }) }).catch(function(){});
}
