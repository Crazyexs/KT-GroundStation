let io,callbackify,listPortsCb;
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

    socket.on('select-port', (data) => {
        boardNumber = data.boardNumber;

        data[boardNumber].COM_PORT = COM_PORT;
        data[boardNumber].baudRate = baudRate;
        data[boardNumber].connectOrNot = connectOrNot;
    });

    socket.on('uplink', (boardNumber,msg) => {
        console.log(`🔄 Received command from client:${boardNumber}: ${msg}`);
        const serial = data[boardNumber].serial;
        if (serial && serial.writable) {
        serial.write(`cmd ${msg}\n`);
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