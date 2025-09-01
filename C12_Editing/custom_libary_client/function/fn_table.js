let data;

export function startTable(){
    table.innerHTML = ""; // ล้างตารางเก่า
    Object.entries(data).forEach(([key, value]) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<th>${key}</th><td>${value}</td>`;
        table.appendChild(tr);
    });
}

export function syncData_table(dataIn){
    data = dataIn;
}