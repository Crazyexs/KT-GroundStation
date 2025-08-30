let io,callbackify,listPortsCb;
let data;

export function configureIO(expression) {
  io = expression.io;
  callbackify = expression.callbackify;
  listPortsCb = expression.listPortsCb;
}

export function setupIOroutes() {
  socket.on('select-port', (data) => {
    COM_PORT = data.port;
    baudRate = data.baudRate;
    connectOrNot = data.connectOrNot;
    boardNumber = data.boardNumber;
  });

  socket.on('uplink', (boardNumber,msg) => {
    console.log(`🔄 Received command from client:${boardNumber}: ${msg}`);
    const serial = data[boardNumber].serial;
    if (serial && serial.writable) {
      serial.write(`cmd ${msg}\n`);
    }
  });
}

export function sendPortAvailable() {
  setInterval(() => {
    listPortsCb((err, ports) => {
      if (err) console.error(err);
      io.emit('Port-available', ports);
    });
  }, 1000);
}


export function syncData_IO(dataIn){
    data = dataIn;
}



// send port available
// read port change