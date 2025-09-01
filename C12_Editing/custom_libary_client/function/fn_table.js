const { dir } = await import('../../dir.js');
const { id } = await import('../../id.js');
const { config } = await import(dir.config);

let data;

export function initializeTable(){
    table.innerHTML = ""; // ล้างตารางเก่า
    Object.entries(data).forEach(([key, value]) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<th>${key}</th><td>${value}</td>`;
        table.appendChild(tr);
    });
}

export function updateTable(){

}

export function syncData_table(dataIn){
    data = dataIn;
}