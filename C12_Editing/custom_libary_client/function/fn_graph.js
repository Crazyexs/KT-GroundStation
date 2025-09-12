const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

const { dir } = await import('../../dir_client.js');
const { id } = await import('../../id.js');

let data;
let divChart = {};

// Instead of canvas, create a div container for ApexCharts
export function placeChartSlot() {
  let realID;

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
  realID = `chart-${Date.now()}`;
  chartDiv.id = realID; // unique id

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

  return [chartDiv,realID]; // ✅ return the div, not canvas
}

export function createChart({
  id_alititude = false,
  initGraph = true,
  chartOptions = null,
  xValue="counter",
  yValue="counter",
  xMx=null, xMn=null,
  yMx=null, yMn=null,
  type="line"
}) {
  let realID;

  if (!chartOptions) {
    chartOptions = {
      chart: {
        height: 400,
        type: type,
        fontFamily: 'Helvetica, Arial, sans-serif',
        foreColor: '#000000ff',
        toolbar: { show: false }
      },
      stroke: { curve: 'smooth', width: 2 },
      series: [],
      title: {
        text: `${xValue} and ${yValue}`,
        align: 'left',
        offsetY: 25,
        offsetX: 5,
        style: { fontSize: '14px', fontWeight: 'bold', color: '#373d3f' }
      },
      markers: { 
        size: 0, 
        strokeWidth: 0, 
        hover: { 
          size: 6 
        } 
      },
      grid: {
        borderColor: '#D9DBF3',
        xaxis: { lines: { show: true } },
        padding: { bottom: 0 }
      },
      labels: [],
      xaxis: {
        // min: xMn, max: xMx,
        categories: [],
        title: { text: xValue, style: { fontSize: '12px', fontWeight: 'bold', color: '#000000ff' } }
      },
      yaxis: {
        // min: yMn, max: yMx,
        title: { text: yValue, style: { fontSize: '12px', fontWeight: 'bold', color: '#000000ff' } }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        offsetY: -10,
        labels: { colors: '#000000ff' }
      }
    };

    // add series
    if (Array.isArray(yValue)) {
      yValue.forEach(ySub => chartOptions.series.push({ name: ySub, data: [] }));
    } else {
      chartOptions.series.push({ name: yValue, data: [] });
    }
  }
  if (xMn != null && xMn !== "") {
    chartOptions.xaxis.min = Number(xMn);
  }
  if (xMx != null && xMx !== "") {
    chartOptions.xaxis.max = Number(xMx);
  }
  if (yMn != null && yMn !== "") {
    chartOptions.yaxis.min = Number(yMn);
  }
  if (yMx != null && yMx !== "") {
    chartOptions.yaxis.max = Number(yMx);
  }
  // console.log(xMx,xMn,yMx,yMn);
  // ✅ use div instead of canvas
  let chartDiv;
  if(!id_alititude){
    [chartDiv,realID] = placeChartSlot();
  }
  else{
    chartDiv = id.altitude.graph
     realID = chartDiv.id;
  }

  // ✅ create ApexCharts with div container
  const chart = new ApexCharts(chartDiv, chartOptions);
  chart.render();

  // track charts
  data[data.boardNow].n_chart += 1;
  data[data.boardNow].charts.push(chart);
  if (!initGraph) {
    data[data.boardNow].storageChart.push(chartOptions);
  }
  data[data.boardNow].chartOptions.push(chartOptions);

  divChart[realID] = chartOptions.title.text;
}


export function initializeGraph(){
    let x, y, xMx, xMn, yMx, yMn,type;
    // console.log(`there will be ${data.setting.key[data.boardNow].plot.length} init graph`)
    for (let valueGraph of data.setting.key[data.boardNow].plot) {
        // console.log(`add grpah init ${valueGraph.x} and ${valueGraph.y}`)
        x = valueGraph.x;
        y = valueGraph.y;

        // use optional chaining + nullish coalescing ??
        xMx = valueGraph?.xMx ?? null;   // default 0 if missing
        xMn = valueGraph?.xMn ?? null;
        yMx = valueGraph?.yMx ?? null;
        yMn = valueGraph?.yMn ?? null;

        type = valueGraph?.type ?? "line";

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

    createChart({initGrpah: false,xValue: x, yValue: y,xMin : xMn, xMax : xMx, yMin : yMn, yMax : yMx});
    id.graph.xMn.value = '';
    id.graph.xMx.value = '';
    id.graph.yMn.value = '';
    id.graph.yMx.value = '';
}

export function autoAddGraph(){
    Object.entries(data[data.boardNow].data_format).forEach(({xName,xType},index) => {
        Object.entries(data[data.boardNow].data_format).forEach(({yName,yType},index) => {
            if(xType != "TEXT" && yType != "TEXT"){
                createChart({xValue : xName,yValue : yName})
            }
        });
    });
}

export function shiftValue(){
    data[data.boardNow].shiftValue = parseInt(id.graph.shiftValue.placeholder);
}

export function deleteGrpah(){
    data[data.boardNow].charts = []
    data[data.boardNow].storageChart = []
}

export function updateChart(){
    let dataChart = data[data.boardNow].sensor.dataIn;
    let index = 1;
    while(index < data[data.boardNow].n_chart){
        let chartOptions = data[data.boardNow].chartOptions[index]

        let xTitle = chartOptions.xaxis.title.text;
        
        let shiftValue = data[data.boardNow].shiftValue;

        let len;
        for(let yNumber of Object.keys(chartOptions.series)){
            let yName = chartOptions.series[yNumber].name;
            // console.log(dataChart[yName]);
            len = dataChart[yName].length;
            if(data[data.boardNow].shiftValue > len){
                chartOptions.series[yNumber].data = dataChart[yName].slice(0,len)
            }else{
                chartOptions.series[yNumber].data = dataChart[yName].slice(len-shiftValue,len)
            }
        }
        len = dataChart[xTitle].length;
        if(data[data.boardNow].shiftValue > len){
            chartOptions.labels = dataChart[xTitle].slice(0,len).map(String);
        }else{
            chartOptions.labels = dataChart[xTitle].slice(len-shiftValue,len).map(String);
        }

        data[data.boardNow].charts[index].updateOptions({series: chartOptions.series,labels: chartOptions.labels});
        index += 1;
    }
}

export function reloadChart(){
  n_chart = loadChartData('n_chart');
  if (!n_chart || isNaN(n_chart)) { n_chart = 0; }

  for(let chartOptions of Array.array(data[data.boardNow].storageChart)){
    createChart({initGrpah: false,chartOptions: chartOptions});
  }
}

export function mapAltitude(){
  createChart({id_alititude: true,xValue: "counter",yValue: data.setting.key[data.boardNow].altitude,yMn: 0,yMx: 1200})
}

export function updateMapAltitude(){
    let dataChart = data[data.boardNow].sensor.dataIn;
    let index = 0;

    let chartOptions = data[data.boardNow].chartOptions[index]
    // let xValue = data[data.boardNow].charts[index].chartOptions.labels
    // let yValue = data[data.boardNow].charts[index].chartOptions.series
    let xTitle = chartOptions.xaxis.title.text;
    
    let shiftValue = 1000;
    // console.log(`shiftValeu: ${shiftValue} len: ${dataChart[xTitle].length}`);

    let len;
    for(let yNumber of Object.keys(chartOptions.series)){
        let yName = chartOptions.series[yNumber].name;
        len = dataChart[yName].length
        if(shiftValue > len){
            chartOptions.series[yNumber].data = dataChart[yName].slice(0,len)
        }else{
            chartOptions.series[yNumber].data = dataChart[yName].slice(len-shiftValue,len)
        }
    }
    len = dataChart[xTitle].length;
    if(shiftValue > len){
        chartOptions.labels = dataChart[xTitle].slice(0,len).map(String);
    }else{
        chartOptions.labels = dataChart[xTitle].slice(len-shiftValue,len).map(String);
    }
    // console.log("chartData")
    // console.log(chartOptions.series)
    // console.log(chartOptions.labels)
    data[data.boardNow].charts[index].updateOptions({series: chartOptions.series,labels: chartOptions.labels});
    
}

export function dowloadGraph() {
  for (let [chartId, name] of Object.entries(divChart)) {
    ApexCharts.exec(chartId, 'dataURI').then(({ imgURI }) => {
      const a = document.createElement('a');
      a.href = imgURI;
      a.download = name + ".png";
      a.click();
    });
  }
}


export function syncData_graph(dataIn){
    data = dataIn;
}