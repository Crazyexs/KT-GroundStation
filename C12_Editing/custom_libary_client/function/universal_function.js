const { id } = await import('../../id.js');

const key_state = ["STARTUP","IDLE_SAFE","ARMED","PAD_PREOP","POWERED","COASTING","DROG_DEPL","DROG_DESC","MAIN_DEPL","MAIN_DESC","LANDED","REC_SAFE"];
const allLabel = ["counter","state","gps_latitude","gps_longitude","apogee","last_ack","last_nack"];

const { syncData_commandMonitor, updateCommandMonitor } = await import(`./fn_commandMonitor.js`);
const { syncData_graph, updateChart, deleteGrpah, shiftValue, autoAddGraph, addGraph, createChart, initializeGraph } = await import(`./fn_graph.js`);
const { syncData_IO, sendSelectPort, sendUplink, initializeUpdateDataIO } = await import(`./fn_IO.js`);
const { syncData_localStorage, reloadWindow, reloadSyncData, reloadChart, loadChartData } = await import(`./fn_localStorage.js`);
const { syncData_map, initializeMap, updateMap } = await import(`./fn_map.js`);
const { syncData_serial, listBoardNumber, listAvaiablePort, disconnectSerialPort, connectSerialPort, connectBoardNumber } = await import(`./fn_serial.js`);
const { syncData_table, initializeTable, updateTable } = await import(`./fn_table.js`);
const { syncData_uplink, initializeUplink } = await import(`./fn_uplink.js`);




/* Length text */
function length_text(label){
  switch(label){
    case 'state': return key_state.length; 
  }
  return 0;
}

/* Text to Key */
function text_to_key(label,text){
  switch(label){
    case 'state' :
      for(let i = 0;i < key_state.length;i++){
        if(key_state[i].toLowerCase() == text) { return i }
      }
      break;
  }
}
/* Key to Text */
function key_to_text(label,key){
  switch(label){
    case 'state' :
      return key_state[key];
      break;
    case 'pyro_a' || 'pyro_b' :
      return key_pyro[key];
      break;
  }
}

/* Value From Key*/
function getValueFromKey(key, data) {
  let value;
  switch (key) {
    case "counter":
      value = parseInt(data.counter, 10);
      break;
    case "state":
      value = text_to_key('state',data.state);
      break;
    case "gps_latitude":
      value = parseFloat(data.gps_latitude);
      break;
    case "gps_longitude":
      value = parseFloat(data.gps_longitude);
      break;
    case "apogee":
      value = parseFloat(data.apogee);
      break;
    case "last_ack":
      value = parseInt(data.last_ack, 10);
      break;
    case "last_nack":
      value = parseInt(data.last_nack, 10);
      break;
    default:
      value = null;
  }
  return value;
}

function getColorByState(state) {
  switch(state.toLowerCase()) {
    case 'startup':     return '#A9A9A9';
    case 'idle_safe':   return '#708090';
    case 'armed':       return '#FFD700';
    case 'pad_preop':   return '#FFA500';
    case 'powered':     return '#FF4500';
    case 'coasting':    return '#FF6347';
    case 'drog_depl':   return '#FF8C00';
    case 'drog_desc':   return '#FF7F50';
    case 'main_depl':   return '#DC143C';
    case 'main_desc':   return '#B22222';
    case 'landed':      return '#228B22';
    case 'rec_safe':    return '#2E8B57';
    default:            return '#000000'; // สีดำถ้าไม่ตรงกับ state ใดๆ
  }
}

/* Is value's label is text ot not */
function isText(label){
  if(label == 'state') { return 1; }
  return 0;
}

/* Get Event */
export function event(){

    // Graph buttons
    if (id.graph.button.add) {
        id.graph.button.add.addEventListener("click", () => addGraph());
    } else {
        console.log('addGraphBtn not found!');
    }

    if (id.graph.button.autoAdd) {
        id.graph.button.autoAdd.addEventListener("click", () => autoAddGraph());
    } else {
        console.log('autoAddGraphBtn not found!');
    }

    if (id.graph.button.clear) {
        id.graph.button.clear.addEventListener("click", () => clearGraphs?.());
    } else {
        console.log('clearGraphBtn not found!');
    }

    // Uplink
    if (id.uplink.button) {
        id.uplink.button.addEventListener("click", () => sendUplink());
    } else {
        console.log('sendBtn not found!');
    }

    // Database
    if (id.database.resetDatabaseBtn) {
        id.database.resetDatabaseBtn.addEventListener("click", () => {
            fetch('/reset-db', { method: 'POST' })
                .then(res => res.text())
                .then(msg => alert(msg))
                .catch(err => alert('Error: ' + err));
        });
    } else {
        console.log('resetDbBtn not found!');
    }

    // Serial
    if (id.SerialPort.connectBtn) {
        id.SerialPort.connectBtn.addEventListener("click", () => connectSerialPort());
    } else {
        console.log('Serial connect button not found!');
    }

    if (id.SerialPort.disconnectBtn) { // fixed typo
        id.SerialPort.disconnectBtn.addEventListener("click", () => disconnectSerialPort());
    } else {
        console.log('Serial disconnect button not found!');
    }

    // Local Storage
    if (id.localStorage.clearBtn) {
        id.localStorage.clearBtn.addEventListener("click", () => clearLocalStorage());
    } else {
        console.log('clearLocalStorageBtn not found!');
    }

}

/* Wait Until */
export function waitUntil(conditionFn, interval = 100) {
  return new Promise((resolve) => {
    const timer = setInterval(() => {
      if (conditionFn()) {
        clearInterval(timer);
        resolve();
      }
    }, interval);
  });
}