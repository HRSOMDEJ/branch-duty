/* =====================================================================
   เวรสาขา — งานส่วนกลาง (เจ้าหน้าที่กลางของฝ่าย)
   control · close · docs · track
   ===================================================================== */

function jumpEntry(ym, b){ setBr(b); S.enYm = ym; go('entry'); }
function jumpPlan(ym, b){ setBr(b); S.plYm = ym; go('plan'); }
function histLine(h){
  var ps = S.boot.pstatus || {};
  var act = { SUBMIT_BRANCH: 'ศูนย์ส่งให้ฝ่าย', RETURN_BRANCH: 'ตีกลับให้ศูนย์แก้ไข', VERIFY_BRANCH: 'ตรวจแล้ว · ปิดรอบ', STEP_PROPOSED: 'เสนอหัวหน้าฝ่าย', STEP_SENT_HR: 'ส่ง HR', STEP_HR_CHECKED: 'HR ตรวจแล้ว', ROLLBACK: 'ย้อนสถานะ', IMPORT_LEGACY: 'นำเข้าจากระบบเดิม', SAVE_PAYREFS: 'บันทึกเลขอ้างอิง' }[h.action] || h.action;
  return '<div class="tl"><i></i><div><b>' + esc(act) + '</b> <span class="small-muted">' + esc(String(h.at || '').slice(0, 16)) + ' · ' + esc(h.by || '') + '</span>' +
    (h.to ? '<div class="small">' + esc(ps[h.from] || h.from || '') + (h.from ? ' → ' : '') + esc(ps[h.to] || h.to) + '</div>' : '') + (h.note ? '<div class="small-muted">' + esc(h.note) + '</div>' : '') + '</div></div>';
}
function showHistory(b, ym, list){
  modal('ประวัติรอบเดือน ' + thYm(ym) + ' · ' + brName(b), list && list.length ? '<div class="timeline">' + list.slice().reverse().map(histLine).join('') + '</div>' : empty('clock-history', 'ยังไม่มีประวัติ'));
}

/* ================= ศูนย์ควบคุม 4 ศูนย์ ================= */
var CT = null;
PAGES.control = function(){
  var ym = S.ctYm || S.boot.ym;
  mount(pageHead('งานส่วนกลาง', 'ศูนย์ควบคุม', 'ภาพรวมทุกศูนย์ในหน้าเดียว · สถานะรอบเดือน ยอดชั่วโมง ค่าตอบแทน และช่องเวรที่ยังว่าง',
    '<button class="btn btn-ghost" onclick="go(\'close\')"><i class="bi bi-shield-check"></i> ตรวจและปิดรอบ</button><button class="btn btn-brand" onclick="go(\'docs\')"><i class="bi bi-printer"></i> เอกสาร / HRMi</button>') +
    '<div class="filters">' + ymSelect('ctYm', ym, 12, 2) + '</div><div id="ctBody">' + skeleton(10) + '</div>');
  $('ctYm').onchange = function(){ S.ctYm = this.value; loadControl(); };
  loadControl();
};
function loadControl(){
  var ym = $('ctYm').value;
  api('getControlBoard', { ym: ym }, { fresh: true, onCache: drawControl }).then(drawControl).catch(function(){});
}
function drawControl(d){
  if (!$('ctBody') || d.ym !== $('ctYm').value) return;
  CT = d;
  var t = d.total, h = '';
  // รอบเดือนก่อนหน้า
  var pv = d.prev.filter(function(x){ return ['OPEN', 'RETURNED', 'SUBMITTED'].indexOf(x.status) >= 0; });
  if (d.ym === S.boot.ym && pv.length) {
    h += '<div class="cta"><div class="cta-ic"><i class="bi bi-inbox"></i></div><div class="flex-grow-1"><b>รอบเดือน ' + esc(thYm(d.prevYm)) + ' ยังไม่ปิดรอบ ' + pv.length + ' ศูนย์</b><div class="d-flex flex-wrap gap-2 mt-1">' +
      d.prev.map(function(x){ return '<span class="ctl-mini">' + brDot(x.id) + ' ' + statusPill(x.status) + '</span>'; }).join('') + '</div></div>' +
      '<button class="btn btn-brand" onclick="S.clYm=\'' + d.prevYm + '\';go(\'close\')"><i class="bi bi-shield-check"></i> ไปตรวจและปิดรอบ</button></div>';
  }
  if (d.archived) h += '<div class="wbanner"><i class="bi bi-archive"></i> เดือนนี้อยู่ในคลังข้อมูลย้อนหลัง (อ่านอย่างเดียว)</div>';
  h += '<div class="kpis">' + kpi('calendar2-week', 'ic-brand', 'เวรทั้งหมด', t.total) + kpi('clock-history', 'ic-info', 'ชั่วโมงที่เบิก', t.hours) +
    kpi('cash-coin', 'ic-ok', 'ค่าตอบแทน (บาท)', t.amount, 0) + kpi('cup-hot', 'ic-warn', 'ค่าอาหาร (วัน)', t.meal) + kpi('exclamation-octagon', t.red ? 'ic-bad' : 'ic-mute', 'รายการต้องแก้ไข', t.red) + '</div>';
  h += '<div class="ctl-grid">' + d.branches.map(function(b){
    var s = b.summary, pct = s.total ? Math.round(s.worked / s.total * 100) : 0, st = b.status;
    var act = st === 'SUBMITTED' ? '<button class="btn btn-sm btn-brand" onclick="S.clYm=\'' + d.ym + '\';go(\'close\')"><i class="bi bi-shield-check"></i> ตรวจ/ปิดรอบ</button>' : '';
    return '<div class="ctl-card" style="--bc:' + esc(b.color) + '"><div class="ctl-top"><div><div class="ctl-name"><i></i>' + esc(b.name) + '</div><div class="small-muted">' + esc(b.fullName || '') + '</div></div>' + statusPill(st) + '</div>' +
      (st === 'RETURNED' && b.period.reason ? '<div class="ctl-ret"><i class="bi bi-arrow-return-left"></i> ' + esc(b.period.reason) + '</div>' : '') +
      '<div class="ctl-money"><div><b>' + hrs(s.hours) + '</b><span>ชั่วโมง</span></div><div><b>' + money(s.amount) + '</b><span>บาท</span></div><div><b>' + fmt(s.meal) + '</b><span>ค่าอาหาร (วัน)</span></div></div>' +
      '<div class="ctl-prog"><div class="d-flex justify-content-between small"><span>ยืนยันการปฏิบัติงาน ' + fmt(s.worked) + '/' + fmt(s.total) + '</span><b>' + pct + '%</b></div><div class="hm-bar"><i style="width:' + pct + '%;background:' + esc(b.color) + '"></i></div></div>' +
      '<div class="ctl-chips">' + (s.toConfirm ? '<span class="cchip o">รอยืนยัน ' + s.toConfirm + '</span>' : '') + (s.red ? '<span class="cchip r">ต้องแก้ไข ' + s.red + '</span>' : '') +
      (s.pendingBook ? '<span class="cchip o">จองรอยืนยัน ' + s.pendingBook + '</span>' : '') + (s.absent ? '<span class="cchip">ไม่มาปฏิบัติงาน ' + s.absent + '</span>' : '') + (!s.toConfirm && !s.red && !s.pendingBook && s.total ? '<span class="cchip g"><i class="bi bi-check2"></i> พร้อม</span>' : '') + '</div>' +
      '<div class="ctl-act"><button class="btn btn-sm btn-ghost" onclick="jumpEntry(\'' + d.ym + '\',\'' + b.id + '\')"><i class="bi bi-ui-checks-grid"></i> บันทึก</button><button class="btn btn-sm btn-ghost" onclick="jumpPlan(\'' + d.ym + '\',\'' + b.id + '\')"><i class="bi bi-grid-3x3-gap"></i> ตาราง</button>' + act + '</div></div>';
  }).join('') + '</div>';
  // ตารางช่องเวร
  var f = d.fill;
  h += '<div class="card mt-3"><div class="card-h"><h3><i class="bi bi-grid-3x3"></i> เวรที่ลงแล้ว / กรอบเวร รายวัน</h3><span class="sub">ช่องสีส้ม = ยังไม่ครบกรอบ · สีเทา = ไม่มีกรอบเวร</span></div><div class="card-b p-0"><div class="sg-wrap"><table class="fill-t"><thead><tr><th class="sticky-l">ศูนย์</th>' +
    f.dates.map(function(x){ return '<th class="' + dk(x.color) + (x.date === S.boot.today ? ' today' : '') + '"><div>' + TH_D[x.dow] + '</div>' + x.d + '</th>'; }).join('') + '</tr></thead><tbody>' +
    f.branches.map(function(b){ return '<tr><td class="sticky-l">' + brDot(b.id) + '</td>' + b.days.map(function(c, i){
      var cls = !c.q ? (c.n ? 'fl-x' : 'fl-0') : c.n >= c.q ? (c.n > c.q ? 'fl-x' : 'fl-ok') : 'fl-gap';
      return '<td class="' + cls + '" title="' + esc(thDate(f.dates[i].date)) + ' · ลงแล้ว ' + c.n + ' / กรอบ ' + c.q + '">' + (c.q || c.n ? c.n + '<small>/' + c.q + '</small>' : '·') + '</td>'; }).join('') + '</tr>'; }).join('') +
    '</tbody></table></div></div></div>';
  var w = d.window;
  h += '<div class="small-muted mt-2"><i class="bi bi-info-circle"></i> ศูนย์ส่งให้ฝ่าย' + (w.mode === 'always' ? 'ได้ตลอด' : 'ได้ระหว่าง ' + esc(thDate(w.from)) + ' – ' + esc(thDate(w.to))) + ' · กำหนดส่ง HRMi ภายในวันที่ ' + esc(thDate(w.deadline)) + '</div>';
  $('ctBody').innerHTML = h;
  animateKpis();
}

/* ================= ตรวจและปิดรอบ ================= */
PAGES.close = function(){
  var ym = S.clYm || addYm(S.boot.ym, -1);
  mount(pageHead('งานส่วนกลาง', 'ตรวจและปิดรอบ', 'ตรวจรายการที่ศูนย์ส่ง ตีกลับให้แก้ไข หรือปิดรอบ (ตรึงชั่วโมงและยอดเงิน) เพื่อออกเอกสารและไฟล์ HRMi') +
    '<div class="filters">' + ymSelect('clYm', ym, 12, 0) + '</div><div id="clBody">' + skeleton(8) + '</div>');
  $('clYm').onchange = function(){ S.clYm = this.value; loadClose(); };
  loadClose();
};
function loadClose(){ api('getControlBoard', { ym: $('clYm').value }).then(drawClose).catch(function(){}); }
function drawClose(d){
  if (!$('clBody') || d.ym !== $('clYm').value) return;
  CT = d;
  var notEnded = d.ym >= S.boot.ym, h = '';
  if (notEnded) h += '<div class="wbanner"><i class="bi bi-hourglass-split"></i> เดือน ' + esc(thYm(d.ym)) + ' ยังไม่สิ้นเดือน · ปิดรอบได้ตั้งแต่วันที่ 1 ของเดือนถัดไป</div>';
  h += '<div class="cl-list">' + d.branches.map(function(b){
    var s = b.summary, st = b.status, locked = ['VERIFIED', 'PROPOSED', 'SENT_HR', 'HR_CHECKED'].indexOf(st) >= 0;
    var canVerify = !locked && !notEnded && !s.blockers && !d.archived;
    var why = notEnded ? 'ยังไม่สิ้นเดือน' : s.blockers ? 'ยังมี ' + s.blockers + ' รายการที่ต้องแก้ไข/ยืนยัน' : '';
    var acts = '';
    if (!locked) {
      acts += '<button class="btn btn-ghost" onclick="jumpEntry(\'' + d.ym + '\',\'' + b.id + '\')"><i class="bi bi-ui-checks-grid"></i> ตรวจรายการ</button>';
      if (st === 'SUBMITTED') acts += '<button class="btn btn-danger-soft" onclick="clReturn(\'' + b.id + '\',this)"><i class="bi bi-arrow-return-left"></i> ตีกลับ</button>';
      acts += '<button class="btn btn-brand"' + (canVerify ? '' : ' disabled title="' + esc(why) + '"') + ' onclick="clVerify(\'' + b.id + '\',this)"><i class="bi bi-shield-lock"></i> ตรวจแล้ว · ปิดรอบ</button>';
    } else {
      acts += '<button class="btn btn-ghost" onclick="S.dcYm=\'' + d.ym + '\';S.dcBr=\'' + b.id + '\';go(\'docs\')"><i class="bi bi-printer"></i> เอกสาร</button>';
      if (has('ADMIN') && !d.archived) acts += '<button class="btn btn-ghost" onclick="clRollback(\'' + b.id + '\')"><i class="bi bi-arrow-counterclockwise"></i> ย้อนสถานะ</button>';
    }
    return '<div class="cl-card" style="--bc:' + esc(b.color) + '"><div class="cl-h"><div class="ctl-name"><i></i>' + esc(b.name) + '</div>' + statusPill(st, true) +
      '<button class="btn btn-sm btn-link ms-auto" onclick="clHist(\'' + b.id + '\')"><i class="bi bi-clock-history"></i> ประวัติ</button></div>' + stepper(st) +
      (st === 'RETURNED' && b.period.reason ? '<div class="ctl-ret"><i class="bi bi-arrow-return-left"></i> ตีกลับ: ' + esc(b.period.reason) + '</div>' : '') +
      '<div class="cl-stats">' + [['เวร', fmt(s.total)], ['ยืนยันแล้ว', fmt(s.worked)], ['รอยืนยัน', fmt(s.toConfirm), s.toConfirm ? 'o' : ''], ['จองรอยืนยัน', fmt(s.pendingBook), s.pendingBook ? 'o' : ''],
        ['ต้องแก้ไข', fmt(s.red), s.red ? 'r' : ''], ['ชั่วโมง', hrs(s.hours)], ['บาท', money(s.amount)], ['ค่าอาหาร', fmt(s.meal) + ' วัน']].map(function(x){ return '<div class="' + (x[2] || '') + '"><b>' + x[1] + '</b><span>' + x[0] + '</span></div>'; }).join('') + '</div>' +
      (!locked && why ? '<div class="small-muted mb-2"><i class="bi bi-info-circle"></i> ' + esc(why) + (s.blockers ? ' · กด "ตรวจรายการ" เพื่อแก้ไข' : '') + '</div>' : '') +
      (locked && b.period.verifiedAt ? '<div class="small-muted mb-2"><i class="bi bi-shield-lock"></i> ปิดรอบเมื่อ ' + esc(b.period.verifiedAt.slice(0, 16)) + '</div>' : '') +
      '<div class="cl-act">' + acts + '</div></div>';
  }).join('') + '</div>';
  $('clBody').innerHTML = h;
}
function clB(id){ return CT.branches.filter(function(b){ return b.id === id; })[0]; }
function clHist(id){ var b = clB(id); showHistory(id, CT.ym, b.period.history); }
function clReturn(id, btn){
  promptBox('ตีกลับให้ศูนย์' + brName(id) + ' แก้ไข', 'เหตุผล (ศูนย์จะเห็นข้อความนี้)', 'เช่น ใบลงชื่อวันที่ 12 ไม่ตรงกับตาราง').then(function(r){
    if (r) api('returnBranch', { ym: CT.ym, branchId: id, reason: r }, { btn: btn }).then(function(){ notify('ตีกลับเรียบร้อย'); loadClose(); }).catch(function(){});
  });
}
function clVerify(id, btn){
  var s = clB(id).summary;
  passwordBox('ตรวจแล้ว · ปิดรอบ', 'ศูนย์' + brName(id) + ' · ' + thYm(CT.ym) + '\nชั่วโมงที่เบิก ' + hrs(s.hours) + ' ชม. · ' + money(s.amount) + ' บาท · ค่าอาหาร ' + s.meal + ' วัน\n\nระบบจะตรึงชั่วโมงและยอดเงิน ศูนย์และเจ้าหน้าที่จะแก้ไขรายการไม่ได้อีก', 'ปิดรอบ').then(function(pw){
    if (pw === null) return;
    api('verifyBranch', { ym: CT.ym, branchId: id, password: pw }, { btn: btn, block: 'กำลังตรวจและปิดรอบ…', timeout: 300000 }).then(function(){
      Swal.fire({ icon: 'success', title: 'ปิดรอบเรียบร้อย', text: 'พิมพ์เอกสารและส่งออกไฟล์ HRMi ได้ที่หน้า "เอกสารและไฟล์ HRMi"', confirmButtonText: 'รับทราบ' });
      loadClose();
    }).catch(function(){});
  });
}
function clRollback(id){
  var b = clB(id), order = ['OPEN', 'SUBMITTED', 'VERIFIED', 'PROPOSED', 'SENT_HR', 'HR_CHECKED'], cur = order.indexOf(b.status);
  var opts = order.slice(0, Math.max(cur, 1)).map(function(k){ return '<option value="' + k + '">' + esc(S.boot.pstatus[k]) + '</option>'; }).join('');
  modal('ย้อนสถานะ · ศูนย์' + brName(id), '<div class="small-muted mb-2">สถานะปัจจุบัน ' + statusPill(b.status) + ' · การย้อนสถานะบันทึกประวัติทุกครั้ง</div>' +
    '<label class="form-label" for="rbTo">ย้อนไปเป็น</label><select class="form-select mb-2" id="rbTo">' + opts + '</select>' +
    '<label class="form-label" for="rbWhy">เหตุผล</label><textarea class="form-control" id="rbWhy" rows="2" placeholder="เช่น HR แจ้งแก้ชั่วโมงของบุคลากร 1 ราย"></textarea>',
    [{ text: 'ยกเลิก', cls: 'btn-ghost' }, { text: '<i class="bi bi-arrow-counterclockwise"></i> ย้อนสถานะ', cls: 'btn-danger-soft', onClick: function(){
      var to = $('rbTo').value, why = $('rbWhy').value.trim();
      if (!why) { notify('กรุณาระบุเหตุผล', 'warning'); return false; }
      passwordBox('ยืนยันการย้อนสถานะ', brName(id) + ' → ' + S.boot.pstatus[to], 'ยืนยัน', true).then(function(pw){
        if (pw !== null) api('rollbackPeriod', { ym: CT.ym, branchId: id, to: to, reason: why, password: pw }).then(function(){ notify('ย้อนสถานะแล้ว'); go(S.page); }).catch(function(){});
      });
    } }]);
}

/* ================= เอกสารและไฟล์ HRMi ================= */
var DC = { fmt: 'pdf' };
PAGES.docs = function(){
  var ym = S.dcYm || addYm(S.boot.ym, -1), brs = myBrs(), br = S.dcBr || (isCentral() ? 'all' : curBr());
  S.dcYm = null;
  mount(pageHead(isCentral() ? 'งานส่วนกลาง' : 'งานศูนย์', 'เอกสารและไฟล์ HRMi', 'ออกใบบันทึกเวลา ตารางชั่วโมง ตารางค่าอาหาร สรุปยอด และไฟล์นำเข้า HRMi · เอกสารของศูนย์ที่ยังไม่ปิดรอบมีคำว่า "ร่าง"') +
    '<div class="filters">' + ymSelect('dcYm', ym, 14, 1) + brSelect('dcBr', brs, br, isCentral() && brs.length > 1) +
    (S.boot.canExcel ? '<div><label class="form-label">รูปแบบไฟล์</label><div class="seg" id="dcFmt"><button data-v="pdf" class="on"><i class="bi bi-file-earmark-pdf"></i> PDF</button><button data-v="xlsx"><i class="bi bi-file-earmark-spreadsheet"></i> Excel</button></div></div>' : '') +
    '</div><div id="dcStat" class="mb-3"></div><div id="dcBody"></div>');
  DC.fmt = 'pdf';
  $$('#dcFmt button').forEach(function(b){ b.onclick = function(){ $$('#dcFmt button').forEach(function(x){ x.classList.toggle('on', x === b); }); DC.fmt = b.dataset.v; }; });
  $('dcYm').onchange = drawDocs; $('dcBr').onchange = function(){ S.dcBr = this.value; drawDocs(); };
  drawDocs();
};
function dcBrs(){ var v = $('dcBr').value; return v === 'all' ? myBrs() : [v]; }
function drawDocs(){
  var ym = $('dcYm').value, bid = $('dcBr').value, one = bid !== 'all';
  $('dcStat').innerHTML = '<div class="d-flex flex-wrap gap-2" id="dcPills"><span class="small-muted">กำลังโหลดสถานะ…</span></div>';
  if (isCentral()) api('getControlBoard', { ym: ym }, { quiet: true, fresh: true }).then(function(d){
    if (!$('dcPills') || ym !== $('dcYm').value) return;
    $('dcPills').innerHTML = d.branches.map(function(b){ return '<span class="ctl-mini">' + brDot(b.id) + ' ' + statusPill(b.status) + '</span>'; }).join('');
  }).catch(function(){ if ($('dcPills')) $('dcPills').innerHTML = ''; });
  else api('getBranchBoard', { ym: ym, branchId: one ? bid : curBr() }, { quiet: true, fresh: true }).then(function(d){ if ($('dcPills')) $('dcPills').innerHTML = '<span class="ctl-mini">' + brDot(d.branchId) + ' ' + statusPill(d.status) + '</span>'; }).catch(function(){});
  var card = function(icon, cls, title, sub, body, btns){ return '<div class="doc-card"><div class="doc-ic ' + cls + '"><i class="bi bi-' + icon + '"></i></div><div class="flex-grow-1"><h3>' + title + '</h3><p>' + sub + '</p>' + (body || '') + '<div class="doc-act">' + btns + '</div></div></div>'; };
  var h = '<div class="doc-grid">';
  h += card('file-earmark-text', 'ic-brand', 'ใบบันทึกเวลาการปฏิบัติงาน', 'แบบ FM-HRM-032/01 · 1 หน้า/ตำแหน่ง/ใบที่ · มีรายชื่อตามตารางเวรเพื่อให้บุคลากรลงชื่อ',
    one ? '<div class="row g-2 mb-2"><div class="col-sm-7">' + posSelect('dcPos', bid, 'all', true) + '</div><div class="col-sm-5 d-flex align-items-end"><div class="form-check"><input class="form-check-input" type="checkbox" id="dcBlank"><label class="form-check-label" for="dcBlank">ใบเปล่า</label></div></div></div>' : '<div class="small text-warning mb-2"><i class="bi bi-info-circle"></i> เลือกศูนย์ 1 ศูนย์เพื่อพิมพ์ใบบันทึกเวลา</div>',
    '<button class="btn btn-brand"' + (one ? '' : ' disabled') + ' onclick="dcSign(this)"><i class="bi bi-printer"></i> สร้างใบบันทึกเวลา</button>');
  h += card('table', 'ic-info', 'ตารางชั่วโมง / ตารางเวร', 'เทียบชั่วโมงกับเวร รายตำแหน่ง 1 หน้า/ตาราง · ฉบับเบิก (เฉพาะชั่วโมงที่จ่าย) หรือฉบับตรวจสอบ (รวมรายการที่ยังไม่ยืนยัน)',
    '<div class="row g-2 mb-2"><div class="col-6"><label class="form-label" for="dcDoc">ชนิด</label><select class="form-select" id="dcDoc"><option value="hours">ตารางชั่วโมง</option><option value="duty">ตารางเวร (ตัวย่อ)</option></select></div>' +
    '<div class="col-6"><label class="form-label" for="dcKind">ฉบับ</label><select class="form-select" id="dcKind"><option value="pay">ฉบับเบิก</option><option value="check">ฉบับตรวจสอบ</option></select></div></div>',
    '<button class="btn btn-brand" onclick="dcHours(this)"><i class="bi bi-file-earmark-pdf"></i> สร้างตาราง</button>');
  h += card('cup-hot', 'ic-warn', 'ตารางค่าอาหาร (R706)', 'เจ้าหน้าที่ประจำที่ปฏิบัติงานเต็มวัน 08.00–16.00 น. ในวันทำการ · 50 บาท/วัน (Part Time ไม่ได้รับ)', '',
    '<button class="btn btn-brand" onclick="dcMeal(this)"><i class="bi bi-file-earmark-pdf"></i> สร้างตารางค่าอาหาร</button>');
  h += card('calculator', 'ic-ok', 'สรุปยอดเบิก', 'ยอดชั่วโมงและเงินแยกตามศูนย์ ตำแหน่ง และรหัสรายได้ สำหรับเสนอหัวหน้าฝ่าย', '',
    '<button class="btn btn-brand" onclick="dcSummary(this)"><i class="bi bi-file-earmark-pdf"></i> สร้างสรุปยอด</button>');
  if (isCentral()) h += card('filetype-xlsx', 'ic-violet', 'ไฟล์นำเข้า HRMi', 'รูปแบบเดิม (รหัสพนักงาน · รหัสรายได้ · จำนวน) แยกชีทตามรหัสรายได้ · ออกได้เฉพาะศูนย์ที่ปิดรอบแล้ว',
    '<div class="row g-2 mb-2"><div class="col-12"><label class="form-label" for="dcMode">รูปแบบ</label><select class="form-select" id="dcMode"><option value="combined">ไฟล์เดียว แยกชีทตามรหัส</option><option value="separate">แยกไฟล์ตามรหัสรายได้</option><option value="zip">แยกไฟล์ รวมเป็น .zip</option></select></div>' +
    '<div class="col-12"><div class="form-check"><input class="form-check-input" type="checkbox" id="dcMealOn" checked><label class="form-check-label" for="dcMealOn">รวมค่าอาหาร R706</label></div></div></div>',
    '<button class="btn btn-brand" onclick="dcHRMi(this)"><i class="bi bi-download"></i> ส่งออกไฟล์ HRMi</button>');
  h += card('paperclip', 'ic-mute', 'ใบลืมสแกนรวมเล่ม', 'รวมไฟล์แนบใบลืมสแกนทั้งเดือนเป็น PDF เล่มเดียว พร้อมหน้าสรุปรายการ', '',
    '<button class="btn btn-ghost" onclick="printAttachments($(\'dcYm\').value,$(\'dcBr\').value)"><i class="bi bi-journal-bookmark"></i> รวมเล่ม PDF</button>');
  $('dcBody').innerHTML = h + '</div>';
  enhanceSelects($('dcBody'));
}
function dcRun(action, p, btn, msg){
  p.ym = $('dcYm').value; p.format = DC.fmt;
  api(action, p, { btn: btn, block: msg || 'กำลังสร้างเอกสาร…', timeout: 330000 }).then(function(r){ download(r.files); }).catch(function(){});
}
function dcSign(btn){ dcRun('exportSignSheets', { branchId: $('dcBr').value, positionId: $('dcPos').value, blank: $('dcBlank').checked }, btn, 'กำลังสร้างใบบันทึกเวลา…'); }
function dcHours(btn){ dcRun('exportHoursTables', { branchIds: dcBrs(), docType: $('dcDoc').value, kind: $('dcKind').value }, btn, 'กำลังสร้างตาราง…'); }
function dcMeal(btn){ dcRun('exportMeal', { branchIds: dcBrs() }, btn); }
function dcSummary(btn){ dcRun('exportSummary', { branchIds: dcBrs() }, btn); }
function dcHRMi(btn){
  api('exportHRMi', { ym: $('dcYm').value, branchIds: dcBrs(), mode: $('dcMode').value, includeMeal: $('dcMealOn').checked }, { btn: btn, block: 'กำลังสร้างไฟล์ HRMi…', timeout: 330000 }).then(function(r){
    download(r.files);
    if (r.notReady && r.notReady.length) setTimeout(function(){ notify('ยังไม่ปิดรอบ (ไม่รวมในไฟล์): ' + r.notReady.join(', '), 'warning'); }, 900);
  }).catch(function(){});
}

/* ================= ติดตามการส่งเบิก ================= */
PAGES.track = function(){
  var ym = S.tkYm || addYm(S.boot.ym, -1);
  mount(pageHead('งานส่วนกลาง', 'ติดตามการส่งเบิก', 'หลังปิดรอบ: เสนอหัวหน้าฝ่ายลงนาม → ส่ง HR (บันทึกเลขอ้างอิง PAY จาก HRMi) → HR ตรวจแล้ว · ครบทุกศูนย์ 10 วัน ระบบย้ายเข้าคลังข้อมูลอัตโนมัติ') +
    '<div class="filters">' + ymSelect('tkYm', ym, 14, 0) + '</div><div id="tkBody">' + skeleton(6) + '</div><div id="tkArch" class="mt-3"></div>');
  $('tkYm').onchange = function(){ S.tkYm = this.value; loadTrack(); };
  loadTrack();
  api('getArchiveList', {}, { quiet: true }).then(function(list){
    if (!$('tkArch')) return;
    $('tkArch').innerHTML = '<div class="card"><div class="card-h"><h3><i class="bi bi-archive"></i> คลังข้อมูลย้อนหลัง</h3><span class="sub">' + list.length + ' เดือน · อ่านได้ทุกหน้าตามปกติ</span></div><div class="card-b">' +
      (list.length ? '<div class="arch-list">' + list.map(function(a){ return '<span class="arch-i" title="' + esc(a.archivedAt) + '"><b>' + esc(a.thMonth) + '</b><small>' + fmt(a.rows) + ' รายการ · ' + (a.source === 'legacy' ? 'ระบบเดิม' : 'ระบบนี้') + '</small></span>'; }).join('') + '</div>' : empty('archive', 'ยังไม่มีเดือนในคลัง')) + '</div></div>';
  }).catch(function(){});
};
function loadTrack(){ api('getControlBoard', { ym: $('tkYm').value }).then(drawTrack).catch(function(){}); }
function drawTrack(d){
  if (!$('tkBody') || d.ym !== $('tkYm').value) return;
  CT = d;
  var col = function(v){ return v ? '<span class="tk-ok"><i class="bi bi-check-circle-fill"></i> ' + esc(/^\d{4}-\d{2}-\d{2}/.test(v) ? thDate(String(v).slice(0, 10)) : String(v).slice(0, 10)) + '</span>' : '<span class="small-muted">—</span>'; };
  var h = '<div class="card"><div class="card-b p-0"><div class="table-responsive"><table class="table tbl mb-0 tk-t"><thead><tr><th style="width:36px"><input class="form-check-input" type="checkbox" id="tkAll" aria-label="เลือกทั้งหมด"></th><th>ศูนย์</th><th>สถานะ</th><th>ปิดรอบ</th><th>เสนอหัวหน้าฝ่าย</th><th>ส่ง HR</th><th>เลขอ้างอิง PAY</th><th>HR ตรวจ</th><th class="num">ยอดเงิน</th><th></th></tr></thead><tbody>' +
    d.branches.map(function(b){ var p = b.period; return '<tr><td><input class="form-check-input tk-sel" type="checkbox" data-id="' + b.id + '" aria-label="เลือก ' + esc(b.name) + '"></td><td>' + brDot(b.id) + '</td><td>' + statusPill(b.status) + '</td>' +
      '<td>' + col(p.verifiedAt) + '</td><td>' + col(p.proposedAt) + '</td><td>' + col(p.sentHrAt) + '</td><td><span class="tk-ref">' + esc(p.payRefs || '') + '</span> <button class="btn btn-sm btn-link p-0" onclick="tkRefs(\'' + b.id + '\')" title="แก้ไขเลขอ้างอิง" aria-label="แก้ไขเลขอ้างอิง"><i class="bi bi-pencil"></i></button></td><td>' + col(p.hrCheckedAt) + '</td>' +
      '<td class="num">' + money(b.summary.amount) + '</td><td><button class="btn btn-sm btn-ghost" onclick="clHist(\'' + b.id + '\')" title="ประวัติ" aria-label="ประวัติ"><i class="bi bi-clock-history"></i></button></td></tr>'; }).join('') +
    '</tbody></table></div></div></div>';
  h += '<div class="tk-steps">' + [['PROPOSED', 'person-check', 'เสนอหัวหน้าฝ่ายแล้ว', 'หลังหัวหน้าฝ่ายลงนามเอกสาร'], ['SENT_HR', 'box-arrow-up-right', 'ส่ง HR แล้ว', 'นำเข้า HRMi และบันทึกเลขอ้างอิง PAY'], ['HR_CHECKED', 'patch-check', 'HR ตรวจแล้ว', 'HR แจ้งตรวจสอบเรียบร้อย']].map(function(x){
    return '<button class="tk-step" onclick="tkAdvance(\'' + x[0] + '\',this)"><i class="bi bi-' + x[1] + '"></i><div><b>' + x[2] + '</b><span>' + x[3] + '</span></div></button>'; }).join('') + '</div><div class="small-muted mt-1">ติ๊กเลือกศูนย์ (หรือไม่เลือก = ทุกศูนย์ที่อยู่ในขั้นก่อนหน้า) แล้วกดขั้นตอน</div>';
  $('tkBody').innerHTML = h;
  $('tkAll').onchange = function(){ var on = this.checked; $$('.tk-sel').forEach(function(c){ c.checked = on; }); };
}
function tkAdvance(step, btn){
  var need = { PROPOSED: 'VERIFIED', SENT_HR: 'PROPOSED', HR_CHECKED: 'SENT_HR' }[step];
  var ids = $$('.tk-sel').filter(function(c){ return c.checked; }).map(function(c){ return c.dataset.id; });
  if (!ids.length) ids = CT.branches.filter(function(b){ return b.status === need; }).map(function(b){ return b.id; });
  if (!ids.length) return alertBox('ยังไม่มีศูนย์ที่พร้อม', 'ขั้นตอนนี้ทำได้กับศูนย์ที่อยู่สถานะ "' + S.boot.pstatus[need] + '"', 'info');
  var names = ids.map(brName).join(', ');
  var run = function(refs){ api('advancePeriods', { ym: CT.ym, branchIds: ids, step: step, payRefs: refs }, { btn: btn }).then(function(r){ resultBox(S.boot.pstatus[step], r.results); loadTrack(); }).catch(function(){}); };
  if (step === 'SENT_HR') {
    Swal.fire({ title: 'ส่ง HR แล้ว', html: '<div class="small-muted mb-2">' + esc(names) + '</div>', input: 'text', inputLabel: 'เลขอ้างอิง PAY จาก HRMi (ถ้ามี)', inputPlaceholder: 'เช่น PAY2569100012, PAY2569100013',
      showCancelButton: true, confirmButtonText: 'บันทึก', cancelButtonText: 'ยกเลิก', reverseButtons: true }).then(function(r){ if (r.isConfirmed) run(r.value || ''); });
  } else confirmBox(S.boot.pstatus[step], names, 'ยืนยัน').then(function(ok){ if (ok) run(); });
}
function tkRefs(id){
  var b = clB(id);
  Swal.fire({ title: 'เลขอ้างอิง PAY · ' + brName(id), input: 'text', inputValue: b.period.payRefs || '', inputPlaceholder: 'คั่นหลายเลขด้วย ,', showCancelButton: true, confirmButtonText: 'บันทึก', cancelButtonText: 'ยกเลิก', reverseButtons: true }).then(function(r){
    if (r.isConfirmed) api('savePayRefs', { ym: CT.ym, branchId: id, payRefs: r.value }).then(function(){ notify('บันทึกแล้ว'); loadTrack(); }).catch(function(){});
  });
}
