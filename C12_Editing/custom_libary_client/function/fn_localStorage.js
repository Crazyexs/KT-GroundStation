const { dir } = await import('../../dir_client.js');
const { id } = await import('../../id.js');
const { reloadChart } = await import('./fn_graph.js')

let data = [];

function saveData(key, obj) {
    const seen = new WeakSet();
    const json = JSON.stringify(obj, (k, v) => {
        if (v && typeof v === "object") {
            if (seen.has(v)) return; // skip circular reference
            seen.add(v);
        }
        return v;
    });
    localStorage.setItem(key, json);
}

export function updateLocalStorage(){
  saveData("syncData", data);
}

export function clearLocalStorage(){
    localStorage.clear();
    alert('Local storage cleared!');
}

export function reloadSyncData(){
  const raw = localStorage.getItem("syncData");
  data = raw ? JSON.parse(raw) : [];
}

export function reloadWindow(){
  window.addEventListener("load", () => {
    reloadSyncData();
    // reloadChart();
  });
}

export function syncData_localStorage(dataIn){
    data = dataIn;
}
