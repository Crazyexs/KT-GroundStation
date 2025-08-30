(() => {
  const qs  = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));
  const on  = (el, ev, fn) => el && el.addEventListener(ev, fn);
  const onAll = (els, ev, fn) => els.forEach(el => on(el, ev, fn));

  // Grab UI elements 
  const els = {
    baud: qs('#baud'),
    portLabel: qs('#port-label'),
    serialDot: qs('#serial-dot') || qs('#connect .dot'),
    serialState: qs('#serial-state'),
    connectBtns: qsa('[data-btn="serial-request"]'),
    disconnectBtns: qsa('[data-btn="serial-disconnect"]'),
    sendBtns: qsa('[data-btn="send-cmd"]'),
    clearCmdBtns: qsa('[data-btn="clear-cmd"]'),
    cmdSel: qs('#uplink-cmd'),
    cmdTag: qs('#cmd-tag'),
    monitor: qs('#monitor'),
    addGraphBtns: qsa('[data-btn="add-graph"]'),
    clearGraphsBtns: qsa('[data-btn="clear-graphs"]'),
    headerConnectLink: qs('nav.primary a[href="#connect"]'),
  };

  //Small helpers
  const ts = () => new Date().toLocaleTimeString([], { hour12: false });
  const escapeHTML = (s) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function log(line, tag = 'RX') {
    if (!els.monitor) return;
    const div = document.createElement('div');
    div.className = 'log-line';
    // ERR
    const tagClass = tag === 'ERR' ? 'err' : 'tag';
    div.innerHTML = `<span class="ts">[${ts()}]</span> <span class="${tagClass}">${escapeHTML(tag)}</span> ${escapeHTML(line)}`;
    els.monitor.appendChild(div);
    els.monitor.scrollTop = els.monitor.scrollHeight;
  }

  function setStatus(connected, label = 'No port selected') {
    if (els.serialDot) {
      els.serialDot.classList.toggle('ok',  connected);
      els.serialDot.classList.toggle('bad', !connected);
    }
    if (els.serialState) els.serialState.textContent = connected ? 'Connected' : 'Disconnected';
    if (els.portLabel)   els.portLabel.textContent   = label;
  }

  // Web Serial state 
  let port = null, reader = null, reading = false, writer = null, textDecoder, readableClosed;

  async function requestSerial() {
    try {
      if (!('serial' in navigator)) { alert('Web Serial API not available. Use Chrome/Edge on HTTPS or localhost.'); return; }
      port = await navigator.serial.requestPort();
      const baudRate = Number(els.baud?.value || 115200);
      await port.open({ baudRate });
      const info = port.getInfo?.() || {};
      const label = `USB ${info.usbVendorId ? info.usbVendorId.toString(16) : '??'}:${info.usbProductId ? info.usbProductId.toString(16) : '??'} @ ${baudRate}`;
      setStatus(true, label);
      log('Serial port opened.', 'SYS');

      // Reader (text)
      textDecoder = new TextDecoderStream();
      readableClosed = port.readable.pipeTo(textDecoder.writable);
      reader = textDecoder.readable.getReader();
      reading = true;
      readLoop().catch(err => { console.error(err); log(`Read error: ${err.message || err}`, 'ERR'); });

      // Writer
      writer = port.writable?.getWriter?.() || null;

      // Handle unplug/reset
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
      if (!port || !writer) { log('Not connected.', 'ERR'); return; }
      const cmd = (els.cmdSel?.value || '').trim();
      const tag = (els.cmdTag?.value || '').trim();
      const msg = tag ? `${cmd} ${tag}` : cmd;
      if (!msg) return;
      await writer.write(new TextEncoder().encode(msg + '\n'));
      log(msg, 'TX');
    } catch (err) {
      console.error(err);
      log(`Send error: ${err.message || err}`, 'ERR');
    }
  }

  async function disconnectSerial() {
    try {
      reading = false;
      if (reader) { await reader.cancel().catch(()=>{}); reader.releaseLock?.(); reader = null; }
      if (textDecoder) { await readableClosed?.catch(()=>{}); textDecoder = null; }
      if (writer) { try { await writer.close?.(); } catch {} writer.releaseLock?.(); writer = null; }
      await port?.close?.();
      log('Serial port closed.', 'SYS');
    } catch (err) {
      console.error(err);
      log(`Close error: ${err.message || err}`, 'ERR');
    } finally {
      port = null; setStatus(false);
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
  const prevent = (fn) => (e) => { e.preventDefault(); fn(); };

  onAll(els.connectBtns,    'click', prevent(requestSerial));
  onAll(els.disconnectBtns, 'click', prevent(disconnectSerial));
  onAll(els.sendBtns,       'click', prevent(sendCmd));
  onAll(els.clearCmdBtns,   'click', (e) => { e.preventDefault(); if (els.monitor) els.monitor.innerHTML = ''; });

  // top nav "Connect" triggers chooser
  on(els.headerConnectLink, 'click', prevent(requestSerial));

  // graph demo hooks (optional)
  const addGraph = () => log('addGraph() not implemented in this demo', 'WARN');
  const clearGraphs = () => log('clearGraphs() not implemented in this demo', 'WARN');
  onAll(els.addGraphBtns,    'click', prevent(addGraph));
  onAll(els.clearGraphsBtns, 'click', prevent(clearGraphs));

  if (!('serial' in navigator)) log('Web Serial not supported: use Chrome/Edge on HTTPS or localhost.', 'WARN');
})();
