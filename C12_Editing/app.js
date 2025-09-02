import { connectBoardNumber } from "./custom_libary_client/function/fn_serial";

const {} = await import('${dir.client.function}')
/* C12_Editing/script.js */
const socket = io();
let counter = 0;

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
    
    connectBoardNumber(id.getElementById("boardSelect"));

    initializeTable();
    initializeUpdateData();
    initializeUplink();

    while(1){
        await waitUntil(() => counter != data[data.boardNow].sensor.dataIn.counter, 10);
        counter = data[data.boardNow].sensor.dataIn.counter

        updateCommandMonitor();
        updateChart();
        updateTable();
    }

    id.addEventListener(click,() => {

    })
    id.
});