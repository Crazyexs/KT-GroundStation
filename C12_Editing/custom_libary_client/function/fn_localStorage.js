const { dir } = await import('../../dir_client.js');
const { id } = await import('../../id.js');
const { config } = await import(dir.config);

let data;

export function saveData(key,data){
  localStorage.setItem(key, JSON.stringify(data));
}

export function saveSyncData(){
  saveData("syncData",data)
}

export function clearLocalStorage(){
    localStorage.clear();
    alert('Local storage cleared!');
}

export function reloadChart(){
  n_chart = loadChartData('n_chart');
  if (!n_chart || isNaN(n_chart)) { n_chart = 0; }

  for(let i = 0; i < n_chart; i++) {
    chartData[i] = loadChartData(`chartData_${i}`);
    const container = document.createElement('canvas');
    container.id = `chart${charts.length}`;

    createChart(container, {
      xLabel: chartData[i].name_x,
      yLabel: chartData[i].name_y,
    });

    // Restore chart data
    charts[i].chart.data.datasets[0].data = chartData[i].data;
    charts[i].chart.update();
  }
}

export function reloadSyncData(){
  data = localStorage.getItem("syncData")
  data = data ? JSON.parse(data) : [];
}

export function reloadWindow(){
  window.onload = () => {
    reloadChart();
    reloadSyncData();
  };
}

export function syncData_localStorage(dataIn){
    data = dataIn;
}