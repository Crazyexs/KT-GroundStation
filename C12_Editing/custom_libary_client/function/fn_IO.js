import { shiftValue } from './fn_graph.js';
import { listAvaiablePort } from './fn_serial.js';

const { dir } = await import('../../dir_client.js');
const { id } = await import('../../id.js');

let data;
let index = 0;
let sending = false;

const socket = (typeof io !== 'undefined') ? io() : null;

export function initializeUpdateDataIO(){
    if(socket){
        socket.on("sensor-data", (dataIn) => { 
            
            if(sending){
                uplinkSending();
                sending = false;
            }

            let dataGet = data[dataIn.boardNumber].sensor.dataIn;
            for(let name of Object.keys(dataGet)){
                if(Number.isFinite(dataIn[name])){
                    dataGet[name].push(parseFloat(dataIn[name]));
                    console.log(`counter: ${dataIn["counter"]}`)
                }
                else{
                    dataGet[name].push(dataIn[name]);
                }

                // if(dataGet[name].length() > data.setting.key[data.boardNow].shiftValue){
                //     dataGet[index] = dataGet[index] + dataGet[index+1];
                //     dataGet.splice(index+1,1);
                //     index++;
                //     if(index + 1 >= data.setting.key[data.boardNow].shiftValue){
                //         index = 0;
                //     }
                // }
            }
            data[data.boardNow].updateDataOrNot.sensor = true;
            console.log(`Get sensor: ${dataIn}`)
        });
        socket.on("cmd-data" , (dataIn) => {
            data[dataIn.boardNumber].command.counter = dataIn.counter;
            data[dataIn.boardNumber].command.command = dataIn.command;
            data[data.boardNow].updateDataOrNot.command = true;
            console.log(`Get command: ${dataIn}`)
        });
        socket.on("Port-available", (ports) => {
            listAvaiablePort(ports);
        })
    }
}

export function uplinkSending(){
    let msg = id.uplink.selected.value;
    if(msg.length == 0){
        msg = id.uplink.placeholder.value;
    }
    socket.emit("uplink",{boardNumber: data.boardNow,msg: msg});

    let count = 0;
    const interval = setInterval(() => {
        let last_ack = data[data.boardNow].sensor.dataIn["last_ack"];
        let last_nack = data[data.boardNow].sensor.dataIn["last_nack"];
        if(last_ack[last_ack.length - 1] != last_ack[last_ack.length - 2]){
            id.uplink.result.textContent = "Success";
            id.uplink.result.style.color = "green";
            clearInterval(interval);
        }
        else if(last_nack[last_nack.length - 1] != last_nack[last_nack.length - 2]){
            id.uplink.result.textContent = "Lora send error";
            id.uplink.result.style.color = "yellow";
            clearInterval(interval);
        } 
        else if(count > 1000){
            id.uplink.result.textContent = "False";
            id.uplink.result.style.color = "red";
            clearInterval(interval);
        }
        count++;
    },10)

    setTimeout(() => {
        id.uplink.result.textContent = "Wait for uplink...";
        id.uplink.result.style.color = "white";
    }, 3000);
}

export function sendUplink(){
    sending = true;
}

export function sendSelectPort(boardNumber,port,baudRate,connectOrNot){
    socket.emit("select-port",{boardNumber:boardNumber,port:port,baudRate:baudRate,connectOrNot:connectOrNot});
}

export function syncData_IO(dataIn){
    data = dataIn;
}