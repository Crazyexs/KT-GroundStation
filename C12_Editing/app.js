import { reloadWindow } from "./custom_libary_client/function/fn_localStorage";
import { connectBoardNumber, connectSerialPort } from "./custom_libary_client/function/fn_serial";

const {} = await import('${dir.client.function}')
/* C12_Editing/script.js */

const socket = io();

/* Declear Variable */
let counter = {
    sensor: 0,
    command: 0
};


/* Start */
Id.boardNow.button.addEventListener('click', async () => {  
    
    // CONNECT BOARD NUMBER
    connectBoardNumber();

    // INITIALIZE
    initializeTable();
    initializeUpdateDataIO();
    initializeUplink(config.uplink);

    console.log("Client INITIALIZE success");

    // SENSOR
    while(1){
        await waitUntil(() => counter.sensor != data[data.boardNow].sensor.dataIn.counter, 10);
        counter.sensor = data[data.boardNow].sensor.dataIn.counter

        updateChart();
        updateTable();
    }

    console.log("Client UPDATE SENSOR success");

    // COMMAND
    while(1){
        await waitUntil(() => counter.command != data[data.boardNow].command.counter, 10);
        counter.command = data[data.boardNow].command.counter

        updateCommandMonitor();
    }

    console.log("Client UPDATE COMMAND success");

    // SENSOR AND COMMAND
    while(1){
        await waitUntil(() => counter.command != data[data.boardNow].command.counter || counter.sensor != data[data.boardNow].sensor.dataIn.counter, 10);

        updateLocalStorage();
    }

    console.log("Client UPDATE SENSOR AND COMMAND success");

    event();
    
    console.log("Client setup event success");

    reloadWindow();

    console.log("Client reloadWindow success");

});
