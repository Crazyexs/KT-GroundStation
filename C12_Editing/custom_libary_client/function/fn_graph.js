const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

const { dir } = await import('../../dir_client.js');
const { id } = await import('../../id.js');

let data;

// Instead of canvas, create a div container for ApexCharts
export function placeChartSlot() {
  const empty = qsa('.graph-slot.is-empty')[0];
  const slot = document.createElement('div');
  slot.className = 'graph-slot resizable';
  slot.style.setProperty('--min-h','260px');

  // wrap in card
  const card = document.createElement('div');
  card.className = 'card--graph';
  const content = document.createElement('div');
  content.className = 'card--graph-content';

  // chart container
  const chartDiv = document.createElement('div');
  chartDiv.className = 'chart-container';
  chartDiv.id = `chart-${Date.now()}`; // unique id

  content.appendChild(chartDiv);
  card.appendChild(content);
  slot.appendChild(card);

  if (empty) {
    empty.classList.remove('is-empty');
    empty.innerHTML = '';
    empty.appendChild(card);
  } else {
    id.graph.container.appendChild(slot);
  }

  return chartDiv; // ✅ return the div, not canvas
}

export function createChart({
  initGraph = true,
  chartOptions = null,
  xValue="counter",
  yValue="counter",
  xMx=null, xMn=null,
  yMx=null, yMn=null,
  type="line"
}) {
  if (!chartOptions) {
    chartOptions = {
      chart: {
        height: 400,
        type: type,
        fontFamily: 'Helvetica, Arial, sans-serif',
        foreColor: '#6E729B',
        toolbar: { show: false }
      },
      stroke: { curve: 'smooth', width: 2 },
      series: [],
      title: {
        text: `Graph Between ${xValue} and ${yValue}`,
        align: 'left',
        offsetY: 25,
        offsetX: 5,
        style: { fontSize: '14px', fontWeight: 'bold', color: '#373d3f' }
      },
      markers: { size: 6, strokeWidth: 0, hover: { size: 9 } },
      grid: {
        borderColor: '#D9DBF3',
        xaxis: { lines: { show: true } },
        padding: { bottom: 0 }
      },
      labels: [],
      xaxis: {
        min: xMn, max: xMx,
        categories: [],
        title: { text: xValue, style: { fontSize: '12px', fontWeight: 'bold', color: '#555' } }
      },
      yaxis: {
        min: yMn, max: yMx,
        title: { text: yValue, style: { fontSize: '12px', fontWeight: 'bold', color: '#555' } }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        offsetY: -10,
        labels: { colors: '#373d3f' }
      }
    };

    // add series
    if (Array.isArray(yValue)) {
      yValue.forEach(ySub => chartOptions.series.push({ name: ySub, data: [] }));
    } else {
      chartOptions.series.push({ name: yValue, data: [] });
    }
  }

  // ✅ use div instead of canvas
  const chartDiv = placeChartSlot();

  // ✅ create ApexCharts with div container
  const chart = new ApexCharts(chartDiv, chartOptions);
  chart.render();

  // track charts
  data[data.boardNow].n_chart += 1;
  data[data.boardNow].charts.push(chart);
  if (!initGraph) {
    data[data.boardNow].storageChart.push(chartOptions);
  }
}


export function initializeGraph(){
    let x, y, xMx, xMn, yMx, yMn,type;
    console.log(`there will be ${data.setting.key[data.boardNow].plot.length} init graph`)
    for (let valueGraph of data.setting.key[data.boardNow].plot) {
        console.log(`add grpah init ${valueGraph.x} and ${valueGraph.y}`)
        x = valueGraph.x;
        y = valueGraph.y;

        // use optional chaining + nullish coalescing ??
        xMx = valueGraph?.xMx ?? null;   // default 0 if missing
        xMn = valueGraph?.xMn ?? null;
        yMx = valueGraph?.yMx ?? null;
        yMn = valueGraph?.yMn ?? null;

        type = valueGraph?.type ?? "linear";

        createChart({xValue: x,yValue: y,xMx: xMx,xMn: xMn,yMx: yMx,yMn: yMn,type: type});
    }

}

export function addGraph(){
    const x = id.graph.xValue.value;
    const y = id.graph.yValue.value;

    if(x === '' || y === '') {
        alert('กรุณาเลือกค่า x และ y');
        return;
    }

    const xMn = parseFloat(id.graph.xMn.value);
    const xMx = parseFloat(id.graph.xMx.value);
    const yMn = parseFloat(id.graph.yMn.value);
    const yMx = parseFloat(id.graph.yMx.value);

    createChart({initGrpah: false,xLabel: x, yLabel: y,xMin : xMn, xMax : xMx, yMin : yMn, yMax : yMx});
    id.graph.xMn.value = '';
    id.graph.xMx.value = '';
    id.graph.yMn.value = '';
    id.graph.yMx.value = '';
}

export function autoAddGraph(){
    Object.entries(data[data.boardNow].data_format).forEach(({xName,xType},index) => {
        Object.entries(data[data.boardNow].data_format).forEach(({yName,yType},index) => {
            if(xType != "TEXT" && yType != "TEXT"){
                createChart({xLabel : xName,yLabel : yName})
            }
        });
    });
}

export function shiftValue(){
    data.shiftValue = id.graph.shiftValue.placeholder;
}

export function deleteGrpah(){
    data[data.boardNow].charts = []
    data[data.boardNow].storageChart = []
}

export function updateChart(){
    let dataChart = data[data.boardNow].sensor.dataIn;
    let index = 0;
    while(index < data.n_chart){
        let chartOptions = data[data.boardNow].charts[index].chartOptions
        // let xValue = data[data.boardNow].charts[index].chartOptions.label
        // let yValue = data[data.boardNow].charts[index].chartOptions.series
        let xTitle = data[data.boardNow].charts[index].chartOptions.xaxis.title.text;
        
        let len;
        for(let yName of Object.keys(chartOptions.series)){
            len = dataChart[yName].length
            if(data.shiftValue < len){
                chartOptions.series[yName] = dataChart[yName].slice(0,len)
            }
            else{
                chartOptions.series[yname] = dataChart[yName].slice(len-shiftValue,len)
            }
        }
        len = dataChart[xTitle].length;
        if(data.shiftValue < len){
            chartOptions.label = dataChart[xTitle].slice(0,len)
        }
        else{
            chartOptions.label = dataChart[xTitle].slice(len-shiftValue,len)
        }
        data[data.boardNow].charts[index].updateOptions(data[data.boardNow].charts[index].chartOptions);
    }
}

export function reloadChart(){
  n_chart = loadChartData('n_chart');
  if (!n_chart || isNaN(n_chart)) { n_chart = 0; }

  for(let chartOptions of Array.array(data[data.boardNow].storageChart)){
    createChart({initGrpah: false,chartOptions: chartOptions});
  }
}

export function syncData_graph(dataIn){
    data = dataIn;
}