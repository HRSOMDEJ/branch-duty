/* ================= ช่องเลือกแบบค้นหาได้ (พิมพ์ + เลือก) =================
 * ใช้กับ <select data-search> ทุกตัวอัตโนมัติ · ค่าจริงยังอยู่ใน select เดิม (onchange ทำงานเหมือนเดิม)
 */
function enhanceSelects(root){ $$('select[data-search]', root || document).forEach(function(s){ if (!s.dataset.combo) makeCombo(s); else comboSync(s); }); }
function comboSync(sel){ if (sel && sel._combo) sel._combo.label(); }
function setSel(id, v){ var s = $(id); if (!s) return; s.value = v; comboSync(s); }
var _comboOpen = null;
document.addEventListener('mousedown', function(e){ if (_comboOpen && !_comboOpen.wrap.contains(e.target) && !_comboOpen.pop.contains(e.target)) _comboOpen.close(); });
// v1.2569 เลื่อนหน้าหรือย่อขยายหน้าต่าง: ย้ายรายการตัวเลือกตามช่องเลือก (ไม่ปิดเอง) · ปิดเมื่อช่องเลือกเลื่อนพ้นจอ
window.addEventListener('scroll', function(e){ if (_comboOpen && !(e.target && e.target.closest && e.target.closest('.combo-pop'))) _comboOpen.place(true); }, true);
window.addEventListener('resize', function(){ if (_comboOpen) _comboOpen.place(true); });
function makeCombo(sel){
  sel.dataset.combo = '1';
  var wrap = document.createElement('div'); wrap.className = 'combo';
  sel.parentNode.insertBefore(wrap, sel); wrap.appendChild(sel);
  sel.classList.add('combo-native'); sel.tabIndex = -1;
  var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'form-select combo-btn'; btn.setAttribute('aria-haspopup', 'listbox');
  if (sel.id) { var lb = document.querySelector('label[for="' + sel.id + '"]'); if (lb) { btn.id = sel.id + '__btn'; lb.setAttribute('for', btn.id); } }
  wrap.appendChild(btn);
  var pop = document.createElement('div'); pop.className = 'combo-pop';
  pop.innerHTML = '<div class="combo-search"><i class="bi bi-search"></i><input class="form-control form-control-sm combo-q" placeholder="พิมพ์เพื่อค้นหา…" aria-label="ค้นหา"></div><div class="combo-list" role="listbox"></div>';
  wrap.appendChild(pop);
  var q = pop.querySelector('.combo-q'), list = pop.querySelector('.combo-list'), items = [], act = -1;
  var api2 = {
    wrap: wrap, pop: pop,
    label: function(){ var o = sel.options[sel.selectedIndex]; btn.innerHTML = '<span class="text-truncate">' + esc(o ? o.text : '—') + '</span>'; btn.disabled = sel.disabled; },
    open: function(){
      if (sel.disabled) return;
      if (_comboOpen && _comboOpen !== api2) _comboOpen.close();
      _comboOpen = api2; wrap.classList.add('open'); q.value = ''; render();
      // ย้ายรายการตัวเลือกไปไว้ชั้นบนสุดของหน้า (ไม่ถูกส่วนอื่นของหน้าทับหรือตัด) แล้ววางตำแหน่งใต้/เหนือช่องเลือก
      document.body.appendChild(pop); pop.classList.add('show');
      pop.querySelector('.combo-search').style.display = sel.options.length > 7 ? '' : 'none';   // ตัวเลือกน้อย ไม่ต้องมีช่องค้นหา
      api2.place();
      var fEl = sel.options.length > 7 ? q : list; if (fEl === list) list.tabIndex = -1;
      try { fEl.focus({ preventScroll: true }); } catch (e) { fEl.focus(); }
      var sEl = list.querySelector('.sel'); if (sEl) list.scrollTop = Math.max(0, sEl.offsetTop - list.clientHeight / 2 + sEl.offsetHeight / 2);
    },
    place: function(fromScroll){
      if (!pop.classList.contains('show')) return;
      var r = btn.getBoundingClientRect(), vh = window.innerHeight, vw = window.innerWidth;
      if (fromScroll && (r.bottom < 0 || r.top > vh || !btn.offsetParent)) { api2.close(); return; }
      var below = vh - r.bottom - 10, above = r.top - 10, up = below < 250 && above > below;
      var room = Math.max(120, (up ? above : below) - 58);
      list.style.maxHeight = Math.min(290, room) + 'px';
      var w = Math.max(r.width, 260);
      pop.style.minWidth = r.width + 'px';
      pop.style.left = Math.max(8, Math.min(r.left, vw - Math.min(w, vw - 16) - 8)) + 'px';
      if (up) { pop.style.top = 'auto'; pop.style.bottom = (vh - r.top + 4) + 'px'; } else { pop.style.bottom = 'auto'; pop.style.top = (r.bottom + 4) + 'px'; }
    },
    close: function(){ wrap.classList.remove('open'); pop.classList.remove('show'); if (pop.parentNode === document.body) wrap.appendChild(pop); if (_comboOpen === api2) _comboOpen = null; }
  };
  function render(){
    var s = q.value.trim().toLowerCase();
    items = [].slice.call(sel.options).filter(function(o){ return !s || (o.text + ' ' + (o.dataset.sub || '') + ' ' + o.value).toLowerCase().indexOf(s) >= 0; });
    list.innerHTML = items.map(function(o, i){ return '<div class="combo-opt' + (o.selected ? ' sel' : '') + '" data-i="' + i + '" role="option">' + esc(o.text) + (o.dataset.sub ? '<small>' + esc(o.dataset.sub) + '</small>' : '') + '</div>'; }).join('') || '<div class="combo-empty">ไม่พบรายการที่ค้นหา</div>';
    act = -1; items.forEach(function(o, i){ if (o.selected) act = i; }); hl();
  }
  function hl(){ $$('.combo-opt', list).forEach(function(el, i){ el.classList.toggle('act', i === act); }); var a = list.querySelector('.act'); if (a) { if (a.offsetTop < list.scrollTop) list.scrollTop = a.offsetTop; else if (a.offsetTop + a.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = a.offsetTop + a.offsetHeight - list.clientHeight; } }
  function pick(i){
    var o = items[i]; if (!o) return;
    var changed = sel.value !== o.value;
    sel.value = o.value; api2.label(); api2.close(); try { btn.focus({ preventScroll: true }); } catch (e) { btn.focus(); }
    if (changed) sel.dispatchEvent(new Event('change', { bubbles: true }));
  }
  btn.onclick = function(){ wrap.classList.contains('open') ? api2.close() : api2.open(); };
  btn.onkeydown = function(e){ if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); api2.open(); } };
  q.oninput = render;
  q.onkeydown = function(e){
    if (e.key === 'ArrowDown') { e.preventDefault(); act = Math.min(items.length - 1, act + 1); hl(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); act = Math.max(0, act - 1); hl(); }
    else if (e.key === 'Enter') { e.preventDefault(); pick(act < 0 ? 0 : act); }
    else if (e.key === 'Escape') { api2.close(); btn.focus(); }
  };
  list.onkeydown = function(e){ q.onkeydown(e); };
  list.onmousedown = function(e){ var el = e.target.closest('.combo-opt'); if (el) { e.preventDefault(); pick(+el.dataset.i); } };
  sel.addEventListener('change', api2.label);
  sel._combo = api2;
  api2.label();
}

/* ================= เลือกช่วงเวลา (เดือน / ไตรมาส / ปีงบประมาณ / ปีปฏิทิน / กำหนดเอง) ================= */
function fyOf(ym){ var p = ym.split('-'); return +p[1] >= 10 ? +p[0] + 1 : +p[0]; }        // ปีงบประมาณ (ค.ศ. ของปีที่สิ้นสุด)
function rangePicker(id, st){
  st = st || { mode: 'month', ym: S.ym || S.boot.ym };
  var cur = S.boot.ym, h = '<div class="range" id="' + id + '">';
  h += '<div><label class="form-label">ช่วงเวลา</label><div class="seg" data-rmode>' + [['month', 'รายเดือน'], ['quarter', 'ไตรมาส'], ['fy', 'ปีงบประมาณ'], ['year', 'ปีปฏิทิน'], ['custom', 'ระบุวันที่']].map(function(m){ return '<button type="button" data-m="' + m[0] + '"' + (st.mode === m[0] ? ' class="on"' : '') + '>' + m[1] + '</button>'; }).join('') + '</div></div>';
  var mo = ''; for (var i = -24; i <= 2; i++) { var y = addYm(cur, i); mo += '<option value="' + y + '"' + (y === (st.ym || cur) ? ' selected' : '') + '>' + thYm(y) + '</option>'; }
  var fyNow = fyOf(cur), qo = '', fo = '', yo = '';
  for (var f = fyNow; f >= fyNow - 2; f--) {
    for (var k = 4; k >= 1; k--) {
      var s = addYm((f - 1) + '-10', (k - 1) * 3);
      if (s > cur) continue;
      var e = addYm(s, 2);
      qo += '<option value="' + s + '|' + e + '">ไตรมาส ' + k + '/' + (f + 543) + ' (' + TH_M[+s.slice(5) - 1] + '–' + TH_M[+e.slice(5) - 1] + ' ' + String(+e.slice(0, 4) + 543).slice(2) + ')</option>';
    }
    fo += '<option value="' + (f - 1) + '-10|' + f + '-09">ปีงบประมาณ ' + (f + 543) + ' (ต.ค. ' + String(f - 1 + 543).slice(2) + ' – ก.ย. ' + String(f + 543).slice(2) + ')</option>';
  }
  var yNow = +cur.slice(0, 4);
  for (var yy = yNow; yy >= yNow - 2; yy--) yo += '<option value="' + yy + '-01|' + yy + '-12">ปี พ.ศ. ' + (yy + 543) + '</option>';
  h += '<div data-rv="month"' + (st.mode === 'month' ? '' : ' hidden') + '><label class="form-label">เดือน</label><select class="form-select" data-search data-rsel="month">' + mo + '</select></div>';
  h += '<div data-rv="quarter"' + (st.mode === 'quarter' ? '' : ' hidden') + '><label class="form-label">ไตรมาส (ปีงบประมาณ)</label><select class="form-select" data-search data-rsel="quarter">' + qo + '</select></div>';
  h += '<div data-rv="fy"' + (st.mode === 'fy' ? '' : ' hidden') + '><label class="form-label">ปีงบประมาณ</label><select class="form-select" data-search data-rsel="fy">' + fo + '</select></div>';
  h += '<div data-rv="year"' + (st.mode === 'year' ? '' : ' hidden') + '><label class="form-label">ปีปฏิทิน</label><select class="form-select" data-search data-rsel="year">' + yo + '</select></div>';
  h += '<div data-rv="custom" class="d-flex gap-2"' + (st.mode === 'custom' ? '' : ' hidden') + '><div><label class="form-label">ตั้งแต่วันที่</label><input type="date" class="form-control" data-rsel="from" value="' + (st.from || cur + '-01') + '"></div><div><label class="form-label">ถึงวันที่</label><input type="date" class="form-control" data-rsel="to" value="' + (st.to || lastDay(cur)) + '"></div></div>';
  return h + '</div>';
}
function rangeValue(id){
  var el = $(id), mode = el.querySelector('[data-rmode] .on').dataset.m;
  var v = function(k){ return el.querySelector('[data-rsel="' + k + '"]').value; };
  if (mode === 'month') { var m = v('month'); return { mode: mode, ym: m, from: m + '-01', to: lastDay(m), label: 'เดือน ' + thYm(m) }; }
  if (mode === 'custom') { var a = v('from'), b = v('to'); return { mode: mode, from: a, to: b, label: thDateFull(a) + ' – ' + thDateFull(b) }; }
  var sel = el.querySelector('[data-rsel="' + mode + '"]'), p = sel.value.split('|');
  return { mode: mode, from: p[0] + '-01', to: lastDay(p[1]), label: sel.options[sel.selectedIndex].text };
}
function initRange(id, onChange){
  var el = $(id);
  $$('[data-rmode] button', el).forEach(function(b){ b.onclick = function(){
    $$('[data-rmode] button', el).forEach(function(x){ x.classList.remove('on'); }); b.classList.add('on');
    $$('[data-rv]', el).forEach(function(d){ d.hidden = d.dataset.rv !== b.dataset.m; });
    onChange(rangeValue(id));
  }; });
  $$('[data-rsel]', el).forEach(function(s){ s.addEventListener('change', function(){ onChange(rangeValue(id)); }); });
}

/* ================= ไฟล์ CSV ================= */
function parseCsv(text){
  text = text.replace(/^﻿/, '');
  var rows = [], row = [], f = '', q = false;
  for (var i = 0; i < text.length; i++) {
    var ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(f); f = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
    else f += ch;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  var hdr = rows.shift() || [];
  return rows.filter(function(r){ return r.length > 1; }).map(function(r){ var o = {}; hdr.forEach(function(h, i){ o[h.trim()] = (r[i] || '').trim(); }); return o; });
}
function readFile(inp){ return new Promise(function(res, rej){ var f = inp.files[0]; if (!f) return res(null); var rd = new FileReader(); rd.onload = function(){ res(String(rd.result)); }; rd.onerror = rej; rd.readAsText(f, 'utf-8'); }); }

/* ================= รวมใบลืมสแกนเป็น PDF เล่มเดียว ================= */
function loadScript(src){
  return new Promise(function(res, rej){
    if (document.querySelector('script[src="' + src + '"]')) return res();
    var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = function(){ rej(new Error('โหลดตัวช่วยสร้าง PDF ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ต')); };
    document.head.appendChild(s);
  });
}
/** ข้อความภาษาไทย → รูป PNG (pdf-lib ไม่มีฟอนต์ไทยในตัว) */
function textImage(lines, width, opt){
  opt = opt || {};
  var scale = 2, lh = opt.lh || 22, pad = 10;
  var c = document.createElement('canvas'); c.width = width * scale; c.height = (lines.length * lh + pad * 2) * scale;
  var g = c.getContext('2d'); g.scale(scale, scale);
  g.fillStyle = opt.bg || '#ffffff'; g.fillRect(0, 0, width, lines.length * lh + pad * 2);
  lines.forEach(function(l, i){
    g.font = (l.bold ? '700 ' : '400 ') + (l.size || 13) + "px 'Sarabun', 'IBM Plex Sans Thai', sans-serif";
    g.fillStyle = l.color || '#111827'; g.textBaseline = 'middle';
    g.textAlign = l.align || 'left';
    g.fillText(l.text, l.align === 'right' ? width - pad : l.align === 'center' ? width / 2 : pad, pad + i * lh + lh / 2);
  });
  return { data: c.toDataURL('image/png'), w: width, h: lines.length * lh + pad * 2 };
}
function imageToJpeg(dataUrl){
  return new Promise(function(res, rej){
    var im = new Image();
    im.onload = function(){ var c = document.createElement('canvas'); var k = Math.min(1, 2200 / Math.max(im.width, im.height)); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); res({ data: c.toDataURL('image/jpeg', 0.85), w: c.width, h: c.height }); };
    im.onerror = function(){ rej(new Error('แสดงรูปนี้ไม่ได้')); };
    im.src = dataUrl;
  });
}
function b64ToBytes(b64){ var bin = atob(b64), a = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; }
function bytesToB64(bytes){ var s = '', ch = 0x8000; for (var i = 0; i < bytes.length; i += ch) s += String.fromCharCode.apply(null, bytes.subarray(i, i + ch)); return btoa(s); }

/** ชุด 07: ใบลืมสแกนรวมเล่ม · brs/pids = ศูนย์/ตำแหน่งที่เลือก (ตัวเลือกเดียวกับเอกสารอื่น)
 *  เรียง ศูนย์ → ตำแหน่ง → วันที่ → ชื่อ · แต่ละตำแหน่งมีหน้าสรุปนำ */
function printAttachments(ym, brs, pids, label){
  if (typeof brs === 'string') brs = brs === 'all' ? myBrs() : [brs];
  var posLabel = label || (brs.length > 1 ? 'ทุกศูนย์' : 'ศูนย์' + brName(brs[0]));
  api('listPrintAttachments', { ym: ym, branchIds: brs, positionIds: pids || [] }, { block: 'กำลังรวบรวมรายการเอกสาร…' }).then(function(r){ return ensureDocFont().then(function(){ return r; }); }).then(function(r){
    if (!r.files.length) return alertBox('ไม่พบใบลืมสแกน', 'เดือน ' + thYm(ym) + ' (' + posLabel + ') ยังไม่มีไฟล์แนบใบลืมสแกน', 'info');
    var n = r.files.length, done = 0;
    Swal.fire({ title: 'กำลังรวมเอกสาร', html: '<div id="pmTxt" class="small-muted">เตรียมเครื่องมือ…</div><div class="progress mt-2" style="height:8px"><div id="pmBar" class="progress-bar" style="width:0%"></div></div>', allowOutsideClick: false, showConfirmButton: false });
    var step = function(t){ done++; $('pmTxt').textContent = t + ' (' + done + '/' + n + ')'; $('pmBar').style.width = Math.round(done / n * 100) + '%'; };
    var PL, doc, A4 = [595.28, 841.89], fails = [];
    // กลุ่ม ศูนย์ × ตำแหน่ง
    var groups = [], gk = {};
    r.files.forEach(function(f){ var k = f.branchId + '|' + f.positionId; if (!gk[k]) { gk[k] = { branch: f.branch, positionName: f.positionName, files: [] }; groups.push(gk[k]); } gk[k].files.push(f); });
    var drawText = function(pg, lines, top, width){ var ti = textImage(lines, 900, { lh: 24 }); return doc.embedPng(ti.data).then(function(img){ var w = width || (A4[0] - 60), h = w * ti.h / ti.w; pg.drawImage(img, { x: 30, y: top - h, width: w, height: h }); return h; }); };
    loadScript('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js').then(function(){
      PL = window.PDFLib;
      return PL.PDFDocument.create();
    }).then(function(d){
      doc = d;
      // ปก + สารบัญกลุ่ม
      var cover = doc.addPage(A4);
      var lines = [{ text: 'ใบลืมสแกน / เอกสารประกอบการลงเวลา', bold: true, size: 20, align: 'center' }, { text: 'รอบเดือน ' + thYm(ym) + ' · ' + posLabel, size: 15, align: 'center' },
        { text: 'จำนวน ' + n + ' ไฟล์ · ' + groups.length + ' ตำแหน่ง', size: 13, align: 'center', color: '#555' }, { text: '', size: 8 }];
      groups.forEach(function(g, i){ lines.push({ text: (i + 1) + '. ศูนย์' + g.branch + ' · ' + g.positionName + ' — ' + g.files.length + ' ไฟล์', size: 13 }); });
      lines.push({ text: '', size: 8 }, { text: r.foot, size: 10, align: 'center', color: '#666' });
      var ci = textImage(lines.slice(0, 40), 700, { lh: 30 });
      return doc.embedPng(ci.data).then(function(img){ var w = 520, h = Math.min(A4[1] - 160, w * ci.h / ci.w); cover.drawImage(img, { x: (A4[0] - w) / 2, y: A4[1] - 120 - h, width: w, height: h }); });
    }).then(function(){
      var chain = Promise.resolve(), idx = 0;
      groups.forEach(function(g){
        // หน้าสรุปนำของตำแหน่ง (35 รายการ/หน้า)
        chain = chain.then(function(){
          var per = 32, pages = Math.ceil(g.files.length / per), c2 = Promise.resolve();
          for (var pi = 0; pi < pages; pi++) (function(pi){
            c2 = c2.then(function(){
              var pg = doc.addPage(A4);
              var L = [{ text: 'สรุปใบลืมสแกน · ศูนย์' + g.branch + ' · ' + g.positionName + (pages > 1 ? ' (' + (pi + 1) + '/' + pages + ')' : ''), bold: true, size: 15 }, { text: 'รอบเดือน ' + thYm(ym) + ' · ' + g.files.length + ' ไฟล์', size: 12, color: '#555' }, { text: ' ', size: 6 }];
              g.files.slice(pi * per, pi * per + per).forEach(function(f, j){ var no = pi * per + j + 1; L.push({ text: no + '. ' + TH_D[dowOf(f.date)] + ' ' + thDateNum(f.date) + ' · ' + slotL(f.slot || 'D').name + ' ' + f.timeIn + '–' + f.timeOut + ' · ' + f.empCode + ' ' + f.name + (f.sheetNo ? ' · ใบที่ ' + f.sheetNo : '') + ' · ' + (f.scanStatus || ''), size: 11.5 }); });
              return drawText(pg, L, A4[1] - 40);
            });
          })(pi);
          return c2;
        });
        g.files.forEach(function(f){
          var no = ++idx;
          chain = chain.then(function(){
            return api('getAttachment', { id: f.id }, { quiet: true }).then(function(att){
              var head = textImage([{ text: no + '. ศูนย์' + f.branch + ' · ' + f.positionName + ' · ' + TH_DF[dowOf(f.date)] + ' ' + thDateNum(f.date) + (f.sheetNo ? ' · ใบที่ ' + f.sheetNo : ''), bold: true, size: 14 },
                { text: f.empCode + ' ' + f.name + ' · เวลา ' + f.timeIn + '–' + f.timeOut + ' น. · ผลสแกน: ' + f.scanStatus, size: 12, color: '#374151' }], 900, { bg: '#f3f4f6', lh: 24 });
              return doc.embedPng(head.data).then(function(hImg){
                var hw = A4[0] - 40, hh = hw * head.h / head.w;
                var addPageWith = function(drawFn){ var pg = doc.addPage(A4); pg.drawImage(hImg, { x: 20, y: A4[1] - 20 - hh, width: hw, height: hh }); drawFn(pg, A4[1] - 30 - hh); };
                if (att.mimeType === 'application/pdf') {
                  return PL.PDFDocument.load(b64ToBytes(att.data), { ignoreEncryption: true }).then(function(src){
                    return doc.embedPages(src.getPages()).then(function(eps){
                      eps.forEach(function(ep){ addPageWith(function(pg, top){ var k = Math.min((A4[0] - 40) / ep.width, (top - 30) / ep.height); pg.drawPage(ep, { x: (A4[0] - ep.width * k) / 2, y: top - ep.height * k, xScale: k, yScale: k }); }); });
                    });
                  });
                }
                return imageToJpeg('data:' + att.mimeType + ';base64,' + att.data).then(function(j){
                  return doc.embedJpg(j.data).then(function(img){ addPageWith(function(pg, top){ var k = Math.min((A4[0] - 40) / j.w, (top - 30) / j.h); pg.drawImage(img, { x: (A4[0] - j.w * k) / 2, y: top - j.h * k, width: j.w * k, height: j.h * k }); }); });
                });
              });
            }).catch(function(e){ fails.push(f.name + ' ' + thDate(f.date) + ': ' + (e.message || e)); }).then(function(){ step('รวมไฟล์ ' + f.name); });
          });
        });
      });
      return chain;
    }).then(function(){
      // เลขหน้า + ผู้จัดพิมพ์
      var pages = doc.getPages(), total = pages.length;
      var ft = pages.map(function(pg, i){ return textImage([{ text: r.foot + '     หน้า ' + (i + 1) + ' / ' + total, size: 10, color: '#555', align: 'right' }], 900, { lh: 18 }); });
      return Promise.all(ft.map(function(t){ return doc.embedPng(t.data); })).then(function(imgs){
        imgs.forEach(function(img, i){ var w = A4[0] - 40, h = w * ft[i].h / ft[i].w; pages[i].drawImage(img, { x: 20, y: 8, width: w, height: h }); });
      });
    }).then(function(){ return doc.save(); }).then(function(bytes){
      Swal.close();
      var name = 'ใบลืมสแกน_' + posLabel.replace(/[\s:·,]+/g, '_').slice(0, 60) + '_' + thYm(ym).replace(' ', '_') + '_' + new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
      // 30 ก.ย. 69: เปิดเล่มให้ดู/พิมพ์ทันที (กด "เปิดในแท็บใหม่" แล้วสั่งพิมพ์ หรือ "ดาวน์โหลด") · ไม่เก็บสำเนาใน Drive
      fileViewer({ fileName: name + '.pdf', mimeType: 'application/pdf', data: bytesToB64(bytes) });
      if (fails.length) alertBox('รวมได้ ' + (n - fails.length) + ' ไฟล์ · รวมไม่ได้ ' + fails.length + ' ไฟล์', 'ไฟล์ที่รวมไม่ได้ (เปิดดูได้ในระบบ):\n' + fails.join('\n'), 'warning');
      else notify('รวมใบลืมสแกน ' + n + ' ไฟล์เรียบร้อย');
    }).catch(function(e){ Swal.close(); alertBox('รวมเอกสารไม่สำเร็จ', e.message || String(e), 'error'); });
  }).catch(function(){});
}
/* ================= v1.3 ดูไฟล์แนบในหน้าต่าง (ไม่ดาวน์โหลดอัตโนมัติ) ================= */
var _viewUrl = null;
function fileViewer(f, opt){
  opt = opt || {};
  if (_viewUrl) { try { URL.revokeObjectURL(_viewUrl); } catch (e) { } }
  var blob = b64ToBlob(f.data, f.mimeType); _viewUrl = URL.createObjectURL(blob);
  var isImg = /^image\//.test(f.mimeType), isPdf = f.mimeType === 'application/pdf';
  var body = '<div class="viewer">' + (isImg ? '<div class="viewer-img" id="vwBox"><img src="' + _viewUrl + '" alt="' + esc(f.fileName) + '" id="vwImg"></div>' :
    isPdf ? '<iframe class="viewer-pdf" src="' + _viewUrl + '#view=FitH" title="' + esc(f.fileName) + '"></iframe>' :
    '<div class="empty"><i class="bi bi-file-earmark"></i>ไฟล์ประเภทนี้แสดงตัวอย่างไม่ได้ กรุณาดาวน์โหลด</div>') +
    '<div class="viewer-meta"><i class="bi bi-paperclip"></i> ' + esc(f.fileName) + ' <span class="small-muted">· ' + (blob.size / 1024 < 1024 ? Math.round(blob.size / 1024) + ' KB' : (blob.size / 1048576).toFixed(1) + ' MB') + '</span>' +
    (isImg ? '<span class="ms-auto d-flex gap-1"><button class="btn btn-sm btn-ghost" type="button" onclick="vwZoom(-1)" aria-label="ย่อ"><i class="bi bi-zoom-out"></i></button><button class="btn btn-sm btn-ghost" type="button" onclick="vwZoom(0)">พอดีจอ</button><button class="btn btn-sm btn-ghost" type="button" onclick="vwZoom(1)" aria-label="ขยาย"><i class="bi bi-zoom-in"></i></button><button class="btn btn-sm btn-ghost" type="button" onclick="vwRotate()" aria-label="หมุน"><i class="bi bi-arrow-clockwise"></i></button></span>' : '') + '</div></div>';
  var btns = [
    { text: '<i class="bi bi-box-arrow-up-right"></i> เปิดในแท็บใหม่', cls: 'btn-ghost', onClick: function(){ var w = window.open(_viewUrl, '_blank'); if (!w) notify('เบราว์เซอร์บล็อกการเปิดหน้าต่างใหม่', 'info'); return false; } },
    { text: '<i class="bi bi-download"></i> ดาวน์โหลด', cls: 'btn-soft', onClick: function(){ saveBlob(blob, f.fileName); return false; } }
  ];
  if (opt.onDelete) btns.push({ text: '<i class="bi bi-trash3"></i> ลบไฟล์', cls: 'btn-danger-soft', onClick: function(){ opt.onDelete(); return false; } });
  btns.push({ text: 'ปิด', cls: 'btn-brand' });
  modal(f.fileName, body, btns, 'xl');
  window._vw = { z: 1, r: 0 };
}
function vwZoom(d){ var v = window._vw; v.z = d === 0 ? 1 : Math.max(.3, Math.min(5, v.z * (d > 0 ? 1.25 : .8))); vwApply(); }
function vwRotate(){ window._vw.r = (window._vw.r + 90) % 360; vwApply(); }
function vwApply(){ var im = $('vwImg'); if (!im) return; var v = window._vw; im.style.transform = 'rotate(' + v.r + 'deg) scale(' + v.z + ')'; $('vwBox').classList.toggle('zoomed', v.z > 1); }

/* ================= v1.3 พิมพ์รายงาน (A4 แนวนอน) พร้อมเลขอ้างอิงและบันทึกการพิมพ์ ================= */
/**
 * o: {title, subtitle, filters, bodyHtml, count, kind, portrait}
 * ขอเลขอ้างอิงจากเซิร์ฟเวอร์ (บันทึกลงประวัติการใช้งาน) แล้วเปิดหน้าต่างพิมพ์ของเบราว์เซอร์
 */
function printReport(o){
  return api('logPrint', { title: o.title, filters: o.filters, count: o.count || 0, kind: o.kind || '' }, { block: 'กำลังเตรียมเอกสารสำหรับพิมพ์…' }).then(function(m){ return ensureDocFont().then(uiIdle).then(function(){ return m; }); }).then(function(m){
    var b = BRAND || {};
    var root = $('printRoot');
    root.className = o.portrait ? 'portrait' : 'landscape';
    $('printPage').textContent = '@page{size:A4 ' + (o.portrait ? 'portrait' : 'landscape') + ';margin:10mm 10mm 14mm 10mm;@bottom-right{content:"หน้า " counter(page) " / " counter(pages);font:9pt Sarabun,"IBM Plex Sans Thai",sans-serif;color:#555}@bottom-left{content:"' + m.ref + '";font:9pt Sarabun,"IBM Plex Sans Thai",sans-serif;color:#555}}';
    root.innerHTML = '<div class="pr-doc">' +
      '<header class="pr-head">' + (b.logo ? '<img class="pr-logo" src="' + b.logo + '" alt="">' : '') +
        '<div class="pr-org"><b>' + esc(m.org) + '</b><span>' + esc(m.system) + '</span></div>' +
        '<div class="pr-ref"><div>เลขอ้างอิง <b>' + esc(m.ref) + '</b></div><div>พิมพ์เมื่อ ' + esc(m.printedAt) + '</div></div></header>' +
      '<h1 class="pr-title">' + esc(o.title) + '</h1>' + (o.subtitle ? '<div class="pr-sub">' + esc(o.subtitle) + '</div>' : '') +
      (o.filters ? '<div class="pr-filters"><b>เงื่อนไข:</b> ' + esc(o.filters) + '</div>' : '') +
      '<div class="pr-body">' + o.bodyHtml + '</div>' +
      '<div class="pr-end">— สิ้นสุดรายงาน · จำนวน ' + fmt(o.count || 0) + ' รายการ —</div>' +
      '<div class="pr-foot">พิมพ์โดย ' + esc(m.printedBy) + ' เมื่อ ' + esc(m.printedAt) + ' · เลขอ้างอิง ' + esc(m.ref) + ' · ' + esc(m.system) + '</div></div>';
    document.body.classList.add('printing');
    var done = function(){ document.body.classList.remove('printing'); window.removeEventListener('afterprint', done); setTimeout(uiCleanup, 50); };
    window.addEventListener('afterprint', done);
    setTimeout(function(){ try { window.print(); } catch (e) { alertBox('เปิดหน้าต่างพิมพ์ไม่ได้', 'กรุณากด Ctrl+P (หรือ ⌘+P) เพื่อพิมพ์', 'info'); } setTimeout(done, 1500); }, 250);
    return m;
  });
}
/* ================= 30 ก.ย. 69 พิมพ์เอกสารจากเบราว์เซอร์ (ใบบันทึกเวลา FM-HRM-032 · ตารางชั่วโมง/เวร · ค่าอาหาร · สรุปยอด) =================
 * เซิร์ฟเวอร์ส่งเฉพาะข้อมูล → จัดหน้า A4 ที่นี่ → เปิดหน้าต่างพิมพ์ทันที (ต้องการไฟล์: เลือก "บันทึกเป็น PDF")
 * ไม่สร้าง Google Sheet ชั่วคราว ไม่เก็บไฟล์ใน Drive · ทุกหน้าย่อให้พอดีกระดาษ 1 หน้าอัตโนมัติ */
function ensureDocFont(){
  if (!$('fSarabun')) { var l = document.createElement('link'); l.id = 'fSarabun'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,400;0,700;1,400&display=swap'; document.head.appendChild(l); }
  var p = (document.fonts && document.fonts.load) ? Promise.all([document.fonts.load('400 14px Sarabun'), document.fonts.load('700 14px Sarabun')]).catch(function(){}) : Promise.resolve();
  return Promise.race([p, new Promise(function(r){ setTimeout(r, 2500); })]);
}
/* 1 ต.ค. 69 แก้บั๊ก: พิมพ์แล้วกดปุ่มอะไรไม่ได้
 * สาเหตุ: หน้าต่าง "กำลังเตรียมเอกสาร…" (SweetAlert) / หน้าต่างเลือกตำแหน่ง (Bootstrap) กำลังปิดอยู่ตอนเริ่มพิมพ์
 * ระหว่างพิมพ์ระบบซ่อนทุกอย่างยกเว้นเอกสาร → อะนิเมชันปิดไม่จบ → ชั้นโปร่งใสค้างทับหน้าจอ
 * แก้: รอให้หน้าต่างปิดสนิทก่อนพิมพ์ + เก็บกวาดชั้นที่ค้างหลังพิมพ์ */
function uiCleanup(){
  try {
    if (window.Swal && !Swal.isVisible()) {
      $$('.swal2-container').forEach(function(x){ x.remove(); });
      [document.body, document.documentElement].forEach(function(el){ el.classList.remove('swal2-shown', 'swal2-height-auto', 'swal2-no-backdrop', 'swal2-toast-shown'); });
      document.body.style.paddingRight = '';
    }
    if (!document.querySelector('.modal.show')) {
      $$('.modal-backdrop').forEach(function(x){ x.remove(); });
      $$('.modal').forEach(function(m){ m.style.display = 'none'; m.setAttribute('aria-hidden', 'true'); m.classList.remove('show'); });
      document.body.classList.remove('modal-open'); document.body.style.overflow = ''; document.body.style.paddingRight = '';
    }
  } catch (e) { }
}
function uiIdle(){
  try { if (window.Swal && Swal.isVisible() && Swal.isLoading()) Swal.close(); } catch (e) { }   // หน้าต่าง "กำลังเตรียม…"
  try { if (window.MDL && document.querySelector('.modal.show')) MDL.hide(); } catch (e) { }
  try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch (e) { }
  return new Promise(function(res){
    var t0 = Date.now();
    (function chk(){
      var busy = (window.Swal && Swal.isVisible() && Swal.isLoading()) || document.querySelector('.swal2-backdrop-hide, .modal.show, .modal-backdrop');
      if (!busy || Date.now() - t0 > 1500) { uiCleanup(); res(); } else setTimeout(chk, 40);
    })();
  });
}
/** o: {orient:'landscape'|'portrait', pages:[html], title} */
function printDoc(o){
  return Promise.all([ensureDocFont(), uiIdle()]).then(function(){
    var root = $('printRoot');
    root.className = 'docs ' + o.orient + ' measuring';
    $('printPage').textContent = '@page{size:A4 ' + o.orient + ';margin:8mm}';
    root.innerHTML = o.pages.map(function(h){ return '<section class="dp' + (o.flow ? ' flow' : '') + '"><div class="dp-in">' + h + '</div></section>'; }).join('');
    // ชุด 07: ข้อความที่ต้องอยู่บรรทัดเดียว (ชื่อ รหัส วันที่ ช่องลงนาม) ยาวเกินช่อง → ลดขนาดอักษรทีละน้อยจนพอดี (ไม่ตัด/ไม่ขึ้นบรรทัดใหม่)
    $$('.fit', root).forEach(function(el){
      var fs = parseFloat(getComputedStyle(el).fontSize) || 14, min = fs * 0.62, n = 0;
      while (el.scrollWidth > el.clientWidth + 0.5 && fs > min && n++ < 20) { fs -= 0.5; el.style.fontSize = fs + 'px'; }
    });
    $$('.dp', root).forEach(function(sec){
      // ย่อให้พอดีหน้า (flow = พอดีความกว้าง ยาวต่อหลายหน้าได้) · ใช้ zoom (ไม่ใช้ transform) เพื่อให้เครื่องพิมพ์ตัดหน้าตามขนาดที่ย่อแล้วจริง
      var inn = sec.firstChild, W = sec.clientWidth, H = o.flow ? 1e9 : sec.clientHeight, w = inn.scrollWidth, h = inn.scrollHeight;
      var k = Math.min(1, W / Math.max(1, w), H / Math.max(1, h)) * 0.99;
      for (var i = 0; i < 4; i++) {   // ตัวอักษรจัดบรรทัดใหม่หลังย่อ → วัดซ้ำจนพอดี
        inn.style.zoom = k.toFixed(4);
        var r = inn.getBoundingClientRect(), a = sec.getBoundingClientRect();
        var over = Math.max(r.width / Math.max(1, a.width), o.flow ? 0 : r.height / Math.max(1, a.height));
        if (over <= 1) break;
        k = k / over * 0.99;
      }
    });
    root.classList.remove('measuring');
    var t0 = document.title; if (o.title) document.title = o.title;   // ชื่อไฟล์ตั้งต้นเมื่อเลือก "บันทึกเป็น PDF"
    document.body.classList.add('printing');
    var done = function(){ document.body.classList.remove('printing'); document.title = t0; window.removeEventListener('afterprint', done); setTimeout(uiCleanup, 50); };
    window.addEventListener('afterprint', done);
    setTimeout(function(){ try { window.print(); } catch (e) { alertBox('เปิดหน้าต่างพิมพ์ไม่ได้', 'กรุณากด Ctrl+P (หรือ ⌘+P) เพื่อพิมพ์', 'info'); } setTimeout(done, 1500); }, 150);
  });
}
function docNum(v, d){ v = +v || 0; return d ? v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (v % 1 === 0 ? v.toLocaleString('en-US') : String(+v.toFixed(2))); }
/* ================= 30 ก.ย. 69 สร้างไฟล์ Excel (.xlsx) และ ZIP ในเครื่อง (ไม่ต้องใช้ไลบรารีภายนอก) ================= */
var CRC_T = null;
function crc32(u8){ if (!CRC_T) { CRC_T = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC_T[n] = c >>> 0; } } var x = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) x = CRC_T[(x ^ u8[i]) & 255] ^ (x >>> 8); return (x ^ 0xFFFFFFFF) >>> 0; }
/** files: [{name, data: Uint8Array|string}] → Blob (ZIP แบบไม่บีบอัด) */
function zipBlob(files, type){
  var enc = new TextEncoder(), parts = [], cen = [], off = 0;
  var d = new Date(), dt = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF, dd = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
  files.forEach(function(f){
    var nm = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
    var h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, dt, true); h.setUint16(12, dd, true);
    h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, nm.length, true); h.setUint16(28, 0, true);
    parts.push(new Uint8Array(h.buffer), nm, data);
    var c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, dt, true); c.setUint16(14, dd, true);
    c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
    cen.push(new Uint8Array(c.buffer), nm);
    off += 30 + nm.length + data.length;
  });
  var csize = cen.reduce(function(a, x){ return a + x.length; }, 0);
  var e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csize, true); e.setUint32(16, off, true);
  return new Blob(parts.concat(cen).concat([new Uint8Array(e.buffer)]), { type: type || 'application/zip' });
}
function xmlEsc(v){ return String(v).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function colName(i){ var s = ''; i++; while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
/** sheets: [{name, rows:[[...]]}] แถวแรก = หัวตาราง (ตัวหนา พื้นเทา) · ทุกช่องมีเส้นขอบ · ฟอนต์ Tahoma 10 */
function xlsxBlob(sheets){
  var sheetXml = function(sh){
    var widths = [];
    sh.rows.forEach(function(r){ r.forEach(function(v, i){ var l = String(v == null ? '' : v).length; widths[i] = Math.max(widths[i] || 8, Math.min(40, l + 2)); }); });
    var x = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>' +
      widths.map(function(w, i){ return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + (w * 1.4).toFixed(1) + '" customWidth="1"/>'; }).join('') + '</cols><sheetData>';
    sh.rows.forEach(function(r, ri){
      x += '<row r="' + (ri + 1) + '">' + r.map(function(v, ci){
        var ref = colName(ci) + (ri + 1), st = ri === 0 ? 1 : 2;
        if (typeof v === 'number' && isFinite(v)) return '<c r="' + ref + '" s="' + st + '"><v>' + v + '</v></c>';
        return '<c r="' + ref + '" s="' + st + '" t="inlineStr"><is><t xml:space="preserve">' + xmlEsc(v == null ? '' : v) + '</t></is></c>';
      }).join('') + '</row>';
    });
    return x + '</sheetData></worksheet>';
  };
  var names = sheets.map(function(s, i){ return xmlEsc(String(s.name || ('Sheet' + (i + 1))).replace(/[\[\]\*\?\/\\:]/g, ' ').slice(0, 31)); });
  var files = [
    { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      sheets.map(function(s, i){ return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') + '</Types>' },
    { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
    { name: 'xl/workbook.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
      names.map(function(n, i){ return '<sheet name="' + n + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join('') + '</sheets></workbook>' },
    { name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      sheets.map(function(s, i){ return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('') +
      '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
    { name: 'xl/styles.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="10"/><name val="Tahoma"/></font><font><b/><sz val="10"/><name val="Tahoma"/></font></fonts>' +
      '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF2F2F2"/><bgColor indexed="64"/></patternFill></fill></fills>' +
      '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color auto="1"/></left><right style="thin"><color auto="1"/></right><top style="thin"><color auto="1"/></top><bottom style="thin"><color auto="1"/></bottom><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/></cellXfs></styleSheet>' }
  ];
  sheets.forEach(function(sh, i){ files.push({ name: 'xl/worksheets/sheet' + (i + 1) + '.xml', data: sheetXml(sh) }); });
  return zipBlob(files, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

/* ---------- ตัวจัดหน้าเอกสารของระบบ ศ.สาขา ---------- */
function docSignBR(L, R, dots){
  var blk = function(x){ return x ? '<div class="ds-b"><div class="fit">' + esc(x.label || '') + '</div><div class="ds-gap"></div><div class="fit">' + '.'.repeat(dots || 68) + '</div><div class="fit">' + esc(x.name || '') + '</div><div class="fit">' + esc(x.title || '') + '</div></div>' : '<div class="ds-b"></div>'; };
  return '<div class="ds">' + blk(L) + blk(R) + '</div>';
}
/** ตารางรายวัน 1 หน้า (ตารางชั่วโมง / ตารางเวร / ค่าอาหาร) รูปแบบเดียวกับเอกสารเดิม */
function docGridHtml(m, foot, page, pages){
  var nD = m.dates.length, n = m.rows.length;
  var wNo = 36, wCode = 70, wName = 176, wPos = 124, wDay = m.dayW || 30;   // ชุด 07: รหัสไม่ถูกตัด
  var totalW = wNo + wCode + wName + wPos + wDay * nD + m.tail.reduce(function(a, t){ return a + t.w; }, 0);
  var k = Math.max(1, totalW / 1065), big = n <= 25;
  var rowH = Math.max(20, Math.min(46, Math.floor((726 * k - 332) / Math.max(1, n))));
  var fName = n <= 15 ? 11 : big ? 10.5 : 9.5, fDay = big ? 12 : 11, fSum = big ? 12 : 11;
  var fv = function(v, f){ return v === '' || v == null ? '' : f === 'money' ? docNum(v, 2) : docNum(v); };
  var dayV = function(v){ return v === '' || v == null ? '' : m.dayFmt === 'num' ? docNum(v) : esc(v); };
  var bg = function(x){ return x.bg ? ' style="background:' + x.bg + '"' : ''; };
  var h = '<div class="dt" style="width:' + totalW + 'px;font-size:' + fName + 'pt"><div class="dt-h1">' + esc(m.head) + '</div>' + m.lines.map(function(l){ return '<div class="dt-h2">' + esc(l) + '</div>'; }).join('') + '<div class="dt-mark">' + esc(m.mark || '') + '</div>' +
    '<table class="dt-t"><colgroup><col style="width:' + wNo + 'px"><col style="width:' + wCode + 'px"><col style="width:' + wName + 'px"><col style="width:' + wPos + 'px">' + m.dates.map(function(){ return '<col style="width:' + wDay + 'px">'; }).join('') + m.tail.map(function(t){ return '<col style="width:' + t.w + 'px">'; }).join('') + '</colgroup>' +
    '<thead><tr><th rowspan="2">ลำดับ</th><th rowspan="2">รหัสเจ้าหน้าที่</th><th rowspan="2">ชื่อ-นามสกุล</th><th rowspan="2">ตำแหน่ง</th>' + m.dates.map(function(x){ return '<th' + bg(x) + '>' + x.d + '</th>'; }).join('') + m.tail.map(function(t){ return '<th rowspan="2">' + esc(t.t) + '</th>'; }).join('') + '</tr><tr>' +
    m.dates.map(function(x){ return '<th' + bg(x) + '>' + esc(x.dow) + '</th>'; }).join('') + '</tr></thead><tbody>';
  m.rows.forEach(function(r){
    h += '<tr style="height:' + rowH + 'px"><td class="c">' + r.no + '</td><td class="c fit">' + esc(r.code) + '</td><td class="fit">' + esc(r.name) + '</td><td class="fit">' + esc(r.pos) + '</td>' +
      r.days.map(function(v, i){ return '<td class="d" style="font-size:' + fDay + 'pt' + (m.dates[i].bg ? ';background:' + m.dates[i].bg : '') + '">' + dayV(v) + '</td>'; }).join('') +
      r.tail.map(function(v, i){ return '<td class="' + (m.tail[i].f === 'money' ? 'a' : 't') + '" style="font-size:' + fSum + 'pt">' + fv(v, m.tail[i].f) + '</td>'; }).join('') + '</tr>';
  });
  h += '<tr class="sum" style="font-size:' + fSum + 'pt"><td colspan="4" class="c">รวมประจำวัน</td>' + m.daily.map(function(v){ return '<td class="c">' + (v ? docNum(v) : '') + '</td>'; }).join('') +
    m.sumTail.map(function(v, i){ return '<td class="' + (m.tail[i].f === 'money' ? 'a' : 'c') + '">' + fv(v, m.tail[i].f) + '</td>'; }).join('') + '</tr></tbody></table>' +
    (m.legend ? '<div class="dt-leg">' + esc(m.legend) + '</div>' : '') + docSignBR(m.sign.left, m.sign.right) +
    '<div class="dt-foot"><i>' + esc(foot) + '</i><span>หน้า ' + page + ' / ' + pages + '</span></div></div>';
  return h;
}
/** ใบบันทึกเวลาการปฏิบัติงาน FM-HRM-032/01 (A4 แนวตั้ง · 2 ช่วง) */
function docSign32Html(pg, foot){
  var W = [56, 82, 62, 152, 92, 62, 152, 92];   // ชุด 07: วันที่เต็ม 1/9/2569 · ชื่ออยู่บรรทัดเดียว
  var h = '<div class="d32"><div class="d32-no">' + pg.no + '</div><div class="d32-t1">' + esc(pg.t1) + '</div><div class="d32-t2">' + esc(pg.t2) + '</div>' +
    '<table class="d32-t"><colgroup>' + W.map(function(w){ return '<col style="width:' + w + 'px">'; }).join('') + '</colgroup><thead><tr><th rowspan="2">วัน</th><th rowspan="2">วันที่</th><th colspan="3" class="g">' + esc(pg.dLabel) + '</th><th colspan="3" class="g">' + esc(pg.eLabel) + '</th></tr>' +
    '<tr><th class="gl">รหัสเจ้าหน้าที่</th><th>ชื่อ-นามสกุล</th><th class="gr">ลงลายมือชื่อ</th><th>รหัสเจ้าหน้าที่</th><th>ชื่อ-นามสกุล</th><th class="gr">ลงลายมือชื่อ</th></tr></thead><tbody>';
  pg.rows.forEach(function(r){
    var b = r[8] ? ' style="background:' + r[8] + '"' : '';
    var cell = function(code, nm, dark){ return dark ? '<td class="dk gl"></td><td class="dk nm"></td><td class="dk gr"></td>' : '<td class="c gl fit"' + b + '>' + esc(code) + '</td><td class="nm fit"' + b + '>' + esc(nm) + '</td><td class="gr"' + b + '></td>'; };
    var cellC = function(code, nm, dark){ return dark ? '<td class="dk"></td><td class="dk nm"></td><td class="dk gr"></td>' : '<td class="c fit"' + b + '>' + esc(code) + '</td><td class="nm fit"' + b + '>' + esc(nm) + '</td><td class="gr"' + b + '></td>'; };
    h += '<tr><td class="c fit"' + b + '>' + esc(r[0]) + '</td><td class="c fit"' + b + '>' + esc(r[1]) + '</td>' + cell(r[2], r[3], r[4]) + cellC(r[5], r[6], r[7]) + '</tr>';
  });
  return h + '</tbody></table><div class="d32-note">ช่องสีเทาทึบ = ปิดศูนย์ หรือไม่มีกรอบเวรสำหรับใบนี้ (ห้ามลงชื่อ) · บุคลากรลงลายมือชื่อตามเวลาที่ปฏิบัติงานจริง</div>' +
    docSignBR(pg.left, pg.right, 50) + '<div class="d32-foot"><i>' + esc(pg.blank ? '' : foot) + '</i></div><div class="d32-pg">' + esc(pg.page) + '</div></div>';
}
/** สรุปยอดเบิกรายศูนย์ (A4 แนวตั้ง) */
function docSummaryHtml(pg, foot){
  var W = [72, 392, 176, 58, 62, 56, 104];   // ชุด 07: รายการ/ตำแหน่งอยู่บรรทัดเดียว
  var h = '<div class="dsm"><div class="dsm-h">' + esc(pg.head) + '</div><table class="dsm-t"><colgroup>' + W.map(function(w){ return '<col style="width:' + w + 'px">'; }).join('') + '</colgroup><tbody>';
  pg.sections.forEach(function(s){
    h += '<tr class="br"><td colspan="7">' + esc(s.title) + '</td></tr><tr class="hd"><td>รหัสรายได้</td><td>รายการ</td><td>ตำแหน่ง</td><td>จำนวนคน</td><td>จำนวน</td><td>หน่วย</td><td>จำนวนเงิน (บาท)</td></tr>';
    s.rows.forEach(function(r){ h += '<tr><td class="fit">' + esc(r[0]) + '</td><td class="fit">' + esc(r[1]) + '</td><td class="fit">' + esc(r[2]) + '</td><td class="n">' + docNum(r[3]) + '</td><td class="n">' + docNum(r[4]) + '</td><td>' + esc(r[5]) + '</td><td class="n">' + docNum(r[6], 2) + '</td></tr>'; });
    h += '<tr class="sum"><td></td><td>รวม ' + esc(s.name) + '</td><td></td><td></td><td></td><td></td><td class="n">' + docNum(s.sub, 2) + '</td></tr><tr class="sp"><td colspan="7"></td></tr>';
  });
  return h + '<tr class="grand"><td></td><td>รวมทุกศูนย์</td><td></td><td></td><td></td><td></td><td class="n">' + docNum(pg.grand, 2) + '</td></tr></tbody></table><div class="dsm-foot"><i>' + esc(foot) + '</i></div></div>';
}
/** r = ผลจาก printDoc (เซิร์ฟเวอร์) → จัดหน้าแล้วเปิดหน้าต่างพิมพ์ */
function printBRDoc(r){
  var pages = r.kind === 'sign32' ? r.pages.map(function(pg){ return docSign32Html(pg, r.foot); })
    : r.kind === 'summary' ? r.pages.map(function(pg){ return docSummaryHtml(pg, r.foot); })
    : r.pages.map(function(m, i){ return docGridHtml(m, r.foot, i + 1, r.pages.length); });
  return printDoc({ orient: r.orient, title: r.title, pages: pages, flow: r.kind === 'summary' });
}

/* ================= 1 ต.ค. 69 Excel เอกสารเบิกจ่าย (ผู้ดูแลระบบ) สร้างในเครื่อง =================
 * เดิมเซิร์ฟเวอร์สร้าง Google Sheet ชั่วคราว → แปลง .xlsx → ส่งกลับ (ช้า 10–40 วิ/ไฟล์)
 * ใหม่: ใช้ข้อมูลชุดเดียวกับหน้าพิมพ์ (printDoc) จัดหน้าในเครื่อง แล้วแปลงตาราง/หัวเรื่อง/ช่องลงนามเป็นเซลล์ Excel
 *       (ตัวหนา ขนาดอักษร สีพื้น เส้นขอบ ผสานเซลล์ ความกว้างคอลัมน์ ตั้งหน้า A4 พอดี 1 หน้า) → ดาวน์โหลดลงเครื่องทันที */
/** sheets: [{name, cols:[px], rows:[{h, cells:[{v, s}|null]}], merges:[[r0,c0,r1,c1]], orient, flow}] */
function xlsxStyledBlob(sheets){
  var fonts = ['<font><sz val="10"/><name val="Tahoma"/></font>'], fills = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>'];
  var borders = ['<border><left/><right/><top/><bottom/><diagonal/></border>'], xfs = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'];
  var K = { f: {}, l: {}, b: {}, x: {} };
  var put = function(arr, map, key, xml){ if (map[key] === undefined) { map[key] = arr.length; arr.push(xml); } return map[key]; };
  var side = function(n, w){ return w ? '<' + n + ' style="' + w + '"><color auto="1"/></' + n + '>' : '<' + n + '/>'; };
  var sid = function(s){
    if (!s) return 0;
    var fk = (s.b ? 'b' : '') + (s.i ? 'i' : '') + '|' + (s.sz || 10) + '|' + (s.color || '');
    var f = put(fonts, K.f, fk, '<font>' + (s.b ? '<b/>' : '') + (s.i ? '<i/>' : '') + '<sz val="' + (s.sz || 10) + '"/>' + (s.color ? '<color rgb="FF' + s.color + '"/>' : '') + '<name val="Tahoma"/></font>');
    var l = s.fill ? put(fills, K.l, s.fill, '<fill><patternFill patternType="solid"><fgColor rgb="FF' + s.fill + '"/><bgColor indexed="64"/></patternFill></fill>') : 0;
    var bd = s.bd || ['', '', '', ''], bk = bd.join('|');
    var b = bk === '|||' ? 0 : put(borders, K.b, bk, '<border>' + side('left', bd[0]) + side('right', bd[1]) + side('top', bd[2]) + side('bottom', bd[3]) + '<diagonal/></border>');
    var al = '<alignment horizontal="' + (s.h || 'general') + '" vertical="' + (s.v || 'center') + '"' + (s.wrap ? ' wrapText="1"' : '') + '/>';
    var nf = s.nf || 0, xk = f + '|' + l + '|' + b + '|' + nf + '|' + al;
    return put(xfs, K.x, xk, '<xf numFmtId="' + nf + '" fontId="' + f + '" fillId="' + l + '" borderId="' + b + '" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"' + (nf ? ' applyNumberFormat="1"' : '') + '>' + al + '</xf>');
  };
  var sheetXml = function(sh){
    var x = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols>' +
      sh.cols.map(function(px, i){ return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + Math.max(2, px / 7).toFixed(2) + '" customWidth="1"/>'; }).join('') + '</cols><sheetData>';
    sh.rows.forEach(function(r, ri){
      x += '<row r="' + (ri + 1) + '"' + (r.h ? ' ht="' + r.h.toFixed(1) + '" customHeight="1"' : '') + '>';
      r.cells.forEach(function(c, ci){
        if (!c) return;
        var ref = colName(ci) + (ri + 1), s = sid(c.s);
        if (c.v === '' || c.v == null) x += '<c r="' + ref + '" s="' + s + '"/>';
        else if (typeof c.v === 'number') x += '<c r="' + ref + '" s="' + s + '"><v>' + c.v + '</v></c>';
        else x += '<c r="' + ref + '" s="' + s + '" t="inlineStr"><is><t xml:space="preserve">' + xmlEsc(c.v) + '</t></is></c>';
      });
      x += '</row>';
    });
    x += '</sheetData>';
    if (sh.merges.length) x += '<mergeCells count="' + sh.merges.length + '">' + sh.merges.map(function(m){ return '<mergeCell ref="' + colName(m[1]) + (m[0] + 1) + ':' + colName(m[3]) + (m[2] + 1) + '"/>'; }).join('') + '</mergeCells>';
    return x + '<printOptions horizontalCentered="1"/><pageMargins left="0.3" right="0.3" top="0.35" bottom="0.35" header="0.2" footer="0.2"/><pageSetup paperSize="9" orientation="' + (sh.orient || 'landscape') + '" fitToWidth="1" fitToHeight="' + (sh.flow ? 0 : 1) + '"/></worksheet>';
  };
  var used = {}, names = sheets.map(function(s, i){
    var n = String(s.name || ('Sheet' + (i + 1))).replace(/[\[\]\*\?\/\\:]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 31) || ('Sheet' + (i + 1)), b = n, k = 2;
    while (used[n.toLowerCase()]) { var t = ' (' + (k++) + ')'; n = b.slice(0, 31 - t.length) + t; }
    used[n.toLowerCase()] = 1; return n;
  });
  var bodies = sheets.map(sheetXml);   // สร้างก่อน styles (สไตล์เก็บระหว่างสร้าง)
  var files = [
    { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      sheets.map(function(s, i){ return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') + '</Types>' },
    { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
    { name: 'xl/workbook.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
      names.map(function(n, i){ return '<sheet name="' + xmlEsc(n) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join('') + '</sheets></workbook>' },
    { name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      sheets.map(function(s, i){ return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('') +
      '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
    { name: 'xl/styles.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="' + fonts.length + '">' + fonts.join('') + '</fonts><fills count="' + fills.length + '">' + fills.join('') + '</fills><borders count="' + borders.length + '">' + borders.join('') + '</borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="' + xfs.length + '">' + xfs.join('') + '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>' }
  ];
  bodies.forEach(function(b, i){ files.push({ name: 'xl/worksheets/sheet' + (i + 1) + '.xml', data: b }); });
  return zipBlob(files, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}
/** หน้าเอกสาร (DOM ที่จัดแล้ว) → แผ่นงาน Excel · ตารางหลักกำหนดคอลัมน์ ข้อความอื่นผสานเต็มความกว้าง ช่องลงนามแบ่งซ้าย/ขวาตามตำแหน่งจริง */
function domToSheet(page, name, orient, flow){
  var tbl = page.querySelector('table'), cols = [];
  if (tbl) { $$('col', tbl).forEach(function(c){ cols.push(c.getBoundingClientRect().width || parseFloat(c.style.width) || 60); }); }
  if (!cols.length) cols = [120, 120, 120, 120, 120, 120];
  var N = cols.length, rows = [], merges = [];
  var tL = tbl ? tbl.getBoundingClientRect().left : page.getBoundingClientRect().left, edges = [0];
  cols.forEach(function(w){ edges.push(edges[edges.length - 1] + w); });
  var rgbHex = function(v){ var m = String(v).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/); if (!m || (m[4] !== undefined && +m[4] < 0.05)) return ''; var h = [m[1], m[2], m[3]].map(function(x){ return ('0' + (+x).toString(16)).slice(-2); }).join('').toUpperCase(); return h; };
  var txt = function(el){ return String(el.textContent || '').replace(/\s+/g, ' ').trim(); };
  var st = function(el, cell){
    var cs = getComputedStyle(el), s = { sz: Math.round(parseFloat(cs.fontSize) * 0.75 * 2) / 2 || 10, b: (+cs.fontWeight || 400) >= 600, i: cs.fontStyle === 'italic' };
    var c = rgbHex(cs.color); if (c && c !== '000000') s.color = c;
    var ta = cs.textAlign; s.h = ta === 'center' ? 'center' : ta === 'right' || ta === 'end' ? 'right' : 'left';
    if (cell) {
      var bg = rgbHex(cs.backgroundColor); if (bg && bg !== 'FFFFFF') s.fill = bg;
      s.bd = ['Left', 'Right', 'Top', 'Bottom'].map(function(k){ var w = parseFloat(cs['border' + k + 'Width']) || 0; return cs['border' + k + 'Style'] === 'none' || !w ? '' : w >= 1.75 ? 'medium' : 'thin'; });
      s.wrap = cs.whiteSpace !== 'nowrap';
    }
    return s;
  };
  var row = function(h){ rows.push({ h: h, cells: new Array(N).fill(null) }); return rows.length - 1; };
  var val = function(t, inBody){
    if (inBody && /^-?(\d{1,3}(,\d{3})+|\d{1,4})(\.\d+)?$/.test(t)) { var n = +t.replace(/,/g, ''); return { v: n, nf: /,|\.\d\d$/.test(t) ? (/\.\d+$/.test(t) ? 4 : 3) : 0 }; }
    return { v: t, nf: 0 };
  };
  var colRange = function(rc){   // ตำแหน่งจริงบนหน้า → ช่วงคอลัมน์
    var a = rc.left - tL, b = rc.right - tL, c0 = 0, c1 = N - 1;
    for (var i = 0; i < N; i++) if (edges[i + 1] > a + 2) { c0 = i; break; }
    for (var j = N - 1; j >= 0; j--) if (edges[j] < b - 2) { c1 = j; break; }
    return [Math.max(0, Math.min(c0, N - 1)), Math.max(c0, Math.min(c1, N - 1))];
  };
  var line = function(el, text, c0, c1, r){
    var s = st(el, false), h = Math.max(15, el.getBoundingClientRect().height * 0.75);
    if (r === undefined) r = row(Math.min(h, 40));
    rows[r].cells[c0] = { v: text, s: s };
    for (var k = c0 + 1; k <= c1; k++) rows[r].cells[k] = { v: '', s: s };
    if (c1 > c0) merges.push([r, c0, r, c1]);
    return r;
  };
  var addTable = function(t){
    var occ = {}, base = rows.length;
    $$('tr', t).forEach(function(tr, ri){
      var r = base + ri; if (r >= rows.length) row(Math.max(12, tr.getBoundingClientRect().height * 0.75));
      var inBody = tr.parentNode.tagName === 'TBODY', ci = 0;
      Array.prototype.forEach.call(tr.cells, function(td){
        while (occ[r + ':' + ci]) ci++;
        if (ci >= N) return;
        var cs = td.colSpan || 1, rs = td.rowSpan || 1, s = st(td, true), v = val(txt(td), inBody && td.tagName === 'TD');
        s.nf = v.nf;
        for (var a = 0; a < rs; a++) for (var b = 0; b < cs; b++) {
          var rr = r + a, cc = ci + b; if (cc >= N) continue;
          occ[rr + ':' + cc] = 1;
          while (rr >= rows.length) row(15);
          rows[rr].cells[cc] = a || b ? { v: '', s: s } : { v: v.v, s: s };
        }
        if (cs > 1 || rs > 1) merges.push([r, ci, r + rs - 1, Math.min(N - 1, ci + cs - 1)]);
        ci += cs;
      });
    });
  };
  var walk = function(el){
    Array.prototype.forEach.call(el.children, function(ch){
      if (ch.tagName === 'TABLE') return addTable(ch);
      if (ch.tagName === 'COLGROUP' || ch.tagName === 'STYLE') return;
      var cs = getComputedStyle(ch);
      if (cs.display === 'none') return;
      if (ch.querySelector('table')) return walk(ch);
      if (cs.display === 'flex' && cs.flexDirection.indexOf('column') < 0 && ch.children.length > 1) {   // ช่องลงนาม / ท้ายกระดาษ ซ้าย-ขวา
        var parts = Array.prototype.map.call(ch.children, function(k){ var lines = k.children.length ? Array.prototype.slice.call(k.children) : [k]; return { el: k, rg: colRange(k.getBoundingClientRect()), lines: lines }; })
          .filter(function(p){ return txt(p.el) || p.lines.length > 1; });
        parts.forEach(function(p, i){ if (i && p.rg[0] <= parts[i - 1].rg[1]) p.rg[0] = Math.min(N - 1, parts[i - 1].rg[1] + 1); if (p.rg[1] < p.rg[0]) p.rg[1] = p.rg[0]; });
        var n = Math.max.apply(null, parts.map(function(p){ return p.lines.length; }).concat([0])), r0 = rows.length;
        for (var i = 0; i < n; i++) row(16);
        parts.forEach(function(p){ p.lines.forEach(function(l, li){ line(l, txt(l), p.rg[0], p.rg[1], r0 + li); }); });
        return;
      }
      var t = txt(ch);
      if (t) line(ch, t, 0, N - 1);
      else if (ch.getBoundingClientRect().height >= 8) row(Math.min(30, ch.getBoundingClientRect().height * 0.75));
    });
  };
  walk(page);
  return { name: name, cols: cols, rows: rows, merges: merges, orient: orient, flow: flow };
}
/** r = ผลจาก printDoc → ไฟล์ .xlsx (1 หน้าเอกสาร = 1 แผ่นงาน) ดาวน์โหลดลงเครื่อง */
function xlsxBRDoc(r){
  var pages = r.kind === 'sign32' ? r.pages.map(function(pg){ return docSign32Html(pg, r.foot); })
    : r.kind === 'summary' ? r.pages.map(function(pg){ return docSummaryHtml(pg, r.foot); })
    : r.pages.map(function(m, i){ return docGridHtml(m, r.foot, i + 1, r.pages.length); });
  var names = r.pages.map(function(pg, i){
    if (r.kind === 'sign32') return String(pg.t2 || '').replace(/^.*ตำแหน่ง\s*/, '').replace(/\s+ใบที่\s*(\d+).*$/, ' ใบ $1') || ('ใบ ' + (i + 1));
    if (r.kind === 'summary') return 'สรุปยอด';
    return String((pg.lines || [])[0] || pg.head || '').replace(/^ตำแหน่ง\s*/, '').replace(/^รหัสรายได้\s*/, '') || ('หน้า ' + (i + 1));
  });
  return ensureDocFont().then(function(){
    var root = $('printRoot'), keep = root.innerHTML, cls = root.className;
    root.className = 'docs ' + r.orient + ' measuring';
    root.innerHTML = pages.map(function(h){ return '<section class="dp' + (r.kind === 'summary' ? ' flow' : '') + '"><div class="dp-in">' + h + '</div></section>'; }).join('');
    var sheets;
    try { sheets = $$('.dp-in', root).map(function(inn, i){ return domToSheet(inn.firstElementChild || inn, names[i], r.orient, r.kind === 'summary'); }); }
    finally { root.innerHTML = keep; root.className = cls; }
    downloadBlobs([{ name: (r.title || 'เอกสาร') + '.xlsx', blob: xlsxStyledBlob(sheets) }]);
    return { sheets: sheets.length };
  });
}

/** ตารางสำหรับรายงานพิมพ์ */
function prTable(cols, rows, groupBy){
  var h = '<table class="pr-table"><thead><tr>' + cols.map(function(c){ return '<th' + (c.w ? ' style="width:' + c.w + '"' : '') + (c.num ? ' class="num"' : '') + '>' + esc(c.t) + '</th>'; }).join('') + '</tr></thead><tbody>';
  var last = null;
  rows.forEach(function(r){
    if (groupBy) { var g = groupBy(r); if (g !== last) { h += '<tr class="pr-group"><td colspan="' + cols.length + '">' + esc(g) + '</td></tr>'; last = g; } }
    h += '<tr>' + cols.map(function(c){ var v = c.f(r); return '<td' + (c.num ? ' class="num"' : '') + '>' + (c.html ? v : esc(v)) + '</td>'; }).join('') + '</tr>';
  });
  return h + '</tbody></table>';
}

/* ================= ตารางแบบ Google Sheet (จัดตารางเวรรายศูนย์) =================
 * cfg: {host, dates:[{d,dow,color,note}], rows:[{key,pid,empCode,name,hrPos,cells:{d:'ชย'},st:{d},pend:{d},editable}],
 *       quota:{pid:[{D,E}...]}, positions:[{id,name}], onSave(changes, btn), onAddRow(pid), canAdd}
 * พิมพ์ตัวย่อในช่อง: ช = ช่วงกลางวัน · ย = ช่วงเย็น · ชย = ทั้งวัน · ลบว่าง = ยกเลิกเวร · วางจาก Excel ได้
 */
function slotMap(){ var m = {}; ['D', 'E'].forEach(function(k){ var l = slotL(k); m[l.s] = k; m[String(l.en || k).toUpperCase()] = k; m[k] = k; }); return m; }
function parseCell(t){
  t = String(t || '').replace(/\s+/g, '').toUpperCase(); if (!t) return { slots: [] };
  var map = slotMap(), out = [], i = 0;
  while (i < t.length) {
    var k = map[t.charAt(i)];
    if (!k) return { error: 'ไม่รู้จัก "' + t.charAt(i) + '" ใช้ ' + slotL('D').s + ' หรือ ' + slotL('E').s + ' (ต่อท้ายเลขได้ เช่น ' + slotL('D').s + '2)' };
    i++;
    if (t.charAt(i) === '*') i++; else { var m = t.slice(i).match(/^\d+/); if (m) { if (+m[0] < 1) return { error: 'เลขเวลาต้องเริ่มที่ 1' }; i += m[0].length; } }
    if (out.indexOf(k) >= 0) return { error: slotL(k).s + ' ซ้ำในช่องเดียวกัน' };
    out.push(k);
  }
  return { slots: out };
}
/** คำอธิบายเวลามาตรฐานของตำแหน่ง: ช 08:00-16:00 · ช2 08:00-12:00 */
function timeLegend(P){
  var f = function(s, list){ return (list || []).map(function(k, i){ return '<span class="tl-k"><b>' + esc(slotL(s).s + (i ? i + 1 : '')) + '</b> ' + esc(k.replace('-', '–')) + '</span>'; }).join(''); };
  return '<span class="time-lg">' + f('D', P.day) + f('E', P.eve) + '</span>';
}
function cellText(slots){ return ['D', 'E'].filter(function(k){ return slots.indexOf(k) >= 0; }).map(function(k){ return slotL(k).s; }).join(''); }
/** แยกข้อความในช่องเป็นรายการตัวย่อ [{slot, raw}] (null = รูปแบบไม่ถูกต้อง) */
function cellToks(v){
  var m = slotMap(), s = String(v || '').replace(/\s+/g, ''), out = [], i = 0;
  while (i < s.length) {
    var ch = s.charAt(i), k = m[ch] || m[ch.toUpperCase()]; if (!k) return null;
    var j = i + 1; if (s.charAt(j) === '*') j++; else while (j < s.length && /\d/.test(s.charAt(j))) j++;
    out.push({ slot: k, raw: s.slice(i, j) }); i = j;
  }
  return out;
}
var SG_UID = 0, SG_LINES = {};
/**
 * ตารางแบบ Google Sheet (แถว = บุคคล×ตำแหน่ง · คอลัมน์ = วันที่)
 * cfg: {host, dates, rows, quota, positions, canAdd, onAddRow, onSave, lineKey}
 * ชุด 07: เลือกดูทีละใบเซ็นชื่อได้ (ทั้งหมด | ใบ 1 | ใบ 2 …) · ช่อง/แถวที่ไม่อยู่ในใบที่เลือกถูกซ่อน · เพิ่มเวรขณะเลือก 1 ใบ → ลงใบนั้น
 */
function SheetGrid(cfg){
  var G = { cfg: cfg, dirty: {}, uid: 'g' + (++SG_UID) };
  var host = typeof cfg.host === 'string' ? $(cfg.host) : cfg.host;
  var dates = cfg.dates, U = G.uid;
  var lk = function(pid){ return (cfg.lineKey || '') + '|' + pid; };
  var selOf = function(pid){ return SG_LINES[lk(pid)] || []; };
  var lnOf = function(r, d, slot){ var o = r.orig && r.orig[d] ? cellToks(r.orig[d]) : null; if (!o || !o.some(function(t){ return t.slot === slot; })) return 0; return (r.ln && r.ln[d] && r.ln[d][slot]) || 0; };
  /** ส่วนของช่องที่แสดงตามใบที่เลือก (เวรใหม่ที่ยังไม่บันทึกแสดงเสมอ) */
  var vis = function(r, d){
    var sel = selOf(r.pid), v = r.cells[d] || '';
    if (!sel.length) return v;
    var t = cellToks(v); if (!t) return v;
    return t.filter(function(x){ var l = lnOf(r, d, x.slot); return !l || sel.indexOf(l) >= 0; }).map(function(x){ return x.raw; }).join('');
  };
  var hiddenToks = function(r, d){
    var sel = selOf(r.pid); if (!sel.length) return [];
    var t = cellToks(r.cells[d] || '') || [];
    return t.filter(function(x){ var l = lnOf(r, d, x.slot); return l && sel.indexOf(l) < 0; });
  };
  var lnTitle = function(r, d){ var ln = r.ln && r.ln[d]; if (!ln) return ''; return ' · ' + ['D', 'E'].filter(function(s){ return ln[s]; }).map(function(s){ return slotL(s).s + ' ใบที่ ' + ln[s]; }).join(' · '); };
  var rowShown = function(r){
    var sel = selOf(r.pid); if (!sel.length || r._show) return true;
    if (Object.keys(G.dirty).some(function(k){ return G.dirty[k].row === r; })) return true;
    return dates.some(function(x){ return !!vis(r, x.d); });
  };
  G.render = function(){
    var anyEdit = cfg.rows.some(function(r){ return r.editable; }) || cfg.canAdd;
    var h = '<div class="sg-bar">' + (anyEdit ? '<span class="small-muted"><i class="bi bi-keyboard"></i> พิมพ์ <b>' + esc(slotL('D').s) + '</b> = ' + esc(slotL('D').name) + ' · <b>' + esc(slotL('E').s) + '</b> = ' + esc(slotL('E').name) + ' · <b>' + esc(slotL('D').s + slotL('E').s) + '</b> = ทั้งวัน · <b>' + esc(slotL('D').s) + '2</b> = เวลามาตรฐานแบบที่ 2 · ลบช่องให้ว่าง = ยกเลิกเวร · วางจาก Excel ได้</span>' : '<span class="small-muted"><i class="bi bi-eye"></i> เปิดดูอย่างเดียว · เอาเมาส์ชี้ช่องเพื่อดูใบเซ็นชื่อที่</span>') +
      '<span class="ms-auto d-flex gap-2 align-items-center"><span class="sg-cnt" id="' + U + 'Cnt"></span>' + (anyEdit ? '<button class="btn btn-sm btn-ghost" type="button" id="' + U + 'Undo" disabled><i class="bi bi-arrow-counterclockwise"></i> ยกเลิกที่แก้</button><button class="btn btn-sm btn-brand" type="button" id="' + U + 'Save" disabled><i class="bi bi-save"></i> บันทึกตาราง</button>' : '') + '</span></div>';
    h += '<div class="sg-wrap"><table class="sg"><thead><tr><th class="sg-code">รหัส</th><th class="sg-name">ชื่อ-นามสกุล</th><th class="sg-hp">ตำแหน่ง (HR)</th>' + dates.map(function(x){ return '<th class="' + dk(x.color) + '" title="' + esc(x.note || '') + '"><div>' + x.d + '</div><small>' + TH_D[x.dow] + '</small></th>'; }).join('') + '<th class="sg-tot">รวม</th></tr></thead><tbody>';
    var order = [], byG = {};
    (cfg.positions || []).forEach(function(p){ byG[p.id] = []; order.push(p.id); });
    cfg.rows.forEach(function(r, i){ if (!byG[r.pid]) { byG[r.pid] = []; order.push(r.pid); } byG[r.pid].push(i); });
    order.forEach(function(g){
      var idx = byG[g], P = (cfg.positions || []).filter(function(p){ return p.id === g; })[0] || { name: posName(g) };
      var q = (cfg.quota || {})[g];
      if (!idx.length && !(q && q.some(function(x){ return x.D || x.E; }))) return;
      var nL = P.lines || 1, sel = selOf(g);
      var chips = nL > 1 || sel.length ? '<span class="sg-lines" data-lp="' + g + '"><span class="small-muted">ใบเซ็นชื่อ:</span> <button type="button" class="lchip' + (sel.length ? '' : ' on') + '" data-ln="0">ทั้งหมด</button>' +
        Array.apply(null, Array(nL)).map(function(_, i){ return '<button type="button" class="lchip' + (sel.indexOf(i + 1) >= 0 ? ' on' : '') + '" data-ln="' + (i + 1) + '">ใบ ' + (i + 1) + '</button>'; }).join('') + '</span>' : '';
      h += '<tr class="sg-g"><td class="sg-code"></td><td class="sg-name" colspan="2"><b>' + esc(posShort(P.name)) + '</b>' + (cfg.onAddRow && cfg.canAdd ? ' <button class="btn btn-sm btn-link py-0" type="button" data-addp="' + g + '"><i class="bi bi-person-plus"></i> เพิ่มบุคลากร</button>' : '') + '</td><td colspan="' + (dates.length + 1) + '" class="sg-tlg">' + chips + (P.day || P.eve ? timeLegend(P) : '') +
        (sel.length === 1 && anyEdit ? ' <span class="pill p-info nodot">เวรที่เพิ่มตอนนี้จะลงใบที่ ' + sel[0] + '</span>' : '') + '</td></tr>';
      var shown = 0;
      idx.forEach(function(i){
        var r = cfg.rows[i];
        if (!rowShown(r)) return;
        shown++;
        h += '<tr data-row="' + i + '"><td class="sg-code tnum">' + esc(r.empCode) + '</td><td class="sg-name"><b>' + esc(r.name) + '</b>' + (r.partTime ? ' <span class="mini-tag">ชม.</span>' : '') + (r.stopNote ? stopPill(r.stop, true) : '') + '</td><td class="sg-hp">' + esc(r.hrPos || '') + '</td>';
        dates.forEach(function(x){
          var v = vis(r, x.d), pend = r.pend && r.pend[x.d], st = r.st && r.st[x.d], rc = v ? recCls(st) : '';
          h += '<td class="' + dk(x.color) + (pend ? ' sg-pend' : '') + (rc ? ' ' + rc : '') + '"' + (v ? ' title="' + esc((pend ? 'ลงเอง รอศูนย์ยืนยัน · ' : '') + recTitle(st) + lnTitle(r, x.d)) + '"' : '') + '>' + (r.editable && x.color !== 'CLOSED' ? '<input class="sgc' + (G.dirty[r.key + '|' + x.d] ? ' dirty' : '') + '" data-r="' + i + '" data-d="' + x.d + '" value="' + esc(v) + '" autocomplete="off" spellcheck="false" aria-label="' + esc(r.name + ' วันที่ ' + x.d) + '">' : '<span class="sgv">' + esc(v) + '</span>') + '</td>';
        });
        h += '<td class="sg-tot" id="' + U + 't_' + i + '">' + rowTotal(r) + '</td></tr>';
      });
      if (sel.length && !shown) h += '<tr><td colspan="' + (dates.length + 4) + '" class="small-muted text-center">ใบที่เลือกยังไม่มีเวร · กด "เพิ่มบุคลากร" แล้วพิมพ์ตัวย่อ เวรจะลงใบนี้</td></tr>';
      if (!sel.length) h += '<tr class="sg-sum" data-g="' + g + '"><td class="sg-code"></td><td class="sg-name" colspan="2">ลงแล้ว / กรอบ (' + esc(slotL('D').s) + ' · ' + esc(slotL('E').s) + ')</td>' + dates.map(function(x, di){ return '<td class="' + dk(x.color) + '" data-sd="' + x.d + '" data-di="' + di + '"></td>'; }).join('') + '<td class="sg-tot" data-st="1"></td></tr>';
    });
    if (!order.length) h += '<tr><td colspan="' + (dates.length + 4) + '">' + empty('calendar-x', 'ยังไม่มีผู้ลงเวร') + '</td></tr>';
    h += '</tbody></table></div>';
    host.innerHTML = h;
    G._byG = byG;
    bind(); count(); sums();
  };
  function sums(){
    Object.keys(G._byG || {}).forEach(function(g){
      var tr = host.querySelector('tr.sg-sum[data-g="' + g + '"]'); if (!tr) return;
      var q = (cfg.quota || {})[g] || [], tot = 0;
      dates.forEach(function(x, di){
        var n = { D: 0, E: 0 };
        G._byG[g].forEach(function(i){ var p = parseCell(cfg.rows[i].cells[x.d]); if (!p.error) p.slots.forEach(function(s){ n[s]++; }); });
        tot += n.D + n.E;
        var qq = q[di] || { D: 0, E: 0 }, td = tr.querySelector('[data-sd="' + x.d + '"]');
        if (!td) return;
        var over = n.D > qq.D || n.E > qq.E, full = n.D === qq.D && n.E === qq.E && (qq.D || qq.E), gap = n.D < qq.D || n.E < qq.E;
        td.innerHTML = (qq.D || qq.E || n.D || n.E) ? '<span class="qd">' + n.D + '/' + qq.D + '</span><span class="qd">' + n.E + '/' + qq.E + '</span>' : '';
        td.className = dk(x.color) + (over ? ' q-over' : full ? ' q-full' : gap ? ' q-gap' : '');
      });
      var tt = tr.querySelector('[data-st]'); if (tt) tt.textContent = tot;
    });
  }
  function rowTotal(r){ var n = 0; Object.keys(r.cells).forEach(function(d){ var p = parseCell(r.cells[d]); if (!p.error) n += p.slots.length; }); return n || ''; }
  function count(){
    var n = Object.keys(G.dirty).length;
    if ($(U + 'Cnt')) $(U + 'Cnt').innerHTML = n ? '<span class="pill p-warn nodot">แก้ไข ' + n + ' ช่อง</span>' : '';
    if ($(U + 'Save')) $(U + 'Save').disabled = !n;
    if ($(U + 'Undo')) $(U + 'Undo').disabled = !n;
  }
  function setCell(inp, val){
    var r = cfg.rows[+inp.dataset.r], d = +inp.dataset.d;
    inp.value = val;
    var p = parseCell(val);
    inp.classList.toggle('bad', !!p.error);
    inp.title = p.error || '';
    // ใบที่เลือก: รวมส่วนที่พิมพ์กับเวรของใบอื่นในช่องเดียวกัน (ซ่อนอยู่)
    var hid = hiddenToks(r, d), full = String(val).trim();
    if (hid.length && !p.error) {
      var mine = cellToks(val) || [], clash = hid.filter(function(h){ return mine.some(function(m){ return m.slot === h.slot; }); });
      if (clash.length) { inp.classList.add('bad'); inp.title = slotL(clash[0].slot).s + ' วันนี้อยู่ในใบอื่นแล้ว (ใบที่ ' + lnOf(r, d, clash[0].slot) + ')'; }
      var all = mine.concat(hid.filter(function(h){ return !mine.some(function(m){ return m.slot === h.slot; }); }));
      full = ['D', 'E'].map(function(s){ var t = all.filter(function(x){ return x.slot === s; })[0]; return t ? t.raw : ''; }).join('');
    }
    var orig = r.orig ? (r.orig[d] || '') : '';
    var key = r.key + '|' + d;
    if (full.replace(/\s+/g, '') === String(orig).replace(/\s+/g, '')) { delete G.dirty[key]; inp.classList.remove('dirty'); }
    else { G.dirty[key] = { row: r, d: d, value: full, line: selOf(r.pid).length === 1 ? selOf(r.pid)[0] : 0 }; inp.classList.add('dirty'); }
    r.cells[d] = full;
    var t = $(U + 't_' + inp.dataset.r); if (t) t.textContent = rowTotal(r);
    count(); sums();
  }
  function bind(){
    cfg.rows.forEach(function(r){ if (!r.orig) { r.orig = {}; for (var k in r.cells) r.orig[k] = r.cells[k]; } });
    $$('.sgc', host).forEach(function(inp){
      inp.addEventListener('input', function(){ setCell(inp, inp.value); });
      inp.addEventListener('focus', function(){ inp.select(); var tr = inp.closest('tr'); $$('.sg tr.on', host).forEach(function(x){ x.classList.remove('on'); }); tr.classList.add('on'); });
      inp.addEventListener('keydown', function(e){
        var cells = $$('.sgc', host), r = +inp.dataset.r, d = +inp.dataset.d, go = null;
        var rowsVis = []; cells.forEach(function(c){ var rr = +c.dataset.r; if (rowsVis.indexOf(rr) < 0) rowsVis.push(rr); });
        var ri = rowsVis.indexOf(r);
        if (e.key === 'ArrowRight' && (inp.selectionStart === inp.value.length || e.altKey)) go = [r, d + 1];
        else if (e.key === 'ArrowLeft' && (inp.selectionStart === 0 || e.altKey)) go = [r, d - 1];
        else if (e.key === 'ArrowDown' || e.key === 'Enter') go = [rowsVis[ri + 1], d];
        else if (e.key === 'ArrowUp') go = [rowsVis[ri - 1], d];
        else if ((e.key === 'Delete' || e.key === 'Backspace') && inp.selectionStart === 0 && inp.selectionEnd === inp.value.length) { e.preventDefault(); setCell(inp, ''); return; }
        if (go && go[0] !== undefined) { var n = host.querySelector('.sgc[data-r="' + go[0] + '"][data-d="' + go[1] + '"]'); if (n) { e.preventDefault(); n.focus(); } }
      });
      inp.addEventListener('paste', function(e){
        var t = (e.clipboardData || window.clipboardData).getData('text');
        if (!t || (t.indexOf('\t') < 0 && t.indexOf('\n') < 0)) return;
        e.preventDefault();
        var lines = t.replace(/\r/g, '').split('\n'); if (lines[lines.length - 1] === '') lines.pop();
        var rowsVis = []; $$('.sgc', host).forEach(function(c){ var rr = +c.dataset.r; if (rowsVis.indexOf(rr) < 0) rowsVis.push(rr); });
        var ri0 = rowsVis.indexOf(+inp.dataset.r), d0 = +inp.dataset.d, n = 0;
        lines.forEach(function(line, i){ line.split('\t').forEach(function(v, j){ var c = host.querySelector('.sgc[data-r="' + rowsVis[ri0 + i] + '"][data-d="' + (d0 + j) + '"]'); if (c) { setCell(c, v.trim()); n++; } }); });
        notify('วางข้อมูล ' + n + ' ช่อง', 'info');
      });
    });
    if ($(U + 'Save')) $(U + 'Save').onclick = function(){ G.save(this); };
    if ($(U + 'Undo')) $(U + 'Undo').onclick = function(){ Object.keys(G.dirty).forEach(function(k){ var x = G.dirty[k]; x.row.cells[x.d] = x.row.orig[x.d] || ''; }); G.dirty = {}; G.render(); };
    $$('[data-addp]', host).forEach(function(b){ b.onclick = function(){ cfg.onAddRow(b.dataset.addp); }; });
    $$('.sg-lines', host).forEach(function(w){
      $$('.lchip', w).forEach(function(b){ b.onclick = function(){
        var pid = w.dataset.lp, k = lk(pid), ln = +b.dataset.ln, cur = (SG_LINES[k] || []).slice();
        if (!ln) cur = []; else { var i = cur.indexOf(ln); if (i >= 0) cur.splice(i, 1); else cur.push(ln); cur.sort(function(a, c){ return a - c; }); }
        SG_LINES[k] = cur; G.render();
      }; });
    });
  }
  G.save = function(btn){
    var bad = $$('.sgc.bad', host);
    if (bad.length) { bad[0].focus(); return alertBox('มีช่องที่ไม่ถูกต้อง', bad.length + ' ช่องไม่ถูกต้อง (กรอบสีแดง) เอาเมาส์ชี้ที่ช่องเพื่อดูเหตุผล กรุณาแก้ไขก่อนบันทึก', 'warning'); }
    var list = Object.keys(G.dirty).map(function(k){ var x = G.dirty[k]; return { pid: x.row.pid, empCode: x.row.empCode, d: x.d, value: x.value, line: x.line || 0 }; });
    if (!list.length) return;
    cfg.onSave(list, btn);
  };
  G.hasDirty = function(){ return Object.keys(G.dirty).length > 0; };
  G.showRow = function(r){ r._show = true; };
  G.render();
  return G;
}

/* ================= ช่องค้นหาบุคลากร (พิมพ์รหัสหรือชื่อ) ================= */
var PEOPLE = null;
/** รายชื่อบุคลากรสำหรับค้นหา · ชุด 07: โหลดครั้งเดียว เก็บในเครื่องรายวัน (เปิดครั้งถัดไปขึ้นทันที แล้วอัปเดตเบื้องหลัง) */
function loadPeople(){
  if (PEOPLE) return Promise.resolve(PEOPLE);
  var k = PC_PRE + pcUser() + ':people', c = null;   // ล้างพร้อมข้อมูลอื่นตอนออกจากระบบ (pcClear)
  try { c = JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { c = null; }
  var fresh = api('listPeople', {}, { quiet: true }).then(function(r){ PEOPLE = r; try { if (pcUser()) localStorage.setItem(k, JSON.stringify({ day: todayIso(), r: r })); } catch (e) { } return r; });
  if (c && c.day === todayIso() && Array.isArray(c.r)) { PEOPLE = c.r; fresh.catch(function(){}); return Promise.resolve(c.r); }
  return fresh;
}
/** ชุด 07 · ป้ายพ้นสภาพ (เฉพาะคนที่พ้นสภาพแล้ว · x = พ้นสภาพ · ds = วันสิ้นสุดตาม HR) */
function todayIso(){ var d = new Date(Date.now() + 7 * 3600000); return d.toISOString().slice(0, 10); }   // วันนี้ (เวลาไทย)
function stopPill(ds, x){
  if (!x) return '';
  return ' <span class="pill p-warn nodot stop-pill" title="' + esc('พ้นสภาพแล้ว' + (ds ? ' · วันสิ้นสุดตาม HR ' + thDate(ds) : '') + ' · ลงเวรได้ ระบบติดธงส้มให้ตรวจ') + '">พ้นสภาพ' + (ds ? ' ' + esc(thDate(ds)) : '') + '</span>';
}
/** เลือกบุคลากร 1 คน · jobId = แสดงคนที่ตรงงานก่อน */
function pickPerson(title, jobId, sub){
  return loadPeople().then(function(list){
    return new Promise(function(resolve){
      var id = 'pp' + Date.now();
      modal(title, (sub ? '<div class="small-muted mb-2">' + sub + '</div>' : '') + '<div class="pp"><input class="form-control" id="' + id + '" placeholder="พิมพ์รหัสเจ้าหน้าที่ หรือชื่อ" autocomplete="off"><div class="pp-list" id="' + id + 'L"></div></div>', [{ text: 'ยกเลิก', cls: 'btn-ghost', onClick: function(){ resolve(null); } }], '');
      var inp = $(id), L = $(id + 'L');
      var draw = function(){
        var q = inp.value.trim().toLowerCase();
        var f = list.filter(function(p){ return !q || p.c.indexOf(q) >= 0 || p.n.toLowerCase().indexOf(q) >= 0; });
        if (jobId) f.sort(function(a, b){ return ((a.x || 0) - (b.x || 0)) || ((b.j.indexOf(jobId) >= 0) - (a.j.indexOf(jobId) >= 0)); });
        L.innerHTML = f.slice(0, 40).map(function(p){ return '<button type="button" class="pp-i' + (p.x ? ' pp-x' : '') + '" data-c="' + p.c + '"><b class="tnum">' + p.c + '</b> ' + esc(p.n) + stopPill(p.ds, p.x) + '<small>' + esc(p.h) + (p.pt ? ' · จ่ายรายชั่วโมง' : '') + (jobId && p.j.indexOf(jobId) >= 0 ? ' · ตรงตำแหน่ง' : '') + (p.x ? ' · พ้นสภาพแล้ว ลงเวรได้ ระบบติดธงส้มให้ตรวจ' : '') + '</small></button>'; }).join('') || '<div class="small-muted p-2">ไม่พบรายชื่อ (บุคลากรใหม่ ให้เจ้าหน้าที่กลางเพิ่มที่หน้า "ข้อมูลบุคลากร")</div>';
        $$('.pp-i', L).forEach(function(b){ b.onclick = function(){ var p = list.filter(function(x){ return x.c === b.dataset.c; })[0]; MDL.hide(); resolve(p); }; });
      };
      inp.oninput = draw; draw(); setTimeout(function(){ inp.focus(); }, 250);
    });
  });
}

/* ================= ชุด 07 · เลือกศูนย์ → ติ๊กตำแหน่ง (แบบ SMC) ใช้ร่วมทุกหน้าและทุกเอกสาร · จำค่าในเครื่อง =================
 * ค่าที่จำ = รายการรหัสตำแหน่งที่ติ๊ก (ว่าง = ทุกตำแหน่ง) · แต่ละหน้ากรองเฉพาะศูนย์ที่หน้านั้นเปิดได้ */
function pickKey(){ return 'bd_pick:' + ((S.boot && S.boot.me && S.boot.me.empCode) || ''); }
function pickGet(){ try { var v = JSON.parse(store(pickKey()) || 'null'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
function pickSave(list){ store(pickKey(), JSON.stringify(list || [])); }
/** ตำแหน่งทั้งหมดในศูนย์ที่กำหนด (ตามลำดับศูนย์ในระบบ) */
function pickIds(brs){
  var order = {}; S.boot.branches.forEach(function(b, i){ order[b.id] = i; });
  return S.boot.positions.filter(function(p){ return brs.indexOf(p.branchId) >= 0; })
    .sort(function(a, b){ return (order[a.branchId] - order[b.branchId]); }).map(function(p){ return p.id; });
}
/** ตำแหน่งที่เลือกไว้ภายในศูนย์ที่กำหนด (ไม่ได้เลือกในขอบเขตนี้ = ทุกตำแหน่ง) */
function pickIn(brs, ids, x){ return ids.indexOf(x) >= 0 || (x.charAt(0) === '*' && brs.indexOf(x.slice(1)) >= 0); }
/** ค่าที่จำไว้: รหัสตำแหน่ง หรือ "*รหัสศูนย์" = ทุกตำแหน่งของศูนย์นั้น (รวมตำแหน่งที่เพิ่มภายหลัง) */
function pickSel(brs){ var ids = pickIds(brs), g = pickGet(), sel = ids.filter(function(id){ return g.indexOf(id) >= 0 || g.indexOf('*' + posOf(id).branchId) >= 0; }); return sel.length ? sel : ids; }
/** ยังไม่เคยเลือกในขอบเขตนี้ → เริ่มที่ศูนย์ของตนศูนย์เดียว (ไม่โหลดทุกศูนย์โดยไม่ตั้งใจ) */
function pickDefault(brs, b){ var ids = pickIds(brs), g = pickGet(); if (!g.some(function(x){ return pickIn(brs, ids, x); }) && b && brs.indexOf(b) >= 0) pickSave(g.concat(['*' + b])); }
function pickIsAll(brs){ var ids = pickIds(brs); return pickSel(brs).length >= ids.length; }
/** ศูนย์ที่มีตำแหน่งที่เลือก (เรียงตามลำดับศูนย์) */
function pickBrs(brs){ var sel = pickSel(brs); return S.boot.branches.map(function(b){ return b.id; }).filter(function(b){ return brs.indexOf(b) >= 0 && sel.some(function(id){ var p = posOf(id); return p && p.branchId === b; }); }); }
/** เลือกทั้งศูนย์เดียว (ใช้จากปุ่มลัด เช่น ศูนย์ควบคุม → เอกสาร) */
/** ให้ศูนย์ b อยู่ในที่เลือก (กระโดดมาจากหน้าอื่น) โดยไม่ล้างค่าที่เลือกไว้ */
function pickEnsure(b){ var g = pickGet(); if (g.length && !g.some(function(x){ return x === '*' + b || (posOf(x) || {}).branchId === b; })) pickSave(g.concat(['*' + b])); }
function pickOnly(b){ pickSave(['*' + b]); }
function pickHas(brs, pid){ return pickSel(brs).indexOf(pid) >= 0; }
/** ข้อความสรุปบนปุ่ม */
function pickSummary(brs){
  var ids = pickIds(brs), sel = pickSel(brs);
  if (sel.length >= ids.length) return (brs.length > 1 ? 'ทุกศูนย์ · ' : 'ศูนย์' + brName(brs[0]) + ' · ') + 'ทุกตำแหน่ง';
  return pickBrs(brs).map(function(b){
    var all = ids.filter(function(id){ return posOf(id).branchId === b; }), mine = sel.filter(function(id){ return posOf(id).branchId === b; });
    return brName(b) + ': ' + (mine.length >= all.length ? 'ทุกตำแหน่ง' : mine.map(function(id){ return posShort(posName(id)); }).join(', '));
  }).join(' · ');
}
/** ปุ่มเปิดตัวเลือก · id = รหัสปุ่ม */
function pickButton(id, brs, label){
  return '<div class="pk-w"><label class="form-label">' + esc(label || 'ศูนย์ / ตำแหน่ง') + '</label><button type="button" class="btn btn-ghost pk-btn" id="' + id + '"><i class="bi bi-ui-checks me-1"></i> <span>' + esc(pickSummary(brs)) + '</span> <i class="bi bi-chevron-down ms-1"></i></button></div>';
}
function pickBind(id, brs, onChange){ var b = $(id); if (b) b.onclick = function(){ pickModal(brs, function(){ var s = b.querySelector('span'); if (s) s.textContent = pickSummary(brs); onChange(); }); }; }
/** หน้าต่างเลือก: แยกกลุ่มตามศูนย์ ติ๊กตำแหน่ง · ปุ่มลัด "งานนี้ทุกศูนย์" */
function pickModal(brs, onOk){
  var ids = pickIds(brs), on = {}; pickSel(brs).forEach(function(id){ on[id] = 1; });
  var groups = S.boot.branches.filter(function(b){ return brs.indexOf(b.id) >= 0; });
  var jobs = S.boot.jobs.filter(function(j){ return ids.some(function(id){ return posOf(id).jobId === j.id; }); });
  var body = '<div class="d-flex gap-2 mb-2 flex-wrap align-items-center"><input class="form-control form-control-sm" id="pkQ" placeholder="ค้นหาตำแหน่ง" style="max-width:220px">' +
    '<button type="button" class="btn btn-sm btn-ghost" id="pkAll"><i class="bi bi-check2-all"></i> เลือกทั้งหมด</button><button type="button" class="btn btn-sm btn-ghost" id="pkNone"><i class="bi bi-x-lg"></i> ล้าง</button></div>' +
    (groups.length > 1 && jobs.length ? '<div class="pk-jobs mb-2"><span class="small-muted me-1">งานนี้ทุกศูนย์:</span>' + jobs.map(function(j){ return '<button type="button" class="btn btn-sm btn-soft" data-job="' + j.id + '">' + esc(j.short || j.name) + '</button>'; }).join('') + '</div>' : '') +
    '<div class="pk-list">' + groups.map(function(b){
      var ps = ids.filter(function(id){ return posOf(id).branchId === b.id; });
      return '<div class="pk-g" data-b="' + b.id + '"><label class="pk-gh"><input class="form-check-input" type="checkbox" data-pkg="' + b.id + '"> ' + brDot(b.id) + ' <span class="small-muted">(' + ps.length + ' ตำแหน่ง)</span></label><div class="pk-items">' +
        ps.map(function(id){ var p = posOf(id); return '<label class="pk-i" data-q="' + esc((p.name + ' ' + brName(b.id)).toLowerCase()) + '"><input class="form-check-input" type="checkbox" data-pk="' + id + '" data-pb="' + b.id + '" data-pj="' + p.jobId + '"' + (on[id] ? ' checked' : '') + '> ' + esc(posShort(p.name)) + '</label>'; }).join('') + '</div></div>';
    }).join('') + '</div><div class="small-muted mt-2" id="pkCnt"></div>';
  modal('เลือกศูนย์ / ตำแหน่ง', body, [{ text: 'ยกเลิก', cls: 'btn-ghost' }, { text: '<i class="bi bi-check2"></i> ใช้ที่เลือก', onClick: function(){
    var list = $$('[data-pk]').filter(function(c){ return c.checked; }).map(function(c){ return c.dataset.pk; });
    if (!list.length) { notify('กรุณาเลือกอย่างน้อย 1 ตำแหน่ง', 'info'); return false; }
    // เก็บค่าที่เลือกในขอบเขตนี้ คงค่าของศูนย์อื่น (นอกขอบเขต) ไว้
    var keep = pickGet().filter(function(x){ return !pickIn(brs, ids, x); }), save = [];
    groups.forEach(function(b){ var ps = ids.filter(function(id){ return posOf(id).branchId === b.id; }), mine = ps.filter(function(id){ return list.indexOf(id) >= 0; });
      if (mine.length && mine.length === ps.length) save.push('*' + b.id); else save = save.concat(mine); });
    pickSave(keep.concat(save));
    onOk(list);
  } }], 'lg');
  var vis = function(c){ return c.closest('.pk-i').style.display !== 'none'; };
  var sync = function(){
    groups.forEach(function(b){ var cs = $$('[data-pb="' + b.id + '"]'), n = cs.filter(function(c){ return c.checked; }).length, h = document.querySelector('[data-pkg="' + b.id + '"]'); h.checked = n === cs.length; h.indeterminate = n > 0 && n < cs.length; });
    var n2 = $$('[data-pk]').filter(function(c){ return c.checked; }).length; $('pkCnt').textContent = 'เลือกแล้ว ' + n2 + ' จาก ' + ids.length + ' ตำแหน่ง';
  };
  setTimeout(function(){
    $$('[data-pk]').forEach(function(c){ c.onchange = sync; });
    $$('[data-pkg]').forEach(function(h){ h.onchange = function(){ $$('[data-pb="' + h.dataset.pkg + '"]').forEach(function(c){ if (vis(c)) c.checked = h.checked; }); sync(); }; });
    $$('[data-job]').forEach(function(b){ b.onclick = function(){ var cs = $$('[data-pj="' + b.dataset.job + '"]'), allOn = cs.every(function(c){ return c.checked; }); $$('[data-pk]').forEach(function(c){ if (c.dataset.pj === b.dataset.job) c.checked = !allOn; else if (!allOn) c.checked = false; }); sync(); }; });
    $('pkAll').onclick = function(){ $$('[data-pk]').forEach(function(c){ if (vis(c)) c.checked = true; }); sync(); };
    $('pkNone').onclick = function(){ $$('[data-pk]').forEach(function(c){ if (vis(c)) c.checked = false; }); sync(); };
    $('pkQ').oninput = function(){ var q = this.value.trim().toLowerCase(); $$('.pk-i').forEach(function(l){ l.style.display = !q || l.dataset.q.indexOf(q) >= 0 ? '' : 'none'; }); $$('.pk-g').forEach(function(g){ g.style.display = $$('.pk-i', g).some(function(l){ return l.style.display !== 'none'; }) ? '' : 'none'; }); };
    sync();
  }, 30);
}
