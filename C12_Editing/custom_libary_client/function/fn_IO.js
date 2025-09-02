const { dir } = await import('../../dir.js');
const { id } = await import('../../id.js');
const { config } = await import(dir.config);

let data;

const socket = io();

export function initializeUpdateData(){
    socket.on("sensor-data", (dataIn) => {
        let dataGet = data[dataIn.boardNumber].dataIn.sensor;
        for(let name of Object.keys(dataGet)){
            dataGet[name] = dataIn[name];
        }
    });
    socket.on("cmd-data" , (dataIn) => {
        data[dataIn.boardNumber].dataIn.command.counter = dataIn.counter;
        data[dataIn.boardNumber].dataIn.command.counter = dataIn.command;
    });
    socket.on("Port-available", (dataIn) => {
        data.portAvailable = dataIn
    });
}

export function sendUplink(msg){
    socket.emit("uplink",msg);
}

export function sendSelectPort(boardNumber,port,baudRate,connectOrNot){
    socket.emit("select-port",{boardNumber:boardNumber,port:port,baudRate:baudRate,connectOrNot:connectOrNot});
}

export function syncData_IO(dataIn){
    data = dataIn;
}