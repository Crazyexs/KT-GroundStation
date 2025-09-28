const { dir } = await import('../../dir.js');

const { callbackify, connect , express, app, server, io, Parser_db, fs, sqlite3, SerialPort, ReadlineParser, listPortsCb, promisify, archiver} = await import(`${dir.expression}`);
let data;
let prevPorts = [];

export function configureIO(expression) {
  io = expression.io;
  callbackify = expression.callbackify;
  listPortsCb = expression.listPortsCb;
}

  // Setup IO routes
export function setupIOroutes() {
  io.on('connection', (socket) => {
    console.log('🌐 Web client connected');

    socket.on('select-port', (dataIn) => {
        let boardNumber = dataIn.boardNumber;

        data[boardNumber].COM_PORT = dataIn.port;
        data[boardNumber].baudRate = dataIn.baudRate;
        data[boardNumber].connectOrNot = dataIn.connectOrNot;
    });

    socket.on('uplink', (dataIn) => {
        let boardNumber = dataIn.boardNumber;
        let msg = dataIn.msg;
        console.log(`🔄 Received command from client:${boardNumber}: ${msg}`);
        const serial = data[boardNumber].serial;
        if (serial && serial.writable) {
          if(dataIn.placeholder){
            serial.write(`${msg}`);
          }
          else{
            serial.write(`cmd ${msg}`);
          }
        }
    });

    socket.on('clear', (dataIn) => {
      let boardNumber = dataIn.boardNumber;
      if(!dataIn.number){
        data[boardNumber].shiftValue = 0;
      }
      else{
        data[boardNumber].shiftValue = parseInt(dataIn.number);
      }
    });
  });
}

  // Send available ports
export function sendPortAvailable() {
  setInterval(() => {
    listPortsCb((err, ports) => {
      if (err) {
        console.error(err);
        return;
      }
      
      io.emit('Port-available', ports);

      const prevPaths = prevPorts.map(p => p.path);
      const currentPaths = ports.map(p => p.path);

      const added = currentPaths.filter(p => !prevPaths.includes(p));
      const removed = prevPaths.filter(p => !currentPaths.includes(p));

      added.forEach(p => console.log(`🔌 Port connected: ${p}`));
      removed.forEach(p => console.log(`❌ Port disconnected: ${p}`));

      prevPorts = ports;
    });
  }, 1000);
}


  // Sync data
export function syncData_IO(dataIn){
    data = dataIn;
}