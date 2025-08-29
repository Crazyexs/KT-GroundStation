
(() => {
  const qs = (s, r = document) => r.querySelector(s);

  // Grab UI elements
  const els = {
    baud: qs('#baud'),
    portLabel: qs('#port-label'),
    serialDot: qs('#serial-dot'),
    serialState: qs('#serial-state'),
    connectBtn: qs('[data-btn="serial-request"]'),
    disconnectBtn: qs('[data-btn="serial-disconnect"]'),
    sendBtn: qs('[data-btn="send-cmd"]'),
    clearCmdBtn: qs('[data-btn="clear-cmd"]'),
    cmdSel: qs('#uplink-cmd'),
    cmdTag: qs('#cmd-tag'),
    monitor: qs('#monitor'),
    graphGrid: qs('#graph-grid'),
    addGraphBtn: qs('[data-btn="add-graph"]'),
    clearGraphsBtn: qs('[data-btn="clear-graphs"]'),
    headerConnectLink: qs('nav.primary a[href="#connect"]'), // top nav "Connect"
  };

  // Serial state
  let port = null;
  let reader = null;
  let reading = false;
  let writer = null;
  let textDecoder, readableClosed;

  // ------------------------------
  // Helpers
  // ------------------------------
  const ts = () =>
    new Date().toLocaleTimeString([], { hour12: false });

  const escapeHTML = (s) =>
    s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function log(line, tag = 'RX') {
    if (!els.monitor) return;
    const div = document.createElement('div');
    div.className = 'log-line';
    div.innerHTML = `<span class="ts">[${ts()}]</span> <span class="tag">${escapeHTML(tag)}</span> ${escapeHTML(line)}`;
    els.monitor.appendChild(div);
    els.monitor.scrollTop = els.monitor.scrollHeight;
  }

  function setStatus(connected, label = 'No port selected') {
    if (connected) {
      els.serialDot.classList.remove('bad');
      els.serialDot.classList.add('ok');
      els.serialState.textContent = 'Connected';
    } else {
      els.serialDot.classList.remove('ok');
      els.serialDot.classList.add('bad');
      els.serialState.textContent = 'Disconnected';
    }
    if (els.portLabel) els.portLabel.textContent = label;
  }

  // ------------------------------
  // Web Serial: Connect / Read / Write / Disconnect
  // ------------------------------
  async function requestSerial() {
    try {
      if (!('serial' in navigator)) {
        alert('Web Serial API not available. Use Chrome/Edge on HTTPS or localhost.');
        return;
      }
      // Open chooser
      port = await navigator.serial.requestPort();
      const baudRate = Number(els.baud?.value || 115200);
      await port.open({ baudRate });
      const info = port.getInfo?.() || {};
      const label = `USB ${info.usbVendorId ? info.usbVendorId.toString(16) : '??'}:${info.usbProductId ? info.usbProductId.toString(16) : '??'} @ ${baudRate}`;
      setStatus(true, label);
      log('Serial port opened.', 'SYS');

      // Setup reader (text)
      textDecoder = new TextDecoderStream();
      readableClosed = port.readable.pipeTo(textDecoder.writable);
      reader = textDecoder.readable.getReader();
      reading = true;
      readLoop().catch((err) => {
        console.error(err);
        log(`Read error: ${err.message || err}`, 'ERR');
      });

      // Prepare writer once
      writer = port.writable?.getWriter?.() || null;

      // Listen for cable unplug / device reset
      navigator.serial.addEventListener?.('disconnect', () => {
        log('Device disconnected.', 'SYS');
        cleanupSerial();
      });
    } catch (err) {
      console.error(err);
      log(`Connect failed: ${err.message || err}`, 'ERR');
      setStatus(false);
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
          if (line.trim()) log(line, 'RX');
        }
      }
    }
  }

  async function sendCmd() {
    try {
      if (!port || !writer) {
        log('Not connected.', 'ERR');
        return;
      }
      const cmd = (els.cmdSel?.value || '').trim();
      const tag = (els.cmdTag?.value || '').trim();
      const msg = tag ? `${cmd} ${tag}` : cmd;
      if (!msg) return;
      const data = new TextEncoder().encode(msg + '\n');
      await writer.write(data);
      log(msg, 'TX');
    } catch (err) {
      console.error(err);
      log(`Send error: ${err.message || err}`, 'ERR');
    }
  }

  async function disconnectSerial() {
    try {
      reading = false;
      if (reader) {
        await reader.cancel().catch(() => {});
        reader.releaseLock?.();
        reader = null;
      }
      if (textDecoder) {
        await readableClosed?.catch(() => {});
        textDecoder = null;
      }
      if (writer) {
        try { await writer.close?.(); } catch {}
        writer.releaseLock?.();
        writer = null;
      }
      await port?.close?.();
      log('Serial port closed.', 'SYS');
    } catch (err) {
      console.error(err);
      log(`Close error: ${err.message || err}`, 'ERR');
    } finally {
      port = null;
      setStatus(false);
    }
  }

  function cleanupSerial() {
    reading = false;
    try { reader?.releaseLock?.(); } catch {}
    try { writer?.releaseLock?.(); } catch {}
    port = reader = writer = null;
    setStatus(false);
  }

  // ------------------------------
  // Graphs: auto-add animated canvas
  // ------------------------------
  const graphs = new Set(); // track only JS-added graphs

  function fitCanvas(canvas, host) {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = Math.max(1, host.clientWidth);
    const h = Math.max(1, host.clientHeight);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // scale for crispness
    return ctx;
  }

  function drawFrame(ctx, canvas, t) {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    // grid
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = '#1c2030';
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y <= h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    // axes
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = '#2b3349';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, h - 30); ctx.lineTo(w, h - 30); ctx.stroke();

    // wave
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#32e6a1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const A = h * 0.25;
    const f = 0.0025;
    for (let x = 0; x < w; x++) {
      const y = h/2 + A * Math.sin((x + t*0.2) * f) * Math.cos((x - t*0.1) * f * 1.7);
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function addGraph() {
    const slot = document.createElement('div');
    slot.className = 'graph-slot resizable jsgraph';
    slot.style.setProperty('--min-h', '260px');

    const canvas = document.createElement('canvas');
    slot.appendChild(canvas);
    els.graphGrid.appendChild(slot);

    const ctx = fitCanvas(canvas, slot);
    let raf = 0, start = performance.now();
    const ro = new ResizeObserver(() => fitCanvas(canvas, slot));
    ro.observe(slot);

    function loop(t) {
      drawFrame(ctx, canvas, t - start);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    graphs.add({ slot, ro, cancel: () => cancelAnimationFrame(raf) });
  }

  function clearGraphs() {
    for (const g of graphs) {
      g.cancel();
      g.ro.disconnect();
      g.slot.remove();
    }
    graphs.clear();
  }

  // ------------------------------
  // Wire up UI
  // ------------------------------
  els.connectBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    requestSerial();
  });

  // Make the TOP NAV "Connect" open the chooser instead of jumping
  els.headerConnectLink?.addEventListener('click', (e) => {
    e.preventDefault();
    requestSerial();
  });

  els.disconnectBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    disconnectSerial();
  });

  els.sendBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    sendCmd();
  });

  els.clearCmdBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (els.monitor) els.monitor.innerHTML = '';
  });

  els.addGraphBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    addGraph();
  });

  els.clearGraphsBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    clearGraphs();
  });

  // Show a hint if Web Serial is unsupported
  if (!('serial' in navigator)) {
    log('Web Serial not supported: use Chrome/Edge on HTTPS or localhost.', 'WARN');
  }
})();
