const { dir } = await import('../../dir.js');
const { id } = await import('../../id.js');

let data,config;

export function initializeTable(id){
    id.innerHTML = ""; // ล้างตารางเก่า
    Object.entries(data[data.boardNow].data_format).forEach(([name, value]) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<th>${name}</th><td>Wait for data...</td>`;
        id.appendChild(tr);
    });
}

export function updateTable(){
    Object.entries(data[data.boardNow].data_format).forEach(([name, value]) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<th>${name}</th><td>${value}</td>`;
        id.appendChild(tr);
    });
}

export function syncData_table(dataIn){
    data = dataIn;
}