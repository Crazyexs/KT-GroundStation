/* C12_Editing/script.js */

import { dir } from "./dir_client"
import { id } from "./id.js"

const { syncData_commandMonitor, updateCommandMonitor } = await import(`${dir.init}fn_commandMonitor.js`);
const { syncData_graph, updateChart, deleteGrpah, shiftValue, autoAddGraph, addGraph, createChart, initializeGraph } = await import(`${dir.init}graph.js`);
const { syncData_IO, sendSelectPort, sendUplink, initializeUpdateDataIO } = await import(`${dir.init}fn_IO.js`);
const { syncData_localStorage, reloadWindow, reloadSyncData, reloadChart, loadChartData } = await import(`${dir.init}fn_localStorage.js`);
const { syncData_map, initializeMap, updateMap } = await import(`${dir.init}fn_map.js`);
const { syncData_serial, listBoardNumber, listAvaiablePort, disconnectSerialPort, connectSerialPort, connectBoardNumber } = await import(`${dir.init}fn_serial.js`);
const { syncData_table, initializeTable, updateTable } = await import(`${dir.init}fn_table.js`);
const { syncData_uplink, initializeUplink } = await import(`${dir.init}fn_uplink.js`);
const { event,waitUntil } = await import(`${dir.init}universal_function.js`);


const socket = io();

/* Declear Variable */
let counter = {
    sensor: 0,
    command: 0
};


listBoardNumber();

syncData_commandMonitor(data);
syncData_graph(data);
syncData_IO(data);
syncData_localStorage(data);
syncData_map(data);
syncData_serial(data);
syncData_table(data);
syncData_uplink(data);

/* Start */
id.boardNow.button.addEventListener('click', async () => {  

    // CONNECT BOARD NUMBER
    connectBoardNumber();

    // INITIALIZE
    initializeTable();
    initializeUpdateDataIO();
    initializeUplink(config.uplink);
    initializeMap();

    console.log("Client INITIALIZE success");

    // SENSOR
    while(1){
        await waitUntil(() => counter.sensor != data[data.boardNow].sensor.dataIn.counter, 10);
        counter.sensor = data[data.boardNow].sensor.dataIn.counter

        updateChart();
        updateTable();
        updateMap();
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
