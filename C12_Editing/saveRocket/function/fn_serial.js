const { dir } = await import('../../dir_client.js');
const { id } = await import('../../id.js');

let data;
let prevPorts = []; // เก็บ state ก่อนหน้า

const socket = (typeof io !== 'undefined') ? io() : null;

export function listBoardNumber(){
    let value,label;
    id.boardNow.selected.innerHTML = '<option value="">-- Select Port --</option>'; // reset
    for(let boardNum of Object.keys(data.data_setting)){
        value = boardNum;
        label = boardNum;
        const option = document.createElement('option');
        option.value = value;        // ค่าที่จะส่งไป server
        option.textContent = label;  // ข้อความที่แสดงใน select
        id.boardNow.selected.appendChild(option);        
    }
}

export function connectBoardNumber(){
    data.boardNow = id.boardNow.selected.value;
}

export function connectSerialPort(){
    if (id.SerialPort.selected.port.value.length > 0) {
        const selectedPort = id.SerialPort.selected.port.value;
        const baudRate = id.SerialPort.selected.baudRate.value;
        socket.emit('select-port', {boardNumber : data.boardNow,baudRate : baudRate,port : selectedPort, connectOrNot: true});
    }
}

export function disconnectSerialPort(){
    socket.emit('select-port', {boardNumber : data.boardNow,baudRate : null, port: null, connectOrNot: false});
}

export function listAvaiablePort(ports){
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
        option.textContent = port.friendlyName;  // ข้อความที่แสดงใน select
        portSelect.appendChild(option);
    });
}

export function syncData_serial(dataIn){
    data = dataIn;
}