import { listAvaiablePort } from './fn_serial.js';

const { dir } = await import('../../dir_client.js');
const { id } = await import('../../id.js');

let data;

const socket = (typeof io !== 'undefined') ? io() : null;

export function initializeUpdateDataIO(){
    if(socket){
        socket.on("sensor-data", (dataIn) => {
            let dataGet = data[dataIn.boardNumber].sensor.dataIn;
            for(let name of Object.keys(dataGet)){
                if(Number.isFinite(dataIn[name])){
                    dataGet[name].push(parseFloat(dataIn[name]));
                    console.log(`counter: ${dataIn["counter"]}`)
                }
                else{
                    dataGet[name].push(dataIn[name]);
                }
            }
            data[data.boardNow].updateDataOrNot.sensor = true;
            console.log(`Get sensor: ${dataIn}`)
        });
        socket.on("cmd-data" , (dataIn) => {
            data[dataIn.boardNumber].dataIn.command.counter = dataIn.counter;
            data[dataIn.boardNumber].dataIn.command.command = dataIn.command;
            data[data.boardNow].updateDataOrNot.command = true;
            console.log(`Get command: ${dataIn}`)
        });
        socket.on("Port-available", (ports) => {
            listAvaiablePort(ports);
        })
    }
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