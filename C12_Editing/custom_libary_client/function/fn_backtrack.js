const { dir } = await import('../../dir_client.js');
const { id }  = await import('../../id.js');

let dataRef;

export function syncData_backtrack(dataIn){
  dataRef = dataIn;
}

export async function initBacktrackUpload(opts = {}){
  let btn  = id?.backtrack?.uploadBtn || document.getElementById('uploadBacktrackBtn');
  let file = id?.backtrack?.fileInput || document.getElementById('backtrackFile');

  if (!file) {
    file = document.createElement('input');
    file.type = 'file';
    file.accept = '.csv';
    file.id = 'backtrackFile';
    file.className = 'visually-hidden';
    document.body.appendChild(file);
    console.warn('[backtrack] Created missing #backtrackFile input dynamically.');
  }

  // Bind the visible button (or delegate)
  if (btn) {
    btn.addEventListener('click', (ev) => { ev.preventDefault(); file.click(); });
  } else {
    console.warn('[backtrack] upload button not found at init; delegating.');
    document.addEventListener('click', (ev) => {
      const t = ev.target;
      if (t && t.id === 'uploadBacktrackBtn') { ev.preventDefault(); file.click(); }
    });
  }

  // Handle file selection
  file.addEventListener('change', async (e) => {
    try{
      const f = e.target.files?.[0];
      if (!f) return;

      const b = dataRef?.boardNow;
      if (!b) { alert('Please select/connect a board first, then upload CSV.'); e.target.value=''; return; }

      const text = await f.text();
      const { cols } = parseCSVtoColumns(text); // normalized + aliases merged

      // light numeric coercion for axes we chart/map
      ['counter','gps_latitude','gps_longitude','altitude'].forEach(k => numify(cols, k));

      // ensure shapes
      ensureDataShapes(dataRef, b);

      // write into sensor.dataIn + data_format
      for (const [k, arr] of Object.entries(cols)) {
        dataRef[b].sensor.dataIn[k] = arr;
        if (!dataRef[b].data_format[k]) dataRef[b].data_format[k] = guessFormat(arr);
      }

      // map / altitude keys (preserve existing config; set if present)
      const forced = opts.forceKeys || {};
      const mapCfg = (dataRef.setting.key[b].map ||= {});

      mapCfg.lat = forced.lat || mapCfg.lat || chooseKey(
        ['gps_latitude','"gps_latitude"','lat','latitude','Lat','Latitude','GPS_Latitude'], cols
      ) || 'gps_latitude';

      mapCfg.lon = forced.lon || mapCfg.lon || chooseKey(
        ['gps_longitude','"gps_longitude"','lon','lng','longitude','Lon','Longitude','GPS_Longitude','gps_longtitude','"gps_longtitude"'], cols
      ) || 'gps_longitude';

      if (!Number.isFinite(mapCfg.zoom)) mapCfg.zoom = 13;

      const altKey = forced.altitude || dataRef.setting.key[b].altitude || (hasKey(cols,'altitude') ? 'altitude' : null);
      if (altKey) dataRef.setting.key[b].altitude = altKey;

      // guarantee arrays exist for map keys
      if (!Array.isArray(dataRef[b].sensor.dataIn[mapCfg.lat])) dataRef[b].sensor.dataIn[mapCfg.lat] = [];
      if (!Array.isArray(dataRef[b].sensor.dataIn[mapCfg.lon])) dataRef[b].sensor.dataIn[mapCfg.lon] = [];

      // ensure all referenced keys exist at least as []
      ensureGraphCompatibility(dataRef, b);

      // ---- Auto-graphs: build like your screenshots (counter vs grouped series) ----
      const hasPlotCfg = Array.isArray(dataRef.setting?.key?.[b]?.plot) && dataRef.setting.key[b].plot.length > 0;

      if (!hasPlotCfg) {
        const { createChart } = await import(`./fn_graph.js`);

        // Reset chart state safely (your deleteGrpah() doesn’t reset n_chart/chartOptions)
        dataRef[b].charts = [];
        dataRef[b].chartOptions = [];
        dataRef[b].storageChart = [];
        dataRef[b].n_chart = 0;

        const counterKey = 'counter';
        const maxPerChart = Number.isFinite(opts.maxPerChart) ? opts.maxPerChart : 4;
        const dataIn = dataRef[b].sensor.dataIn;

        if (!Array.isArray(dataIn[counterKey]) || !isNumericArray(dataIn[counterKey])) {
          console.warn(`[autograph] Counter key "${counterKey}" missing or non-numeric; no graphs created.`);
        } else {
          // collect numeric y-keys
          const numericKeys = Object.keys(dataIn).filter(k => k !== counterKey && isNumericArray(dataIn[k]));

          // group related keys (gps/rf/flight/power/command), rest by prefix
          const groups = new Map();
          for (const k of numericKeys){
            const fam = familyOf(k);
            if (!groups.has(fam)) groups.set(fam, []);
            groups.get(fam).push(k);
          }

          // Force the grouping order for nicer layout
          const order = ['flight','gps','rf','power','command'];
          const orderedEntries = [
            ...order.filter(f => groups.has(f)).map(f => [f, groups.get(f)]),
            ...[...groups.entries()].filter(([f]) => !order.includes(f))
          ];

          // Create charts: chunk large families to keep readability
          for (const [fam, keys] of orderedEntries){
            for (let i=0; i<keys.length; i+=maxPerChart){
              const chunk = keys.slice(i, i+maxPerChart);
              createChart({ xValue: counterKey, yValue: chunk, type: 'line' });
            }
          }
          console.log('[autograph] Charts created from numeric columns grouped by family.');
        }
      }

      // trigger normal UI updates
      dataRef[b].updateDataOrNot.sensor = true;

      // reset input so same file can be picked again
      e.target.value = '';
      console.log('[backtrack] CSV loaded and update triggered.');
    }catch(err){
      console.error('[backtrack] Upload failed:', err);
      alert('Failed to load CSV. See console for details.');
      e.target.value = '';
    }
  });

  console.log('[backtrack] UI bound (button + file input).');
}

/* ------------------------- Helpers ------------------------- */

function ensureDataShapes(data, board){
  data[board]                       = data[board] || {};
  data[board].sensor                = data[board].sensor || {};
  data[board].sensor.dataIn         = data[board].sensor.dataIn || {};
  data[board].data_format           = data[board].data_format || {};
  data[board].updateDataOrNot       = data[board].updateDataOrNot || {};
  data.setting                      = data.setting || {};
  data.setting.key                  = data.setting.key || {};
  data.setting.key[board]           = data.setting.key[board] || {};
  data.setting.key[board].map       = data.setting.key[board].map || {};
  data[board].charts                = data[board].charts || [];
  data[board].chartOptions          = data[board].chartOptions || [];
  data[board].storageChart          = data[board].storageChart || [];
  data[board].n_chart               = data[board].n_chart ?? 0;
}

function detectDelimiter(sample){
  const s = sample.slice(0, 5000);
  const count = (re) => (s.match(re)||[]).length;
  const c = count(/,/g), sc = count(/;/g), t = count(/\t/g);
  if (t  > Math.max(c, sc)) return '\t';
  if (sc > c)               return ';';
  return ',';
}

function normalizeHeader(h){
  return String(h).replace(/^\uFEFF/, '').trim().replace(/^"+|"+$/g, '');
}
function stripCell(v){
  if (v == null) return '';
  return String(v).trim().replace(/^"+|"+$/g, '');
}

function parseCSVtoColumns(text){
  const delim = detectDelimiter(text);
  const lines = text.replace(/\r/g,'').split('\n').filter(l => l.length > 0);
  if (!lines.length) return { header: [], cols: {} };

  const rawHeader = lines[0].split(delim);
  const header = rawHeader.map(normalizeHeader);

  const cols = {};
  header.forEach(h => { cols[h] = []; });

  for (let i = 1; i < lines.length; i++){
    const parts = lines[i].split(delim).map(stripCell);
    for (let j = 0; j < header.length; j++){
      const h = header[j];
      cols[h].push(parts[j] ?? '');
    }
  }

  rekeyAliases(cols); // merge aliases/typos -> canonical
  return { header: Object.keys(cols), cols };
}

function rekeyAliases(cols){
  const groups = [
    ['gps_latitude',  '"gps_latitude"','Latitude','Lat','"Latitude"','"Lat"','GPS_Latitude'],
    ['gps_longitude', '"gps_longitude"','Longitude','Lon','lng','"Longitude"','"Lon"','"lng"','gps_longtitude','"gps_longtitude"','GPS_Longitude'],
    ['counter',       '"counter"'],
    ['altitude',      '"altitude"','Alt','"Alt"'],
    ['state',         '"state"'],
    ['apogee',        '"apogee"'],
    ['voltageMon',    '"voltageMon"'],
    ['last_ack',      '"last_ack"'],
    ['last_nack',     '"last_nack"'],
    ['RSSI',          '"RSSI"'],
    ['SNR',           '"SNR"'],
    ['PacketLength',  '"PacketLength"'],
    ['RocketName',    '"RocketName"'],
    ['freq',          '"freq"']
  ];

  for (const group of groups){
    const [canon, ...aliases] = group;
    const present = [canon, ...aliases].filter(k => Object.prototype.hasOwnProperty.call(cols, k));
    if (present.length <= 1) continue;

    // pick the array with most non-empty values
    let best = present[0], bestScore = -1;
    for (const k of present){
      const arr = cols[k] || [];
      const score = arr.reduce((a,v)=> a + (v!=='' ? 1 : 0), 0);
      if (score > bestScore){ best = k; bestScore = score; }
    }

    if (!Object.prototype.hasOwnProperty.call(cols, canon)) cols[canon] = [];
    if (best !== canon) cols[canon] = cols[best];

    for (const k of present){
      if (k !== canon) delete cols[k];
    }
  }
}

function hasKey(obj, k){ return Object.prototype.hasOwnProperty.call(obj, k); }
function chooseKey(candidates, cols){ for (const k of candidates){ if (hasKey(cols, k)) return k; } return null; }

function numify(obj, key){
  if (!obj[key]) return;
  obj[key] = obj[key].map(v => {
    const n = Number(v);
    return Number.isFinite(n) ? n : v;
  });
}

function guessFormat(arr){
  let numeric = 0, total = 0;
  for (const v of arr){ total++; if (Number.isFinite(Number(v))) numeric++; }
  return numeric >= total/2 ? 'NUMBER' : 'TEXT';
}

/* ---- Auto-graph helpers (group by related families) ---- */
function isNumericArray(arr){
  if (!Array.isArray(arr) || arr.length === 0) return false;
  let numericCount = 0;
  for (const v of arr) if (Number.isFinite(Number(v))) numericCount++;
  return numericCount >= Math.max(1, Math.floor(arr.length * 0.5));
}

function familyOf(key){
  const k = String(key);
  if (/^(altitude|apogee)$/i.test(k))                                     return 'flight';
  if (/^gps_/i.test(k) || /(lat|lon|lng)/i.test(k))                      return 'gps';
  if (/^(RSSI|SNR|PacketLength)$/i.test(k))                               return 'rf';
  if (/^voltage/i.test(k))                                                return 'power';
  if (/^(last_ack|last_nack)$/i.test(k))                                  return 'command';
  const pref = k.split('_')[0];                                           // fallback: prefix group
  return pref || 'misc';
}

/**
 * Ensure any keys referenced by charts/maps/altitude exist (as [])
 * so downstream code never hits ".length" on undefined.
 */
function ensureGraphCompatibility(data, board){
  const sensor = data[board].sensor || {};
  const dataIn = sensor.dataIn || {};
  const charts = data[board].chartOptions || [];
  const needed = new Set();

  for (const chart of charts){
    if (!chart) continue;
    const xKey = chart?.xaxis?.title?.text;
    if (xKey) needed.add(xKey);
    const series = chart?.series || {};
    Object.keys(series).forEach(idx => {
      const yKey = series[idx]?.name;
      if (yKey) needed.add(yKey);
    });
  }

  const k = (data.setting?.key?.[board]) || {};
  if (k.map?.lat)  needed.add(k.map.lat);
  if (k.map?.lon)  needed.add(k.map.lon);
  if (k.altitude)  needed.add(k.altitude);

  for (const key of needed){
    if (!Array.isArray(dataIn[key])) {
      dataIn[key] = [];
      if (!data[board].data_format[key]) data[board].data_format[key] = 'AUTO';
      console.warn(`[backtrack] Filled missing key "${key}" with [] for chart/map safety.`);
    }
  }

  if (!Number.isFinite(k.map?.zoom)) {
    data.setting.key[board].map = { ...(k.map||{}), zoom: 13 };
  }
}
