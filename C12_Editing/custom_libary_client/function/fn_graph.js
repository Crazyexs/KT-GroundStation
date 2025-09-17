const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

const { dir } = await import('../../dir_client.js');
const { id } = await import('../../id.js');

let data;
let divChart = {};
let maxPoints;

function isNumber(value) {
  return !isNaN(Number(value));
}

function downsampleWithPriority(data, maxPoints, priorityIndices = [], state=[]) {
  console.log(state)
  if (data.length <= maxPoints) return data.slice(); // copy original array

  const step = Math.ceil(data.length / maxPoints);
  const result = [];

  // add sampled points
  for (let i = 0; i < data.length; i += step) {
    data[i].x = Number(data[i].x);
    if(isNumber(data[i].y)){
      data[i].y = Number(data[i].y);
    }
    data[i].state = state[i];
    result.push(data[i]);
  }

  // add priority points if not already included
  priorityIndices.forEach(idx => {
    if (idx >= 0 && idx < data.length && !result.includes(data[idx])) {
      // create a copy with state
      const pointWithState = {
        x: Number(data[idx].x),
        y: isNumber(data[idx].y) ? Number(data[idx].y) : data[idx].y,
        state: state[idx] ?? 'No info'   // assign state
      };

      // find the position in result closest to idx to preserve order
      let insertPos = result.findIndex(p => data.indexOf(p) > idx);
      if (insertPos === -1) insertPos = result.length;
      result.splice(insertPos, 0, pointWithState);
    }
  });


  for(let point of result){
    point.x = Number(point.x);
    point.y = Number(point.y);
  }
  console.log(result)
  console.log(typeof result[0].x)
  console.log(typeof result[0].y)
  return result;
}



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
        zoom: { enabled: true, type: 'x' },
        toolbar: { show: true , tools: { zoomin: true, zoomout: true, reset: true, download: true, pan: true }},
        events: {
          zoomed: function(chartContext, { xaxis }) {
            console.log('Zoomed to X:', xaxis);
            const meta = chartContext.opts.meta;

            const xValue = meta.xValue;
            const yValues = Array.isArray(meta.yValues) ? meta.yValues : [meta.yValue];

            const datasetX = data[data.boardNow].sensor.dataIn[xValue] || [];

            const seriesData = yValues.map(yName => {
              const datasetY = data[data.boardNow].sensor.dataIn[yName] || [];

              // create {x, y} objects safely
              let combined = datasetX.map((x, i) => ({ x, y: datasetY[i] ?? 0 }));
              let state = data[data.boardNow].sensor.dataIn[data.setting.key[data.boardNow].state] || [];
              // apply zoom window if defined
              if (xaxis.min != null && xaxis.max != null) {
                combined = combined.filter((p, i) => {
                  // keep only points inside the zoom window
                  return p.x >= xaxis.min && p.x <= xaxis.max;
                });

                // update state array for zoomed points
                state = combined.map(p => p.state ?? 'No info');
              }
              return {
                name: yName,
                data: downsampleWithPriority(combined,
                                             maxPoints,
                                             data[data.boardNow].sensor.priority[yName] || [],
                                             state || [])
              };
            });
            console.log('Zoomed to X:');
            console.log(seriesData)
            chartContext.updateSeries(seriesData);
          }
        }
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
        type: 'numeric',
        title: { text: xValue, style: { fontSize: '12px', fontWeight: 'bold', color: '#000000ff' } },
        annotations: {
           xaxis: (data[data.boardNow].sensor.priority[xValue] || []).map(idx => {
            const xVal = data[data.boardNow].sensor.dataIn[xValue][idx]; // get actual x from index
            return {
              x: xVal,
              borderColor: '#ff0',
              strokeDashArray: 4,
              label: {
                text: `Priority ${xVal}`,
                style: { color: '#000', background: '#ff0' }
              }
            };
          })
        }
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
      },
      meta: { xValue, yValue },
      tooltip: {
        shared: true,  // important for multiple series
        intersect: false, // show all series at hover
        custom: function({ series, seriesIndex, dataPointIndex, w }) {
          const xName = w.config.xaxis.title.text;
          const xVal = w.globals.labels[dataPointIndex] ?? (w.globals.seriesX?.[0]?.[dataPointIndex] ?? ''); 

          // extra text stored separately
          const extraText = data[data.boardNow].sensor.dataIn[data.setting.key[data.boardNow].state][dataPointIndex] || 'No info';

          // loop over all series for this point
          let seriesHtml = '';

          const state = w.globals.initialSeries[seriesIndex].data[dataPointIndex].state;

          w.config.series.forEach((s, i) => {
            const yVal = series[i][dataPointIndex];
            const color = w.globals.colors[i];  // color of the series
            seriesHtml += `
              <div style="display:flex; align-items:center; gap:4px; margin-bottom:2px;">
                <div style="width:12px; height:12px; background:${color}; border-radius:50%;"></div>
                <div>${s.name}:   ${yVal}</div>
              </div>
            `;
          });

          return `
            <div style="padding:6px; font-size:13px; min-width:150px; background:#fff; border:1px solid #949494ff; border-radius:4px;">
              <div style="font-weight:bold; text-align:center; margin-bottom:4px;">${xName}: ${xVal}</div>
              ${seriesHtml}
              <div style="font-size:12px; color:#555; margin-top:4px;">${state}</div>
            </div>
          `;
        }
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

  chartOptions.chart.id = realID;   // make ApexCharts know this chart’s id
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
  
    maxPoints = data[data.boardNow].showValue;

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
    data[data.boardNow].shiftValue = parseInt(id.graph.shiftValue.value);
    updateChart();
}

export function deleteGrpah(){
    data[data.boardNow].charts = []
    data[data.boardNow].storageChart = []
}

export function updateChart() {
  let dataChart = data[data.boardNow].sensor.dataIn;
  let index = 1;

  while (index < data[data.boardNow].n_chart) {
      let chartOptions = data[data.boardNow].chartOptions[index];
      let xTitle = chartOptions.xaxis.title.text;
      let shiftValue = data[data.boardNow].shiftValue * data[data.boardNow].showValue;
;

      // Loop over each series
      for (let i = 0; i < chartOptions.series.length; i++) {
          let yName = chartOptions.series[i].name;
          let len = dataChart[yName].length;

          // Slice the window of X and Y data
          let start = Math.max(len - shiftValue, 0);
          let xData = dataChart[xTitle].slice(start, len);
          let yData = dataChart[yName].slice(start, len);

          // Combine into {x, y} objects
          console.log(data[data.boardNow].sensor.dataIn[data.setting.key[data.boardNow].state])
          chartOptions.series[i].data = downsampleWithPriority(
              xData.map((x, j) => ({ x, y: yData[j] })),
              maxPoints,
              data[data.boardNow].sensor.priority[yName],
              data[data.boardNow].sensor.dataIn[data.setting.key[data.boardNow].state] || []
          );
      }

      // ✅ Only update series
      data[data.boardNow].charts[index].updateSeries(chartOptions.series);
      index++;
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
  createChart({id_alititude: true,xValue: "indice",yValue: data.setting.key[data.boardNow].altitude,yMn: 0,yMx: 1200})
}

export function updateMapAltitude() {
    let dataChart = data[data.boardNow].sensor.dataIn;
    let index = 0;

    let chartOptions = data[data.boardNow].chartOptions[index];
    let xTitle = chartOptions.xaxis.title.text;
    let shiftValue = 1000; // fixed window for altitude

    for (let i = 0; i < chartOptions.series.length; i++) {
        let yName = chartOptions.series[i].name;
        let len = dataChart[yName].length;

        let start = Math.max(len - shiftValue, 0);
        let xData = dataChart[xTitle].slice(start, len);
        let yData = dataChart[yName].slice(start, len);

        chartOptions.series[i].data = downsampleWithPriority(
            xData.map((x, j) => ({ x, y: yData[j] })),
            maxPoints,
            data[data.boardNow].sensor.priority[yName],
            data[data.boardNow].sensor.dataIn[data.setting.key[data.boardNow].state] || []
        );
    }

    data[data.boardNow].charts[index].updateSeries(chartOptions.series);
}

export function downloadGraph() {
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