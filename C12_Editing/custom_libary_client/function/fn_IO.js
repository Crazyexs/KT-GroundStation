import { listAvaiablePort } from './fn_serial.js';

const { dir } = await import('../../dir_client.js');
const { id } = await import('../../id.js');
const { config } = await import(dir.config);

let data;

const socket = io();

export function initializeUpdateDataIO(){
    socket.on("sensor-data", (dataIn) => {
        let dataGet = data[dataIn.boardNumber].dataIn.sensor;
        for(let name of Object.keys(dataGet)){
            dataGet[name] = dataIn[name];
        }
        data[data.boardNow].updateDataOrNot.sensor = true;
    });
    socket.on("cmd-data" , (dataIn) => {
        data[dataIn.boardNumber].dataIn.command.counter = dataIn.counter;
        data[dataIn.boardNumber].dataIn.command.command = dataIn.command;
        data[data.boardNow].updateDataOrNot.command = true;
    });
    socket.on("Port-available", (dataIn) => {
        data.portAvailable = dataIn
        listAvaiablePort();
    });
}

export function sendUplink(){
    let msg = id.uplink.selected.value;
    if(msg.length == 0){
        msg = id.uplink.placeholder.value;
    }
    socket.emit("uplink",msg);
}

export function sendSelectPort(boardNumber,port,baudRate,connectOrNot){
    socket.emit("select-port",{boardNumber:boardNumber,port:port,baudRate:baudRate,connectOrNot:connectOrNot});
}

export function syncData_IO(dataIn){
    data = dataIn;
}