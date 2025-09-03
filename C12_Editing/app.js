import { connectBoardNumber, connectSerialPort } from "./custom_libary_client/function/fn_serial";

const {} = await import('${dir.client.function}')
/* C12_Editing/script.js */
const socket = io();
let counter = {
    sensor: 0,
    command: 0
};

function waitUntil(conditionFn, interval = 100) {
  return new Promise((resolve) => {
    const timer = setInterval(() => {
      if (conditionFn()) {
        clearInterval(timer);
        resolve();
      }
    }, interval);
  });
}

Id.boardSelectedBtn.addEventListener('click', async () => {
    
    function event(){
      // Graph
      id.graph.button.add.addEventListener(click, () => {
        addGraph();
      })
      id.graph.button.autoAdd.addEventListener(click, () => {
        autoAddGraph();
      })
      id.graph.button.clear.addEventListener(click, () => {

      })

      // Uplink
      id.uplink.button.addEventListener(click, () => {
        sendUplink();
      })

      // Database
      id.database.resetDatabaseBtn.addEventListener(click, () => {

      })

      // Serial
      id.SerialPort.connectBtn.addEventListener(click, () => {
        connectSerialPort();
      })
      id.SerialPort.disconnecBtn.addEventListener(click, () => {
        disconnectSerialPort();
      })
    }
    connectBoardNumber(id.getElementById("boardSelect"));

    initializeTable();
    initializeUpdateData();
    initializeUplink();

    while(1){
        await waitUntil(() => counter.sensor != data[data.boardNow].sensor.dataIn.counter, 10);
        counter.sensor = data[data.boardNow].sensor.dataIn.counter

        updateChart();
        updateTable();
    }
    while(1){
        await waitUntil(() => counter.command != data[data.boardNow].command.dataIn.counter, 10);
        counter.command = data[data.boardNow].sensor.dataIn.counter

        updateCommandMonitor();
    }

    id.addEventListener(click,() => {

    })
    
});