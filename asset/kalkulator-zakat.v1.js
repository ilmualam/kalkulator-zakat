(function(){
'use strict';

var ZK_STORE_KEY = 'ilmxZkState_v1';
var RATE = 0.025;

function fmt(n){
  if(isNaN(n)||n<0)n=0;
  return 'RM ' + n.toLocaleString('ms-MY',{minimumFractionDigits:2,maximumFractionDigits:2});
}
function num(id){
  var el = document.getElementById(id);
  if(!el) return 0;
  var v = parseFloat(el.value);
  return isNaN(v) ? 0 : v;
}
function setText(id, txt){
  var el = document.getElementById(id);
  if(el) el.textContent = txt;
}
function saveState(){
  try{
    var ids = ['zkPdGaji','zkPdLain','zkPdBelanja','zkPdKaedah','zkSpBaki','zkEmBerat','zkEmUruf',
      'zkPnAset','zkPnLiabiliti','zkPlNilai','zkPlDividen','zkKwPengeluaran','zkFtAhli','zkFtKadar',
      'zkGoldPrice','zkGoldGram','zdHari','zdKadar','zdTahun','zdKadarManual'];
    var state = {};
    for(var i=0;i<ids.length;i++){
      var el = document.getElementById(ids[i]);
      if(el) state[ids[i]] = el.value;
    }
    localStorage.setItem(ZK_STORE_KEY, JSON.stringify(state));
  }catch(e){}
}
function loadState(){
  try{
    var raw = localStorage.getItem(ZK_STORE_KEY);
    if(!raw) return;
    var state = JSON.parse(raw);
    for(var k in state){
      var el = document.getElementById(k);
      if(el) el.value = state[k];
    }
  }catch(e){}
}

function nisabValue(){
  var price = num('zkGoldPrice');
  var grams = num('zkGoldGram') || 85;
  return price * grams;
}

function calcPendapatan(){
  var gaji = num('zkPdGaji');
  var lain = num('zkPdLain');
  var belanja = num('zkPdBelanja');
  var kaedahEl = document.getElementById('zkPdKaedah');
  var kaedah = kaedahEl ? kaedahEl.value : 'kasar';
  var kasarBulan = gaji + lain;
  var bersihBulan = kaedah === 'bersih' ? Math.max(0, kasarBulan - belanja) : kasarBulan;
  var zakatBulan = bersihBulan * RATE;
  var zakatTahun = zakatBulan * 12;
  setText('zkPdOut', fmt(zakatBulan) + ' / bulan');
  setText('zkPdOutYr', 'Anggaran setahun: ' + fmt(zakatTahun));
}

function calcSimpanan(){
  var baki = num('zkSpBaki');
  var nisab = nisabValue();
  var zakat = baki >= nisab && nisab > 0 ? baki * RATE : 0;
  setText('zkSpOut', fmt(zakat));
  setText('zkSpOutNote', baki < nisab ? 'Belum cukup nisab (' + fmt(nisab) + ') — zakat tidak wajib' : 'Zakat setahun (2.5%)');
  setText('zkSpNisabNote', 'Nisab semasa: ' + (nisab > 0 ? fmt(nisab) : 'Sila set harga emas di tab Info'));
}

function calcEmas(){
  var berat = num('zkEmBerat');
  var uruf = num('zkEmUruf');
  var price = num('zkGoldPrice');
  var wajibGram = Math.max(0, berat - uruf);
  var nisabGram = num('zkGoldGram') || 85;
  var zakat = wajibGram >= nisabGram ? wajibGram * price * RATE : 0;
  setText('zkEmOut', fmt(zakat));
  setText('zkEmOutNote', wajibGram < nisabGram ? 'Belum cukup nisab (' + nisabGram + 'g)' : 'Berdasarkan ' + wajibGram + 'g × harga emas semasa');
}

function calcPerniagaan(){
  var aset = num('zkPnAset');
  var liabiliti = num('zkPnLiabiliti');
  var nisab = nisabValue();
  var bersih = Math.max(0, aset - liabiliti);
  var zakat = bersih >= nisab && nisab > 0 ? bersih * RATE : 0;
  setText('zkPnOut', fmt(zakat));
}

function calcPelaburan(){
  var nilai = num('zkPlNilai');
  var dividen = num('zkPlDividen');
  var nisab = nisabValue();
  var jumlah = nilai + dividen;
  var zakat = jumlah >= nisab && nisab > 0 ? jumlah * RATE : 0;
  setText('zkPlOut', fmt(zakat));
}

function calcKwsp(){
  var pengeluaran = num('zkKwPengeluaran');
  var zakat = pengeluaran * RATE;
  setText('zkKwOut', fmt(zakat));
}

function calcFitrah(){
  var ahli = num('zkFtAhli');
  var kadarEl = document.getElementById('zkFtKadar');
  var kadar = kadarEl ? parseFloat(kadarEl.value) : 7;
  var zakat = ahli * kadar;
  setText('zkFtOut', fmt(zakat));
}

// v1.1.0 — Fidyah calculator (hari x kadar x tahun tertangguh)
function calcFidyah(){
  var hari = num('zdHari');
  var kadarSelect = num('zdKadar');
  var kadarManual = num('zdKadarManual');
  var kadar = kadarManual > 0 ? kadarManual : kadarSelect;
  var tahunEl = document.getElementById('zdTahun');
  var tahun = tahunEl ? (parseFloat(tahunEl.value) || 1) : 1;
  if(tahun < 1) tahun = 1;
  var jumlah = hari * kadar * tahun;
  setText('zdOut', fmt(jumlah));
  setText('zdOutNote', hari + ' hari × ' + fmt(kadar) + ' × ' + tahun + ' tahun tertangguh');
}

function calcAll(){
  calcPendapatan();
  calcSimpanan();
  calcEmas();
  calcPerniagaan();
  calcPelaburan();
  calcKwsp();
  calcFitrah();
  calcFidyah();
}

function switchTab(name){
  var tabs = document.querySelectorAll('.ilmx-zk-tab');
  var panels = document.querySelectorAll('.ilmx-zk-panel');
  for(var i=0;i<tabs.length;i++){
    var isActive = tabs[i].getAttribute('data-tab') === name;
    tabs[i].classList.toggle('is-active', isActive);
    tabs[i].setAttribute('aria-selected', isActive ? 'true' : 'false');
  }
  for(var j=0;j<panels.length;j++){
    panels[j].classList.toggle('is-active', panels[j].getAttribute('data-panel') === name);
  }
}

function buildShareText(){
  var lines = [
    'Kalkulator Zakat — Ringkasan',
    'Pendapatan: ' + (document.getElementById('zkPdOut')?document.getElementById('zkPdOut').textContent:''),
    'Simpanan: ' + (document.getElementById('zkSpOut')?document.getElementById('zkSpOut').textContent:''),
    'Emas/Perak: ' + (document.getElementById('zkEmOut')?document.getElementById('zkEmOut').textContent:''),
    'Sumber: https://www.ilmualam.com/p/kalkulator-zakat.html'
  ];
  return lines.join('\n');
}

function attachToolListeners(toolEl){
  if(!toolEl || toolEl.getAttribute('data-ilmx-bound') === '1') return;
  toolEl.setAttribute('data-ilmx-bound', '1');

  toolEl.addEventListener('click', function(e){
    var tabBtn = e.target.closest('.ilmx-zk-tab');
    if(tabBtn){
      switchTab(tabBtn.getAttribute('data-tab'));
      return;
    }
    if(e.target.id === 'zkPrintBtn'){
      window.print();
      return;
    }
    if(e.target.id === 'zkShareBtn'){
      var url = 'https://wa.me/?text=' + encodeURIComponent(buildShareText());
      window.open(url, '_blank');
      return;
    }
    if(e.target.id === 'zkResetBtn'){
      try{ localStorage.removeItem(ZK_STORE_KEY); }catch(err){}
      var inputs = toolEl.querySelectorAll('input');
      for(var i=0;i<inputs.length;i++){ inputs[i].value = ''; }
      calcAll();
      return;
    }
  });

  toolEl.addEventListener('input', function(e){
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT'){
      calcAll();
      saveState();
    }
  });

  toolEl.addEventListener('change', function(e){
    if(e.target.tagName === 'SELECT'){
      calcAll();
      saveState();
    }
  });
}

function init(){
  loadState();
  calcAll();

  // Supports the full hub tool (#ilmxZkTool) and single-purpose embeds
  // (e.g. #ilmxFdTool on the Fidyah page) sharing the same calc engine.
  attachToolListeners(document.getElementById('ilmxZkTool'));
  attachToolListeners(document.getElementById('ilmxFdTool'));

  // FAQ accordion — event delegation, classList only. Reused across
  // ilmxZkFaq (hub/fitrah pages) and ilmxFdFaq (fidyah page).
  ['ilmxZkFaq','ilmxFdFaq'].forEach(function(id){
    var faqWrap = document.getElementById(id);
    if(faqWrap && faqWrap.getAttribute('data-ilmx-bound') !== '1'){
      faqWrap.setAttribute('data-ilmx-bound', '1');
      faqWrap.addEventListener('click', function(e){
        var q = e.target.closest('[class*="faq-q"]');
        if(!q) return;
        var item = q.closest('[class*="faq-item"]');
        if(item) item.classList.toggle('is-open');
      });
    }
  });
}

setTimeout(init, 300);

window.ilmxZkCalcAll = calcAll;
window.ilmxZkSwitchTab = switchTab;

})();
