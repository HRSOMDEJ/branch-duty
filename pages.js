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
  var steps = [['OPEN', 'บันทึก'], ['SUBMITTED', 'ศูนย์ส่ง'], ['VERIFIED', 'ปิดรอบ'], ['PROPOSED', 'เสนอหัวหน้าฝ่าย'], ['SENT_HR', 'ส่ง HR'], ['HR_CHECKED', 'HR ตรวจ']];
  var idx = { OPEN: 0, RETURNED: 0, SUBMITTED: 1, VERIFIED: 2, PROPOSED: 3, SENT_HR: 4, HR_CHECKED: 5 }[st] || 0;
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
  api('getMyMonth', { ym: ym }, { fresh: true, onCache: drawMy }).then(drawMy).catch(function(){});
}
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
        '<div class="dl-s">' + st + ' ' + (d.scanStatus && d.date < today ? scanPill(d.scanStatus) : '') + (d.scanIn ? ' <span class="small-muted">สแกน ' + esc(d.scanIn) + (d.scanOut && d.scanOut !== d.scanIn ? '–' + esc(d.scanOut) : '') + '</span>' : '') + ' ' + flagChips(d.flags.filter(function(f){ return f !== 'NOT_CONFIRMED' && f !== 'PENDING_BOOK'; }), 3) + '</div></div>' +
        '<div class="dl-pay">' + (d.payType === 'HOURLY' ? '<b>' + hrs(d.workStatus === 'WORKED' ? d.hours : d.planned) + '</b> ชม.<small>' + money(d.workStatus === 'WORKED' ? d.amount : d.planned * d.rate) + ' บาท</small>' : d.payType === 'FULLTIME' ? '<b>Full Time</b><small>' + (d.meal ? 'ค่าอาหาร ' + money(brOf(d.branchId).mealRate) : 'ในเวลาราชการ') + '</small>' : '<b>—</b><small>ไม่จ่ายรายชั่วโมง</small>') + '</div>' +
        '<div class="dl-act">' + d.attachIds.map(function(a, i){ return '<button class="btn btn-sm btn-ghost" onclick="viewAttach(\'' + a + '\',' + (locked ? 'null' : 'loadMy') + ')"><i class="bi bi-paperclip"></i> ใบที่ ' + (i + 1) + '</button>'; }).join('') +
        (needDoc && !locked ? '<button class="btn btn-sm btn-soft" onclick="attachForm(\'' + d.id + '\',loadMy)"><i class="bi bi-upload"></i> แนบใบลืมสแกน</button>' : '') +
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
    if (ok) api('cancelBooking', { id: id }).then(function(){ notify('ยกเลิกเวรแล้ว'); loadMy(); }).catch(function(){});
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
function loadBooking(){
  api('getBookingBoard', { ym: $('bkYm').value, branchId: S.bkBr }, { fresh: true, onCache: drawBooking }).then(drawBooking).catch(function(){});
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
    if (mine && mine.pending) btns.push({ text: '<i class="bi bi-x-lg"></i> ยกเลิกเวรของฉัน', cls: 'btn-danger-soft', onClick: function(){ api('cancelBooking', { id: mine.id }).then(function(){ notify('ยกเลิกเวรแล้ว'); loadBooking(); }).catch(function(){}); } });
    if (b.manage && c.n < c.q) btns.push({ text: '<i class="bi bi-person-plus"></i> ลงเวรแทน', cls: 'btn-soft', onClick: function(){ var t = $('slTime') ? $('slTime').value : times[0];
      setTimeout(function(){ pickPerson('ลงเวรแทน · ' + dateTh(date), P.jobId).then(function(pp){ if (pp) api('book', { positionId: P.id, date: date, slot: s, times: t, empCode: pp.c }, { block: 'กำลังลงเวร…' }).then(function(){ notify('ลงเวร ' + pp.n + ' แล้ว'); loadBooking(); }).catch(function(){}); }); }, 300); } });
    if (!mine && c.n < c.q && (S.boot.myJobs || []).indexOf(P.jobId) >= 0) btns.push({ text: '<i class="bi bi-calendar2-check"></i> ลงตารางเวรนี้', cls: 'btn-brand', onClick: function(){ var t = $('slTime') ? $('slTime').value : times[0];
      api('book', { positionId: P.id, date: date, slot: s, times: t }, { block: 'กำลังลงตารางเวร…' }).then(function(){ notify('ลงตารางเวรเรียบร้อย รอศูนย์ยืนยัน'); loadBooking(); }).catch(function(){}); } });
  }
  modal('ช่วงเวร', body, btns);
}
function slotRemove(id, name){
  MDL.hide();
  promptBox('นำ ' + name + ' ออกจากตาราง', 'เหตุผล (บันทึกในประวัติ)', 'เช่น แลกเวร / ลงผิด').then(function(r){ if (r) api('cancelBooking', { id: id, reason: r }).then(function(){ notify('นำออกจากตารางแล้ว'); loadBooking(); }).catch(function(){}); });
}

/* ================= ตารางเวรรวม (ดูอย่างเดียว) ================= */
PAGES.schedule = function(){
  var brs = S.boot.branches.map(function(b){ return b.id; });
  var br = S.scBr || curBr();
  mount(pageHead('งานของฉัน', 'ตารางเวรรวม', 'ตารางเวรของศูนย์รายเดือน ' + esc(slotL('D').s) + ' = ' + esc(slotL('D').name) + ' · ' + esc(slotL('E').s) + ' = ' + esc(slotL('E').name)) +
    '<div class="filters">' + ymSelect('scYm', S.ym || S.boot.ym, 36, 2) + '<div class="flex-grow-1"><label class="form-label">ศูนย์</label>' + brTabs('scBr', brs, br) + '</div></div>' + dayLegend() + recLegend() + '<div id="scBody" class="mt-2">' + skeleton(8) + '</div>');
  S.scBr = br;
  $('scYm').onchange = function(){ S.ym = this.value; loadSchedule(); };
  bindBrTabs('scBr', function(b){ S.scBr = b; loadSchedule(); });
  loadSchedule();
};
function loadSchedule(){
  api('getScheduleGrid', { ym: $('scYm').value, branchId: S.scBr }, { fresh: true, onCache: drawSchedule }).then(drawSchedule).catch(function(){});
}
function drawSchedule(g){
  if (!$('scBody')) return;
  g.rows.forEach(function(r){ r.editable = false; });
  SheetGrid({ host: 'scBody', dates: g.dates, rows: g.rows, quota: g.quota, positions: g.positions });
  if (g.archived) $('scBody').insertAdjacentHTML('afterbegin', '<div class="wbanner"><i class="bi bi-archive"></i> ข้อมูลย้อนหลังจากคลังข้อมูล (ดูอย่างเดียว)</div>');
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
  Promise.all([api('getBranchBoard', { ym: ym, branchId: br }), api('getBranchBoard', { ym: addYm(ym, -1), branchId: br }, { quiet: true }).catch(function(){ return null; })]).then(function(rs){ drawBranchBoard(rs[0], rs[1]); }).catch(function(){});
}
function drawBranchBoard(d, prev){
  if (!$('dbBody')) return;
  var s = d.summary, b = brOf(d.branchId);
  var h = '<div class="br-hero" style="--bc:' + esc(b.color) + '"><div><div class="eyebrow">' + esc(b.fullName || b.name) + '</div><h2>' + esc(thYm(d.ym)) + '</h2>' + stepper(d.status) + '</div>' +
    '<div class="brh-k"><div><b>' + fmt(s.total) + '</b><span>เวรทั้งเดือน</span></div><div><b>' + hrs(s.hours) + '</b><span>ชั่วโมงที่ยืนยัน</span></div><div><b>' + money(s.amount) + '</b><span>บาท</span></div></div></div>';
  if (prev && ['OPEN', 'RETURNED'].indexOf(prev.status) >= 0) {
    var ps = prev.summary;
    h += '<div class="cta' + (prev.status === 'RETURNED' ? ' cta-bad' : '') + '"><div class="cta-ic"><i class="bi bi-send"></i></div><div class="flex-grow-1"><b>รอบเดือน ' + esc(thYm(prev.ym)) + ' ' + (prev.status === 'RETURNED' ? 'ถูกตีกลับ: ' + esc(prev.period.reason) : 'รอส่งให้ฝ่าย') + '</b><div class="small-muted">' + fmt(ps.total) + ' เวร · ยืนยันแล้ว ' + fmt(ps.worked) + ' · รอยืนยัน ' + fmt(ps.toConfirm) + ' · ต้องแก้ไข ' + fmt(ps.red) + ' · ส่งภายในวันที่ ' + esc(thDate(prev.window.deadline)) + '</div></div>' +
      '<button class="btn btn-ghost" onclick="S.enYm=\'' + prev.ym + '\';go(\'entry\')"><i class="bi bi-ui-checks-grid"></i> ตรวจรายการ</button><button class="btn btn-brand" onclick="submitBr(\'' + prev.ym + '\',\'' + d.branchId + '\',this)"><i class="bi bi-send-check"></i> ส่งให้ฝ่าย</button></div>';
  } else if (prev) h += '<div class="wbanner"><i class="bi bi-check2-circle"></i> รอบเดือน ' + esc(thYm(prev.ym)) + ' : ' + statusPill(prev.status) + '</div>';
  h += '<div class="kpis">' + kpi('hourglass-split', 'ic-warn', 'รอยืนยันการปฏิบัติงาน', s.toConfirm) + kpi('exclamation-octagon', s.red ? 'ic-bad' : 'ic-mute', 'รายการต้องแก้ไข', s.red) + kpi('person-plus', 'ic-info', 'เวรเดือนหน้ารอศูนย์ยืนยัน', d.pendingNext) + kpi('cup-hot', 'ic-ok', 'ค่าอาหาร (วัน)', s.meal) + '</div>';
  h += '<div class="grid-2"><div class="card"><div class="card-h"><h3><i class="bi bi-sun"></i> วันนี้ · ' + esc(dateTh(S.boot.today)) + '</h3><span class="sub">' + d.today.length + ' เวร</span></div><div class="card-b">' +
    (d.today.length ? d.today.map(function(x){ return '<div class="td-row"><span class="td-t">' + slotTag(x.slot) + ' ' + esc(x.timeIn + '–' + x.timeOut) + '</span><b>' + esc(x.name) + '</b><span class="small-muted">' + esc(posShort(x.posName)) + '</span></div>'; }).join('') : empty('moon-stars', 'วันนี้ไม่มีเวร')) + '</div></div>' +
    '<div class="card"><div class="card-h"><h3><i class="bi bi-person-exclamation"></i> ช่องเวรที่ยังว่าง (14 วัน)</h3><button class="btn btn-sm btn-soft ms-auto" onclick="go(\'plan\')">จัดตารางเวร</button></div><div class="card-b gap-list">' +
    (d.gaps.length ? d.gaps.map(function(g){ return '<div class="gp"><b>' + esc(thDate(g.date)) + '</b><span>' + esc(posShort(g.name)) + ' ' + slotTag(g.slot) + '</span><span class="pill p-warn nodot">ขาด ' + g.need + '</span></div>'; }).join('') : empty('check2-all', 'กรอบเวรครบทุกช่องแล้ว')) + '</div></div></div>';
  if (d.redItems.length) h += '<div class="card mt-3"><div class="card-h"><h3><i class="bi bi-exclamation-octagon text-danger"></i> รายการต้องแก้ไข</h3><button class="btn btn-sm btn-ghost ms-auto" onclick="go(\'followup\')">ดูทั้งหมด</button></div><div class="card-b">' +
    d.redItems.slice(0, 12).map(function(x){ return '<div class="td-row"><span class="td-t">' + esc(thDate(x.date)) + '</span><b>' + esc(x.name) + '</b>' + flagChips(x.flags.filter(function(f){ return flagLevel(f) === 'R'; }), 3) + '</div>'; }).join('') + '</div></div>';
  $('dbBody').innerHTML = h;
  animateKpis();
}
function submitBr(ym, br, btn){
  confirmBox('ส่งให้ฝ่าย', 'ยืนยันส่งข้อมูลรอบเดือน ' + thYm(ym) + ' ของศูนย์' + brName(br) + ' ให้เจ้าหน้าที่กลางตรวจ\nหลังส่งแล้วศูนย์จะแก้ไขไม่ได้ (เว้นแต่ถูกตีกลับ)\nอย่าลืมส่งใบบันทึกเวลาฉบับกระดาษด้วย', 'ส่งให้ฝ่าย').then(function(ok){
    if (ok) api('submitBranch', { ym: ym, branchId: br }, { btn: btn }).then(function(){ Swal.fire({ icon: 'success', title: 'ส่งให้ฝ่ายเรียบร้อย', text: 'เจ้าหน้าที่กลางจะตรวจและแจ้งผลในระบบ', confirmButtonText: 'รับทราบ' }); go(S.page); }).catch(function(){});
  });
}

/* ================= จัดตารางเวร (ผู้ดูแลศูนย์) ================= */
var PL = null;
PAGES.plan = function(){
  var brs = myBrs(), br = curBr();
  var ym = S.plYm || addYm(S.boot.ym, S.boot.today.slice(8) >= '10' ? 1 : 0);
  mount(pageHead('งานศูนย์', 'จัดตารางเวร', 'พิมพ์ตัวย่อในช่องแบบ Google Sheet · ยืนยันเวรที่บุคลากรลงเอง · พิมพ์ใบบันทึกเวลาที่มีชื่อตามตาราง',
    '<button class="btn btn-ghost" onclick="plPrint(this)"><i class="bi bi-printer"></i> พิมพ์ใบบันทึกเวลา</button>') +
    '<div class="filters">' + ymSelect('plYm', ym, 3, 2) + (brs.length > 1 ? '<div class="flex-grow-1"><label class="form-label">ศูนย์</label>' + brTabs('plBr', brs, br) + '</div>' : '') + '</div>' +
    '<div id="plHead"></div>' + dayLegend() + recLegend() + '<div id="plBody" class="mt-2">' + skeleton(8) + '</div>');
  $('plYm').onchange = function(){ var el = this, v = el.value, go2 = function(){ S.plYm = v; loadPlan(); };
    if (PL && PL.hasDirty()) confirmBox('ยังไม่ได้บันทึกตาราง', 'มีช่องที่แก้ไขแต่ยังไม่บันทึก เปลี่ยนเดือนแล้วการแก้ไขจะหายไป', 'เปลี่ยนเดือน', true).then(function(ok){ if (ok) go2(); else setSel('plYm', S.plYm || $('plYm').dataset.o); });
    else go2(); };
  $('plYm').dataset.o = ym;
  if (brs.length > 1) bindBrTabs('plBr', function(b){ setBr(b); loadPlan(); });
  loadPlan();
};
function loadPlan(){ api('getScheduleGrid', { ym: $('plYm').value, branchId: curBr() }).then(drawPlan).catch(function(){}); }
function drawPlan(g){
  if (!$('plBody')) return;
  $('plHead').innerHTML = (g.pendingCount ? '<div class="cta"><div class="cta-ic"><i class="bi bi-person-check"></i></div><div class="flex-grow-1"><b>มีเวรที่บุคลากรลงเอง รอยืนยัน ' + g.pendingCount + ' รายการ</b><div class="small-muted">ช่องที่มีเส้นประสีส้ม · ตรวจแล้วกดยืนยันทั้งตารางครั้งเดียว</div></div>' + (g.editable ? '<button class="btn btn-brand" onclick="plConfirm(this)"><i class="bi bi-check2-all"></i> ยืนยันเวรทั้งหมด</button>' : '') + '</div>' : '') +
    (!g.editable ? '<div class="wbanner">' + statusPill(g.status) + ' รอบเดือนนี้แก้ไขตารางไม่ได้ในสถานะปัจจุบัน</div>' : '');
  g.rows.forEach(function(r){ r.editable = g.editable; });
  PL = SheetGrid({ host: 'plBody', dates: g.dates, rows: g.rows, quota: g.quota, positions: g.positions, canAdd: g.editable,
    onAddRow: function(pid){ var P = g.positions.filter(function(p){ return p.id === pid; })[0];
      pickPerson('เพิ่มบุคลากรใน ' + posShort(P.name), P.jobId, 'เพิ่มแถวแล้วพิมพ์ตัวย่อในช่องวันที่ต้องการ').then(function(pp){ if (!pp) return;
        if (g.rows.some(function(r){ return r.pid === pid && r.empCode === pp.c; })) return notify('มีรายชื่อนี้ในตำแหน่งนี้แล้ว', 'info');
        g.rows.push({ key: pid + '|' + pp.c, pid: pid, empCode: pp.c, name: pp.n, hrPos: pp.h, partTime: !!pp.pt, cells: {}, st: {}, pend: {}, editable: true });
        PL.render(); }); },
    onSave: function(list, btn){ api('saveScheduleGrid', { ym: g.ym, branchId: g.branchId, changes: list }, { btn: btn, block: 'กำลังบันทึกตาราง…' }).then(function(r){
      var bad = r.results.filter(function(x){ return !x.ok; });
      if (bad.length) resultBox('บันทึกตารางแล้วบางส่วน', r.results); else notify('บันทึกตารางแล้ว (เพิ่ม ' + r.added + ' · ลบ ' + r.removed + ')');
      drawPlan(r.grid); }).catch(function(){}); } });
}
function plConfirm(btn){ api('confirmBookings', { ym: $('plYm').value, branchId: curBr() }, { btn: btn }).then(function(r){ notify('ยืนยันเวรแล้ว ' + r.confirmed + ' รายการ'); loadPlan(); }).catch(function(){}); }
function plPrint(btn){
  modal('พิมพ์ใบบันทึกเวลาการปฏิบัติงาน', '<div class="small-muted mb-2">แบบฟอร์ม FM-HRM-032/01 · 1 หน้า/เดือน/ตำแหน่ง/ใบที่ · ช่องที่ไม่มีกรอบเวรเป็นสีเทาทึบ</div>' +
    posSelect('ppPos', curBr(), 'all', true) + '<div class="form-check mt-3"><input class="form-check-input" type="checkbox" id="ppBlank"><label class="form-check-label" for="ppBlank">ใบเปล่า (ไม่ใส่รายชื่อตามตาราง)</label></div>',
    [{ text: 'ยกเลิก', cls: 'btn-ghost' }, { text: '<i class="bi bi-file-earmark-pdf"></i> สร้าง PDF', cls: 'btn-brand', onClick: function(){
      api('exportSignSheets', { ym: $('plYm').value, branchId: curBr(), positionId: $('ppPos').value, blank: $('ppBlank').checked }, { block: 'กำลังสร้างใบบันทึกเวลา…', timeout: 300000 }).then(function(r){ download(r.files); }).catch(function(){}); } }]);
}

/* ================= บันทึกการปฏิบัติงาน ================= */
var EN = { data: null, sheet: 0, view: 'sheet', filter: 'all', sel: {} };
PAGES.entry = function(){
  var brs = myBrs(), br = curBr();
  var ym = S.enYm || (S.boot.today.slice(8) <= '10' ? addYm(S.boot.ym, -1) : S.boot.ym);
  S.enYm = null;
  EN.view = store('bd_env') || 'sheet';
  mount(pageHead('งานศูนย์', 'บันทึกการปฏิบัติงาน', 'ระบบเติมรายการจากตารางเวรให้แล้ว เทียบกับใบลงชื่อกระดาษ แล้วกด <b>"ตรงตามใบ"</b> แก้เฉพาะจุดที่ต่าง',
    '<button class="btn btn-ghost" onclick="enSync(this)"><i class="bi bi-fingerprint"></i> ดึงสแกนล่าสุด</button>') +
    '<div class="filters">' + ymSelect('enYm', ym, 6, 0) + (brs.length > 1 ? brSelect('enBr', brs, br) : '') + '<div id="enPosW"></div>' +
    '<div><label class="form-label">มุมมอง</label><div class="seg" id="enView"><button data-v="sheet"' + (EN.view === 'sheet' ? ' class="on"' : '') + '><i class="bi bi-file-earmark-text"></i> ดูเป็นใบ</button><button data-v="list"' + (EN.view === 'list' ? ' class="on"' : '') + '><i class="bi bi-list-ul"></i> ดูรวม</button></div></div></div>' +
    '<div id="enHead"></div><div id="enBody">' + skeleton(10) + '</div>');
  $('enYm').onchange = function(){ loadEntry(true); };
  if ($('enBr')) $('enBr').onchange = function(){ setBr(this.value); S.enPos = 'all'; loadEntry(true); };
  $$('#enView button').forEach(function(b){ b.onclick = function(){ $$('#enView button').forEach(function(x){ x.classList.toggle('on', x === b); }); EN.view = b.dataset.v; store('bd_env', EN.view); drawEntry(); }; });
  loadEntry(true);
};
function loadEntry(reset){
  var br = $('enBr') ? $('enBr').value : curBr();
  if (reset) { EN.sheet = 0; EN.sel = {}; }
  api('getEntrySheet', { ym: $('enYm').value, branchId: br, positionId: 'all' }).then(function(d){ EN.data = d; drawEntry(); }).catch(function(){});
}
function enSync(btn){
  var br = $('enBr') ? $('enBr').value : curBr();
  api('syncBranchScans', { ym: $('enYm').value, branchId: br }, { btn: btn, block: 'กำลังดึงข้อมูลสแกนจากระบบ HR…', timeout: 300000 }).then(function(r){ notify('ดึงสแกนแล้ว ' + r.codes + ' คน ' + r.days + ' วัน'); loadEntry(); }).catch(function(){});
}
function drawEntry(){
  var d = EN.data; if (!d || !$('enBody')) return;
  var s = d.summary;
  var pct = s.total ? Math.round(s.worked / s.total * 100) : 0;
  $('enHead').innerHTML = '<div class="en-sum"><div class="ens-l">' + brDot(d.branchId) + ' ' + statusPill(d.status) + (d.period.reason && d.status === 'RETURNED' ? ' <span class="small text-danger">เหตุผล: ' + esc(d.period.reason) + '</span>' : '') + '</div>' +
    '<div class="ens-k"><div><b>' + s.worked + '</b>/' + s.total + '<span>ยืนยันแล้ว</span></div><div class="' + (s.pending ? 'w' : '') + '"><b>' + s.pending + '</b><span>รอยืนยัน</span></div><div class="' + (s.red ? 'r' : '') + '"><b>' + s.red + '</b><span>ต้องแก้ไข</span></div><div><b>' + hrs(s.hours) + '</b><span>ชั่วโมง</span></div><div><b>' + money(s.amount) + '</b><span>บาท</span></div><div><b>' + s.meal + '</b><span>ค่าอาหาร (วัน)</span></div></div>' +
    '<div class="ens-bar"><i style="width:' + pct + '%"></i></div>' + (d.lastScanSync ? '<div class="small-muted mt-1"><i class="bi bi-fingerprint"></i> ข้อมูลสแกนล่าสุด ' + esc(d.lastScanSync) + '</div>' : '') + '</div>';
  var pos = d.sheets;
  $('enPosW').innerHTML = '';
  if (EN.view === 'list') return drawEntryList();
  // ใบ = ตำแหน่ง × ใบที่
  var pages = []; pos.forEach(function(p){ for (var k = 1; k <= p.lines; k++) pages.push({ p: p, k: k }); });
  if (!pages.length) { $('enBody').innerHTML = '<div class="card">' + empty('file-earmark-x', 'ไม่มีเวรในเดือนนี้') + '</div>'; return; }
  if (EN.sheet >= pages.length) EN.sheet = pages.length - 1;
  var cur = pages[EN.sheet], P = cur.p, k = cur.k;
  var mine = d.items.filter(function(x){ return x.positionId === P.positionId && x.lineNo === k; });
  var at = {}; mine.forEach(function(x){ at[x.date + '|' + x.slot] = x; });
  var sheetItems = mine.filter(function(x){ return x.workStatus !== 'ABSENT'; });
  var todo = sheetItems.filter(function(x){ return x.workStatus !== 'WORKED' && x.date <= d.today; });
  var h = '<div class="pv-bar"><button class="pv-nav" id="pvPrev" aria-label="ใบก่อนหน้า"' + (EN.sheet ? '' : ' disabled') + '><i class="bi bi-chevron-left"></i></button><div class="pv-where"><div class="pv-pos">' + esc(posShort(P.name)) + ' <span class="tag brand">ใบที่ ' + k + ' / ' + P.lines + '</span></div>' +
    '<div class="pv-sub">ใบ ' + (EN.sheet + 1) + ' จาก ' + pages.length + ' · รอยืนยัน ' + todo.length + ' · ต้องแก้ไข ' + sheetItems.filter(function(x){ return x.red; }).length + '</div><div class="pv-dots">' + pages.map(function(pg, i){ var t = d.items.some(function(x){ return x.positionId === pg.p.positionId && x.lineNo === pg.k && x.red; }); return '<i class="' + (i === EN.sheet ? 'on' : '') + (i && pg.k === 1 ? ' gap' : '') + (t ? ' bad' : '') + '" data-i="' + i + '" title="' + esc(posShort(pg.p.name)) + ' ใบที่ ' + pg.k + '"></i>'; }).join('') + '</div></div>' +
    '<div class="pv-tools">' + (d.editable && todo.length ? '<button class="btn btn-ok" id="enOkSheet"><i class="bi bi-check2-all"></i> ตรงตามใบ (' + todo.length + ')</button>' : '') + '</div><button class="pv-nav" id="pvNext" aria-label="ใบถัดไป"' + (EN.sheet < pages.length - 1 ? '' : ' disabled') + '><i class="bi bi-chevron-right"></i></button></div>';
  h += '<div class="paper-stage"><div class="paper" id="enPaper"><div class="paper-top"><span class="paper-form">FM-HRM-032/01</span><span class="paper-no">ใบที่ <b>' + k + '</b></span></div>' +
    '<div class="paper-t">แบบบันทึกเวลาการปฏิบัติงาน (' + esc(brOf(d.branchId).fullName || brName(d.branchId)) + ')</div><div class="paper-s">ประจำเดือน ' + esc(thYm(d.ym)) + ' · ตำแหน่ง ' + esc(posShort(P.name)) + '</div>' +
    '<div class="tbl paper-tbl"><table class="table sheet-g"><thead><tr><th rowspan="2" class="sw-d">วันที่</th><th class="sw-s">' + esc(slotL('D').name) + ' ' + esc(P.day.join(' / ') || '') + '</th><th class="sw-s">' + esc(slotL('E').name) + ' ' + esc(P.eve.join(' / ') || '—') + '</th></tr></thead><tbody>';
  d.dates.forEach(function(x, i){
    var q = P.quota[i] || { D: 0, E: 0 };
    h += '<tr class="' + dk(x.color) + '"><td class="sw-d"><b>' + x.d + '</b> <small>' + TH_D[x.dow] + '</small>' + (x.color !== 'WORK' && x.color !== 'WEEKEND' && x.note ? '<div class="sw-note">' + esc(x.note) + '</div>' : '') + '</td>' +
      ['D', 'E'].map(function(s){ return sheetCell(at[x.date + '|' + s], x, s, k <= q[s], d.editable, P); }).join('') + '</tr>';
  });
  h += '</tbody></table></div><div class="paper-sign"><div><i></i>ผู้ตรวจสอบการลงเวลาปฏิบัติงาน</div><div><i></i>ผู้จัดการศูนย์บริการสุขภาพสาขา</div></div></div></div>';
  $('enBody').innerHTML = h;
  $('pvPrev').onclick = function(){ EN.sheet--; drawEntry(); $('enPaper').classList.add('flip-prev'); };
  $('pvNext').onclick = function(){ EN.sheet++; drawEntry(); $('enPaper').classList.add('flip-next'); };
  $$('.pv-dots i').forEach(function(el){ el.onclick = function(){ EN.sheet = +el.dataset.i; drawEntry(); }; });
  if ($('enOkSheet')) $('enOkSheet').onclick = function(){ enConfirm(todo.map(function(x){ return x.id; }), this); };
  $$('#enBody [data-cell]').forEach(function(el){ el.onclick = function(e){ if (e.target.closest('.sc-cf')) return; openDuty(el.dataset.cell); }; });
  $$('#enBody .sc-cf').forEach(function(el){ el.onclick = function(e){ e.stopPropagation(); enConfirm([el.dataset.id], el); }; });
  $$('#enBody [data-add]').forEach(function(el){ el.onclick = function(){ var a = el.dataset.add.split('|'); enAdd(a[0], a[1], a[2], +a[3]); }; });
}
document.addEventListener('keydown', function(e){
  if (S.page !== 'entry' || EN.view !== 'sheet' || MDL && document.querySelector('.modal.show') || /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '')) return;
  if (e.key === 'ArrowRight' && $('pvNext') && !$('pvNext').disabled) $('pvNext').click();
  if (e.key === 'ArrowLeft' && $('pvPrev') && !$('pvPrev').disabled) $('pvPrev').click();
});
function sheetCell(x, day, s, inQuota, editable, P){
  if (!x || x.workStatus === 'ABSENT') {
    var ab = x && x.workStatus === 'ABSENT';
    if (day.kind === 'CLOSED') return '<td class="sc sc-off">ปิดศูนย์</td>';
    if (!inQuota && !ab) return '<td class="sc sc-dark"></td>';
    return '<td class="sc sc-empty">' + (ab ? '<span class="sc-ab" data-cell="' + x.id + '"><i class="bi bi-person-x"></i> ' + esc(x.name) + ' <small>ไม่มา</small></span>' : '') +
      (editable && day.date <= S.boot.today && (s === 'D' ? P.day.length : P.eve.length) ? '<button class="sc-add" data-add="' + P.positionId + '|' + day.date + '|' + s + '|' + '0' + '"><i class="bi bi-plus-lg"></i> เพิ่ม</button>' : '') + '</td>';
  }
  var past = x.date <= S.boot.today;
  var cls = x.red ? 'bad' : x.workStatus === 'WORKED' ? 'ok' : past ? 'todo' : 'plan';
  return '<td class="sc sc-' + cls + '" data-cell="' + x.id + '"><div class="sc-n"><b>' + esc(x.name) + '</b><small class="tnum">' + esc(x.empCode) + (x.partTime ? ' · ชม.' : '') + '</small></div>' +
    '<div class="sc-m">' + (isStd(x, P) ? '' : '<span class="tag">' + esc(x.timeIn + '–' + x.timeOut) + '</span>') + (x.payType === 'HOURLY' ? '<span class="sc-h">' + hrs(x.workStatus === 'WORKED' ? x.hours : x.planned) + ' ชม.</span>' : x.payType === 'FULLTIME' ? '<span class="sc-h ft">FT' + (x.meal ? ' ☕' : '') + '</span>' : '') +
    (x.scanStatus && past ? '<span class="sc-scan ' + scanCls(x.scanStatus) + '" title="' + esc(x.scanStatus) + '"><i class="bi bi-fingerprint"></i>' + esc(x.scanOut || x.scanIn || '') + '</span>' : '') + (x.attachIds.length ? '<i class="bi bi-paperclip" title="มีใบลืมสแกน"></i>' : '') + '</div>' +
    (x.flags.length ? '<div class="sc-f">' + flagChips(x.flags.filter(function(f){ return f !== 'NOT_CONFIRMED' && f !== 'LEGACY'; }), 2) + '</div>' : '') +
    (editable && past && x.workStatus !== 'WORKED' ? '<button class="sc-cf" data-id="' + x.id + '" title="ตรงตามใบ"><i class="bi bi-check-lg"></i></button>' : x.workStatus === 'WORKED' ? '<i class="bi bi-check-circle-fill sc-done" title="ยืนยันแล้ว"></i>' : '') + '</td>';
}
function isStd(x, P){ var k = x.timeIn + '-' + x.timeOut; return (x.slot === 'D' ? P.day : P.eve).indexOf(k) >= 0; }
function scanCls(s){ var sc = S.boot.scan; return s === sc.OK || s === sc.OK_DOC ? 'ok' : s === sc.PENDING ? 'pend' : 'bad'; }
function enConfirm(ids, btn){
  if (!ids.length) return;
  api('confirmDuties', { ids: ids }, { btn: btn && btn.tagName === 'BUTTON' ? btn : null }).then(function(r){ notify('ยืนยันแล้ว ' + r.confirmed + ' รายการ' + (r.skipped ? ' (ข้ามวันที่ยังไม่ถึง ' + r.skipped + ')' : '')); loadEntry(); }).catch(function(){});
}
function enAdd(pid, date, s){
  var P = posOf(pid) || {};
  pickPerson('เพิ่มผู้ปฏิบัติงาน · ' + dateTh(date) + ' · ' + slotL(s).name, P.jobId, 'กรณีมาปฏิบัติงานจริงแต่ไม่ได้อยู่ในตาราง (จะบันทึกเป็นยืนยันแล้วทันที)').then(function(pp){
    if (pp) api('addDuty', { positionId: pid, date: date, slot: s, empCode: pp.c, worked: true }, { block: 'กำลังเพิ่มรายการ…' }).then(function(){ notify('เพิ่ม ' + pp.n + ' แล้ว'); loadEntry(); }).catch(function(){});
  });
}
/** รายละเอียดเวร + การดำเนินการ */
function openDuty(id){
  var d = EN.data, x = d.items.filter(function(i){ return i.id === id; })[0]; if (!x) return;
  var P = d.sheets.filter(function(s){ return s.positionId === x.positionId; })[0] || { day: [], eve: [] };
  var ed = d.editable, times = (x.slot === 'D' ? P.day : P.eve).slice();
  if (times.indexOf(x.timeIn + '-' + x.timeOut) < 0) times.unshift(x.timeIn + '-' + x.timeOut);
  var early = x.flags.indexOf('EARLY') >= 0 || x.flags.indexOf('EARLY_CUT') >= 0 || x.flags.indexOf('EARLY_PAY') >= 0;
  var body = '<div class="dd-h"><div><b>' + esc(x.name) + '</b> <span class="small-muted tnum">' + esc(x.empCode) + ' · ' + esc(x.hrPos) + '</span><div>' + esc(dateTh(x.date)) + ' · ' + slotTag(x.slot) + ' ' + esc(x.timeIn + '–' + x.timeOut) + ' · ใบที่ ' + x.lineNo + '</div></div>' +
    '<div class="dd-pay">' + (x.payType === 'HOURLY' ? '<b>' + hrs(x.workStatus === 'WORKED' ? x.hours : x.planned) + '</b> ชม.<small>' + money(x.amount || x.planned * x.rate) + ' บาท</small>' : x.payType === 'FULLTIME' ? '<b>Full Time</b><small>' + (x.meal ? 'ค่าอาหาร' : 'ไม่จ่ายรายชั่วโมง') + '</small>' : '<b>—</b>') + '</div></div>' +
    '<div class="dd-grid"><div><span>การปฏิบัติงาน</span>' + (x.workStatus === 'WORKED' ? '<span class="pill p-ok">ยืนยันแล้ว</span> <small class="small-muted">' + esc(x.confirmedBy || '') + '</small>' : x.workStatus === 'ABSENT' ? '<span class="pill p-mute">ไม่มา</span> ' + esc(x.note) : '<span class="pill p-slate">รอยืนยัน</span>') + '</div>' +
    '<div><span>สแกนนิ้ว</span>' + scanPill(x.scanStatus) + (x.scanIn ? ' <small>' + esc(x.scanIn) + (x.scanOut && x.scanOut !== x.scanIn ? ' – ' + esc(x.scanOut) : '') + '</small>' : '') + '</div>' +
    '<div><span>กลุ่มการจ่าย</span>' + (x.partTime ? 'จ่ายรายชั่วโมงทุกช่วง' : 'บุคลากรประจำศูนย์') + (x.payMode ? ' <span class="tag">กำหนดรายเวร</span>' : '') + '</div>' +
    '<div><span>ที่มา</span>' + esc({ BOOK: 'ลงเอง', BRANCH: 'ผู้ดูแลศูนย์', CENTRAL: 'เจ้าหน้าที่กลาง', IMPORT: 'นำเข้าจากระบบเดิม', LEGACY: 'ระบบเดิม' }[x.source] || x.source) + '</div></div>' +
    (x.flags.length ? '<div class="mt-2">' + flagChips(x.flags, 8) + '</div>' : '') +
    (x.attachIds.length ? '<div class="mt-2">' + x.attachIds.map(function(a, i){ return '<button class="btn btn-sm btn-ghost me-1" onclick="viewAttach(\'' + a + '\',' + (ed ? 'function(){loadEntry()}' : 'null') + ')"><i class="bi bi-paperclip"></i> ใบลืมสแกน ' + (i + 1) + '</button>'; }).join('') + '</div>' : '');
  if (ed) {
    body += '<hr><div class="row g-2"><div class="col-sm-6"><label class="form-label" for="ddTime">เวลา</label><select class="form-select" id="ddTime">' + times.map(function(t){ return '<option' + (t === x.timeIn + '-' + x.timeOut ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('') + '<option value="_">กำหนดเอง…</option></select></div>' +
      (x.slot === 'D' && !x.partTime || x.payMode ? '<div class="col-sm-6"><label class="form-label" for="ddPay">การจ่ายเวรนี้</label><select class="form-select" id="ddPay"><option value="">ตามข้อมูลบุคลากร</option><option value="HOURLY"' + (x.payMode === 'HOURLY' ? ' selected' : '') + '>จ่ายรายชั่วโมง</option><option value="FULLTIME"' + (x.payMode === 'FULLTIME' ? ' selected' : '') + '>Full Time (ประจำศูนย์)</option></select></div>' : '') + '</div>';
    if (early) body += '<div class="early-box"><b><i class="bi bi-alarm"></i> สแกนออกก่อนเวลา (' + esc(x.scanOut) + ')</b><div class="seg mt-2" id="ddEarly"><button data-v="CUT"' + (x.earlyDecision === 'CUT' ? ' class="on"' : '') + '>ไม่จ่ายช่วงนี้</button><button data-v="PAY"' + (x.earlyDecision === 'PAY' ? ' class="on"' : '') + '>จ่ายเต็ม + เหตุผล</button><button data-v=""' + (!x.earlyDecision ? ' class="on"' : '') + '>ยังไม่ตัดสิน</button></div>' +
      '<textarea class="form-control mt-2" id="ddEarlyR" rows="2" placeholder="เหตุผล (บังคับ)">' + esc(x.earlyReason || '') + '</textarea></div>';
  }
  var btns = [{ text: 'ปิด', cls: 'btn-ghost' }];
  if (ed) {
    if (x.workStatus === 'ABSENT') btns.push({ text: '<i class="bi bi-arrow-counterclockwise"></i> คืนรายการ', cls: 'btn-soft', onClick: function(){ api('restoreDuty', { id: id }).then(function(){ loadEntry(); }).catch(function(){}); } });
    else {
      btns.push({ text: '<i class="bi bi-person-x"></i> ไม่มา', cls: 'btn-danger-soft', onClick: function(){ setTimeout(function(){ promptBox('ไม่มาปฏิบัติงาน', 'เหตุผล', 'เช่น ลาป่วย / แลกเวร / ไม่มาตามตาราง').then(function(r){ if (r) api('markAbsent', { ids: [id], reason: r }).then(function(){ notify('บันทึกไม่มาปฏิบัติงานแล้ว'); loadEntry(); }).catch(function(){}); }); }, 250); } });
      btns.push({ text: '<i class="bi bi-arrow-left-right"></i> เปลี่ยนตัว', cls: 'btn-ghost', onClick: function(){ setTimeout(function(){ pickPerson('เปลี่ยนตัวผู้ปฏิบัติงาน', (posOf(x.positionId) || {}).jobId, 'แทน ' + x.name + ' · ' + dateTh(x.date)).then(function(pp){ if (pp) api('updateDuty', { id: id, empCode: pp.c }).then(function(){ notify('เปลี่ยนเป็น ' + pp.n + ' แล้ว'); loadEntry(); }).catch(function(){}); }); }, 250); } });
      if (x.scanStatus && x.scanStatus !== S.boot.scan.OK) btns.push({ text: '<i class="bi bi-upload"></i> แนบใบลืมสแกน', cls: 'btn-ghost', onClick: function(){ attachForm(id, function(){ loadEntry(); }); } });
      btns.push({ text: '<i class="bi bi-save"></i> บันทึก', cls: 'btn-soft', onClick: function(){ return ddSave(x); } });
      if (x.workStatus === 'WORKED') btns.push({ text: 'ยกเลิกการยืนยัน', cls: 'btn-ghost', onClick: function(){ api('unconfirmDuties', { ids: [id] }).then(function(){ loadEntry(); }).catch(function(){}); } });
      else if (x.date <= S.boot.today) btns.push({ text: '<i class="bi bi-check2"></i> ตรงตามใบ', cls: 'btn-ok', onClick: function(){ var p = ddSave(x, true); (p || Promise.resolve()).then(function(){ enConfirm([id]); }); } });
    }
  }
  modal('รายละเอียดเวร', body, btns, 'lg');
  if ($('ddEarly')) $$('#ddEarly button').forEach(function(b){ b.onclick = function(){ $$('#ddEarly button').forEach(function(y){ y.classList.toggle('on', y === b); }); }; });
  if ($('ddTime')) $('ddTime').onchange = function(){ if (this.value === '_') { var v = prompt('เวลา เช่น 16:00-19:30', x.timeIn + '-' + x.timeOut); if (v) { var o = document.createElement('option'); o.textContent = v; this.insertBefore(o, this.firstChild); this.value = v; } else this.value = x.timeIn + '-' + x.timeOut; } };
}
/** บันทึกค่าที่แก้ในหน้าต่างรายละเอียด (คืน Promise หรือ null ถ้าไม่มีอะไรเปลี่ยน) */
function ddSave(x, quiet){
  var p = { id: x.id }, ch = false;
  if ($('ddTime') && $('ddTime').value !== x.timeIn + '-' + x.timeOut) { p.times = $('ddTime').value; ch = true; }
  if ($('ddPay') && $('ddPay').value !== (x.payMode || '')) { p.payMode = $('ddPay').value; ch = true; }
  if ($('ddEarly')) { var on = document.querySelector('#ddEarly button.on'); var v = on ? on.dataset.v : ''; var r = $('ddEarlyR').value.trim(); if (v !== (x.earlyDecision || '') || r !== (x.earlyReason || '')) { p.earlyDecision = v; p.earlyReason = r; ch = true; } }
  if (!ch) { if (!quiet) notify('ไม่มีการเปลี่ยนแปลง', 'info'); return null; }
  return api('updateDuty', p).then(function(){ if (!quiet) { notify('บันทึกแล้ว'); loadEntry(); } });
}
function drawEntryList(){
  var d = EN.data, f = EN.filter;
  var items = d.items.filter(function(x){
    if (f === 'todo') return x.workStatus === '' && x.date <= d.today;
    if (f === 'red') return x.red;
    if (f === 'abs') return x.workStatus === 'ABSENT';
    if (f === 'ok') return x.workStatus === 'WORKED';
    return true;
  }).sort(function(a, b){ return a.date < b.date ? -1 : a.date > b.date ? 1 : (a.slot < b.slot ? -1 : a.slot > b.slot ? 1 : a.lineNo - b.lineNo); });
  var cnt = function(k){ return d.items.filter(function(x){ return k === 'todo' ? x.workStatus === '' && x.date <= d.today : k === 'red' ? x.red : k === 'abs' ? x.workStatus === 'ABSENT' : k === 'ok' ? x.workStatus === 'WORKED' : true; }).length; };
  var h = '<div class="d-flex gap-2 flex-wrap align-items-center mb-2"><div class="chips-tabs" id="enF">' + [['all', 'ทั้งหมด'], ['todo', 'รอยืนยัน'], ['red', 'ต้องแก้ไข'], ['ok', 'ยืนยันแล้ว'], ['abs', 'ไม่มา']].map(function(t){ return '<button class="ctab' + (f === t[0] ? ' on' : '') + '" data-f="' + t[0] + '">' + t[1] + '<span class="n">' + cnt(t[0]) + '</span></button>'; }).join('') + '</div>' +
    (d.editable ? '<button class="btn btn-ok btn-sm ms-auto" id="enOkSel" disabled><i class="bi bi-check2-all"></i> ตรงตามใบ (<span id="enSelN">0</span>)</button>' : '') + '</div>';
  h += '<div class="tbl"><table class="table table-hover"><thead><tr>' + (d.editable ? '<th style="width:34px"><input class="form-check-input" type="checkbox" id="enAll"></th>' : '') + '<th>วันที่</th><th>ตำแหน่ง · ใบ</th><th>ช่วง</th><th>ผู้ปฏิบัติงาน</th><th>สแกน</th><th class="num">ชม.</th><th class="num">บาท</th><th>สถานะ</th></tr></thead><tbody>';
  items.slice(0, 1500).forEach(function(x){
    var can = d.editable && x.workStatus === '' && x.date <= d.today;
    h += '<tr class="' + (x.red ? 'row-err' : '') + '" data-cell="' + x.id + '">' + (d.editable ? '<td>' + (can ? '<input class="form-check-input en-c" type="checkbox" data-id="' + x.id + '">' : '') + '</td>' : '') +
      '<td class="text-nowrap">' + esc(thDate(x.date)) + ' <small class="small-muted">' + TH_D[dowOf(x.date)] + '</small></td><td>' + esc(posShort(x.posName)) + ' <span class="small-muted">ใบ ' + x.lineNo + '</span></td><td>' + slotTag(x.slot) + ' <small>' + esc(x.timeIn + '–' + x.timeOut) + '</small></td>' +
      '<td><div class="who"><b>' + esc(x.name) + '</b><small>' + esc(x.empCode) + (x.partTime ? ' · จ่ายรายชั่วโมง' : '') + '</small></div></td><td>' + (x.date <= d.today ? scanPill(x.scanStatus) : '') + '</td>' +
      '<td class="num">' + (x.payType === 'HOURLY' ? hrs(x.workStatus === 'WORKED' ? x.hours : x.planned) : x.payType === 'FULLTIME' ? 'FT' : '-') + '</td><td class="num">' + (x.amount ? money(x.amount) : '') + '</td>' +
      '<td>' + (x.workStatus === 'WORKED' ? '<span class="pill p-ok">ยืนยันแล้ว</span>' : x.workStatus === 'ABSENT' ? '<span class="pill p-mute">ไม่มา</span>' : x.date <= d.today ? '<span class="pill p-slate">รอยืนยัน</span>' : '<span class="pill p-info">ตามตาราง</span>') + ' ' + flagChips(x.flags.filter(function(g){ return g !== 'NOT_CONFIRMED'; }), 2) + '</td></tr>';
  });
  h += '</tbody></table></div>' + (items.length > 1500 ? '<div class="small-muted mt-1">แสดง 1,500 รายการแรก</div>' : '');
  $('enBody').innerHTML = items.length ? h : h + empty('check2-circle', 'ไม่มีรายการในกลุ่มนี้');
  $$('#enF .ctab').forEach(function(b){ b.onclick = function(){ EN.filter = b.dataset.f; drawEntryList(); }; });
  var upd = function(){ var n = $$('.en-c:checked').length; if ($('enSelN')) { $('enSelN').textContent = n; $('enOkSel').disabled = !n; } };
  $$('.en-c').forEach(function(c){ c.onclick = function(e){ e.stopPropagation(); upd(); }; });
  if ($('enAll')) $('enAll').onchange = function(){ var v = this.checked; $$('.en-c').forEach(function(c){ c.checked = v; }); upd(); };
  if ($('enOkSel')) $('enOkSel').onclick = function(){ enConfirm($$('.en-c:checked').map(function(c){ return c.dataset.id; }), this); };
  $$('#enBody tr[data-cell]').forEach(function(tr){ tr.onclick = function(e){ if (e.target.closest('input')) return; openDuty(tr.dataset.cell); }; });
}

/* ================= รายงานติดตามปัญหา ================= */
PAGES.followup = function(){
  var brs = myBrs();
  mount(pageHead('งานศูนย์', 'รายงานติดตามปัญหา', 'รายการที่ระบบตรวจพบ · สีแดง = ต้องแก้ก่อนปิดรอบ · สีส้ม = ข้อสังเกต',
    '<button class="btn btn-ghost" onclick="fuPrint(this)"><i class="bi bi-printer"></i> พิมพ์รายงาน</button>') +
    '<div class="filters">' + ymSelect('fuYm', S.fuYm || (S.boot.today.slice(8) <= '10' ? addYm(S.boot.ym, -1) : S.boot.ym), 6, 0) + brSelect('fuBr', brs, isCentral() ? 'all' : curBr(), isCentral() && brs.length > 1) + '</div>' +
    '<div id="fuBody">' + skeleton(8) + '</div>');
  $('fuYm').onchange = function(){ S.fuYm = this.value; loadFu(); }; $('fuBr').onchange = loadFu;
  S.fuTypes = S.fuTypes || [];
  loadFu();
};
var FU = null;
function loadFu(){ api('getFollowup', { ym: $('fuYm').value, branchId: $('fuBr').value }).then(function(r){ FU = r; drawFu(); }).catch(function(){}); }
function drawFu(){
  var r = FU; if (!r || !$('fuBody')) return;
  var types = Object.keys(r.counts).sort(function(a, b){ return (flagLevel(a) === 'R' ? 0 : 1) - (flagLevel(b) === 'R' ? 0 : 1) || r.counts[b] - r.counts[a]; });
  var sel = S.fuTypes.filter(function(t){ return types.indexOf(t) >= 0; });
  var rows = r.rows.filter(function(x){ return !sel.length || x.hit.some(function(f){ return sel.indexOf(f) >= 0; }); });
  var h = '<div class="issue-chips mb-3">' + types.map(function(t){ return '<button class="ichip ' + (flagLevel(t) === 'R' ? 'r' : 'o') + (sel.indexOf(t) >= 0 ? ' on' : '') + '" data-t="' + t + '">' + esc(flagText(t)) + ' <b>' + r.counts[t] + '</b></button>'; }).join('') + '</div>';
  h += rows.length ? '<div class="tbl"><table class="table table-hover"><thead><tr><th>ศูนย์</th><th>วันที่</th><th>ตำแหน่ง</th><th>ช่วง</th><th>ผู้ปฏิบัติงาน</th><th>สแกน</th><th>ปัญหา</th></tr></thead><tbody>' +
    rows.slice(0, 1500).map(function(x){ return '<tr><td>' + brDot(x.branchId) + '</td><td class="text-nowrap">' + esc(thDate(x.date)) + '</td><td>' + esc(posShort(x.posName)) + ' <small class="small-muted">ใบ ' + x.lineNo + '</small></td><td>' + slotTag(x.slot) + ' <small>' + esc(x.timeIn + '–' + x.timeOut) + '</small></td><td><div class="who"><b>' + esc(x.name) + '</b><small>' + esc(x.empCode) + '</small></div></td><td>' + scanPill(x.scanStatus) + (x.scanOut ? ' <small>' + esc(x.scanOut) + '</small>' : '') + '</td><td>' + flagChips(x.hit, 4) + '</td></tr>'; }).join('') + '</tbody></table></div>'
    : '<div class="card">' + empty('emoji-smile', 'ไม่พบปัญหาตามเงื่อนไขที่เลือก') + '</div>';
  $('fuBody').innerHTML = h;
  $$('#fuBody .ichip').forEach(function(b){ b.onclick = function(){ var t = b.dataset.t, i = S.fuTypes.indexOf(t); if (i >= 0) S.fuTypes.splice(i, 1); else S.fuTypes.push(t); drawFu(); }; });
}
function fuPrint(){
  var r = FU; if (!r) return;
  var sel = S.fuTypes;
  var rows = r.rows.filter(function(x){ return !sel.length || x.hit.some(function(f){ return sel.indexOf(f) >= 0; }); });
  printReport({ title: 'รายงานติดตามปัญหาการลงเวลา ศูนย์บริการสุขภาพสาขา', subtitle: 'รอบเดือน ' + thYm(r.ym), filters: ($('fuBr').value === 'all' ? 'ทุกศูนย์' : 'ศูนย์' + brName($('fuBr').value)) + (sel.length ? ' · ' + sel.map(flagText).join(', ') : ' · ทุกประเภท'), count: rows.length, kind: 'followup',
    bodyHtml: prTable([{ t: 'ศูนย์', f: function(x){ return brName(x.branchId); } }, { t: 'วันที่', f: function(x){ return thDate(x.date); } }, { t: 'ตำแหน่ง', f: function(x){ return posShort(x.posName) + ' ใบ ' + x.lineNo; } },
      { t: 'เวลา', f: function(x){ return x.timeIn + '–' + x.timeOut; } }, { t: 'รหัส', f: function(x){ return x.empCode; } }, { t: 'ชื่อ-นามสกุล', f: function(x){ return x.name; } }, { t: 'สแกน', f: function(x){ return (x.scanStatus || '') + (x.scanOut ? ' ' + x.scanOut : ''); } },
      { t: 'ปัญหา', f: function(x){ return x.hit.map(flagText).join(', '); } }], rows) }).catch(function(){});
}
