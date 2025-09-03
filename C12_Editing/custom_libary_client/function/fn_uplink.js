const { dir } = await import('../../dir.js');
const { id } = await import('../../id.js');
const { config } = await import(dir.config);

let data;

export function initializeUplink(uplink_format){
    let value,label
    id.innerHTML = '<option value="">-- Select Port --</option>'; // reset
    for(let uplinkNumber of uplink_format[data.boardNow]){
        value = uplinkNumber.value;
        label = uplinkNumber.label;
        const option = document.createElement('option');
        option.value = value;        // ค่าที่จะส่งไป server
        option.textContent = label;  // ข้อความที่แสดงใน select
        id.appendChild(option);        
    }
}

export function syncData_uplink(dataIn){
    data = dataIn;
}