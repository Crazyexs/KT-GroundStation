const { dir } = await import('../../dir_client.js');
const { id } = await import('../../id.js');

let data;

export function initializeUplink(){
    let value,label
    id.uplink.selected.innerHTML = '<option value="">-- Select Port --</option>'; // reset
    for(let uplinkNumber of data.uplink[data.boardNow]){
        value = uplinkNumber.value;
        label = uplinkNumber.label;
        const option = document.createElement('option');
        option.value = value;        // ค่าที่จะส่งไป server
        option.textContent = label;  // ข้อความที่แสดงใน select
        id.uplink.selected.appendChild(option);        
    }
}

export function syncData_uplink(dataIn){
    data = dataIn;
}