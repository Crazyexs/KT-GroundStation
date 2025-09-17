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

export function initializeTableState(){
    id.tableState.innerHTML = ""; // clear old table

    // Create header row (sensor names)
    const headerRow = document.createElement("tr");
    headerRow.innerHTML = "<th>Sensor</th>"; 
    id.tableState.appendChild(headerRow);

    // Create data row (initially "Wait for data...")
    const dataRow = document.createElement("tr");
    dataRow.innerHTML = "<th>Value</th>";
    id.tableState.appendChild(dataRow);

    // Fill sensor names in the header
    Object.keys(data[data.boardNow].data_format).forEach((name) => {
        const th = document.createElement("th");
        th.textContent = name;
        headerRow.appendChild(th);

        const td = document.createElement("td");
        td.textContent = "Wait for data...";
        dataRow.appendChild(td);
    });
}

export function updateTableState(){
    // Find the second row (data row)
    const dataRow = id.tableState.rows[1];

    // Update values
    Object.entries(data[data.boardNow].sensor.dataIn).forEach(([name, value], index) => {
        const cell = dataRow.cells[index + 1]; // +1 because first cell is "Value"
        if (cell) {
            cell.textContent = value[value.length - 1];
        }
    });
}


export function syncData_table(dataIn){
    data = dataIn;
}