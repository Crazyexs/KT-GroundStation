/* C12_Editing/app.js */
import { dir } from "./dir_client.js";
import { id } from "./id.js";

let prevBoard = null;
let data;

(async () => {

    console.log("start");

    const { initSyncData } = await import(`./sync_data_client.js`);
    console.log("sync_data_client.js import success");



    const { syncData_commandMonitor, updateCommandMonitor } = await import(`${dir.function}fn_commandMonitor.js`);
    console.log("fn_commandMonitor.js import success");

    const { syncData_graph, updateChart, deleteGrpah, shiftValue, autoAddGraph, addGraph, createChart, mapAltitude, initializeGraph, updateMapAltitude } = await import(`${dir.function}fn_graph.js`);
    console.log("fn_graph.js import success");

    const { syncData_IO, sendSelectPort, sendUplink, initializeUpdateDataIO } = await import(`${dir.function}fn_IO.js`);
    console.log("fn_IO.js import success");

    const { syncData_localStorage, reloadWindow, reloadSyncData, reloadChart, updateLocalStorage } = await import(`${dir.function}fn_localStorage.js`);
    console.log("fn_localStorage.js import success");

    const { syncData_map, initializeMap, updateMap } = await import(`${dir.function}fn_map.js`);
    console.log("fn_map.js import success");

    const { syncData_serial, listBoardNumber, listAvaiablePort, disconnectSerialPort, connectSerialPort, connectBoardNumber } = await import(`${dir.function}fn_serial.js`);
    console.log("fn_serial.js import success");

    const { syncData_table, initializeTable, updateTable } = await import(`${dir.function}fn_table.js`);
    console.log("fn_table.js import success");

    const { syncData_uplink, initializeUplink } = await import(`${dir.function}fn_uplink.js`);
    console.log("fn_uplink.js import success");

    const { syncData_css, updateAltitude, updateStage } = await import(`${dir.function}fn_css.js`);
    console.log("universal_function.js import success");

    const { event, waitUntil } = await import(`${dir.function}universal_function.js`);
    console.log("universal_function.js import success");

    console.log("import function success")

    const { syncData_backtrack, initBacktrackUpload } = await import(`${dir.function}fn_backtrack.js`);
    console.log("fn_backtrack.js import success");
    
    // const socket = io();

    console.log("connect to server success")

    data = initSyncData();

    syncData_commandMonitor(data);
    syncData_graph(data);
    syncData_IO(data);
    syncData_localStorage(data);
    syncData_map(data);
    syncData_serial(data);
    syncData_table(data);
    syncData_uplink(data);
    syncData_css(data);
    syncData_backtrack(data);
    await initBacktrackUpload();  

    console.log("sync Data success");

    listBoardNumber();

    console.log("list board available success")

    /* Start */
    id.boardNow.button.addEventListener('click', async () => {  
        // CONNECT BOARD NUMBER
        console.log("start connect board");
        
        connectBoardNumber();

        console.log("connect board success")

        if(data.boardNow != null && prevBoard != data.boardNow){

            console.log("Start New Board");

            prevBoard = data.boardNow;

            // SET ZERO
            deleteGrpah();

            console.log("SET ZERO success");

            // INITIALIZE
            initializeTable();
            console.log("init Table success");

            initializeUpdateDataIO();
            console.log("init IO success");

            initializeUplink();
            console.log("init Uplink success");

            initializeMap();
            console.log("init Map success");

            mapAltitude();
            initializeGraph();
            console.log("init Graph success");

            console.log("Client INITIALIZE success");

            // SENSOR
            const sensor_interval = setInterval(() => {
                if(data[data.boardNow].updateDataOrNot.sensor == true){
                    data[data.boardNow].updateDataOrNot.sensor = false;

                    updateChart();
                    updateMapAltitude();
                    console.log("update charts")

                    updateTable();
                    updateMap();

                    updateAltitude();

                    updateStage();

                    updateLocalStorage();

                    console.log("update sensor data")

                    if(data[data.boardNow].startRocket == true){

                    }
                }
            },100)

            console.log("Client UPDATE SENSOR success");

            // COMMAND
            const command_interval = setInterval(() => {
                if(data[data.boardNow].updateDataOrNot.command == true){
                    data[data.boardNow].updateDataOrNot.command = false;

                    updateCommandMonitor();

                    updateLocalStorage();

                    console.log("update command data")
                }
            },100)

            console.log("Client UPDATE COMMAND success");

            event();
            
            console.log("Client setup event success");

            reloadWindow();

            console.log("Client reloadWindow success");

            const visual_data = setInterval(() => {
                console.log("data:")
                console.log(data)
            },2000)
        };
    });
})();