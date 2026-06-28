// -----------------------------------------------------------------------
// NAVIGATION
// -----------------------------------------------------------------------
function toggleMenu() {
  document.getElementById('nav-list').classList.toggle('open');
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    item.classList.add('active');
    document.getElementById('tab-' + item.dataset.tab).classList.add('active');
    if (window.innerWidth <= 500) toggleMenu();

  });
});

// -----------------------------------------------------------------------
// ABOUT (opened from footer)
// -----------------------------------------------------------------------
function openAbout() {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-about').classList.add('active');
}

// -----------------------------------------------------------------------
// SETTINGS LOAD
// -----------------------------------------------------------------------
async function loadSettings() {
  try {
    const s = await window.pywebview.api.get_settings();
    document.getElementById('set-rate').value = s.interest_rate || '11.25';
    document.getElementById('set-ll-max').value = s.ll_max_amount || '400000';
    document.getElementById('set-sl-max').value = s.sl_max_amount || '50000';
    document.getElementById('set-share').value = s.share_requirement || '8000';
    document.getElementById('set-cd-pct').value = s.cd_percentage || '20';
    document.getElementById('set-fd-1').value = s.fd_rate_1_360 || '4.0';
    document.getElementById('set-fd-12').value = s.fd_rate_12 || '8.0';
    document.getElementById('set-fd-24').value = s.fd_rate_24 || '8.5';
    document.getElementById('set-fd-36').value = s.fd_rate_36 || '9.5';
    document.getElementById('loan-rate').value = s.interest_rate || '11.25';
    document.getElementById('loan-share-required').value = s.share_requirement || '8000';
    updateFDRateDisplay(s);
  } catch(e) { console.log(e); }
}

function updateFDRateDisplay(s) {
  document.getElementById('rate-1-360').textContent = (s.fd_rate_1_360 || '4.0') + '%';
  document.getElementById('rate-12').textContent = (s.fd_rate_12 || '8.0') + '%';
  document.getElementById('rate-24').textContent = (s.fd_rate_24 || '8.5') + '%';
  document.getElementById('rate-36').textContent = (s.fd_rate_36 || '9.5') + '%';
}

async function saveSettings() {
  const settings = {
    interest_rate: document.getElementById('set-rate').value,
    ll_max_amount: document.getElementById('set-ll-max').value,
    sl_max_amount: document.getElementById('set-sl-max').value,
    share_requirement: document.getElementById('set-share').value,
    cd_percentage: document.getElementById('set-cd-pct').value,
    fd_rate_1_360: document.getElementById('set-fd-1').value,
    fd_rate_12: document.getElementById('set-fd-12').value,
    fd_rate_24: document.getElementById('set-fd-24').value,
    fd_rate_36: document.getElementById('set-fd-36').value,
  };
  try {
    await window.pywebview.api.save_settings(JSON.stringify(settings));
    document.getElementById('settings-msg').innerHTML = '<div class="msg msg-success">Settings saved.</div>';
    updateFDRateDisplay(settings);
  } catch(e) {
    document.getElementById('settings-msg').innerHTML = '<div class="msg msg-error">Error saving settings.</div>';
  }
}

// -----------------------------------------------------------------------
// LOAN
// -----------------------------------------------------------------------
async function calculateLoan() {
  const data = {
    name: document.getElementById('loan-name').value,
    gen_no: document.getElementById('loan-gen').value,
    interest_rate: parseFloat(document.getElementById('loan-rate').value) || 11.25,
    present_cd: parseFloat(document.getElementById('loan-cd-present').value) || 0,
    required_cd: parseFloat(document.getElementById('loan-cd-required').value) || 0,
    present_share: parseFloat(document.getElementById('loan-share-present').value) || 0,
    required_share: parseFloat(document.getElementById('loan-share-required').value) || 0,
    old_long_loan: parseFloat(document.getElementById('loan-old-ll').value) || 0,
    old_short_loan: parseFloat(document.getElementById('loan-old-sl').value) || 0,
    other_deduction: parseFloat(document.getElementById('loan-other-ded').value) || 0,
    new_loan_amount: parseFloat(document.getElementById('loan-new-amount').value) || 0,
    principal_recovery: parseFloat(document.getElementById('loan-principal-rec').value) || 0,
    remark: document.getElementById('loan-remark').value,
  };
  const llMax = parseFloat(document.getElementById('set-ll-max').value) || 400000;
  const slMax = parseFloat(document.getElementById('set-sl-max').value) || 50000;
  if (data.old_long_loan > llMax) {
    document.getElementById('loan-result').innerHTML = `<div class="msg msg-error">Old Long Loan (₹${fmt(data.old_long_loan)}) exceeds maximum of ₹${fmt(llMax)}.</div>`;
    return;
  }
  if (data.old_short_loan > slMax) {
    document.getElementById('loan-result').innerHTML = `<div class="msg msg-error">Old Short Loan (₹${fmt(data.old_short_loan)}) exceeds maximum of ₹${fmt(slMax)}.</div>`;
    return;
  }
  try {
    const r = await window.pywebview.api.calculate_loan(JSON.stringify(data));
    window._loanData = { ...data, ...r };
    document.getElementById('loan-cd-deduction').textContent = fmt(r.cd_deduction);
    document.getElementById('loan-share-deduction').textContent = fmt(r.share_deduction);
    let html = '<div class="result-box">';
    html += `<div class="row"><span class="label">CD Deduction</span><span class="value">₹ ${fmt(r.cd_deduction)}</span></div>`;
    html += `<div class="row"><span class="label">Share Deduction</span><span class="value">₹ ${fmt(r.share_deduction)}</span></div>`;
    html += `<div class="row"><span class="label">Old Long Loan</span><span class="value">₹ ${fmt(data.old_long_loan)}</span></div>`;
    html += `<div class="row"><span class="label">Old Short Loan</span><span class="value">₹ ${fmt(data.old_short_loan)}</span></div>`;
    html += `<div class="row"><span class="label">Other Deduction</span><span class="value">₹ ${fmt(data.other_deduction)}</span></div>`;
    html += `<div class="row total"><span class="label">Total Deduction</span><span class="value">₹ ${fmt(r.total_deduction)}</span></div>`;
    html += `<div class="row total"><span class="label">Amount In Hand</span><span class="value">₹ ${fmt(r.amount_in_hand)}</span></div>`;
    html += `<div class="row"><span class="label">Total Interest</span><span class="value">₹ ${fmt(r.total_interest)}</span></div>`;
    html += `<div class="row"><span class="label">Total Repayment</span><span class="value">₹ ${fmt(r.total_repayment)}</span></div>`;
    html += '</div>';
    html += '<button class="btn btn-small btn-primary" onclick="toggleSchedule()" style="margin-top:10px">Show Amortization Schedule</button>';
    html += '<div id="loan-schedule" style="display:none"></div>';
    document.getElementById('loan-result').innerHTML = html;
    markUnsaved();
  } catch(e) { document.getElementById('loan-result').innerHTML = '<div class="msg msg-error">Error calculating loan.</div>'; }
}

function toggleSchedule() {
  const div = document.getElementById('loan-schedule');
  if (div.style.display === 'none') {
    const r = window._loanData;
    if (!r || !r.schedule || r.schedule.length === 0) return;
    let html = '<h3>Amortization Schedule</h3><div class="table-wrap">';
    html += '<table class="schedule-table"><tr><th>#</th><th>Principal</th><th>Interest</th><th>Total EMI</th><th>Balance</th><th>Remark</th></tr>';
    r.schedule.forEach(s => {
      const cls = s.remark === 'Loan Closed' ? ' class="closed"' : '';
      html += `<tr${cls}><td>${s.emi_no}</td><td>₹ ${fmt(s.principal)}</td><td>₹ ${fmt(s.interest)}</td><td>₹ ${fmt(s.total_emi)}</td><td>₹ ${fmt(s.balance)}</td><td>${s.remark}</td></tr>`;
    });
    html += '</table></div>';
    div.innerHTML = html;
    div.style.display = 'block';
    this.textContent = 'Hide Amortization Schedule';
  } else {
    div.style.display = 'none';
    this.textContent = 'Show Amortization Schedule';
  }
}

async function saveLoan() {
  if (!window._loanData) { alert('Calculate first.'); return; }
  try {
    const editId = window._loanData._editId || null;
    if (editId) {
      await window.pywebview.api.update_loan(editId, JSON.stringify(window._loanData));
      document.getElementById('loan-result').innerHTML += '<div class="msg msg-success">Loan record updated.</div>';
    } else {
      const r = await window.pywebview.api.save_loan(JSON.stringify(window._loanData));
      document.getElementById('loan-result').innerHTML += '<div class="msg msg-success">Loan record saved (ID: ' + r.id + ').</div>';
    }
  } catch(e) { alert('Error saving.'); }
}

function clearLoan() {
  document.querySelectorAll('#tab-loan input, #tab-loan select').forEach(el => el.value = '');
  document.getElementById('loan-result').innerHTML = '';
  document.getElementById('loan-cd-deduction').textContent = '0.00';
  document.getElementById('loan-share-deduction').textContent = '0.00';
  document.getElementById('loan-share-required').value = '8000';
  loadSettings();
  window._loanData = null;
  _cdManualOverride = false;
}

function autoCalcRequiredCD() {
  if (_cdManualOverride) return;
  const newLoan = parseFloat(document.getElementById('loan-new-amount').value) || 0;
  const cdPct = parseFloat(document.getElementById('set-cd-pct').value) || 20;
  const val = newLoan * cdPct / 100;
  document.getElementById('loan-cd-required').value = val ? val.toFixed(2) : '';
}

document.getElementById('loan-cd-required').addEventListener('input', function() {
  if (document.activeElement === this) _cdManualOverride = true;
});

document.getElementById('loan-new-amount').addEventListener('input', autoCalcRequiredCD);

// -----------------------------------------------------------------------
// SETTLEMENT
// -----------------------------------------------------------------------
async function calculateSettlement() {
  const data = {
    name: document.getElementById('sett-name').value,
    gen_no: document.getElementById('sett-gen').value,
    short_loan: parseFloat(document.getElementById('sett-sl').value) || 0,
    long_loan: parseFloat(document.getElementById('sett-ll').value) || 0,
    ll_interest: parseFloat(document.getElementById('sett-lli').value) || 0,
    sl_interest: parseFloat(document.getElementById('sett-sli').value) || 0,
    other_deduction: parseFloat(document.getElementById('sett-od').value) || 0,
    cd: parseFloat(document.getElementById('sett-cd').value) || 0,
    share: parseFloat(document.getElementById('sett-share').value) || 0,
    dcrb: parseFloat(document.getElementById('sett-dcrb').value) || 0,
    other_earning: parseFloat(document.getElementById('sett-oe').value) || 0,
    remark: document.getElementById('sett-remark').value,
  };
  try {
    const r = await window.pywebview.api.calculate_settlement(JSON.stringify(data));
    window._settData = { ...data, ...r };
    let html = '<div class="result-box">';
    html += `<div class="row"><span class="label">Total Deduction</span><span class="value">₹ ${fmt(r.total_deduction)}</span></div>`;
    html += `<div class="row"><span class="label">Total Earning</span><span class="value">₹ ${fmt(r.total_earning)}</span></div>`;
    html += `<div class="row total"><span class="label">Final Settlement Amount</span><span class="value">₹ ${fmt(r.final_amount)}</span></div>`;
    html += `<div class="row"><span class="label">Status</span><span class="value">${r.status}</span></div>`;
    html += '</div>';
    document.getElementById('sett-result').innerHTML = html;
    markUnsaved();
  } catch(e) { document.getElementById('sett-result').innerHTML = '<div class="msg msg-error">Error calculating settlement.</div>'; }
}

async function saveSettlement() {
  if (!window._settData) { alert('Calculate first.'); return; }
  try {
    const editId = window._settData._editId || null;
    if (editId) {
      await window.pywebview.api.update_settlement(editId, JSON.stringify(window._settData));
      document.getElementById('sett-result').innerHTML += '<div class="msg msg-success">Settlement updated.</div>';
    } else {
      const r = await window.pywebview.api.save_settlement(JSON.stringify(window._settData));
      document.getElementById('sett-result').innerHTML += '<div class="msg msg-success">Settlement saved (ID: ' + r.id + ').</div>';
    }
  } catch(e) { alert('Error saving.'); }
}

function clearSettlement() {
  document.querySelectorAll('#tab-settlement input').forEach(el => el.value = '');
  document.getElementById('sett-result').innerHTML = '';
  window._settData = null;
  delete window._settData;
}

// -----------------------------------------------------------------------
// FD
// -----------------------------------------------------------------------
async function suggestFDRate() {
  const months = parseInt(document.getElementById('fd-months').value) || 0;
  const data = JSON.stringify({ amount: 0, months: months, rate: 0 });
  try {
    const r = await window.pywebview.api.calculate_fd(data);
    document.getElementById('fd-rate').placeholder = 'Suggested: ' + r.suggested_rate + '%';
  } catch(e) {}
}

async function calculateFD() {
  const data = {
    fd_no: document.getElementById('fd-no').value,
    name: document.getElementById('fd-name').value,
    amount: parseFloat(document.getElementById('fd-amount').value) || 0,
    months: parseInt(document.getElementById('fd-months').value) || 0,
    rate: parseFloat(document.getElementById('fd-rate').value) || 0,
    remark: document.getElementById('fd-remark').value,
  };
  try {
    const r = await window.pywebview.api.calculate_fd(JSON.stringify(data));
    if (data.rate === 0) data.rate = r.suggested_rate;
    window._fdData = { ...data, ...r };
    let html = '<div class="result-box">';
    html += `<div class="row"><span class="label">FD Amount</span><span class="value">₹ ${fmt(data.amount)}</span></div>`;
    html += `<div class="row"><span class="label">Duration</span><span class="value">${data.months} months</span></div>`;
    html += `<div class="row"><span class="label">Interest Rate</span><span class="value">${data.rate}%</span></div>`;
    html += `<div class="row"><span class="label">Total Interest</span><span class="value">₹ ${fmt(r.total_interest)}</span></div>`;
    html += `<div class="row total"><span class="label">Total Amount</span><span class="value">₹ ${fmt(r.total_amount)}</span></div>`;
    html += '</div>';
    document.getElementById('fd-result').innerHTML = html;
    markUnsaved();
  } catch(e) { document.getElementById('fd-result').innerHTML = '<div class="msg msg-error">Error calculating FD.</div>'; }
}

async function saveFD() {
  if (!window._fdData) { alert('Calculate first.'); return; }
  try {
    const editId = window._fdData._editId || null;
    if (editId) {
      await window.pywebview.api.update_fd(editId, JSON.stringify(window._fdData));
      document.getElementById('fd-result').innerHTML += '<div class="msg msg-success">FD record updated.</div>';
    } else {
      const r = await window.pywebview.api.save_fd(JSON.stringify(window._fdData));
      document.getElementById('fd-result').innerHTML += '<div class="msg msg-success">FD record saved (ID: ' + r.id + ').</div>';
    }
  } catch(e) { alert('Error saving.'); }
}

function clearFD() {
  document.querySelectorAll('#tab-fd input').forEach(el => el.value = '');
  document.getElementById('fd-result').innerHTML = '';
  window._fdData = null;
}

// -----------------------------------------------------------------------
// SIMPLE CALCULATOR (3.4)
// -----------------------------------------------------------------------
let calcState = { current: '0', previous: '', op: null, reset: false, expr: '' };
const calcDisplay = document.getElementById('calc-display');

function calcInput(val) {
  if (val === 'C') { calcState = { current: '0', previous: '', op: null, reset: false, expr: '' }; updateDisplay(); return; }
  if (val === 'B') {
    calcState.current = calcState.current.length > 1 ? calcState.current.slice(0, -1) : '0';
    updateDisplay(); return;
  }
  if (val === '=') {
    if (calcState.op && calcState.previous !== '') {
      const a = parseFloat(calcState.previous);
      const b = parseFloat(calcState.current);
      let result = 0;
      if (calcState.op === '+') result = a + b;
      else if (calcState.op === '-') result = a - b;
      else if (calcState.op === '*') result = a * b;
      else if (calcState.op === '/') result = b !== 0 ? a / b : 0;
      else if (calcState.op === '%') result = a * b / 100;
      calcState.current = String(parseFloat(result.toFixed(10)));
      const expr = calcState.expr + calcState.current;
      calcState.previous = '';
      calcState.op = null;
      calcState.reset = true;
      calcState.expr = '';
      try { window.pywebview.api.save_calc(JSON.stringify({ expression: expr, result: calcState.current })); } catch(e) {}
    }
    updateDisplay(); return;
  }
  if (['+','-','*','/','%'].includes(val)) {
    const sym = { '+':' + ','-':' - ','*':' × ','/':' ÷ ','%':' % ' };
    calcState.expr = calcState.current + sym[val];
    if (calcState.op && calcState.previous !== '') {
      const a = parseFloat(calcState.previous);
      const b = parseFloat(calcState.current);
      let r = 0;
      if (calcState.op === '+') r = a + b;
      else if (calcState.op === '-') r = a - b;
      else if (calcState.op === '*') r = a * b;
      else if (calcState.op === '/') r = b !== 0 ? a / b : 0;
      else if (calcState.op === '%') r = a * b / 100;
      calcState.previous = String(parseFloat(r.toFixed(10)));
    } else {
      calcState.previous = calcState.current;
    }
    calcState.op = val;
    calcState.reset = true;
    updateDisplay(); return;
  }
  if (val === '.' && calcState.current.includes('.')) return;
  if (calcState.reset || calcState.current === '0') {
    if (val === '.') { calcState.current = '0.'; }
    else { calcState.current = val === '.' ? '0.' : val; }
    calcState.reset = false;
  } else {
    calcState.current += val;
  }
  updateDisplay();
}

function updateDisplay() {
  calcDisplay.textContent = calcState.current;
}

// -----------------------------------------------------------------------
// SETTINGS HISTORY
// -----------------------------------------------------------------------
async function toggleSettingsHistory() {
  const el = document.getElementById('history-settings');
  if (el.style.display !== 'none') { el.style.display = 'none'; return; }
  el.style.display = 'block';
  try {
    const s = await window.pywebview.api.get_settings();
    let html = '<div class="result-box">';
    html += `<div class="row"><span class="label">Interest Rate</span><span class="value">${s.interest_rate || '11.25'}%</span></div>`;
    html += `<div class="row"><span class="label">Max Long Loan</span><span class="value">₹ ${fmt(s.ll_max_amount || 400000)}</span></div>`;
    html += `<div class="row"><span class="label">Max Short Loan</span><span class="value">₹ ${fmt(s.sl_max_amount || 50000)}</span></div>`;
    html += `<div class="row"><span class="label">Share Requirement</span><span class="value">₹ ${fmt(s.share_requirement || 8000)}</span></div>`;
    html += `<div class="row"><span class="label">CD Percentage</span><span class="value">${s.cd_percentage || '20'}%</span></div>`;
    html += `<div class="row"><span class="label">FD Rate (1-360D)</span><span class="value">${s.fd_rate_1_360 || '4.0'}%</span></div>`;
    html += `<div class="row"><span class="label">FD Rate (12M)</span><span class="value">${s.fd_rate_12 || '8.0'}%</span></div>`;
    html += `<div class="row"><span class="label">FD Rate (24M)</span><span class="value">${s.fd_rate_24 || '8.5'}%</span></div>`;
    html += `<div class="row"><span class="label">FD Rate (36M)</span><span class="value">${s.fd_rate_36 || '9.5'}%</span></div>`;
    html += '</div>';
    el.innerHTML = html;
  } catch(e) { el.innerHTML = '<div class="msg msg-error">Error loading settings.</div>'; }
}

// -----------------------------------------------------------------------
// HISTORY (per-tab inline records)
// -----------------------------------------------------------------------
async function toggleHistory(type) {
  const el = document.getElementById('history-' + type);
  if (el.style.display !== 'none') { el.style.display = 'none'; return; }
  el.innerHTML = '<p class="msg">Loading...</p>';
  el.style.display = 'block';
  try {
    let rows = [];
    if (type === 'settlement') rows = await window.pywebview.api.get_settlements();
    else if (type === 'loan') rows = await window.pywebview.api.get_loans();
    else if (type === 'fd') rows = await window.pywebview.api.get_fds();
    else if (type === 'calc') rows = await window.pywebview.api.get_calcs();
    renderHistory(type, rows, el);
  } catch(e) { el.innerHTML = '<div class="msg msg-error">Error loading history.</div>'; }
}

function renderHistory(type, rows, el) {
  if (!rows || rows.length === 0) { el.innerHTML = '<p>No records found.</p>'; return; }
  let html = '<div class="table-wrap"><table class="records-table"><tr>';
  if (type === 'settlement') {
    html += '<th>Date</th><th>Name</th><th>Gen No</th><th>Total Deduction</th><th>Total Earning</th><th>Final Amount</th><th>Status</th><th>Actions</th>';
  } else if (type === 'loan') {
    html += '<th>Date</th><th>Name</th><th>Gen No</th><th>New Loan</th><th>Total Deduction</th><th>Amount In Hand</th><th>Total Interest</th><th>Actions</th>';
  } else if (type === 'fd') {
    html += '<th>Date</th><th>FD No</th><th>Name</th><th>Amount</th><th>Months</th><th>Rate</th><th>Total Interest</th><th>Total Amount</th><th>Actions</th>';
  } else if (type === 'calc') {
    html += '<th>Date</th><th>Expression</th><th>Result</th><th>Actions</th>';
  }
  html += '</tr>';
  rows.forEach(r => {
    html += `<tr>`;
    html += `<td>${r.created_at || ''}</td>`;
    if (type === 'settlement') {
      html += `<td>${esc(r.name)}</td><td>${esc(r.gen_no)}</td>`;
      html += `<td>₹ ${fmt(r.total_deduction)}</td><td>₹ ${fmt(r.total_earning)}</td>`;
      html += `<td>₹ ${fmt(r.final_amount)}</td><td>${r.status}</td>`;
      html += `<td class="actions"><button class="btn btn-small btn-primary" onclick="viewRecord('settlement',${r.id})">View</button> <button class="btn btn-small btn-danger" onclick="deleteHistoryRecord('settlement',${r.id})">Del</button></td>`;
    } else if (type === 'loan') {
      html += `<td>${esc(r.name)}</td><td>${esc(r.gen_no)}</td>`;
      html += `<td>₹ ${fmt(r.new_loan_amount)}</td><td>₹ ${fmt(r.total_deduction)}</td>`;
      html += `<td>₹ ${fmt(r.amount_in_hand)}</td><td>₹ ${fmt(r.total_interest)}</td>`;
      html += `<td class="actions"><button class="btn btn-small btn-primary" onclick="viewRecord('loan',${r.id})">View</button> <button class="btn btn-small btn-danger" onclick="deleteHistoryRecord('loan',${r.id})">Del</button></td>`;
    } else if (type === 'fd') {
      html += `<td>${esc(r.fd_no)}</td><td>${esc(r.name)}</td>`;
      html += `<td>₹ ${fmt(r.amount)}</td><td>${r.months}</td>`;
      html += `<td>${r.rate}%</td><td>₹ ${fmt(r.total_interest)}</td><td>₹ ${fmt(r.total_amount)}</td>`;
      html += `<td class="actions"><button class="btn btn-small btn-primary" onclick="viewRecord('fd',${r.id})">View</button> <button class="btn btn-small btn-danger" onclick="deleteHistoryRecord('fd',${r.id})">Del</button></td>`;
    } else if (type === 'calc') {
      html += `<td>${esc(r.expression)}</td><td><strong>${esc(r.result)}</strong></td>`;
      html += `<td class="actions"><button class="btn btn-small btn-danger" onclick="deleteHistoryRecord('calc',${r.id})">Del</button></td>`;
    }
    html += '</tr>';
  });
  html += '</table></div>';
  el.innerHTML = html;
}

async function deleteHistoryRecord(type, id) {
  if (!confirm('Delete this record?')) return;
  try {
    if (type === 'settlement') await window.pywebview.api.delete_settlement(id);
    else if (type === 'loan') await window.pywebview.api.delete_loan(id);
    else if (type === 'fd') await window.pywebview.api.delete_fd(id);
    else if (type === 'calc') await window.pywebview.api.delete_calc(id);
    toggleHistory(type);
  } catch(e) { alert('Error deleting.'); }
}

async function viewRecord(type, id) {
  try {
    let r;
    if (type === 'settlement') r = await window.pywebview.api.get_settlement(id);
    else if (type === 'loan') r = await window.pywebview.api.get_loan(id);
    else r = await window.pywebview.api.get_fd(id);
    if (!r) { alert('Record not found.'); return; }

    // Switch to the appropriate tab and populate
    if (type === 'settlement') {
      document.querySelector('[data-tab="settlement"]').click();
      document.getElementById('sett-name').value = r.name || '';
      document.getElementById('sett-gen').value = r.gen_no || '';
      document.getElementById('sett-sl').value = r.short_loan || 0;
      document.getElementById('sett-ll').value = r.long_loan || 0;
      document.getElementById('sett-lli').value = r.ll_interest || 0;
      document.getElementById('sett-sli').value = r.sl_interest || 0;
      document.getElementById('sett-od').value = r.other_deduction || 0;
      document.getElementById('sett-cd').value = r.cd || 0;
      document.getElementById('sett-share').value = r.share || 0;
      document.getElementById('sett-dcrb').value = r.dcrb || 0;
      document.getElementById('sett-oe').value = r.other_earning || 0;
      document.getElementById('sett-remark').value = r.remark || '';
      window._settData = { ...r, _editId: r.id };
      let html = '<div class="result-box">';
      html += `<div class="row"><span class="label">Total Deduction</span><span class="value">₹ ${fmt(r.total_deduction)}</span></div>`;
      html += `<div class="row"><span class="label">Total Earning</span><span class="value">₹ ${fmt(r.total_earning)}</span></div>`;
      html += `<div class="row total"><span class="label">Final Settlement Amount</span><span class="value">₹ ${fmt(r.final_amount)}</span></div>`;
      html += `<div class="row"><span class="label">Status</span><span class="value">${r.status}</span></div>`;
      html += '</div>';
      document.getElementById('sett-result').innerHTML = html;
    } else if (type === 'loan') {
      document.querySelector('[data-tab="loan"]').click();
      document.getElementById('loan-name').value = r.name || '';
      document.getElementById('loan-gen').value = r.gen_no || '';
      document.getElementById('loan-rate').value = r.interest_rate || '';
      document.getElementById('loan-cd-present').value = r.present_cd || 0;
      document.getElementById('loan-cd-required').value = r.required_cd || 0;
      document.getElementById('loan-share-present').value = r.present_share || 0;
      document.getElementById('loan-share-required').value = r.required_share || 0;
      document.getElementById('loan-old-ll').value = r.old_long_loan || 0;
      document.getElementById('loan-old-sl').value = r.old_short_loan || 0;
      document.getElementById('loan-other-ded').value = r.other_deduction || 0;
      document.getElementById('loan-new-amount').value = r.new_loan_amount || 0;
      document.getElementById('loan-principal-rec').value = r.principal_recovery || 0;
      document.getElementById('loan-remark').value = r.remark || '';
      r._editId = r.id;
      _cdManualOverride = true;
      displayLoanResult(r);
    } else if (type === 'fd') {
      document.querySelector('[data-tab="fd"]').click();
      document.getElementById('fd-no').value = r.fd_no || '';
      document.getElementById('fd-name').value = r.name || '';
      document.getElementById('fd-amount').value = r.amount || 0;
      document.getElementById('fd-months').value = r.months || 0;
      document.getElementById('fd-rate').value = r.rate || '';
      document.getElementById('fd-remark').value = r.remark || '';
      window._fdData = { ...r, _editId: r.id };
      let html = '<div class="result-box">';
      html += `<div class="row"><span class="label">Total Interest</span><span class="value">₹ ${fmt(r.total_interest)}</span></div>`;
      html += `<div class="row total"><span class="label">Total Amount</span><span class="value">₹ ${fmt(r.total_amount)}</span></div>`;
      html += '</div>';
      document.getElementById('fd-result').innerHTML = html;
    }
  } catch(e) { alert('Error loading record.'); }
}

function displayLoanResult(r) {
  window._loanData = { ...r };
  document.getElementById('loan-cd-deduction').textContent = fmt(r.cd_deduction);
  document.getElementById('loan-share-deduction').textContent = fmt(r.share_deduction);
  let html = '<div class="result-box">';
  html += `<div class="row"><span class="label">CD Deduction</span><span class="value">₹ ${fmt(r.cd_deduction)}</span></div>`;
  html += `<div class="row"><span class="label">Share Deduction</span><span class="value">₹ ${fmt(r.share_deduction)}</span></div>`;
  html += `<div class="row"><span class="label">Old Long Loan</span><span class="value">₹ ${fmt(r.old_long_loan)}</span></div>`;
  html += `<div class="row"><span class="label">Old Short Loan</span><span class="value">₹ ${fmt(r.old_short_loan)}</span></div>`;
  html += `<div class="row"><span class="label">Other Deduction</span><span class="value">₹ ${fmt(r.other_deduction)}</span></div>`;
  html += `<div class="row total"><span class="label">Total Deduction</span><span class="value">₹ ${fmt(r.total_deduction)}</span></div>`;
  html += `<div class="row total"><span class="label">Amount In Hand</span><span class="value">₹ ${fmt(r.amount_in_hand)}</span></div>`;
  html += `<div class="row"><span class="label">Total Interest</span><span class="value">₹ ${fmt(r.total_interest)}</span></div>`;
  html += `<div class="row"><span class="label">Total Repayment</span><span class="value">₹ ${fmt(r.total_repayment)}</span></div>`;
  html += '</div>';
  html += '<button class="btn btn-small btn-primary" onclick="toggleSchedule()" style="margin-top:10px">Show Amortization Schedule</button>';
  html += '<div id="loan-schedule" style="display:none"></div>';
  document.getElementById('loan-result').innerHTML = html;
}

// -----------------------------------------------------------------------
// UNSAVED DATA TRACKING (§4.2)
// -----------------------------------------------------------------------
let _hasUnsaved = false;
let _cdManualOverride = false;

function markUnsaved() { _hasUnsaved = true; }
function markSaved() { _hasUnsaved = false; }

// Track unsaved for all calculator modules
['sett', 'loan', 'fd'].forEach(prefix => {
  const els = document.querySelectorAll(`#tab-${prefix === 'sett' ? 'settlement' : prefix} input`);
  els.forEach(el => el.addEventListener('input', markUnsaved));
});

// Override save functions to also clear the flag
['Settlement', 'Loan', 'FD'].forEach(name => {
  const orig = window[`save${name}`];
  if (orig) {
    window[`save${name}`] = function() {
      markSaved();
      return orig.apply(this, arguments);
    };
  }
});

window.addEventListener('beforeunload', e => {
  if (_hasUnsaved) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// -----------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------
function fmt(n) {
  if (n === null || n === undefined) return '0.00';
  return parseFloat(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function esc(s) {
  if (!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// -----------------------------------------------------------------------
// WEBSITE & CONTACT (§6) — URLs used internally, never displayed
// -----------------------------------------------------------------------
const _PRIMARY_URL = 'https://aartitechservices.pages.dev';
const _BACKUP_URL = '';
const _EMAIL_TO = 'aartitechservices@gmail.com';
const _TG_USER = 'Itsmakk';
const _IG_USER = 'aartitechservices';
const _FB_USER = 'aartitechservices';

async function openWebsite() {
  try {
    await window.pywebview.api.open_url(_PRIMARY_URL);
  } catch(e) {
    if (_BACKUP_URL) {
      try { await window.pywebview.api.open_url(_BACKUP_URL); } catch(e2) {}
    }
  }
}

function openEmail()    { window.pywebview.api.open_url('mailto:' + _EMAIL_TO); }
function openTelegram() { window.pywebview.api.open_url('https://t.me/' + _TG_USER); }
function openInstagram(){ window.pywebview.api.open_url('https://instagram.com/' + _IG_USER); }
function openFacebook() { window.pywebview.api.open_url('https://facebook.com/' + _FB_USER); }

// -----------------------------------------------------------------------
// INIT
// -----------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
});
