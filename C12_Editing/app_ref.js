(() => {
  const qs  = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ---- UI refs
  const els = {
    // Web Serial
    baud: qs('#baud'),
    // portLabel: qs('#port-label'),
    // serialDot: qs('#serial-dot'),
    // serialState: qs('#serial-state'),
    // connectBtn: qs('[data-btn="serial-request"]'),
    // disconnectBtn: qs('[data-btn="serial-disconnect"]'),

    // Server (Socket.IO)
    // serverDot: qs('#server-dot'),
    // serverState: qs('#server-state'),
    portSelect: qs('#portSelect'),
    serverConnectBtn: qs('#ConnectBtn'),
    serverDisconnectBtn: qs('#DisconnectBtn'),
    shiftInput: qs('#number_of_value'),
    shiftApplyBtn: qs('#addNumber_of_valueBtn'),

    // Uplink
    sendBtn: qs('#sendBtn'),
    cmdSel: qs('#uplink-cmd'),
    cmdTag: qs('#cmd-tag'),

    // Stats & monitors
    monitor: qs('#monitor'),
    valueMonitor: qs('#value-monitor'),
    // statPackets: qs('#stat-packets'),
    // statUplink: qs('#stat-uplink'),
    // statDownlink: qs('#stat-downlink'),
    // statErrors: qs('#stat-errors'),

    // Graphs
    graphGrid: qs('#graph-grid'),
    addGraphBtn: qs('#addGraphBtn'),
    autoAddGraphBtn: qs('#autoAddGraphBtn'),
    clearGraphBtn: qs('#clearGraphBtn'),
    xValue: qs('#xValue'),
    yValue: qs('#yValue'),
    xMn: qs('#xMn'), xMx: qs('#xMx'),
    yMn: qs('#yMn'), yMx: qs('#yMx'),

    // Table
    tableBody: qs('#telemetry-table tbody'),
  };

  // ---- Realtime state
  let packets = 0, uplinkOk = 0, downlinkOk = 0, errors = 0;
  let shiftValue = 50;
  let currentBoard = 0;

  // Socket.IO 
  const socket = (typeof io !== 'undefined') ? io() : null;
  let prevPorts = [];

  function setServerStatus(connected, label) {
    if (!els.serverDot) return;
    els.serverDot.classList.toggle('ok', connected);
    els.serverDot.classList.toggle('bad', !connected);
    els.serverState.textContent = label;
  }

  if (socket) {
    socket.on('connect', () => setServerStatus(true, 'Connected'));
    socket.on('disconnect', () => setServerStatus(false, 'Disconnected'));

    // Server broadcasts full port objects
    socket.on('Port-available', (ports = []) => {
      const newPaths = ports.map(p => p.path || p.comName || p.friendlyName || '');
      const changed = prevPorts.length !== newPaths.length ||
                      prevPorts.some((p, i) => p !== newPaths[i]);
      if (!changed) return;
      prevPorts = [...newPaths];

      if (!els.portSelect) return;
      els.portSelect.innerHTML = '<option value="">-- Select Port --</option>';
      ports.forEach(p => {
        const label = p.path || p.comName || p.friendlyName || 'Unknown';
        const opt = document.createElement('option');
        opt.value = label;
        opt.textContent = label;
        els.portSelect.appendChild(opt);
      });
    });

    // Telemetry frames 
    socket.on('sensor-data', onIncomingData);
    socket.on('serial-data', onIncomingData);

    // Command echo/log
    socket.on('cmd-data', onIncomingCmdLog);
  }
  // Web Serial (browser path)
  let port = null, reader = null, reading = false, writer = null, textDecoder, readableClosed;
  const ts = () => new Date().toLocaleTimeString([], { hour12: false });
  const escapeHTML = (s) =>
    s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function logTo(el, line, tag = 'RX') {
    if (!el) return;
    const div = document.createElement('div');
    div.className = 'log-line';
    div.innerHTML = `<span class="ts">[${ts()}]</span> <span class="tag">${escapeHTML(tag)}</span> ${escapeHTML(line)}`;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
  }

  function setSerialStatus(connected, label = 'No port selected') {
    if (!els.serialDot) return;
    els.serialDot.classList.toggle('ok', connected);
    els.serialDot.classList.toggle('bad', !connected);
    els.serialState.textContent = connected ? 'Connected' : 'Disconnected';
    if (els.portLabel) els.portLabel.textContent = label;
  }

  async function requestSerial() {
    try {
      if (!('serial' in navigator)) {
        alert('Web Serial API not available. Use Chrome/Edge on HTTPS or localhost.');
        return;
      }
      port = await navigator.serial.requestPort();
      const baudRate = Number(els.baud?.value || 115200);
      await port.open({ baudRate });
      const info = port.getInfo?.() || {};
      const label = `USB ${info.usbVendorId ? info.usbVendorId.toString(16) : '??'}:${info.usbProductId ? info.usbProductId.toString(16) : '??'} @ ${baudRate}`;
      setSerialStatus(true, label);
      logTo(els.monitor, 'Serial port opened.', 'SYS');

      textDecoder = new TextDecoderStream();
      readableClosed = port.readable.pipeTo(textDecoder.writable);
      reader = textDecoder.readable.getReader();
      reading = true;
      readLoop().catch((err) => logTo(els.monitor, `Read error: ${err.message || err}`, 'ERR'));

      writer = port.writable?.getWriter?.() || null;

      navigator.serial.addEventListener?.('disconnect', () => {
        logTo(els.monitor, 'Device disconnected.', 'SYS');
        cleanupSerial();
      });
    } catch (err) {
      logTo(els.monitor, `Connect failed: ${err.message || err}`, 'ERR');
      setSerialStatus(false);
    }
  }

  async function readLoop() {
    let buffer = '';
    while (reading) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        buffer += value;
        let idx;
        while ((idx = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, idx).replace(/\r$/, '');
          buffer = buffer.slice(idx + 1);
          if (line.trim()) {
            logTo(els.monitor, line, 'RX');
            try { onIncomingData(JSON.parse(line)); } catch {}
          }
        }
      }
    }
  }

  async function disconnectSerial() {
    try {
      reading = false;
      if (reader) { await reader.cancel().catch(() => {}); reader.releaseLock?.(); reader = null; }
      if (textDecoder) { await readableClosed?.catch(() => {}); textDecoder = null; }
      if (writer) { try { await writer.close?.(); } catch {} writer.releaseLock?.(); writer = null; }
      await port?.close?.();
      logTo(els.monitor, 'Serial port closed.', 'SYS');
    } catch (err) {
      logTo(els.monitor, `Close error: ${err.message || err}`, 'ERR');
    } finally {
      port = null;
      setSerialStatus(false);
    }
  }
  function cleanupSerial() {
    reading = false;
    try { reader?.releaseLock?.(); } catch {}
    try { writer?.releaseLock?.(); } catch {}
    port = reader = writer = null;
    setSerialStatus(false);
  }


  // Map (Leaflet)
  const map = L.map('map').setView([13.7563, 100.5018], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);
  let rocketMarker = L.marker([13.7563, 100.5018]).addTo(map).bindPopup('Rocket Location');
  function updateMarker(lat, lon) { if (Number.isFinite(lat) && Number.isFinite(lon)) rocketMarker.setLatLng([lat, lon]); }

  // Graphs (Chart.js)
  const charts = [];
  const chartData = [];
  const allLabel = ["counter","state","gps_latitude","gps_longitude","apogee","last_ack","last_nack"];
  const key_state = ["STARTUP","IDLE_SAFE","ARMED","PAD_PREOP","POWERED","COASTING","DROG_DEPL","DROG_DESC","MAIN_DEPL","MAIN_DESC","LANDED","REC_SAFE"];
  const isText = (label) => label === 'state';
  function text_to_key(label, text) {
    if (label !== 'state') return null;
    const i = key_state.findIndex(s => s.toLowerCase() === String(text).toLowerCase());
    return i >= 0 ? i : null;
  }
  function getValueFromKey(key, data) {
    switch (key) {
      case "counter":       return parseInt(data.counter, 10);
      case "state":         return text_to_key('state', data.state);
      case "gps_latitude":  return parseFloat(data.gps_latitude);
      case "gps_longitude": return parseFloat(data.gps_longitude);
      case "apogee":        return parseFloat(data.apogee);
      case "last_ack":      return parseInt(data.last_ack, 10);
      case "last_nack":     return parseInt(data.last_nack, 10);
      default:              return null;
    }
  }
  function getColorByState(state) {
    switch (String(state || '').toLowerCase()) {
      case 'startup': return '#A9A9A9'; case 'idle_safe': return '#708090'; case 'armed': return '#FFD700';
      case 'pad_preop': return '#FFA500'; case 'powered': return '#FF4500'; case 'coasting': return '#FF6347';
      case 'drog_depl': return '#FF8C00'; case 'drog_desc': return '#FF7F50'; case 'main_depl': return '#DC143C';
      case 'main_desc': return '#B22222'; case 'landed': return '#228B22'; case 'rec_safe': return '#2E8B57';
      default: return '#000000';
    }
  }

  function createChart(canvas, { xLabel, yLabel, xMin=null, xMax=null, yMin=0, yMax=null }) {
    canvas.width = 600; canvas.height = 300;
    const cfg = {
      type: 'line',
      data: { labels: [], datasets: [{ label: yLabel, data: [], fill:false, tension:0.1, pointRadius:0, borderWidth:2,
        segment:{ borderColor:(ctx)=> (ctx.p0 && ctx.p0.raw && ctx.p0.raw.color) || undefined } }] },
      options: { responsive:true, animation:false, parsing:false,
        scales:{ x:{ type:'linear', title:{display:true, text:xLabel}, min:xMin, max:xMax },
                 y:{ title:{display:true, text:yLabel}, beginAtZero:true, min:yMin, max:yMax } } }
    };
    const chart = new Chart(canvas.getContext('2d'), cfg);
    charts.push({ chart, x: xLabel, y: yLabel });
    return chart;
  }
  function placeChartCanvas() {
    const empty = qsa('.graph-slot.is-empty')[0];
    const canvas = document.createElement('canvas');
    canvas.className = 'graph-canvas';
    if (empty) { empty.classList.remove('is-empty'); empty.innerHTML = ''; empty.appendChild(canvas); }
    else { const slot = document.createElement('div'); slot.className = 'graph-slot resizable'; slot.style.setProperty('--min-h','260px'); slot.appendChild(canvas); els.graphGrid.appendChild(slot); }
    return canvas;
  }
  function updateChartLinear(index, chart, xVal, yVal, state) {
    chart.data.datasets[0].data.push({ x:xVal, y:yVal, color:getColorByState(state) });
    while (chart.data.datasets[0].data.length > shiftValue) chart.data.datasets[0].data.shift();
    chart.update('none');
    chartData[index].data.push({ x:xVal, y:yVal, color:getColorByState(state) });
    chartData[index].state.push(state);
    while (chartData[index].data.length > shiftValue) chartData[index].data.shift();
  }
  function addGraphFromUI() {
    const x = els.xValue.value.trim(), y = els.yValue.value.trim();
    if (!x || !y) return alert('Please choose both X and Y.');
    const xMn = parseFloat(els.xMn.value), xMx = parseFloat(els.xMx.value), yMn = parseFloat(els.yMn.value), yMx = parseFloat(els.yMx.value);
    const canvas = placeChartCanvas();
    createChart(canvas, { xLabel:x, yLabel:y,
      xMin: Number.isNaN(xMn) ? null : xMn, xMax: Number.isNaN(xMx) ? null : xMx,
      yMin: Number.isNaN(yMn) ? 0    : yMn, yMax: Number.isNaN(yMx) ? null : yMx });
    chartData.push({ name_x:x, name_y:y, data:[], state:[] });
    els.xMn.value = els.xMx.value = els.yMn.value = els.yMx.value = '';
  }
  function autoAddGraphs() {
    for (let i=0;i<allLabel.length;i++) for (let j=0;j<allLabel.length;j++) {
      if (i===j) continue; if (isText(allLabel[i]) || isText(allLabel[j])) continue;
      const canvas = placeChartCanvas();
      createChart(canvas, { xLabel:allLabel[i], yLabel:allLabel[j] });
      chartData.push({ name_x:allLabel[i], name_y:allLabel[j], data:[], state:[] });
    }
  }
  function clearGraphs() {
    charts.length = 0; chartData.length = 0; localStorage.clear();
    els.graphGrid.innerHTML = `
      <div class="graph-slot resizable is-empty" id="graph-1" style="--min-h:260px; --ar:auto">
        <div class="slot-hint skeleton">Drop a graph here</div>
      </div>
      <div class="graph-slot resizable is-empty" id="graph-2" style="--min-h:260px; --ar:auto">
        <div class="slot-hint skeleton">Another graph slot</div>
      </div>
      <div class="graph-slot resizable is-empty" id="graph-3" style="--min-h:320px; --ar:16/9">
        <div class="slot-hint skeleton">Wide 16:9 graph slot</div>
      </div>`;
  }

  // Shared data handlers
  function onIncomingData(d) {
    // Track boardNumber if the server provides it
    if (d && d.boardNumber != null) currentBoard = d.boardNumber;

    packets++; downlinkOk++; updateStats();

    // Value monitor
    const vm = els.valueMonitor;
    if (vm) {
      if (vm.firstElementChild && vm.firstElementChild.classList.contains('slot-hint')) vm.innerHTML = '';
      const line = document.createElement('div');
      line.textContent = `counter: ${d.counter} | state: ${d.state} | lat: ${d.gps_latitude} | lon: ${d.gps_longitude} | apogee: ${d.apogee} | ack: ${d.last_ack} | nack: ${d.last_nack}`;
      vm.appendChild(line);
      if (vm.childNodes.length > 200) vm.removeChild(vm.firstChild);
      vm.scrollTop = vm.scrollHeight;
    }

    // Table
    if (els.tableBody) {
      els.tableBody.innerHTML = '';
      Object.entries(d).forEach(([k, v]) => {
        if (k === 'boardNumber') return;
        const tr = document.createElement('tr');
        tr.innerHTML = `<th>${escapeHTML(k)}</th><td>${escapeHTML(String(v))}</td>`;
        els.tableBody.appendChild(tr);
      });
    }

    // Map
    const lat = parseFloat(d.gps_latitude), lon = parseFloat(d.gps_longitude);
    if (Number.isFinite(lat) && Number.isFinite(lon)) updateMarker(lat, lon);

    // Graphs
    for (let i = 0; i < charts.length; i++) {
      const c = charts[i].chart, xKey = charts[i].x, yKey = charts[i].y;
      const xVal = getValueFromKey(xKey, d), yVal = getValueFromKey(yKey, d);
      if (xVal == null || yVal == null) continue;
      updateChartLinear(i, c, xVal, yVal, d.state);
      saveChartData(`chartData_${i}`, chartData[i]);
    }
    saveChartData('n_chart', chartData.length);
  }

  function onIncomingCmdLog(data) {
    const msg = (typeof data === 'string') ? data : (data?.cmd ?? JSON.stringify(data));
    if (els.monitor.firstElementChild && els.monitor.firstElementChild.classList.contains('slot-hint')) els.monitor.innerHTML = '';
    logTo(els.monitor, msg, 'CMD');
    if (els.monitor.childNodes.length > 200) els.monitor.removeChild(els.monitor.firstChild);
    els.monitor.scrollTop = els.monitor.scrollHeight;
  }

  function updateStats() {
    els.statPackets.textContent   = String(packets);
    els.statUplink.textContent    = String(uplinkOk);
    els.statDownlink.textContent  = String(downlinkOk);
    els.statErrors.textContent    = String(errors);
  }

  // localStorage helpers
  const saveChartData = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const loadChartData = (k) => { try { const d = localStorage.getItem(k); return d ? JSON.parse(d) : []; } catch { return []; } };


  // UI wiring
  els.connectBtn?.addEventListener('click', (e) => { e.preventDefault(); requestSerial(); });
  els.disconnectBtn?.addEventListener('click', (e) => { e.preventDefault(); disconnectSerial(); });

  // Connect to friend’s server 
  els.serverConnectBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!socket || !socket.connected) return alert('Server not connected.');
    const selected = els.portSelect?.value;
    if (!selected) return alert('Please select a port.');
    const baud = Number(els.baud?.value || 115200);
    socket.emit('select-port', {
      boardNumber: currentBoard,   // if you use multiple boards, switch this as needed
      COM_PORT: selected,
      baudRate: baud,
      connectOrNot: true
    });
    setServerStatus(true, `Port ${selected}`);
  });

  els.serverDisconnectBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (socket) socket.emit('select-port', {
      boardNumber: currentBoard,
      connectOrNot: false
    });
    setServerStatus(false, 'Disconnected');
  });

  els.shiftApplyBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const v = parseInt(els.shiftInput.value, 10);
    if (!Number.isFinite(v) || v <= 0) return alert('Shift size must be a positive number.');
    shiftValue = v; els.shiftInput.value = '';
  });

  els.sendBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const cmd = (els.cmdSel?.value || '').trim();
    const tag = (els.cmdTag?.value || '').trim();
    const msg = tag ? `${cmd} ${tag}` : cmd;
    if (!msg) return;

    // Web Serial first
    if (writer) {
      try {
        const data = new TextEncoder().encode(msg + '\n');
        writer.write(data);
        uplinkOk++; updateStats();
        logTo(els.monitor, msg, 'TX');
        return;
      } catch (err) {
        errors++; updateStats();
        logTo(els.monitor, `Send error: ${err.message || err}`, 'ERR');
      }
    }

    // จากเซิร์ฟเวอร์
    if (socket && socket.connected) {
      socket.emit('uplink', currentBoard, msg);
      uplinkOk++; updateStats();
      logTo(els.monitor, msg, 'TX(sock)');
      return;
    }

    logTo(els.monitor, 'No connection available (Web Serial or Server).', 'ERR');
  });

  // Graph controls
  els.addGraphBtn?.addEventListener('click', (e) => { e.preventDefault(); addGraphFromUI(); });
  els.autoAddGraphBtn?.addEventListener('click', (e) => { e.preventDefault(); autoAddGraphs(); });
  els.clearGraphBtn?.addEventListener('click', (e) => { e.preventDefault(); clearGraphs(); });

  // Reset DB 
  const resetBtn = qsa('[data-btn="reset-db"]')[0];
  resetBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      const r = await fetch('/reset-db', { method: 'POST' });
      const msg = await r.text();
      alert(msg);
    } catch (err) {
      alert('Error: ' + (err?.message || err));
    }
  });

  // Footer year + restore charts
  const y = qs('#year'); if (y) y.textContent = String(new Date().getFullYear());
  window.addEventListener('load', () => {
    const n = loadChartData('n_chart');
    const nCharts = (!n || isNaN(n)) ? 0 : Number(n);
    for (let i = 0; i < nCharts; i++) {
      const d = loadChartData(`chartData_${i}`);
      if (!d || !d.name_x || !d.name_y) continue;
      const canvas = placeChartCanvas();
      createChart(canvas, { xLabel: d.name_x, yLabel: d.name_y });
      charts[i].chart.data.datasets[0].data = d.data || [];
      charts[i].chart.update('none');
      chartData[i] = d;
    }
    if (!('serial' in navigator)) {
      logTo(els.monitor, 'Web Serial not supported: use Chrome/Edge on HTTPS or localhost. You can still use Server Connect.', 'WARN');
    }
  });
})();