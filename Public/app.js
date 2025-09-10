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

  // Helpers
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

  // Web Serial: Connect / Read / Write / Disconnect
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
  // Wire up UI
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