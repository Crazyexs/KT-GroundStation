const { dir } = await import('../../dir.js');
const { id } = await import('../../id.js');
const { config } = await import(dir.config);

let data;
let prevPorts = []; // เก็บ state ก่อนหน้า

export function connectBoardNumber(){
    data.boardNow = id.boardNow.selected
}

export function connectSerialPort(){
    if (id.SerialPort.selected.value.lenght > 0) {
        const selectedPort = id.SerialPort.selected.value;
        const baudRate = id.SerialPort.baudRate.value;
        socket.emit('select-port', {boardNumber : data.boardNow,baudRate : baudRate,port : selectedPort, connectOrNot: true});
    }
}

export function disconnectSerialPort(){
    socket.emit('select-port', {boardNumber : data.boardNow,baudRate : null, port: null, connectOrNot: false});
}

export function listAvaiablePort(){

    const newPorts = ports.map(p => p.path);

    // เช็คว่ามีการเปลี่ยนแปลงจริงหรือไม่
    const isChanged = prevPorts.length !== newPorts.length ||
                        prevPorts.some((p, i) => p !== newPorts[i]);

    if (!isChanged) return; // ไม่เปลี่ยนอะไรเลย

    prevPorts = [...newPorts]; // update state

    const portSelect = id.SerialPort.selected.port;
    portSelect.innerHTML = '<option value="">-- Select Port --</option>'; // reset

    ports.forEach(port => {
        const option = document.createElement('option');
        option.value = port.path;        // ค่าที่จะส่งไป server
        option.textContent = port.path;  // ข้อความที่แสดงใน select
        portSelect.appendChild(option);
    });
}

export function syncData_serial(dataIn){
    data = dataIn;
}