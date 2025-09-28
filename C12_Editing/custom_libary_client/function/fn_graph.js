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

  if (data.length <= maxPoints) return data.slice(); // copy original array

  const step = parseInt(Math.ceil(data.length / maxPoints));
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

  // ✅ ensure last index is always included
  const lastIdx = data.length - 1;
  if (!result.includes(data[lastIdx])) {
    const lastPoint = {
      x: Number(data[lastIdx].x),
      y: isNumber(data[lastIdx].y) ? Number(data[lastIdx].y) : data[lastIdx].y,
      state: state[lastIdx] ?? "No info"
    };
    result.push(lastPoint);
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
  // console.log(result)

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

  // // close button first
  // const closeBtn = document.createElement('button');
  // closeBtn.textContent = '×';       
  // closeBtn.className = 'graph-close-btn';
  // closeBtn.addEventListener('click', () => {
  //     const chartDiv = card.querySelector('.chart-container');
  //     const chartId = chartDiv.id;

  //     const chartIndex = data[data.boardNow].charts.findIndex(c => c.opts.chart.id === chartId);
  //     if (chartIndex !== -1) {
  //         data[data.boardNow].charts[chartIndex].destroy();
  //         data[data.boardNow].charts.splice(chartIndex, 1);
  //         data[data.boardNow].chartOptions.splice(chartIndex, 1);
  //     }

  //     delete divChart[chartId];
  //     card.remove();
  // });

  // card.appendChild(closeBtn);

  // chart container
  const content = document.createElement('div');
  content.className = 'card--graph-content';

  const chartDiv = document.createElement('div');
  chartDiv.className = 'chart-container';
  realID = `chart-${Date.now()}`;
  chartDiv.id = realID;

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
        toolbar: { show: true ,
          tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
          customIcons: [
            { 
              icon: '<span style="font-size:16px;">×</span>',
              index: -1, // put it at the far right
              title: 'Close Chart',
              class: 'apexcharts-close-btn',
              click: function(chartContext, opts) {
                const chartId = chartContext.opts.chart.id;

                // Destroy the ApexChart instance
                const chartIndex = data[data.boardNow].charts.findIndex(c => c.opts.chart.id === chartId);
                if (chartIndex !== -1) {
                  data[data.boardNow].charts[chartIndex].destroy();
                  data[data.boardNow].charts.splice(chartIndex, 1);
                  data[data.boardNow].chartOptions.splice(chartIndex, 1);
                }

                // Remove from divChart tracking
                delete divChart[chartId];

                // Remove the entire slot (card is inside slot)
                const slot = document.getElementById(chartId)?.closest('.graph-slot');
                if (slot) slot.remove();
              }
            }]
          }
        },
        events: {
          zoomed: function (chartContext, { xaxis }) {
              if(xaxis.min && xaxis.max){
                xaxis.min = Math.ceil(xaxis.min);
                xaxis.max = Math.floor(xaxis.max);
              }

              if(xaxis.min > xaxis.max){
                xaxis.min += xaxis.max;
                xaxis.max = xaxis.min - xaxis.max;
                xaxis.min = xaxis.min - xaxis.max;
              }
              console.log("ZOOM to ");
              console.log(xaxis);

              const meta = chartContext.opts.meta;
              const xValue = meta.xValue;
              let yValues = Array.isArray(meta.yValues) ? meta.yValues : [meta.yValue]; // ✅ works for 1 or many Y’s

              const stateArr = data[data.boardNow].sensor.dataIn[data.setting.key[data.boardNow].state] || [];
              const datasetX = data[data.boardNow].sensor.dataIn[xValue] || [];

              // -----------------------------
              // 1. Build base array (X + state)
              // -----------------------------
              let baseCombined = datasetX.map((x, i) => ({
                x: Number(x),
                state: stateArr[i] ?? 'No info'
              }));

              // Apply zoom filter
              if (xaxis?.min != null && xaxis?.max != null) {
                baseCombined = baseCombined.filter(p => p.x >= xaxis.min && p.x <= xaxis.max);
              }

              // -----------------------------
              // 2. Build series for each Y
              // -----------------------------
              // console.log(yValues)
              console.log("ZOOM")
              if(Array.isArray(yValues[0])){
                yValues = yValues[0];
              }
              // for(let yName of yValues)
              const seriesData = yValues.map(yName => {
                const datasetY = data[data.boardNow].sensor.dataIn[yName] || [];

                // console.log(yName);
                const combined = baseCombined.map((p, i) => ({
                  x: p.x,
                  y: datasetY[i] ?? 0,
                  state: p.state
                }));
                // console.log(combined);
                return {
                  name: yName,
                  data: downsampleWithPriority(
                    combined,
                    maxPoints,
                    data[data.boardNow].sensor.priority[yName] || [],
                    combined.map(p => p.state)
                  )
                };
              });

              // -----------------------------
              // 3. Update chart
              // -----------------------------
              // console.log(seriesData);
              chartContext.updateSeries(seriesData, false, true);
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
          seriesHtml += `
            <div style="display:flex; align-items:center; gap:4px; margin-bottom:2px;">
              <div style="width:12px; height:12px; background:#3B3B3B ; border-radius:50%;"></div>
              <div>state:   ${state}</div>
            </div>
          `
          return `
            <div style="padding:6px; font-size:13px; min-width:150px; background:#fff; border:1px solid #949494ff; border-radius:4px;">
              <div style="font-weight:bold; text-align:center; margin-bottom:4px;">${xName}: ${xVal}</div>
              ${seriesHtml}
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
    let value,label
    id.graph.xValue.innerHTML = '<option value="">-- xValue --</option>'; // reset
    id.graph.yValue.innerHTML = '<option value="">-- yValue --</option>'; // reset
    for(let dataName of Object.keys(data.data_setting[data.boardNow].data_format)){
        const optionX = document.createElement('option');
        optionX.value = dataName;      // value sent to server
        optionX.textContent = dataName; // text shown in select
        id.graph.xValue.appendChild(optionX);

        const optionY = document.createElement('option');
        optionY.value = dataName;
        optionY.textContent = dataName;
        id.graph.yValue.appendChild(optionY);    
    }


    maxPoints = data[data.boardNow].showValue;

    let x, y, xMx, xMn, yMx, yMn,type;
    for (let valueGraph of data.setting.key[data.boardNow].plot) {
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
    const name = data.setting.key[data.boardNow];

    // add3DChart({xValue: name.map.lat, yValue:name.map.lon , zValue:name.altitude})
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
    console.log("change to shift value to %d",data[data.boardNow].shiftValue)
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

      // skip if chartOptions no longer exists
      if (!chartOptions) {
          index++;
          continue;
      }

      let xTitle = chartOptions.xaxis.title.text;
      let shiftValue = data[data.boardNow].shiftValue * data[data.boardNow].showValue;

      // Loop over each series
      for (let i = 0; i < chartOptions.series.length; i++) {
          let yName = chartOptions.series[i].name;

          console.log(yName)
          
          let len = dataChart[yName].length;

          // Slice the window of X and Y data
          let start = Math.max(len - shiftValue, 0);
          let xData = dataChart[xTitle].slice(start, len);
          let yData = dataChart[yName].slice(start, len);

          // Combine into {x, y} objects
          // console.log(data[data.boardNow].sensor.dataIn[data.setting.key[data.boardNow].state])
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
        
        // console.log(yName);
        
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

export async function downloadGraph() {
    const zip = new JSZip();

    // Iterate through each chart
    for (let [chartId, name] of Object.entries(divChart)) {
        const { imgURI } = await ApexCharts.exec(chartId, 'dataURI');

        // Convert Base64 URI to Blob
        const base64Data = imgURI.split(',')[1]; // remove "data:image/png;base64,"
        const blob = new Blob([Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))], { type: "image/png" });

        // Add to zip
        zip.file(name + ".png", blob);
    }

    // Generate zip and trigger download
    zip.generateAsync({ type: "blob" }).then((content) => {
        saveAs(content, "graph.zip");
    });
}



export function syncData_graph(dataIn){
    data = dataIn;
}




// ---------------------------
// 3D Downsampling function
// ---------------------------
function downsample3D(data, maxPoints, priorityIndices = [], state = []) {
    if (data.length <= maxPoints) {
        // Ensure all points have numbers and state
        return data.map(p => ({
            x: Number(p.x),
            y: Number(p.y),
            z: Number(p.z),
            state: p.state ?? 'No info'
        }));
    }

    const step = Math.ceil(data.length / maxPoints);
    const result = [];

    // Sample every step
    for (let i = 0; i < data.length; i += step) {
        result.push({
            x: Number(data[i].x),
            y: Number(data[i].y),
            z: Number(data[i].z),
            state: state[i] ?? 'No info'
        });
    }

    // Ensure last point included
    const lastPoint = data[data.length - 1];
    if (!result.some(p => p.x === lastPoint.x && p.y === lastPoint.y && p.z === lastPoint.z)) {
        result.push({
            x: Number(lastPoint.x),
            y: Number(lastPoint.y),
            z: Number(lastPoint.z),
            state: state[data.length - 1] ?? 'No info'
        });
    }

    // Add priority points
    priorityIndices.forEach(idx => {
        if (idx >= 0 && idx < data.length && !result.some(p => p.x === data[idx].x && p.y === data[idx].y && p.z === data[idx].z)) {
            let insertPos = result.findIndex(p => data.indexOf(p) > idx);
            if (insertPos === -1) insertPos = result.length;
            result.splice(insertPos, 0, {
                x: Number(data[idx].x),
                y: Number(data[idx].y),
                z: Number(data[idx].z),
                state: state[idx] ?? 'No info'
            });
        }
    });

    return result;
}

// ---------------------------
// Add a 3D chart
// ---------------------------
export function add3DChart({ xValue = 'x', yValue = 'y', zValue = 'z', maxPoints = 500, chartTitle = null }) {
    if(!chartTitle){
      chartTitle = String(xValue) + " " + String(yValue) + " " + String(zValue);
    }
    console.log("Init 3D")
    if (!data[data.boardNow].chart3D) data[data.boardNow].chart3D = [];

    // Create div slot
    const [chartDiv, chartId] = placeChartSlot(); // reuse 2D slot function

    const datasetX = data[data.boardNow].sensor.dataIn[xValue] || [];
    const datasetY = data[data.boardNow].sensor.dataIn[yValue] || [];
    const datasetZ = data[data.boardNow].sensor.dataIn[zValue] || [];
    const stateArr = data[data.boardNow].sensor.dataIn[data.setting.key[data.boardNow].state] || [];

    const combined = datasetX.map((x, i) => ({
        x: Number(x),
        y: Number(datasetY[i] ?? 0),
        z: Number(datasetZ[i] ?? 0),
        state: stateArr[i] ?? 'No info'
    }));

    const downsampledData = downsample3D(combined, maxPoints);

    // Store chart options separately
    const chartOptions3D = {
        chartDiv,
        chartId,
        data: downsampledData,
        title: chartTitle,
        xValue,
        yValue,
        zValue
    };

    data[data.boardNow].chart3D.push(chartOptions3D);
    // Prepare hover text
    const hoverText = downsampledData.map(p =>
        `${xValue}: ${p.x}<br>${yValue}: ${p.y}<br>${zValue}: ${p.z}<br>state: ${p.state}`
    );
    // Render 3D scatter with Plotly
    Plotly.newPlot(chartDiv, [{
        x: downsampledData.map(p => p.x),
        y: downsampledData.map(p => p.y),
        z: downsampledData.map(p => p.z),
        mode: 'markers',
        type: 'scatter3d',
        marker: { size: 5, color: 'blue' },
        text: hoverText,
        hovertemplate: '%{text}<extra></extra>' // use text array and hide default trace info
    }], {
        title: chartTitle,
        margin: { l: 0, r: 0, b: 0, t: 30 },
        scene: {
            xaxis: { title: xValue },
            yaxis: { title: yValue },
            zaxis: { title: zValue }
        }
    });
    console.log("Finish Init 3D")
}

// ---------------------------
// Update 3D chart
// ---------------------------
export function update3DChart(index = 0, maxPoints = 500) {
    console.log("start update 3D")
    const chartOptions3D = data[data.boardNow].chart3D[index];
    if (!chartOptions3D) return;

    const { chartDiv, xValue, yValue, zValue } = chartOptions3D;

    const datasetX = data[data.boardNow].sensor.dataIn[xValue] || [];
    const datasetY = data[data.boardNow].sensor.dataIn[yValue] || [];
    const datasetZ = data[data.boardNow].sensor.dataIn[zValue] || [];
    const stateArr = data[data.boardNow].sensor.dataIn[data.setting.key[data.boardNow].state] || [];

    console.log("3D update")
    console.log(datasetX)
    console.log(datasetY)
    console.log(datasetZ)
    const combined = datasetX.map((x, i) => ({
        x: Number(x),
        y: Number(datasetY[i] ?? 0),
        z: Number(datasetZ[i] ?? 0),
        state: stateArr[i] ?? 'No info'
    }));

    const downsampledData = downsample3D(combined, maxPoints);

    // Prepare hover text
    const hoverText = downsampledData.map(p =>
      `<b>${xValue}:</b> ${p.x}<br>
      <b>${yValue}:</b> ${p.y}<br>
      <b>${zValue}:</b> ${p.z}<br>
      <b>state:</b> ${p.state}`
    );


    // Update chart data
    Plotly.react(chartDiv, [{
        x: downsampledData.map(p => p.x),
        y: downsampledData.map(p => p.y),
        z: downsampledData.map(p => p.z),
        mode: 'markers',
        type: 'scatter3d',
        marker: { size: 5, color: 'blue' },
        text: hoverText,
        hovertemplate: '%{text}<extra></extra>'
    }], {
        title: chartOptions3D.title,
        margin: { l: 0, r: 0, b: 0, t: 30 },
        scene: {
            xaxis: { title: { text: xValue } },
            yaxis: { title: { text: yValue } },
            zaxis: { title: { text: zValue } }
        }
    });
}
