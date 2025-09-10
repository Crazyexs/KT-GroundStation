const { dir } = await import('../../dir_client.js');
const { id } = await import('../../id.js');

let data,config;

export function initializeTable(){
    id.table.innerHTML = ""; // ล้างตารางเก่า
    Object.entries(data[data.boardNow].data_format).forEach(([name, value]) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<th>${name}</th><td>Wait for data...</td>`;
        id.table.appendChild(tr);
    });
}

export function updateTable(){
    id.table.innerHTML = ""; // ล้างตารางเก่า
    Object.entries(data[data.boardNow].sensor.dataIn).forEach(([name, value]) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<th>${name}</th><td>${value[value.length - 1]}</td>`;
        id.table.appendChild(tr);
    });
}

export function syncData_table(dataIn){
    data = dataIn;
}