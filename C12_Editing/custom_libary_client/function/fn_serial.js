const { dir } = await import('../../dir.js');
const { id } = await import('../../id.js');
const { config } = await import(dir.config);

let data;

export function connectBoardNumber(){
    data.boardNumber
}

export function connectSerialPort(boardNumber,baudRate,selectedPort){
    if (document.getElementById('portSelect').value) {
        const selectedPort = document.getElementById('portSelect').value;
        socket.emit('select-port', {boardNumber : boardNumber,baudRate : 115200,port : selectedPort, connectOrNot: true});
    }
}

export function disconnectSerialPort(){
    socket.emit('select-port', {boardNumber : boardNumber,baudRate : null, port: null, connectOrNot: false});
}


export function syncData_serial(dataIn){
    data = dataIn;
}