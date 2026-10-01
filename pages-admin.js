/* =====================================================================
   ระบบจัดการเวร ศ.สาขาฯ — การตั้งค่า
   setup · calendar · signers · employees · users · settings · import · audit
   ===================================================================== */

function fld(id, label, val, o){
  o = o || {};
  return '<div class="' + (o.col || 'col-md-6') + '"><label class="form-label" for="' + id + '">' + label + '</label><input class="form-control' + (o.cls ? ' ' + o.cls : '') + '" id="' + id + '" value="' + esc(val == null ? '' : val) + '"' +
    (o.type ? ' type="' + o.type + '"' : '') + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + (o.ro ? ' readonly' : '') + (o.attr || '') + '>' + (o.help ? '<div class="form-text">' + o.help + '</div>' : '') + '</div>';
}
function sw(id, label, on){ return '<div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" id="' + id + '"' + (on ? ' checked' : '') + '><label class="form-check-label" for="' + id + '">' + label + '</label></div>'; }
function segHtml(id, opts, val){ return '<div class="seg" id="' + id + '" role="tablist">' + opts.map(function(o){ return '<button type="button" data-v="' + o[0] + '"' + (o[0] === val ? ' class="on"' : '') + '>' + o[1] + '</button>'; }).join('') + '</div>'; }
function bindSeg(id, cb){ $$('#' + id + ' button').forEach(function(b){ b.onclick = function(){ $$('#' + id + ' button').forEach(function(x){ x.classList.toggle('on', x === b); }); cb(b.dataset.v); }; }); }

/* ================= ศูนย์ ตำแหน่ง และอัตรา ================= */
var SU = null;
PAGES.setup = function(){
  S.suTab = S.suTab || 'pos';
  mount(pageHead('การตั้งค่า', 'ศูนย์ ตำแหน่ง และอัตรา', 'เพิ่มศูนย์ใหม่ กำหนดงาน ตำแหน่ง×ศูนย์ (รหัสรายได้ เวลามาตรฐาน กรอบเวร) และอัตราค่าตอบแทนพร้อมประวัติ') +
    '<div class="filters">' + '<div><label class="form-label">หมวด</label>' + segHtml('suTab', [['pos', '<i class="bi bi-person-vcard"></i> ตำแหน่งและอัตรา'], ['br', '<i class="bi bi-hospital"></i> ศูนย์'], ['job', '<i class="bi bi-briefcase"></i> งาน'], ['slot', '<i class="bi bi-clock"></i> ช่วงเวร']], S.suTab) + '</div></div>' +
    '<div id="suBody">' + skeleton(8) + '</div>');
  bindSeg('suTab', function(v){ S.suTab = v; drawSetup(); });
  api('listSetup', {}, { fresh: true, onCache: function(d){ SU = d; drawSetup(); } }).then(function(d){ SU = d; drawSetup(); }).catch(function(){});
};
function drawSetup(){
  if (!$('suBody') || !SU) return;
  var t = S.suTab, h = '';
  if (t === 'br') {
    h = '<div class="card"><div class="card-h"><h3>ศูนย์บริการสุขภาพสาขา</h3><span class="sub">' + SU.branches.length + ' ศูนย์</span><button class="btn btn-sm btn-brand ms-auto" onclick="brModal()"><i class="bi bi-plus-lg"></i> เพิ่มศูนย์</button></div><div class="card-b p-0"><div class="table-responsive"><table class="table tbl mb-0"><thead><tr><th>ศูนย์</th><th>ชื่อเต็ม</th><th>ลำดับ HR</th><th>รหัสค่าอาหาร</th><th class="num">อัตรา/วัน</th><th>สถานะ</th><th></th></tr></thead><tbody>' +
      SU.branches.map(function(b){ return '<tr><td><span class="bdot" style="--bc:' + esc(b.color) + '"><i></i>' + esc(b.name) + '</span> <span class="small-muted">' + esc(b.id) + '</span></td><td>' + esc(b.fullName) + '</td><td>' + esc(b.hrNo) + '</td><td><code>' + esc(b.mealCode) + '</code></td><td class="num">' + money(b.mealRate) + '</td><td>' + (b.active === 'FALSE' ? '<span class="pill p-mute">ปิดใช้งาน</span>' : '<span class="pill p-ok">ใช้งาน</span>') + '</td><td><button class="btn btn-sm btn-ghost" onclick="brModal(\'' + b.id + '\')" aria-label="แก้ไข"><i class="bi bi-pencil"></i></button></td></tr>'; }).join('') +
      '</tbody></table></div></div></div>';
  } else if (t === 'job') {
    h = '<div class="card"><div class="card-h"><h3>งาน (ประเภทบุคลากร)</h3><span class="sub">งานเดียวกันใช้ได้หลายศูนย์</span><button class="btn btn-sm btn-brand ms-auto" onclick="jobModal()"><i class="bi bi-plus-lg"></i> เพิ่มงาน</button></div><div class="card-b p-0"><div class="table-responsive"><table class="table tbl mb-0"><thead><tr><th>รหัส</th><th>ชื่องาน</th><th>ชื่อย่อ</th><th>ชื่อตำแหน่ง HR ที่เทียบได้</th><th>จ่ายรายชั่วโมง</th><th>สถานะ</th><th></th></tr></thead><tbody>' +
      SU.jobs.map(function(j){ return '<tr><td><b>' + esc(j.id) + '</b></td><td>' + esc(j.name) + '</td><td>' + esc(j.short) + '</td><td class="small">' + esc(j.aliases) + '</td><td>' + (j.hourly === 'FALSE' ? '<span class="pill p-mute">ไม่จ่าย</span>' : '<span class="pill p-ok">จ่าย</span>') + '</td><td>' + (j.active === 'FALSE' ? '<span class="pill p-mute">ปิด</span>' : '<span class="pill p-ok">ใช้งาน</span>') + '</td><td><button class="btn btn-sm btn-ghost" onclick="jobModal(\'' + j.id + '\')" aria-label="แก้ไข"><i class="bi bi-pencil"></i></button></td></tr>'; }).join('') +
      '</tbody></table></div></div></div>';
  } else if (t === 'slot') {
    var L = S.boot.labels;
    h = '<div class="card" style="max-width:720px"><div class="card-h"><h3>ชื่อและตัวย่อช่วงเวร</h3><span class="sub">ตัวย่อใช้พิมพ์ในตารางเวรและแสดงบนเอกสาร</span></div><div class="card-b">' +
      ['D', 'E'].map(function(k){ var x = L[k] || {}; return '<div class="row g-2 mb-3 align-items-end"><div class="col-12"><b>' + slotTag(k) + ' ' + (k === 'D' ? 'ช่วงกลางวัน' : 'ช่วงเย็น') + '</b></div>' +
        fld('sl_s_' + k, 'ตัวย่อ', x.s, { col: 'col-3 col-md-2' }) + fld('sl_n_' + k, 'ชื่อ', x.name, { col: 'col-9 col-md-6' }) + fld('sl_e_' + k, 'ชื่ออังกฤษ', x.nameEn, { col: 'col-12 col-md-4' }) + '</div>'; }).join('') +
      '<button class="btn btn-brand" onclick="saveSlotL(this)"><i class="bi bi-save"></i> บันทึก</button></div></div>';
  } else {
    S.suBr = S.suBr || (SU.branches[0] || {}).id;
    var list = SU.positions.filter(function(p){ return p.branchId === S.suBr; });
    h = '<div class="d-flex flex-wrap gap-2 align-items-end mb-2">' + brTabs('suBr', SU.branches.map(function(b){ return b.id; }), S.suBr) + '<button class="btn btn-sm btn-brand ms-auto" onclick="posModal()"><i class="bi bi-plus-lg"></i> เพิ่มตำแหน่ง</button></div>' +
      '<div class="card"><div class="card-b p-0"><div class="table-responsive"><table class="table tbl mb-0 su-pos"><thead><tr><th>ตำแหน่ง</th><th>รหัสรายได้</th><th class="num">อัตรา</th><th>เวลามาตรฐาน</th><th class="text-center">กรอบ วันทำการ<br><small>' + esc(slotL('D').s) + ' / ' + esc(slotL('E').s) + '</small></th><th class="text-center">กรอบ วันหยุด<br><small>' + esc(slotL('D').s) + ' / ' + esc(slotL('E').s) + '</small></th><th>ค่าอาหาร</th><th></th></tr></thead><tbody>' +
      (list.length ? list.map(function(p){
        var cur = p.current;
        return '<tr class="' + (p.active === 'FALSE' ? 'op50' : '') + '"><td><b>' + esc(posShort(p.name)) + '</b><div class="small-muted">' + esc(p.id) + (p.active === 'FALSE' ? ' · ปิดใช้งาน' : '') + '</div></td>' +
          '<td>' + (p.incomeCode ? '<code>' + esc(p.incomeCode) + '</code><div class="small-muted">' + esc(p.incomeName) + '</div>' : '<span class="small-muted">ไม่จ่าย</span>') + '</td>' +
          '<td class="num">' + (cur ? '<b>' + money(cur.rate) + '</b><div class="small-muted">ตั้งแต่ ' + esc(thDate(cur.effectiveFrom)) + '</div>' : (p.hourly ? '<span class="pill p-bad">ไม่มีอัตรา</span>' : '—')) + '</td>' +
          '<td class="small">' + slotTag('D') + ' ' + esc(String(p.dayTimes || '').replace(/,/g, ', ')) + '<br>' + slotTag('E') + ' ' + esc(String(p.eveTimes || '—').replace(/,/g, ', ')) + '</td>' +
          '<td class="text-center tnum">' + esc(p.qWorkD) + ' / ' + esc(p.qWorkE) + '</td><td class="text-center tnum">' + esc(p.qHolD) + ' / ' + esc(p.qHolE) + '</td>' +
          '<td>' + (p.mealEligible === 'FALSE' ? '<span class="small-muted">ไม่มี</span>' : '<i class="bi bi-check2 text-success"></i>') + '</td>' +
          '<td class="text-nowrap"><button class="btn btn-sm btn-ghost" onclick="posModal(\'' + p.id + '\')" aria-label="แก้ไขตำแหน่ง"><i class="bi bi-pencil"></i></button> ' + (p.hourly ? '<button class="btn btn-sm btn-soft" onclick="rateModal(\'' + p.id + '\')"><i class="bi bi-cash-coin"></i> อัตรา</button>' : '') + '</td></tr>';
      }).join('') : '<tr><td colspan="8">' + empty('person-vcard', 'ยังไม่มีตำแหน่งในศูนย์นี้') + '</td></tr>') + '</tbody></table></div></div></div>' +
      '<div class="small-muted mt-2">เวลามาตรฐานใส่ได้หลายค่า คั่นด้วย , · กรอบเวรรายวันปรับได้ที่หน้า "ปฏิทิน กรอบเวร ช่วงลงตารางเวร"</div>';
  }
  $('suBody').innerHTML = h;
  if (t === 'pos') bindBrTabs('suBr', function(b){ S.suBr = b; drawSetup(); });
}
function suAfter(d){ SU = d; drawSetup(); refreshBoot(); notify('บันทึกเรียบร้อย'); }
function refreshBoot(){ api('bootstrap', {}, { quiet: true }).then(function(b){ S.boot = b; try { store('bd_boot', JSON.stringify(b)); } catch (e) {} }).catch(function(){}); }
function brModal(id){
  var b = id ? SU.branches.filter(function(x){ return x.id === id; })[0] : { color: '#5b6ee1', mealRate: 50, sortOrder: SU.branches.length + 1, active: 'TRUE' };
  modal(id ? 'แก้ไขศูนย์ ' + b.name : 'เพิ่มศูนย์ใหม่', '<div class="row g-2">' + fld('bmId', 'รหัสศูนย์ (อังกฤษ 2–4 ตัว)', b.id, { col: 'col-4', ro: !!id }) + fld('bmName', 'ชื่อศูนย์ (สั้น)', b.name, { col: 'col-8', ph: 'เช่น บ่อวิน' }) +
    fld('bmFull', 'ชื่อเต็ม', b.fullName, { col: 'col-12', ph: 'ศูนย์บริการสุขภาพสาขา…' }) + fld('bmHr', 'ลำดับศูนย์ใน HR', b.hrNo, { col: 'col-4' }) + fld('bmMc', 'รหัสค่าอาหาร', b.mealCode, { col: 'col-4', ph: 'R706-x' }) + fld('bmMr', 'ค่าอาหาร/วัน', b.mealRate, { col: 'col-4', type: 'number' }) +
    fld('bmMn', 'ชื่อรายการค่าอาหาร', b.mealName, { col: 'col-12' }) + fld('bmColor', 'สีประจำศูนย์', b.color, { col: 'col-4', type: 'color', cls: 'form-control-color w-100' }) + fld('bmSort', 'ลำดับแสดง', b.sortOrder, { col: 'col-4', type: 'number' }) +
    '<div class="col-4 d-flex align-items-end">' + sw('bmAct', 'เปิดใช้งาน', b.active !== 'FALSE') + '</div></div>',
    [{ text: 'ยกเลิก', cls: 'btn-ghost' }, { text: '<i class="bi bi-save"></i> บันทึก', onClick: function(btn){
      api('saveBranch', { id: $('bmId').value, name: $('bmName').value, fullName: $('bmFull').value, hrNo: $('bmHr').value, mealCode: $('bmMc').value, mealRate: $('bmMr').value, mealName: $('bmMn').value, color: $('bmColor').value, sortOrder: $('bmSort').value, active: $('bmAct').checked }, { btn: btn }).then(function(d){ MDL.hide(); suAfter(d); }).catch(function(){});
      return false; } }]);
}
function jobModal(id){
  var j = id ? SU.jobs.filter(function(x){ return x.id === id; })[0] : { hourly: 'TRUE', active: 'TRUE', sortOrder: 99 };
  modal(id ? 'แก้ไขงาน ' + j.name : 'เพิ่มงาน', '<div class="row g-2">' + fld('jmId', 'รหัส (อังกฤษ 2–4 ตัว)', j.id, { col: 'col-4', ro: !!id }) + fld('jmName', 'ชื่องาน', j.name, { col: 'col-8' }) + fld('jmShort', 'ชื่อย่อ', j.short, { col: 'col-6' }) + fld('jmSort', 'ลำดับ', j.sortOrder, { col: 'col-6', type: 'number' }) +
    fld('jmAlias', 'ชื่อตำแหน่ง HR ที่เทียบได้ (คั่นด้วย ,)', j.aliases, { col: 'col-12', help: 'ใช้จับคู่อัตโนมัติว่าใครมีสิทธิ์ลงบันทึกตารางเวรในงานนี้' }) +
    '<div class="col-6">' + sw('jmHourly', 'จ่ายค่าตอบแทนรายชั่วโมง', j.hourly !== 'FALSE') + '</div><div class="col-6">' + sw('jmAct', 'เปิดใช้งาน', j.active !== 'FALSE') + '</div></div>',
    [{ text: 'ยกเลิก', cls: 'btn-ghost' }, { text: '<i class="bi bi-save"></i> บันทึก', onClick: function(btn){
      api('saveJob', { id: $('jmId').value, name: $('jmName').value, short: $('jmShort').value, sortOrder: $('jmSort').value, aliases: $('jmAlias').value, hourly: $('jmHourly').checked, active: $('jmAct').checked }, { btn: btn }).then(function(d){ MDL.hide(); suAfter(d); }).catch(function(){});
      return false; } }]);
}
function posModal(id){
  var p = id ? SU.positions.filter(function(x){ return x.id === id; })[0] : { branchId: S.suBr, dayTimes: '08:00-16:00', eveTimes: '16:00-19:00', qWorkD: 0, qWorkE: 1, qHolD: 1, qHolE: 0, mealEligible: 'TRUE', active: 'TRUE' };
  var jobs = SU.jobs.map(function(j){ return '<option value="' + j.id + '"' + (j.id === p.jobId ? ' selected' : '') + '>' + esc(j.name) + '</option>'; }).join('');
  modal(id ? 'แก้ไขตำแหน่ง' : 'เพิ่มตำแหน่งในศูนย์' + brName(S.suBr), '<div class="row g-2">' +
    '<div class="col-6"><label class="form-label" for="pmBr">ศูนย์</label><select class="form-select" id="pmBr"' + (id ? ' disabled' : '') + '>' + SU.branches.map(function(b){ return '<option value="' + b.id + '"' + (b.id === p.branchId ? ' selected' : '') + '>' + esc(b.name) + '</option>'; }).join('') + '</select></div>' +
    '<div class="col-6"><label class="form-label" for="pmJob">งาน</label><select class="form-select" id="pmJob"' + (id ? ' disabled' : '') + '>' + jobs + '</select></div>' +
    fld('pmName', 'ชื่อตำแหน่ง (บนเอกสาร)', p.name, { col: 'col-12', ph: 'เว้นว่าง = ชื่องาน + ศ.ชื่อศูนย์' }) + fld('pmCode', 'รหัสรายได้ HRMi', p.incomeCode, { col: 'col-5', ph: 'R6xx-x' }) + fld('pmCodeN', 'ชื่อรายได้', p.incomeName, { col: 'col-7' }) +
    fld('pmDay', 'เวลามาตรฐาน ' + esc(slotL('D').name) + ' (หลายค่าคั่นด้วย , · ค่าแรก = เต็มวัน)', p.dayTimes, { col: 'col-12', ph: '08:00-16:00,08:00-14:00', help: 'เช่น ผู้ที่ต้องกลับไปต่อเวรที่ รพ. ใส่ 08:00-14:00 เพิ่ม · ในตารางเวรพิมพ์ ' + esc(slotL('D').s) + '2 = แบบที่ 2' }) + fld('pmEve', 'เวลามาตรฐาน ' + esc(slotL('E').name) + ' (หลายค่าคั่นด้วย ,)', p.eveTimes, { col: 'col-12', ph: '16:00-19:00,16:00-20:00' }) +
    '<div class="col-12"><label class="form-label">กรอบเวรตั้งต้น (คน/ช่วง)</label><div class="q-box">' + [['pmQwd', 'วันทำการ ' + slotL('D').s, p.qWorkD], ['pmQwe', 'วันทำการ ' + slotL('E').s, p.qWorkE], ['pmQhd', 'วันหยุด ' + slotL('D').s, p.qHolD], ['pmQhe', 'วันหยุด ' + slotL('E').s, p.qHolE]].map(function(x){
      return '<div><label for="' + x[0] + '">' + esc(x[1]) + '</label><input class="form-control text-center" type="number" min="0" max="20" id="' + x[0] + '" value="' + esc(x[2]) + '"></div>'; }).join('') + '</div></div>' +
    fld('pmAlias', 'ชื่อตำแหน่งในระบบเดิม (สำหรับนำเข้า คั่นด้วย ,)', p.aliases, { col: 'col-12' }) +
    '<div class="col-6">' + sw('pmMeal', 'มีสิทธิ์ค่าอาหาร (เต็มวัน วันทำการ)', p.mealEligible !== 'FALSE') + '</div><div class="col-6">' + sw('pmAct', 'เปิดใช้งาน', p.active !== 'FALSE') + '</div></div>',
    [{ text: 'ยกเลิก', cls: 'btn-ghost' }, { text: '<i class="bi bi-save"></i> บันทึก', onClick: function(btn){
      api('savePosition', { branchId: $('pmBr').value, jobId: $('pmJob').value, name: $('pmName').value, incomeCode: $('pmCode').value, incomeName: $('pmCodeN').value, dayTimes: $('pmDay').value, eveTimes: $('pmEve').value,
        qWorkD: $('pmQwd').value, qWorkE: $('pmQwe').value, qHolD: $('pmQhd').value, qHolE: $('pmQhe').value, aliases: $('pmAlias').value, mealEligible: $('pmMeal').checked, active: $('pmAct').checked }, { btn: btn }).then(function(d){ MDL.hide(); suAfter(d); }).catch(function(){});
      return false; } }], 'lg');
}
function rateModal(id){
  var p = SU.positions.filter(function(x){ return x.id === id; })[0];
  var hist = (p.history || []).map(function(r){ return '<tr><td>' + esc(thDate(r.effectiveFrom)) + '</td><td>' + (r.effectiveTo ? esc(thDate(r.effectiveTo)) : '<span class="pill p-ok">ปัจจุบัน</span>') + '</td><td class="num"><b>' + money(r.rate) + '</b></td></tr>'; }).join('');
  modal('อัตราค่าตอบแทน · ' + posShort(p.name), '<div class="row g-2 mb-3">' + fld('rmFrom', 'มีผลตั้งแต่วันที่', addYm(S.boot.ym, 1) + '-01', { col: 'col-6', type: 'date' }) + fld('rmRate', 'อัตรา (บาท/ชั่วโมง)', '', { col: 'col-6', type: 'number', attr: ' min="1" step="0.5"' }) +
    '<div class="col-12 small-muted">ระบบปิดอัตราเดิมให้อัตโนมัติ (สิ้นสุดวันก่อนหน้า) และคำนวณเวรตามวันที่ปฏิบัติงาน</div></div>' +
    '<div class="fw-semibold mb-1">ประวัติอัตรา</div><table class="table tbl mb-0"><thead><tr><th>ตั้งแต่</th><th>ถึง</th><th class="num">บาท/ชม.</th></tr></thead><tbody>' + (hist || '<tr><td colspan="3" class="small-muted">ยังไม่มีอัตรา</td></tr>') + '</tbody></table>',
    [{ text: 'ปิด', cls: 'btn-ghost' }, { text: '<i class="bi bi-plus-lg"></i> เพิ่มอัตราใหม่', onClick: function(btn){
      api('saveRate', { positionId: id, rate: $('rmRate').value, effectiveFrom: $('rmFrom').value }, { btn: btn }).then(function(d){ MDL.hide(); suAfter(d); }).catch(function(){});
      return false; } }]);
}
function saveSlotL(btn){
  var o = {}; ['D', 'E'].forEach(function(k){ o[k] = { s: $('sl_s_' + k).value, name: $('sl_n_' + k).value, nameEn: $('sl_e_' + k).value, en: k }; });
  api('saveSlotLabels', { labels: o }, { btn: btn }).then(function(L){ S.boot.labels = L; notify('บันทึกชื่อช่วงเวรแล้ว'); drawSetup(); }).catch(function(){});
}

/* ================= ปฏิทิน กรอบเวร ช่วงลงตารางเวร ================= */
var CA = null;
PAGES.calendar = function(){
  var ym = S.caYm || addYm(S.boot.ym, 1);
  S.caTab = S.caTab || 'day';
  mount(pageHead('การตั้งค่า', 'ปฏิทิน กรอบเวร และช่วงลงตารางเวร', 'กำหนดวันหยุดนักขัตฤกษ์ วันหยุดชดเชย วันปิดศูนย์ กรอบเวรรายวัน และช่วงเปิดลงตารางเวร (เสาร์–อาทิตย์เป็นวันหยุดอัตโนมัติ)') +
    '<div class="filters">' + ymSelect('caYm', ym, 6, 6) + '<div><label class="form-label">หมวด</label>' + segHtml('caTab', [['day', '<i class="bi bi-calendar3"></i> ประเภทวัน'], ['quota', '<i class="bi bi-people"></i> กรอบเวรรายวัน']], S.caTab) + '</div></div>' +
    '<div id="caWin"></div>' + dayLegend() + '<div id="caBody" class="mt-2">' + skeleton(8) + '</div>');
  $('caYm').onchange = function(){ S.caYm = this.value; loadCal(); };
  bindSeg('caTab', function(v){ S.caTab = v; drawCal(); });
  loadCal();
};
function loadCal(){ api('getCalendar', { ym: $('caYm').value }).then(function(d){ CA = d; drawCal(); }).catch(function(){}); }
function drawCal(){
  if (!$('caBody') || !CA) return;
  var w = CA.window;
  $('caWin').innerHTML = '<div class="card mb-3"><div class="card-b d-flex flex-wrap gap-3 align-items-end"><div><div class="form-label">ช่วงลงตารางเวรของเดือน ' + esc(thYm(CA.ym)) + '</div>' + windowPill(CA.windowState) + (w.custom ? ' <span class="pill p-info">กำหนดเอง</span>' : ' <span class="small-muted">ตามค่าตั้งต้น</span>') + '</div>' +
    '<div><label class="form-label" for="bwFrom">เปิดลงตารางเวร</label><input class="form-control" type="date" id="bwFrom" value="' + esc(w.openFrom) + '"></div><div><label class="form-label" for="bwTo">ปิดลงตารางเวร</label><input class="form-control" type="date" id="bwTo" value="' + esc(w.openTo) + '"></div>' +
    '<button class="btn btn-brand" onclick="saveBw(this)"><i class="bi bi-save"></i> บันทึกช่วงลงตารางเวร</button>' + (w.custom ? '<button class="btn btn-ghost" onclick="saveBw(this,true)">ใช้ค่าตั้งต้น</button>' : '') + '</div></div>';
  var h = '';
  if (S.caTab === 'day') {
    h = '<div class="card"><div class="card-h"><h3>ประเภทวัน</h3><span class="sub">วันหยุดชดเชยคิดแบบวันหยุด · ปิดศูนย์ = ไม่มีเวร (เลือกเฉพาะบางศูนย์ได้)</span><button class="btn btn-sm btn-brand ms-auto" onclick="saveCal(this)"><i class="bi bi-save"></i> บันทึกปฏิทิน</button></div><div class="card-b p-0"><div class="table-responsive" style="max-height:66vh"><table class="table tbl mb-0 ca-t"><thead><tr><th>วันที่</th><th>ประเภทวัน</th><th>ชื่อวัน/หมายเหตุ</th><th>ปิดเฉพาะศูนย์</th></tr></thead><tbody>' +
      CA.dates.map(function(x){
        var cb = String(x.closedBranches || '').split(',').filter(String);
        return '<tr class="cal-row ' + dk(x.color) + '" data-d="' + x.date + '"><td class="text-nowrap fw-semibold">' + TH_D[x.dow] + ' ' + esc(thDate(x.date)) + '</td>' +
          '<td><select class="form-select form-select-sm ca-type" aria-label="ประเภทวัน ' + esc(x.date) + '"><option value="">ตามปกติ (' + (x.dow === 0 || x.dow === 6 ? 'เสาร์-อาทิตย์' : 'วันทำการ') + ')</option>' + [['WORKDAY', 'วันทำการ (ทำงานวันเสาร์-อาทิตย์)'], ['HOLIDAY', 'วันหยุดนักขัตฤกษ์'], ['COMP', 'วันหยุดชดเชย'], ['CLOSED', 'ปิดทุกศูนย์']].map(function(o){ return '<option value="' + o[0] + '"' + (x.dayType === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></td>' +
          '<td><input class="form-control form-control-sm ca-note" value="' + esc(x.dayType || x.closedBranches ? x.note : '') + '" placeholder="—" aria-label="หมายเหตุ"></td>' +
          '<td class="text-nowrap">' + S.boot.branches.map(function(b){ return '<label class="ca-cb" style="--bc:' + esc(b.color) + '"><input type="checkbox" value="' + b.id + '"' + (cb.indexOf(b.id) >= 0 ? ' checked' : '') + '><span>' + esc(b.name) + '</span></label>'; }).join('') + '</td></tr>';
      }).join('') + '</tbody></table></div></div></div>';
  } else {
    S.caBr = S.caBr || S.boot.branches[0].id;
    var pos = S.boot.positions.filter(function(p){ return p.branchId === S.caBr; });
    h = '<div class="d-flex flex-wrap gap-2 align-items-end mb-2">' + brTabs('caBr', S.boot.branches.map(function(b){ return b.id; }), S.caBr) + '<div class="ms-auto d-flex gap-2"><button class="btn btn-sm btn-ghost" onclick="resetQuota(this)"><i class="bi bi-arrow-counterclockwise"></i> คืนค่าตั้งต้นทั้งเดือน</button><button class="btn btn-sm btn-brand" onclick="saveQuota(this)"><i class="bi bi-save"></i> บันทึกกรอบเวร</button></div></div>' +
      '<div class="card"><div class="card-b p-0"><div class="table-responsive" style="max-height:66vh"><table class="table tbl mb-0 qt-t"><thead><tr><th rowspan="2" class="sticky-l">วันที่</th>' + pos.map(function(p){ return '<th colspan="2" class="text-center">' + esc(posShort(p.name)) + '</th>'; }).join('') + '</tr><tr>' +
      pos.map(function(){ return '<th class="text-center">' + slotTag('D') + '</th><th class="text-center">' + slotTag('E') + '</th>'; }).join('') + '</tr></thead><tbody>' +
      CA.dates.map(function(x){ return '<tr class="cal-row ' + dk(x.color) + '"><td class="sticky-l text-nowrap fw-semibold ' + dk(x.color) + '">' + TH_D[x.dow] + ' ' + x.d + '</td>' + pos.map(function(p){ return ['D', 'E'].map(function(s){
        var q = CA.quotas[p.id + '|' + x.date + '|' + s] || { q: 0 };
        return '<td class="text-center"><input class="form-control form-control-sm q-in' + (q.custom ? ' q-custom' : '') + '" type="number" min="0" max="20" data-k="' + x.date + '|' + p.id + '|' + s + '" data-o="' + q.q + '" value="' + q.q + '" aria-label="กรอบ ' + esc(posShort(p.name)) + ' ' + s + ' ' + x.d + '"></td>'; }).join(''); }).join('') + '</tr>'; }).join('') +
      '</tbody></table></div></div></div><div class="small-muted mt-2">ช่องขอบสีม่วง = กำหนดเฉพาะวัน · ค่าตั้งต้นแก้ไขที่หน้า "ศูนย์ ตำแหน่ง และอัตรา"</div>';
  }
  $('caBody').innerHTML = h;
  if (S.caTab === 'quota') {
    bindBrTabs('caBr', function(b){ S.caBr = b; drawCal(); });
    $$('.q-in').forEach(function(i){ i.oninput = function(){ i.classList.toggle('q-dirty', i.value !== i.dataset.o); }; });
  }
}
function saveBw(btn, reset){
  api('saveBookingWindow', { ym: CA.ym, openFrom: reset ? '' : $('bwFrom').value, openTo: reset ? '' : $('bwTo').value }, { btn: btn }).then(function(){ notify('บันทึกช่วงลงตารางเวรแล้ว'); loadCal(); }).catch(function(){});
}
function saveCal(btn){
  var items = $$('.ca-t tbody tr').map(function(tr){ return { date: tr.dataset.d, dayType: $$('.ca-type', tr)[0].value, note: $$('.ca-note', tr)[0].value.trim(), closedBranches: $$('.ca-cb input', tr).filter(function(c){ return c.checked; }).map(function(c){ return c.value; }).join(',') }; });
  api('saveCalendar', { ym: CA.ym, items: items }, { btn: btn, block: 'กำลังบันทึกและคำนวณใหม่…' }).then(function(d){ CA = d; notify('บันทึกปฏิทินแล้ว'); drawCal(); }).catch(function(){});
}
function saveQuota(btn){
  var items = $$('.q-in.q-dirty').map(function(i){ var k = i.dataset.k.split('|'); return { date: k[0], positionId: k[1], slot: k[2], quota: i.value === '' ? '' : +i.value }; });
  if (!items.length) return notify('ยังไม่มีการเปลี่ยนแปลง', 'info');
  api('saveQuotas', { ym: CA.ym, items: items }, { btn: btn }).then(function(r){ notify('บันทึกกรอบเวร ' + r.saved + ' ช่อง'); loadCal(); }).catch(function(){});
}
function resetQuota(btn){
  var items = $$('.q-in.q-custom').map(function(i){ var k = i.dataset.k.split('|'); return { date: k[0], positionId: k[1], slot: k[2], quota: '' }; });
  if (!items.length) return notify('ศูนย์นี้ใช้ค่าตั้งต้นทั้งเดือนอยู่แล้ว', 'info');
  confirmBox('คืนค่าตั้งต้น', 'ลบกรอบเวรที่กำหนดเฉพาะวัน ' + items.length + ' ช่อง ของศูนย์' + brName(S.caBr), 'คืนค่าตั้งต้น', true).then(function(ok){
    if (ok) api('saveQuotas', { ym: CA.ym, items: items }, { btn: btn }).then(function(){ notify('คืนค่าตั้งต้นแล้ว'); loadCal(); }).catch(function(){});
  });
}

/* ================= ผู้ลงนามในเอกสาร ================= */
var SG = null;
PAGES.signers = function(){
  S.sgBr = S.sgBr || S.boot.branches[0].id;
  mount(pageHead('การตั้งค่า', 'ผู้ลงนามในเอกสาร', 'ชื่อและตำแหน่งผู้ลงนามแยกตามศูนย์และชนิดเอกสาร · กำหนดรายตำแหน่งได้ถ้าผู้ตรวจต่างกัน · ช่องว่างใช้ค่าตั้งต้น') +
    '<div class="filters"><div class="flex-grow-1"><label class="form-label">ศูนย์</label>' + brTabs('sgBr', ['*'].concat(S.boot.branches.map(function(b){ return b.id; })), S.sgBr).replace('data-b="*" style="--bc:#8a8fae"><i></i>*', 'data-b="*" style="--bc:#8a8fae"><i></i>ทุกศูนย์ (ค่ากลาง)') + '</div></div><div id="sgBody">' + skeleton(6) + '</div>');
  bindBrTabs('sgBr', function(b){ S.sgBr = b; drawSigners(); });
  api('getSigners').then(function(d){ SG = d; drawSigners(); }).catch(function(){});
};
function sgFind(b, k, pos){ return SG.list.filter(function(r){ return r.branchId === b && r.docKind === k && r.positionId === (pos || '*'); })[0] || null; }
function sgBlock(pre, r, def, pos){
  var f = function(k, lbl){ return '<div class="col-md-4"><label class="form-label" for="' + pre + k + '">' + lbl + '</label><input class="form-control sg-in" id="' + pre + k + '" data-k="' + k + '" value="' + esc(r ? r[k] : '') + '" placeholder="' + esc(def ? def[k] || '' : '') + '"></div>'; };
  return '<div class="row g-2 mb-2">' + f('s1Label', 'ผู้ลงนาม 1 · ข้อความ') + f('s1Name', 'ชื่อ-สกุล') + f('s1Title', 'ตำแหน่ง') + '</div><div class="row g-2">' + f('s2Label', 'ผู้ลงนาม 2 · ข้อความ') + f('s2Name', 'ชื่อ-สกุล') + f('s2Title', 'ตำแหน่ง') + '</div>';
}
function drawSigners(){
  if (!$('sgBody') || !SG) return;
  var b = S.sgBr, h = '';
  Object.keys(SG.kinds).forEach(function(k){
    var def = SG.defaults[(b === '*' ? S.boot.branches[0].id : b) + '|' + k];
    var r = sgFind(b, k), inh = b !== '*' && !r && sgFind('*', k);
    h += '<div class="card mb-3 sg-card" data-b="' + b + '" data-k="' + k + '" data-p="*"><div class="card-h"><h3><i class="bi bi-file-earmark-text"></i> ' + esc(SG.kinds[k]) + '</h3>' + (r ? '<span class="pill p-info">กำหนดแล้ว</span>' : inh ? '<span class="pill p-slate">ใช้ค่ากลาง</span>' : '<span class="pill p-mute">ค่าตั้งต้น</span>') + '</div><div class="card-b">' + sgBlock('sg_' + k + '_', r || inh, def) + '</div></div>';
    if (b !== '*' && k !== 'MEAL') {
      var extra = SG.list.filter(function(x){ return x.branchId === b && x.docKind === k && x.positionId !== '*'; });
      extra.forEach(function(x, i){ h += '<div class="card mb-3 sg-card sg-sub" data-b="' + b + '" data-k="' + k + '" data-p="' + esc(x.positionId) + '"><div class="card-h"><h3><i class="bi bi-person-vcard"></i> ' + esc(SG.kinds[k]) + ' · ' + esc(posShort(posName(x.positionId))) + '</h3><button class="btn btn-sm btn-danger-soft ms-auto" onclick="sgRemove(\'' + b + '\',\'' + k + '\',\'' + esc(x.positionId) + '\')"><i class="bi bi-trash3"></i> ลบ</button></div><div class="card-b">' + sgBlock('sgp_' + k + i + '_', x, def) + '</div></div>'; });
    }
  });
  h += '<div class="d-flex flex-wrap gap-2">' + (b !== '*' ? '<button class="btn btn-ghost" onclick="sgAddPos()"><i class="bi bi-plus-lg"></i> กำหนดผู้ลงนามเฉพาะตำแหน่ง</button>' : '') + '<button class="btn btn-brand ms-auto" onclick="sgSave(this)"><i class="bi bi-save"></i> บันทึกผู้ลงนาม</button></div>' +
    '<div class="small-muted mt-2">ลำดับการเลือก: ศูนย์+ตำแหน่ง → ศูนย์ → ทุกศูนย์ → ค่าตั้งต้น · ช่องว่างใช้ข้อความสีจางที่แสดงอยู่</div>';
  $('sgBody').innerHTML = h;
}
function sgAddPos(){
  modal('กำหนดผู้ลงนามเฉพาะตำแหน่ง', '<div class="row g-2">' + posSelect('sgPos', S.sgBr, '', false) + '<div><label class="form-label" for="sgKind">เอกสาร</label><select class="form-select" id="sgKind"><option value="SIGN">' + esc(SG.kinds.SIGN) + '</option><option value="HOURS">' + esc(SG.kinds.HOURS) + '</option></select></div></div>',
    [{ text: 'ยกเลิก', cls: 'btn-ghost' }, { text: 'เพิ่ม', onClick: function(){ var pid = $('sgPos').value, k = $('sgKind').value; if (!sgFind(S.sgBr, k, pid)) SG.list.push({ branchId: S.sgBr, docKind: k, positionId: pid, s1Label: '', s1Name: '', s1Title: '', s2Label: '', s2Name: '', s2Title: '' }); drawSigners(); } }]);
}
function sgRemove(b, k, p){ api('saveSigners', { items: [{ branchId: b, docKind: k, positionId: p, remove: true }] }).then(function(d){ SG = d; notify('ลบแล้ว'); drawSigners(); }).catch(function(){}); }
function sgSave(btn){
  var items = $$('.sg-card').map(function(c){
    var o = { branchId: c.dataset.b, docKind: c.dataset.k, positionId: c.dataset.p }, any = false;
    $$('.sg-in', c).forEach(function(i){ o[i.dataset.k] = i.value.trim(); if (o[i.dataset.k]) any = true; });
    var had = sgFind(o.branchId, o.docKind, o.positionId);
    if (!any && !had) return null;
    if (!any && o.positionId === '*') o.remove = true;
    return o;
  }).filter(Boolean);
  // ค่าที่ขึ้นแบบ "ใช้ค่ากลาง" ถ้าไม่ได้แก้ ไม่ต้องบันทึกซ้ำ
  items = items.filter(function(o){ if (o.remove || o.branchId === '*' || sgFind(o.branchId, o.docKind, o.positionId)) return true; var g = sgFind('*', o.docKind, '*'); return !g || ['s1Label', 's1Name', 's1Title', 's2Label', 's2Name', 's2Title'].some(function(k){ return (g[k] || '') !== o[k]; }); });
  if (!items.length) return notify('ยังไม่มีการเปลี่ยนแปลง', 'info');
  api('saveSigners', { items: items }, { btn: btn }).then(function(d){ SG = d; notify('บันทึกผู้ลงนามแล้ว'); drawSigners(); }).catch(function(){});
}

/* ================= ข้อมูลบุคลากร ================= */
var EM = { list: null };
PAGES.employees = function(){
  mount(pageHead('การตั้งค่า', 'ข้อมูลบุคลากร', 'ซิงก์จากระบบ HR ทุกคืน · กำหนดกลุ่มการจ่าย (Part Time / ประจำ) ศูนย์ต้นสังกัด และงานที่ขึ้นเวรได้',
    isCentral() ? '<button class="btn btn-ghost" onclick="probeEmp()"><i class="bi bi-search"></i> ตรวจข้อมูลจาก HR</button><button class="btn btn-ghost" onclick="syncEmp(this)"><i class="bi bi-arrow-repeat"></i> ซิงก์จาก HR</button><button class="btn btn-brand" onclick="addEmp()"><i class="bi bi-person-plus"></i> เพิ่มบุคลากร</button>' : '') +
    '<div class="filters"><div class="flex-grow-1" style="min-width:220px"><label class="form-label" for="emQ">ค้นหา</label><input class="form-control" id="emQ" placeholder="รหัส ชื่อ ตำแหน่ง หน่วยงาน"></div>' +
    '<div><label class="form-label" for="emG">กลุ่มการจ่าย</label><select class="form-select" id="emG"><option value="">ทั้งหมด</option><option value="pt">Part Time (จ่ายทุกช่วง)</option><option value="ft">ประจำ (วันทำการเต็มเวลา)</option><option value="set">กำหนดเอง</option></select></div>' +
    '<div><label class="form-label" for="emB">ศูนย์ต้นสังกัด</label><select class="form-select" id="emB"><option value="">ทั้งหมด</option>' + S.boot.branches.map(function(b){ return '<option value="' + b.id + '">' + esc(b.name) + '</option>'; }).join('') + '<option value="-">ไม่ระบุ</option></select></div>' +
    '<div><label class="form-label" for="emS">สถานะ</label><select class="form-select" id="emS"><option value="ACTIVE">ปฏิบัติงาน</option><option value="">ทั้งหมด</option><option value="INACTIVE">พ้นสภาพ</option></select></div></div><div id="emBody">' + skeleton(10) + '</div>');
  ['emQ', 'emG', 'emB', 'emS'].forEach(function(id){ $(id)[id === 'emQ' ? 'oninput' : 'onchange'] = drawEmp; });
  api('listEmployees', {}, { fresh: true, onCache: function(l){ EM.list = l; drawEmp(); } }).then(function(l){ EM.list = l; drawEmp(); }).catch(function(){});
};
function drawEmp(){
  if (!$('emBody') || !EM.list) return;
  var q = $('emQ').value.trim().toLowerCase(), g = $('emG').value, b = $('emB').value, st = $('emS').value;
  var list = EM.list.filter(function(e){
    if (st && e.status !== st) return false;
    if (g === 'pt' && !e.partTime) return false; if (g === 'ft' && e.partTime) return false; if (g === 'set' && !e.partTimeSet) return false;
    if (b === '-' ? e.homeBranch : b && e.homeBranch !== b) return false;
    return !q || (e.empCode + ' ' + e.fullName + ' ' + e.hrPosition + ' ' + e.division + ' ' + e.orgUnit).toLowerCase().indexOf(q) >= 0;
  });
  var jn = function(id){ var j = S.boot.jobs.filter(function(x){ return x.id === id; })[0]; return j ? j.short || j.name : id; };
  $('emBody').innerHTML = '<div class="small-muted mb-2">' + fmt(list.length) + ' จาก ' + fmt(EM.list.length) + ' คน</div><div class="card"><div class="card-b p-0"><div class="table-responsive"><table class="table tbl table-hover mb-0"><thead><tr><th>รหัส</th><th>ชื่อ-สกุล</th><th>ตำแหน่ง HR / หน่วยงาน</th><th>กลุ่มการจ่าย</th><th>ศูนย์ต้นสังกัด</th><th>งานที่ขึ้นเวร</th><th></th></tr></thead><tbody>' +
    list.slice(0, 400).map(function(e){
      var jobs = e.allowedJobs.concat(e.usedJobs.filter(function(j){ return e.allowedJobs.indexOf(j) < 0; }));
      return '<tr class="' + (e.status !== 'ACTIVE' ? 'op50' : '') + '"><td class="tnum">' + esc(e.empCode) + '</td><td><b>' + esc(e.fullName) + '</b>' + stopPill(e.dateStop, e.status !== 'ACTIVE') + '</td>' +
        '<td class="small">' + esc(e.hrPosition) + '<div class="small-muted">' + esc(e.orgUnit || e.division) + '</div></td>' +
        '<td>' + (e.partTime ? '<span class="pill p-violet">Part Time</span>' : '<span class="pill p-slate">ประจำ</span>') + (e.partTimeSet ? '' : ' <span class="small-muted" title="กำหนดจากชื่อตำแหน่ง HR">อัตโนมัติ</span>') + '</td>' +
        '<td>' + (e.homeBranch ? brDot(e.homeBranch) : '<span class="small-muted">—</span>') + '</td>' +
        '<td>' + jobs.map(function(j){ return '<span class="mini-tag' + (e.allowedJobs.indexOf(j) >= 0 ? ' on' : '') + '">' + esc(jn(j)) + '</span>'; }).join(' ') + '</td>' +
        '<td>' + (isCentral() ? '<button class="btn btn-sm btn-ghost" onclick="empModal(\'' + e.empCode + '\')" aria-label="แก้ไข ' + esc(e.fullName) + '"><i class="bi bi-pencil"></i></button>' : '') + '</td></tr>';
    }).join('') + (list.length > 400 ? '<tr><td colspan="7" class="small-muted text-center">แสดง 400 รายการแรก กรุณาค้นหาเพิ่ม</td></tr>' : '') + (!list.length ? '<tr><td colspan="7">' + empty('people', 'ไม่พบบุคลากรตามเงื่อนไข') + '</td></tr>' : '') + '</tbody></table></div></div></div>';
}
function empModal(code){
  var e = EM.list.filter(function(x){ return x.empCode === code; })[0];
  modal(e.fullName, '<div class="small-muted mb-3">' + esc(e.empCode) + ' · ' + esc(e.hrPosition) + '<br>' + esc(e.division) + ' / ' + esc(e.orgUnit) + (e.dateStop ? '<br>DateStop ตาม HR (วันสิ้นสุดสัญญา/เกษียณ/ลาออก): ' + esc(thDate(e.dateStop)) + (e.status !== 'ACTIVE' ? ' · <b>พ้นสภาพแล้ว</b>' : '') : '') + (e.lastLogin ? '<br>เข้าใช้ล่าสุด ' + esc(e.lastLogin) : '') + '</div><div class="row g-2">' +
    '<div class="col-md-6"><label class="form-label" for="epPt">กลุ่มการจ่าย</label><select class="form-select" id="epPt"><option value="">อัตโนมัติจากชื่อตำแหน่ง HR (' + (/part\s*-?\s*time/i.test(e.hrPosition) ? 'Part Time' : 'ประจำ') + ')</option><option value="TRUE">Part Time · จ่ายรายชั่วโมงทุกช่วง ไม่มีค่าอาหาร</option><option value="FALSE">ประจำ · วันทำการ 08–16 เต็มเวลา (ค่าอาหาร)</option></select></div>' +
    '<div class="col-md-6"><label class="form-label" for="epHb">ศูนย์ต้นสังกัด</label><select class="form-select" id="epHb"><option value="">ไม่ระบุ</option>' + S.boot.branches.map(function(b){ return '<option value="' + b.id + '">' + esc(b.name) + '</option>'; }).join('') + '</select></div>' +
    '<div class="col-12"><label class="form-label">งานที่ขึ้นเวรได้ (นอกเหนือจากที่เทียบจากตำแหน่ง HR)</label><div class="d-flex flex-wrap gap-2">' + S.boot.jobs.map(function(j){ return '<label class="ca-cb"><input type="checkbox" class="ep-job" value="' + j.id + '"' + (e.allowedJobs.indexOf(j.id) >= 0 ? ' checked' : '') + '><span>' + esc(j.name) + '</span></label>'; }).join('') + '</div></div>' +
    fld('epPhone', 'โทรศัพท์', e.phone, { col: 'col-md-6' }) + fld('epNote', 'หมายเหตุ', e.note, { col: 'col-md-6' }) + '</div>',
    [{ text: 'ยกเลิก', cls: 'btn-ghost' }, { text: '<i class="bi bi-save"></i> บันทึก', onClick: function(btn){
      var p = { empCode: code, partTime: $('epPt').value, homeBranch: $('epHb').value, allowedJobs: $$('.ep-job').filter(function(c){ return c.checked; }).map(function(c){ return c.value; }), phone: $('epPhone').value, note: $('epNote').value };
      api('updateEmployee', p, { btn: btn }).then(function(){ e.partTimeSet = p.partTime; e.partTime = p.partTime ? p.partTime === 'TRUE' : /part\s*-?\s*time/i.test(e.hrPosition); e.homeBranch = p.homeBranch; e.allowedJobs = p.allowedJobs; e.phone = p.phone; e.note = p.note; MDL.hide(); notify('บันทึกแล้ว'); drawEmp(); }).catch(function(){});
      return false; } }], 'lg');
  setSel('epPt', e.partTimeSet || ''); setSel('epHb', e.homeBranch || '');
}
function addEmp(){
  modal('เพิ่มบุคลากร', '<label class="form-label" for="aeCodes">รหัสเจ้าหน้าที่ (หลายรหัสคั่นด้วย , หรือขึ้นบรรทัดใหม่)</label><textarea class="form-control mb-2" id="aeCodes" rows="3" placeholder="5660101, 5770123"></textarea>' +
    '<div class="row g-2"><div class="col-6"><label class="form-label" for="aeHb">ศูนย์ต้นสังกัด (ถ้ามี)</label><select class="form-select" id="aeHb"><option value="">ไม่ระบุ</option>' + S.boot.branches.map(function(b){ return '<option value="' + b.id + '">' + esc(b.name) + '</option>'; }).join('') + '</select></div></div><div class="small-muted mt-2">ระบบดึงชื่อ ตำแหน่ง และหน่วยงานจาก HR ให้อัตโนมัติ และสร้างบัญชีผู้ใช้ (รหัสผ่านเริ่มต้น = รหัสเจ้าหน้าที่)</div>',
    [{ text: 'ยกเลิก', cls: 'btn-ghost' }, { text: '<i class="bi bi-person-plus"></i> เพิ่ม', onClick: function(btn){
      api('addEmployees', { codes: $('aeCodes').value, homeBranch: $('aeHb').value }, { btn: btn }).then(function(r){ MDL.hide();
        alertBox('เพิ่มบุคลากร', 'เพิ่มใหม่ ' + r.added.length + ' · ปรับปรุง ' + r.updated.length + (r.notFound.length ? '\nไม่พบในระบบ HR: ' + r.notFound.join(', ') : ''), r.notFound.length ? 'warning' : 'success'); go('employees'); }).catch(function(){});
      return false; } }]);
}
/** 1 ต.ค. 69: ซิงก์แล้วแจ้งว่าเกิดอะไรขึ้น (ใครพ้นสภาพ/วันพ้นสภาพเปลี่ยน · HR ส่งฟิลด์อะไรมา) */
function syncEmp(btn){
  api('syncEmployeesNow', {}, { btn: btn, block: 'กำลังซิงก์ข้อมูลจาก HR…', timeout: 300000 }).then(function(r){
    var ch = r.changes || [], st = function(s){ return s === 'ACTIVE' ? 'ปฏิบัติงาน' : s === 'INACTIVE' ? 'พ้นสภาพ' : (s || '—'); };
    var a = r.apiActive || {};
    var h = '<div class="small-muted mb-2">ซิงก์ ' + fmt(r.total || 0) + ' คน · ข้อมูลเปลี่ยน ' + fmt(r.changed || 0) + ' คน · พ้นสภาพในระบบ ' + fmt(r.inactive || 0) + ' คน · มีวันพ้นสภาพ ' + fmt(r.withStop || 0) + ' คน</div>' +
      '<div class="small mb-2">สถานะที่ HR ส่งมา: ปฏิบัติงาน ' + fmt(a.yes || 0) + ' · พ้นสภาพ ' + fmt(a.no || 0) + ' · ไม่ระบุ ' + fmt(a.unknown || 0) + (r.notFound && r.notFound.length ? ' · <b>ไม่พบรหัสใน HR ' + r.notFound.length + '</b>' : '') + '</div>' +
      (ch.length ? '<div class="sync-chg"><table class="table table-sm mb-2"><thead><tr><th>รหัส</th><th>ชื่อ</th><th>สถานะ</th><th>DateStop (HR)</th></tr></thead><tbody>' + ch.map(function(c){
        return '<tr><td class="tnum">' + esc(c.empCode) + '</td><td>' + esc(c.name || '') + '</td><td>' + esc(st(c.from)) + (c.from !== c.to ? ' → <b>' + esc(st(c.to)) + '</b>' : '') + (c.found ? '' : ' <span class="pill p-bad nodot">ไม่พบใน HR</span>') + '</td><td>' + (c.dateStop ? esc(thDate(c.dateStop)) : '—') + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<div class="small mb-2">ไม่มีใครเปลี่ยนสถานะหรือวันพ้นสภาพ</div>') +
      '<div class="small-muted">ฟิลด์ที่ HR ส่งมา: ' + esc((r.fields || []).join(', ') || '—') + '</div>' +
      '<div class="small-muted mt-1">กติกา: DateStop ผ่านไปแล้ว = พ้นสภาพ · ยังไม่ถึง (วันเกษียณ/สิ้นสุดสัญญาในอนาคต) = ปฏิบัติงาน · คนพ้นสภาพยังลงเวรได้ เวรทุกเวรติดธงส้มให้เห็น</div>';
    modal('ผลการซิงก์ข้อมูลจาก HR', h, null, 'lg');
    if ($('emBody')) api('listEmployees', {}, { fresh: true, quiet: true }).then(function(l){ EM.list = l; drawEmp(); }).catch(function(){});
  }).catch(function(){});
}
/** ตรวจข้อมูลดิบที่ HR (SmartAPI) ส่งมาของรหัสเดียว (ไม่แสดงฟิลด์ส่วนบุคคล) */
function probeEmp(code){
  modal('ตรวจข้อมูลจาก HR', '<div class="d-flex gap-2 mb-2"><input class="form-control" id="pbCode" placeholder="รหัสเจ้าหน้าที่" value="' + esc(code || '') + '"><button class="btn btn-brand text-nowrap" id="pbGo"><i class="bi bi-search"></i> ตรวจ</button></div><div id="pbOut" class="hr-probe small-muted">ดูว่า HR ส่งข้อมูลอะไรมา และระบบอ่านสถานะ/วันพ้นสภาพอย่างไร</div>');
  var run = function(){
    var c = $('pbCode').value.trim(); if (!c) return;
    $('pbOut').innerHTML = skeleton(4);
    api('probeEmp', { empCode: c }, { quiet: true }).then(function(r){
      if (!r.found) { $('pbOut').innerHTML = '<div class="dd-stop">ไม่พบรหัส ' + esc(c) + ' ในข้อมูล HR (SmartAPI ไม่ส่งข้อมูลกลับ)</div>'; return; }
      var R = r.read, S = r.stored, act = R.active === true ? 'ปฏิบัติงาน' : R.active === false ? 'พ้นสภาพ' : 'ไม่ระบุ';
      var h = '<div class="mb-2"><b>' + esc(R.fullName) + '</b> · ' + esc(R.hrPosition) + '</div><table><tbody>' +
        '<tr><td>ระบบอ่านได้ว่า</td><td>DateStop: <b>' + (R.dateStop ? esc(thDate(R.dateStop)) : '—') + '</b>' + (R.active !== null ? ' · สถานะจาก HR: <b>' + act + '</b>' : '') + ' → สถานะในระบบ <b>' + (r.statusNow === 'ACTIVE' ? 'ปฏิบัติงาน' : 'พ้นสภาพ') + '</b></td></tr>' +
        '<tr><td>ที่เก็บในระบบตอนนี้</td><td>' + (S ? esc(S.status === 'ACTIVE' ? 'ปฏิบัติงาน' : 'พ้นสภาพ') + (S.dateStop ? ' · DateStop ' + esc(thDate(S.dateStop)) : '') + ' <span class="small-muted">(ซิงก์ ' + esc(S.lastSync || '—') + ')</span>' : 'ยังไม่อยู่ในรายชื่อบุคลากรของระบบ') + '</td></tr>' +
        Object.keys(r.fields).map(function(k){ return '<tr><td>' + esc(k) + '</td><td>' + esc(r.fields[k] === null ? 'null' : String(r.fields[k])) + '</td></tr>'; }).join('') + '</tbody></table>';
      $('pbOut').innerHTML = h;
    }).catch(function(e){ $('pbOut').innerHTML = '<div class="dd-stop">' + esc(e && (e.text || e.title || e.message) || 'ตรวจไม่สำเร็จ') + '</div>'; });
  };
  $('pbGo').onclick = run; $('pbCode').onkeydown = function(e){ if (e.key === 'Enter') run(); };
  if (code) run(); else setTimeout(function(){ $('pbCode').focus(); }, 250);
}

/* ================= ผู้ใช้งานและสิทธิ์ ================= */
var US = null;
PAGES.users = function(){
  mount(pageHead('การตั้งค่า', 'ผู้ใช้งานและสิทธิ์', 'บุคลากรทุกคนเข้าระบบได้ (บทบาทบุคลากร) · กำหนดผู้ดูแลศูนย์ เจ้าหน้าที่กลาง และผู้ดูแลระบบที่นี่',
    '<button class="btn btn-brand" onclick="userModal()"><i class="bi bi-person-plus"></i> กำหนดสิทธิ์</button>') +
    '<div class="filters"><div class="flex-grow-1"><label class="form-label" for="usQ">ค้นหา</label><input class="form-control" id="usQ" placeholder="รหัส ชื่อ"></div><div><label class="form-label" for="usR">บทบาท</label><select class="form-select" id="usR"><option value="x">ที่มีสิทธิ์พิเศษ</option><option value="">ทั้งหมด</option><option value="BRANCH">ผู้ดูแลศูนย์</option><option value="CENTRAL">เจ้าหน้าที่กลาง</option><option value="ADMIN">ผู้ดูแลระบบ</option></select></div></div><div id="usBody">' + skeleton(8) + '</div>');
  $('usQ').oninput = drawUsers; $('usR').onchange = drawUsers;
  api('listUsers').then(function(l){ US = l; drawUsers(); }).catch(function(){});
};
function drawUsers(){
  if (!$('usBody') || !US) return;
  var q = $('usQ').value.trim().toLowerCase(), r = $('usR').value;
  var list = US.filter(function(u){ if (r === 'x' && u.roles.length < 2) return false; if (r && r !== 'x' && u.roles.indexOf(r) < 0) return false; return !q || (u.empCode + ' ' + u.name).toLowerCase().indexOf(q) >= 0; });
  var rc = { BRANCH: 'p-info', CENTRAL: 'p-violet', ADMIN: 'p-bad' };
  $('usBody').innerHTML = '<div class="card"><div class="card-b p-0"><div class="table-responsive"><table class="table tbl table-hover mb-0"><thead><tr><th>รหัส</th><th>ชื่อ-สกุล</th><th>บทบาท</th><th>ศูนย์ที่ดูแล</th><th>เข้าใช้ล่าสุด</th><th></th></tr></thead><tbody>' +
    list.slice(0, 300).map(function(u){ return '<tr class="' + (u.active ? '' : 'op50') + '"><td class="tnum">' + esc(u.empCode) + '</td><td><b>' + esc(u.name) + '</b>' + (u.active ? '' : ' <span class="pill p-mute">ปิดบัญชี</span>') + (u.mustChange ? ' <span class="pill p-warn nodot" title="ยังไม่เปลี่ยนรหัสผ่านเริ่มต้น">รหัสเริ่มต้น</span>' : '') + '</td>' +
      '<td>' + u.roles.filter(function(x){ return x !== 'STAFF'; }).map(function(x){ return '<span class="pill ' + rc[x] + ' nodot">' + esc(S.boot.roles[x]) + '</span>'; }).join(' ') + (u.roles.length < 2 ? '<span class="small-muted">บุคลากร</span>' : '') + '</td>' +
      '<td>' + (u.branches.indexOf('*') >= 0 ? '<span class="pill p-slate nodot">ทุกศูนย์</span>' : u.branches.map(function(b){ return brDot(b); }).join(' ')) + '</td><td class="small">' + esc(u.lastLogin || '—') + '</td>' +
      '<td><button class="btn btn-sm btn-ghost" onclick="userModal(\'' + u.empCode + '\')" aria-label="แก้ไขสิทธิ์"><i class="bi bi-pencil"></i></button></td></tr>'; }).join('') +
    (!list.length ? '<tr><td colspan="6">' + empty('shield-lock', 'ไม่พบผู้ใช้ตามเงื่อนไข') + '</td></tr>' : '') + '</tbody></table></div></div></div>';
}
function userModal(code){
  var u = code ? US.filter(function(x){ return x.empCode === code; })[0] : { empCode: '', roles: ['STAFF'], branches: [], active: true };
  var roles = ['BRANCH', 'CENTRAL', 'ADMIN'], desc = { BRANCH: 'จัดตารางเวร ยืนยันเวร ตรวจรายการ และส่งให้ฝ่าย ของศูนย์ที่ดูแล', CENTRAL: 'บันทึก ตรวจ ปิดรอบ ออกเอกสารและไฟล์ HRMi ทุกศูนย์ และตั้งค่าหลัก', ADMIN: 'ทุกอย่าง รวมถึงผู้ใช้ สิทธิ์ นำเข้าข้อมูล และย้อนสถานะ' };
  modal(code ? 'สิทธิ์ของ ' + u.name : 'กำหนดสิทธิ์ผู้ใช้', (code ? '' : fld('umCode', 'รหัสเจ้าหน้าที่', '', { col: 'mb-3', ph: 'ต้องมีในข้อมูลบุคลากรก่อน' })) +
    '<label class="form-label">บทบาท (ทุกคนเป็นบุคลากรอยู่แล้ว)</label>' + roles.map(function(r){ return '<label class="role-opt"><input class="form-check-input" type="checkbox" value="' + r + '" data-role' + (u.roles.indexOf(r) >= 0 ? ' checked' : '') + '><div><b>' + esc(S.boot.roles[r]) + '</b><span>' + desc[r] + '</span></div></label>'; }).join('') +
    '<label class="form-label mt-2">ศูนย์ที่ดูแล (สำหรับผู้ดูแลศูนย์)</label><div class="d-flex flex-wrap gap-2 mb-3"><label class="ca-cb"><input type="checkbox" value="*" data-ubr' + (u.branches.indexOf('*') >= 0 ? ' checked' : '') + '><span>ทุกศูนย์</span></label>' +
    S.boot.branches.map(function(b){ return '<label class="ca-cb" style="--bc:' + esc(b.color) + '"><input type="checkbox" value="' + b.id + '" data-ubr' + (u.branches.indexOf(b.id) >= 0 ? ' checked' : '') + '><span>' + esc(b.name) + '</span></label>'; }).join('') + '</div>' +
    sw('umAct', 'เปิดใช้งานบัญชี', u.active),
    [code ? { text: '<i class="bi bi-key"></i> รีเซ็ตรหัสผ่าน', cls: 'btn-ghost me-auto', onClick: function(){ confirmBox('รีเซ็ตรหัสผ่าน', u.name + '\nรหัสผ่านจะกลับเป็นรหัสเจ้าหน้าที่ และต้องเปลี่ยนเมื่อเข้าระบบครั้งถัดไป', 'รีเซ็ต', true).then(function(ok){ if (ok) api('resetPassword', { empCode: code }).then(function(){ notify('รีเซ็ตรหัสผ่านแล้ว'); }).catch(function(){}); }); return false; } } : null,
      { text: 'ยกเลิก', cls: 'btn-ghost' }, { text: '<i class="bi bi-save"></i> บันทึก', onClick: function(btn){
      var p = { empCode: code || $('umCode').value.trim(), roles: $$('[data-role]').filter(function(c){ return c.checked; }).map(function(c){ return c.value; }), branches: $$('[data-ubr]').filter(function(c){ return c.checked; }).map(function(c){ return c.value; }), active: $('umAct').checked };
      api('saveUser', p, { btn: btn }).then(function(l){ US = l; MDL.hide(); notify('บันทึกสิทธิ์แล้ว'); drawUsers(); }).catch(function(){});
      return false; } }].filter(Boolean));
}

/* ================= ตั้งค่าระบบและรูปลักษณ์ ================= */
var ST = null;
var SET_GROUPS = [
  ['การทำงาน', 'gear', ['deptName', 'hoursDocTitle', 'formCode', 'bookOpenDay', 'bookCloseDay', 'submitWindowMode', 'submitFromDay', 'submitToDay', 'submitDeadlineDay', 'scheduleView', 'reminderEmails']],
  ['การตรวจเวลาสแกน', 'fingerprint', ['earlyToleranceMin', 'lateToleranceMin', 'checkEntryScan', 'requirePasswordConfirm']],
  ['ชื่อระบบและการติดต่อ', 'card-text', ['systemName', 'systemNameEn', 'systemShortName', 'orgName', 'copyrightYear', 'developerName', 'contactPhone', 'contactEmail']],
  ['เชื่อมต่อและระบบ', 'hdd-network', ['apiBase', 'apiScanPath', 'apiEmpPath', 'auditKeepMonths', 'auditMaxRows', 'webAppUrl']]
];
var SET_SELECT = { submitWindowMode: [['always', 'ส่งได้ทุกเวลา'], ['window', 'ส่งได้เฉพาะช่วงที่กำหนด']], scheduleView: [['all', 'เห็นตารางทุกศูนย์'], ['own', 'เห็นเฉพาะศูนย์/ตำแหน่งที่เกี่ยวข้อง']],
  checkEntryScan: [['TRUE', 'ตรวจ'], ['FALSE', 'ไม่ตรวจ']], requirePasswordConfirm: [['TRUE', 'ต้องใส่รหัสผ่าน'], ['FALSE', 'ยืนยันด้วยปุ่มอย่างเดียว']], announceLevel: [['info', 'ข่าวสารทั่วไป (ฟ้า)'], ['warning', 'โปรดทราบ (เหลือง)'], ['danger', 'สำคัญมาก (แดง)']] };
var COLORS = [['#3b4bc8', 'คราม'], ['#2563eb', 'น้ำเงิน'], ['#0e7490', 'ฟ้าทะเล'], ['#0f766e', 'เขียวหัวเป็ด'], ['#15803d', 'เขียว'], ['#7c3aed', 'ม่วง'], ['#be185d', 'ชมพูเข้ม'], ['#d72638', 'แดงสภากาชาด'], ['#c2410c', 'ส้มอิฐ'], ['#334155', 'เทาเข้ม']];
PAGES.settings = function(){
  mount(pageHead('การตั้งค่า', 'ตั้งค่าระบบและรูปลักษณ์', 'ค่าการทำงาน ประกาศ สีหลัก โลโก้ และคำสั่งระบบ') + '<div id="stBody">' + skeleton(10) + '</div>');
  api('getSettings').then(function(s){ ST = s; drawSettings(); }).catch(function(){});
};
function setInput(k){
  var x = ST[k]; if (!x) return '';
  var dis = x.editable ? '' : ' disabled', v = x.value;
  var ctl = SET_SELECT[k] ? '<select class="form-select" data-set="' + k + '" id="st_' + k + '"' + dis + '>' + SET_SELECT[k].map(function(o){ return '<option value="' + o[0] + '"' + (String(v) === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>'
    : '<input class="form-control" data-set="' + k + '" id="st_' + k + '" value="' + esc(v) + '"' + dis + '>';
  return '<div class="col-md-6"><label class="form-label" for="st_' + k + '">' + esc(x.note || k) + '</label>' + ctl + '</div>';
}
function drawSettings(){
  if (!$('stBody') || !ST) return;
  var adm = ST._admin, h = '<div class="row g-3"><div class="col-xl-7">';
  SET_GROUPS.forEach(function(g){
    var inner = g[2].map(setInput).join('');
    if (!inner || (!adm && g[2].every(function(k){ return !ST[k] || !ST[k].editable; }))) return;
    h += '<div class="card mb-3"><div class="card-h"><h3><i class="bi bi-' + g[1] + '"></i> ' + g[0] + '</h3></div><div class="card-b row g-2">' + inner + '</div></div>';
  });
  h += '<button class="btn btn-brand mb-3" onclick="saveSet(this)"><i class="bi bi-save"></i> บันทึกการตั้งค่า</button></div><div class="col-xl-5">';
  if (adm) {
    var b = BRAND || {};
    h += '<div class="card mb-3"><div class="card-h"><h3><i class="bi bi-megaphone"></i> ประกาศ</h3></div><div class="card-b row g-2"><div class="col-12"><textarea class="form-control" data-set="announcement" rows="3" placeholder="เช่น ศูนย์ส่งข้อมูลเดือนกันยายนภายในวันที่ 4 ตุลาคม">' + esc((ST.announcement || {}).value || '') + '</textarea></div>' +
      '<div class="col-6"><label class="form-label" for="st_announceLevel">ระดับ</label><select class="form-select" data-set="announceLevel" id="st_announceLevel">' + SET_SELECT.announceLevel.map(function(o){ return '<option value="' + o[0] + '"' + (((ST.announceLevel || {}).value || 'info') === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>' +
      '<div class="col-6"><label class="form-label" for="st_announceUntil">แสดงถึงวันที่</label><input type="date" class="form-control" data-set="announceUntil" id="st_announceUntil" value="' + esc((ST.announceUntil || {}).value || '') + '"></div></div></div>';
    h += '<div class="card mb-3"><div class="card-h"><h3><i class="bi bi-palette"></i> สีหลักและโลโก้</h3></div><div class="card-b"><div class="d-flex flex-wrap gap-2 mb-2">' + COLORS.map(function(c){ return '<button type="button" class="swatch" title="' + c[1] + '" aria-label="สี' + c[1] + '" style="background:' + c[0] + '" onclick="$(\'st_brandColor\').value=\'' + c[0] + '\';previewBrand()"></button>'; }).join('') + '</div>' +
      '<div class="d-flex gap-2 align-items-center mb-3"><input type="color" class="form-control form-control-color" data-set="brandColor" id="st_brandColor" value="' + esc((ST.brandColor || {}).value || '#3b4bc8') + '" oninput="previewBrand()" aria-label="เลือกสีเอง"><span class="small-muted">หรือเลือกสีเอง</span></div>' +
      '<div class="d-flex gap-3 align-items-center"><div class="logo brand-logo" id="stLogo" style="width:96px;height:96px;border-radius:22px"></div><div class="d-flex flex-column gap-2"><label class="btn btn-soft btn-sm mb-0"><i class="bi bi-upload"></i> เลือกรูปโลโก้<input type="file" accept="image/*" hidden onchange="pickLogo(this)"></label><button class="btn btn-ghost btn-sm" onclick="S._logo=\'\';S._logoCh=true;previewBrand()"><i class="bi bi-x-lg"></i> ไม่ใช้โลโก้</button></div></div></div></div>';
    h += '<div class="card mb-3"><div class="card-h"><h3><i class="bi bi-terminal"></i> คำสั่งระบบ</h3></div><div class="card-b">' +
      '<div class="small mb-2">SmartAPI: ' + (ST._api && ST._api.user && ST._api.pass ? '<span class="pill p-ok">ตั้งค่า Script Properties แล้ว</span>' : '<span class="pill p-bad">ยังไม่ได้ตั้ง SMARTAPI_USER / SMARTAPI_PASS</span>') + '</div>' +
      '<div class="small mb-3">งานอัตโนมัติ: ' + ((ST._triggers || []).length ? ST._triggers.map(function(t){ return '<span class="pill p-info nodot">' + esc(t) + '</span>'; }).join(' ') : '<span class="pill p-warn">ยังไม่ได้ติดตั้ง</span>') + '</div>' +
      '<div class="d-flex gap-2 align-items-end mb-2">' + ymSelect('jbYm', S.boot.ym, 12, 1, 'เดือนสำหรับคำสั่ง') + '</div><div class="job-grid">' +
      [['testApi', 'plug', 'ทดสอบ SmartAPI'], ['syncEmployees', 'people', 'ซิงก์บุคลากร'], ['syncScans', 'fingerprint', 'ดึงสแกนของเดือน'], ['recalc', 'calculator', 'คำนวณใหม่ทั้งเดือน'], ['installTriggers', 'alarm', 'ติดตั้งงานอัตโนมัติ'], ['archive', 'archive', 'ย้ายเดือนเข้าคลัง'], ['archiveAudit', 'journal-arrow-up', 'ย้ายประวัติไปไดรฟ์'], ['clearCache', 'lightning', 'ล้างแคช']].map(function(j){
        return '<button class="btn btn-ghost" onclick="runJob(\'' + j[0] + '\',this)"><i class="bi bi-' + j[1] + '"></i> ' + j[2] + '</button>'; }).join('') + '</div></div></div>';
  }
  $('stBody').innerHTML = h + '</div></div>';
  enhanceSelects($('stBody'));
  if (adm) { S._logo = (BRAND && BRAND.logo) || ''; S._logoCh = false; previewBrand(); }
}
function previewBrand(){
  var b = {}; for (var k in BRAND) b[k] = BRAND[k];
  if ($('st_brandColor')) b.brandColor = $('st_brandColor').value;
  b.logo = S._logo; if (S._logoCh) { b.logoTrim = null; b.logoTrimVer = null; }
  applyBrand(b);
}
function pickLogo(inp){
  var f = inp.files[0]; if (!f) return;
  var rd = new FileReader();
  rd.onload = function(){
    var im = new Image();
    im.onload = function(){
      var c = document.createElement('canvas'), k = Math.min(1, 512 / Math.max(im.width, im.height));
      c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      var g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, c.width, c.height);
      var d = c.toDataURL('image/png'); if (d.length > 340000) d = c.toDataURL('image/jpeg', 0.9);
      S._logo = d; S._logoCh = true; previewBrand();
    };
    im.src = rd.result;
  };
  rd.readAsDataURL(f);
}
function saveSet(btn){
  var o = {}; $$('[data-set]').forEach(function(i){ if (!i.disabled) o[i.dataset.set] = i.value; });
  var p = { values: o }; if (ST._admin && S._logoCh) p.logoData = S._logo || '';
  api('saveSettings', p, { btn: btn }).then(function(s){
    ST = s; notify('บันทึกการตั้งค่าแล้ว'); S._logoCh = false;
    rawCall('branding', {}).then(function(r){ if (r && r.ok) applyBrand(r.data); }).catch(function(){});
    refreshBoot();
  }).catch(function(){});
}
function runJob(job, btn){
  var ym = $('jbYm') ? $('jbYm').value : S.boot.ym;
  var go2 = function(){ api('runJob', { job: job, ym: ym }, { btn: btn, block: 'กำลังทำงาน…', timeout: 330000 }).then(function(r){ alertBox('เสร็จแล้ว', typeof r === 'object' ? (r.message || JSON.stringify(r).slice(0, 600)) : String(r), 'success'); }).catch(function(){}); };
  if (job === 'archive') confirmBox('ย้ายเดือนเข้าคลัง', 'ย้ายเดือน ' + thYm(ym) + ' เข้าคลังข้อมูลย้อนหลัง (แม้ยังไม่ครบ 10 วันหลัง HR ตรวจ)', 'ย้ายเข้าคลัง', true).then(function(ok){ if (ok) go2(); });
  else go2();
}

/* ================= นำเข้าข้อมูล ================= */
var IM = {};
PAGES['import'] = function(){
  mount(pageHead('การตั้งค่า', 'นำเข้าข้อมูล', 'ย้ายข้อมูลจากระบบเดิม 3 ขั้นตอน · ใช้ไฟล์ CSV ที่เตรียมให้ (UTF-8) · ทำตามลำดับ 1 → 2 → 3') +
    '<div class="im-steps">' +
    imCard(1, 'people', 'รายชื่อบุคลากร', 'ไฟล์ 0_รายชื่อบุคลากร_นำเข้าก่อน.csv · เพิ่มคนที่ยังไม่มี และตั้งกลุ่มการจ่าย/ศูนย์ต้นสังกัดจากประวัติ (ไม่ทับค่าที่ตั้งไว้แล้ว)', 'imEmp', '<button class="btn btn-brand" onclick="imEmp(this)"><i class="bi bi-upload"></i> นำเข้ารายชื่อ</button>') +
    imCard(2, 'archive', 'ข้อมูลย้อนหลัง (เดือนที่จบแล้ว)', 'ไฟล์ 1_ข้อมูลย้อนหลัง_ต.ค.68-ส.ค.69.csv · แยกเก็บเป็นคลังรายเดือน สถานะ "HR ตรวจแล้ว" ดูได้ทุกหน้าแต่แก้ไขไม่ได้', 'imLeg',
      '<div class="form-check mb-2"><input class="form-check-input" type="checkbox" id="imLegRep"><label class="form-check-label" for="imLegRep">แทนที่เดือนที่เคยนำเข้าแล้ว</label></div><button class="btn btn-brand" onclick="imLegacy(this)"><i class="bi bi-upload"></i> นำเข้าทีละเดือน</button><div id="imLegLog" class="im-log"></div>') +
    imCard(3, 'calendar-check', 'ข้อมูลเดือนปัจจุบัน (ใช้งานต่อ)', 'ไฟล์ 2_ข้อมูลปัจจุบัน_ก.ย.69.csv · เข้าเป็นเวรที่ยืนยันแล้ว รอกด "ตรงตามใบ" ในหน้าบันทึกการปฏิบัติงาน แล้วใช้งานต่อในระบบนี้', 'imLive',
      '<div class="form-check mb-2"><input class="form-check-input" type="checkbox" id="imLiveRep"><label class="form-check-label" for="imLiveRep">แทนที่ข้อมูลที่นำเข้าเดิมของเดือนนั้น</label></div><button class="btn btn-brand" onclick="imLive(this)"><i class="bi bi-upload"></i> นำเข้าเดือนปัจจุบัน</button>') +
    '</div><div id="imArch" class="mt-3"></div>');
  $$('.im-file').forEach(function(inp){ inp.onchange = function(){ imRead(inp); }; });
  imArch();
};
function imCard(n, icon, title, sub, id, body){
  return '<div class="im-card"><div class="im-n">' + n + '</div><div class="flex-grow-1"><h3><i class="bi bi-' + icon + '"></i> ' + title + '</h3><p>' + sub + '</p><input class="form-control mb-2 im-file" type="file" accept=".csv,text/csv" id="' + id + '" aria-label="เลือกไฟล์ ' + esc(title) + '"><div class="im-info small-muted mb-2" id="' + id + 'Info"></div>' + body + '</div></div>';
}
function imRead(inp){
  readFile(inp).then(function(t){
    var rows = t ? parseCsv(t) : [];
    // ไฟล์ที่ไม่มีคอลัมน์ ym (เช่น ไฟล์เดือนปัจจุบัน) → คิดเดือนจากวันที่
    rows.forEach(function(r){ if (!r.ym && /^\d{4}-\d{2}-\d{2}/.test(r.date || '')) r.ym = r.date.slice(0, 7); });
    IM[inp.id] = rows;
    var info = $(inp.id + 'Info');
    if (!rows.length) { info.innerHTML = '<span class="text-danger">ไม่พบข้อมูลในไฟล์</span>'; return; }
    var yms = {}; rows.forEach(function(r){ if (r.ym) yms[r.ym] = (yms[r.ym] || 0) + 1; });
    var k = Object.keys(yms).sort();
    info.innerHTML = '<i class="bi bi-check2-circle text-success"></i> ' + fmt(rows.length) + ' แถว · คอลัมน์: ' + esc(Object.keys(rows[0]).join(', ')) + (k.length ? '<br>' + k.map(function(y){ return '<span class="mini-tag on">' + esc(thYm(y)) + ' ' + fmt(yms[y]) + '</span>'; }).join(' ') : '');
  }).catch(function(){ notify('อ่านไฟล์ไม่สำเร็จ', 'error'); });
}
function imNeed(id){ var r = IM[id]; if (!r || !r.length) { alertBox('กรุณาเลือกไฟล์', 'เลือกไฟล์ CSV ของขั้นตอนนี้ก่อน', 'info'); return null; } return r; }
function imEmp(btn){
  var rows = imNeed('imEmp'); if (!rows) return;
  api('importEmployeesCsv', { rows: rows }, { btn: btn, block: 'กำลังนำเข้ารายชื่อ…', timeout: 300000 }).then(function(r){ alertBox('นำเข้ารายชื่อเรียบร้อย', 'เพิ่มใหม่ ' + r.added + ' คน · ปรับปรุง ' + r.updated + ' คน · รวม ' + r.total + ' คน\n' + r.note, 'success'); }).catch(function(){});
}
function imLegacy(btn){
  var rows = imNeed('imLeg'); if (!rows) return;
  var by = {}; rows.forEach(function(r){ if (r.ym && r.ym < S.boot.ym) (by[r.ym] = by[r.ym] || []).push(r); });
  var yms = Object.keys(by).sort(), log = $('imLegLog'), rep = $('imLegRep').checked, i = 0, tot = 0;
  if (!yms.length) return alertBox('ไม่พบเดือนที่นำเข้าได้', 'ข้อมูลย้อนหลังต้องเป็นเดือนที่สิ้นสุดแล้ว (คอลัมน์ ym)', 'warning');
  log.innerHTML = ''; btnBusy(btn, true, 'กำลังนำเข้า');
  var next = function(){
    if (i >= yms.length) { btnBusy(btn, false); notify('นำเข้าข้อมูลย้อนหลังครบ ' + yms.length + ' เดือน (' + fmt(tot) + ' รายการ)'); imArch(); return; }
    var ym = yms[i++], line = document.createElement('div'); line.innerHTML = '<span class="spinner-border spinner-border-sm"></span> ' + esc(thYm(ym)) + ' · ' + fmt(by[ym].length) + ' แถว…'; log.appendChild(line);
    api('importLegacyMonth', { ym: ym, rows: by[ym], replace: rep }, { quiet: true, timeout: 330000 }).then(function(r){
      tot += r.rows || 0;
      line.innerHTML = r.skipped ? '<i class="bi bi-skip-forward text-muted"></i> ' + esc(thYm(ym)) + ' มีในคลังแล้ว (' + fmt(r.rows) + ' รายการ) · ข้าม' :
        '<i class="bi bi-check-circle-fill text-success"></i> ' + esc(thYm(ym)) + ' · ' + fmt(r.rows) + ' รายการ' + (r.badCount ? ' · <span class="text-danger">แถวไม่ถูกต้อง ' + r.badCount + '</span>' : '') + (r.overlap ? ' · <span class="text-warning">เวลาซ้อน ' + r.overlap + '</span>' : '');
      next();
    }).catch(function(e){ line.innerHTML = '<i class="bi bi-x-circle-fill text-danger"></i> ' + esc(thYm(ym)) + ' · ' + esc(e.message || e); next(); });
  };
  next();
}
function imLive(btn){
  var rows = imNeed('imLive'); if (!rows) return;
  var yms = {}; rows.forEach(function(r){ if (r.ym) yms[r.ym] = 1; }); var k = Object.keys(yms);
  if (!k.length) return alertBox('ไม่พบเดือนในไฟล์', 'ไฟล์ต้องมีคอลัมน์ date รูปแบบ 2026-09-01 (หรือคอลัมน์ ym)', 'warning');
  if (k.length !== 1) return alertBox('ไฟล์ต้องเป็นเดือนเดียว', 'พบ ' + k.length + ' เดือนในไฟล์: ' + k.join(', '), 'warning');
  passwordBox('นำเข้าเดือน ' + thYm(k[0]), fmt(rows.length) + ' รายการ จะเข้าเป็นเวรที่ยืนยันแล้ว\nหลังนำเข้า ให้ตรวจที่หน้า "บันทึกการปฏิบัติงาน" แล้วกด "ตรงตามใบ"', 'นำเข้า').then(function(pw){
    if (pw === null) return;
    api('importLiveMonth', { ym: k[0], rows: rows, replace: $('imLiveRep').checked, password: pw }, { btn: btn, block: 'กำลังนำเข้าและคำนวณ…', timeout: 330000 }).then(function(r){
      alertBox('นำเข้าเรียบร้อย', thYm(r.ym) + ' · ' + fmt(r.rows) + ' รายการ' + (r.badCount ? '\nแถวที่ไม่ถูกต้อง ' + r.badCount + ' แถว (เช่น แถวที่ ' + r.badRows.slice(0, 8).join(', ') + ')' : ''), r.badCount ? 'warning' : 'success');
    }).catch(function(){});
  });
}
function imArch(){
  api('getArchiveList', {}, { quiet: true }).then(function(list){
    if (!$('imArch')) return;
    $('imArch').innerHTML = '<div class="card"><div class="card-h"><h3><i class="bi bi-archive"></i> คลังข้อมูลย้อนหลัง</h3><span class="sub">' + list.length + ' เดือน</span></div><div class="card-b">' + (list.length ? '<div class="arch-list">' + list.map(function(a){ return '<span class="arch-i"><b>' + esc(a.thMonth) + '</b><small>' + fmt(a.rows) + ' รายการ · ' + (a.source === 'legacy' ? 'ระบบเดิม' : 'ระบบนี้') + '</small></span>'; }).join('') + '</div>' : empty('archive', 'ยังไม่มีข้อมูลในคลัง')) + '</div></div>';
  }).catch(function(){});
}

/* ================= ประวัติการใช้งาน ================= */
var AU_TXT = { LOGIN: 'เข้าสู่ระบบ', LOGIN_FAIL: 'เข้าสู่ระบบไม่สำเร็จ', LOGOUT: 'ออกจากระบบ', CHANGE_PASSWORD: 'เปลี่ยนรหัสผ่าน', RESET_PASSWORD: 'รีเซ็ตรหัสผ่าน', BOOK: 'ลงบันทึกตารางเวร', CANCEL_BOOKING: 'ยกเลิกเวร', CONFIRM_BOOKINGS: 'ยืนยันเวร',
  SAVE_GRID: 'บันทึกตารางเวร', CONFIRM_DUTIES: 'ตรงตามใบ', UNCONFIRM_DUTIES: 'ยกเลิกการยืนยัน', MARK_ABSENT: 'ไม่มาปฏิบัติงาน', RESTORE_DUTY: 'คืนรายการ', UPDATE_DUTY: 'แก้ไขรายการ', ADD_DUTY: 'เพิ่มรายการ',
  UPLOAD_ATTACHMENT: 'แนบใบลืมสแกน', DELETE_ATTACHMENT: 'ลบไฟล์แนบ', SUBMIT_BRANCH: 'ศูนย์ส่งให้ฝ่าย', RETURN_BRANCH: 'ตีกลับ', VERIFY_BRANCH: 'ปิดรอบ', ROLLBACK: 'ย้อนสถานะ', EXPORT_HRMI: 'ส่งออก HRMi', EXPORT_HOURS: 'ตารางชั่วโมง',
  EXPORT_SIGN: 'ใบบันทึกเวลา', SAVE_SETTINGS: 'บันทึกตั้งค่า', SAVE_USER: 'บันทึกสิทธิ์', SAVE_POSITION: 'บันทึกตำแหน่ง', SAVE_RATE: 'บันทึกอัตรา', SAVE_CALENDAR: 'บันทึกปฏิทิน', SAVE_QUOTAS: 'บันทึกกรอบเวร', SAVE_SIGNERS: 'บันทึกผู้ลงนาม',
  IMPORT_LEGACY_MONTH: 'นำเข้าข้อมูลย้อนหลัง', IMPORT_LIVE_MONTH: 'นำเข้าเดือนปัจจุบัน', IMPORT_EMPLOYEES: 'นำเข้ารายชื่อ', UPDATE_EMPLOYEE: 'แก้ไขบุคลากร', ADD_EMPLOYEES: 'เพิ่มบุคลากร' };
PAGES.audit = function(){
  mount(pageHead('การตั้งค่า', 'ประวัติการใช้งาน', 'บันทึกทุกการเปลี่ยนแปลง · ประวัติเก่าถูกย้ายไปเก็บในไดรฟ์อัตโนมัติและยังค้นหาได้') +
    '<div class="filters"><div class="flex-grow-1"><label class="form-label" for="auQ">ค้นหา</label><input class="form-control" id="auQ" placeholder="รหัสผู้ใช้ การดำเนินการ รหัสรายการ แล้วกด Enter"></div><div><label class="form-label" for="auM">เดือน</label><select class="form-select" id="auM"><option value="">ล่าสุด</option></select></div>' +
    '<div class="d-flex align-items-end"><button class="btn btn-brand" onclick="loadAudit(this)"><i class="bi bi-search"></i> ค้นหา</button></div></div><div id="auBody">' + skeleton(10) + '</div>');
  $('auQ').onkeydown = function(e){ if (e.key === 'Enter') loadAudit(); };
  $('auM').onchange = function(){ loadAudit(); };
  loadAudit(null, true);
};
function loadAudit(btn, first){
  api('getAudit', { q: $('auQ').value, ym: $('auM').value }, { btn: btn }).then(function(r){
    if (!$('auBody')) return;
    if (first) $('auM').innerHTML = '<option value="">ล่าสุด</option>' + (r.months || []).map(function(m){ return '<option value="' + esc(m.ym || m) + '">' + esc(thYm(m.ym || m)) + (m.where === 'drive' ? ' (ไดรฟ์)' : '') + '</option>'; }).join('');
    $('auBody').innerHTML = '<div class="small-muted mb-2">' + fmt(r.rows.length) + ' รายการ</div><div class="card"><div class="card-b p-0"><div class="table-responsive"><table class="table tbl mb-0 au-t"><thead><tr><th>เวลา</th><th>ผู้ใช้</th><th>การดำเนินการ</th><th>รายการ</th><th>รายละเอียด</th></tr></thead><tbody>' +
      r.rows.map(function(x){ return '<tr><td class="text-nowrap small">' + esc(String(x.ts).slice(0, 19)) + '</td><td class="tnum">' + esc(x.user) + '</td><td><span class="pill p-slate nodot">' + esc(AU_TXT[x.action] || x.action) + '</span></td><td class="small">' + esc(x.entity) + (x.entityId ? '<div class="small-muted text-break">' + esc(String(x.entityId).slice(0, 40)) + '</div>' : '') + '</td><td class="small au-d">' + esc(String(x.detail || '').slice(0, 400)) + '</td></tr>'; }).join('') +
      (!r.rows.length ? '<tr><td colspan="5">' + empty('clock-history', 'ไม่พบรายการ') + '</td></tr>' : '') + '</tbody></table></div></div></div>';
  }).catch(function(){});
}
