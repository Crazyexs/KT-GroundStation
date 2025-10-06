const { id } = await import("./id.js");
const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

const socket = io();
let data;
let map;
let rocketMarker;
let Location;
let alert;
let freq = null;
let prevBoard = null;
let init = false;
let divChart = {};

let oldack = 0;
let oldnack = 0;

let dataTable = [
                    "counter",
                    // "TimeStamp",
                    "RocketName",
                    "freq",
                    // "state",
                    "altitude",
                    "apogee",
                    "servoCheck",
                    "voltageMon",
                    "RSSI",
                    "SNR",
                    "last_ack",
                    "last_nack"
                ];
                /*  [name,max,min] */
let dataGraph = [
                    [["altitude"],null,0],
                    
                ]
let dataradialBar = [
                      // [["voltageMon"],7.4,0,"+"],
                      // [["currentServo"],20,-130,"-"],
                      // [["SNR"],20,-130,"-"]
                    ]
function getGoogleMapsPinLink(lat, lng) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

// General map function
function mapValue(x, inMin, inMax, outMin, outMax) {
  return (x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}


function findByNameRadialBar(name) {
  const dataArray = dataradialBar;
  for (let i = 0; i < dataArray.length; i++) {
    // first element is an array with the name inside
    console.log(dataArray[i][0][0],name)
    if (dataArray[i][0][0] === name) {
      return i;
    }
  }
  return null; // not found
}

function toStringAny(input) {
  if (typeof input === "string") {
    // already string → return as is
    return input;
  } else if (Array.isArray(input) || typeof input === "object") {
    // arrays or objects → stringify
    return JSON.stringify(input);
  } else {
    // numbers, booleans, etc. → normal toString
    return String(input);
  }
}

function changeDataTypeArr(arr,dataType) {
  return arr.map(v => dataType(v));
}

/* ============================================= Table ============================================= */

export function initializeTable(){
    id.table.innerHTML = ""; // ล้างตารางเก่า
    for(const name of dataTable){
        const tr = document.createElement("tr");
        tr.innerHTML = `<th>${name}</th><td>Wait for data...</td>`;
        id.table.appendChild(tr);
    };
}

export function updateTable(){
    id.table.innerHTML = ""; // ล้างตารางเก่า
    for(const name of dataTable){
        const value = data[data.boardNow].sensor.dataIn[name];
        const tr = document.createElement("tr");
        tr.innerHTML = `<th>${name}</th><td>${value[value.length - 1]}</td>`;
        id.table.appendChild(tr);
    };
}

/* ============================================= Alerting ============================================= */

export function alerting_fn(CASE,data){
    alert = true;

    let level = 0;
    let header = CASE;
    let text;

    switch(CASE){
        case "RocketName":
            text = `Unexpect RocketID : ${data.RocketName}`
            break;
        case "freq":
            text = `Unexpect freq : ${data.freq}`
            break;
        case "uplink":
            text = `Uplink False : ${data.uplink}`
            break;
        case "limit":
            let direction,numDirection;
            if(data.direction == "+"){
                direction = "above"
                numDirection = 1;
            }
            else if(data.direction == "-"){
                direction = "below"
                numDirection = -1;
            }
            else{
                direction = "unknow"
            }
            console.log("LIMITDATA",data.name,data.value,data.limit,direction,data.direction)
            text = `${data.name} now limit ${data.limit} ${data.value} ${direction} ${(data.value - data.limit)*numDirection}`
            // return;
            break;
        case "Lora missing information":
            text = `got ${data.get} length\nexpect ${data.expect} length`
            break;
        case "unexpect command":
            if(data.command.length == 0){ return}
            text = `got command : ${data.command}`
            // return;
            break;
        default:
            text = `unknow header : ${toStringAny(data)}`
            break;
    }

    let output = id.alert.text;
    id.alert.header += header;

    console.log('Received command data:', data);
    const line = document.createElement("div");
    line.textContent =
        `${text}\n`;  
    output.appendChild(line);

    // keep only last 200 lines (optional, prevents memory bloat)
    if (output.childNodes.length > 200) {
        output.removeChild(output.firstChild);
    }
    output.scrollTop = output.scrollHeight;
}

/* ============================================= handle command ============================================= */

export function handelCommand(){
    let except = false;
    
    alert = false;

    let command = data[data.boardNow].command.command;
    
    const dataName = Object.keys(data.data_setting[data.boardNow].data_format);
    if (typeof command !== "string") {
      console.warn("handelCommand got non-string:", command);
      return;
    }
    
    command = command.trim().split(/\s+/);
    command.splice(0,2);
    if(command.length >= dataName.indexOf("status")){
        if(data.boardNow == command[dataName.indexOf("status")]){
            alerting_fn("Lora missing information",{"expect": data.dataName.length ,"get": command.length })
        }
    }

    
    switch(command[0]){
        case "TransmitFailed,Code:":
            alerting_fn("unexpect command",{"command": command })
            break;
        case "ReceiveFailed,Code:":
            alerting_fn("unexpect command",{"command": command })
            break;
        case "[RECEIVING...]":
            except = true;
            break;
        case "[TRANSMITTING...]":
            except = true;
            break;
        case "[RECEIVED]":
            except = true;
            break;
        case "Transmitting:":
            except = true;
            break;
        case "SetFrequencyTo":
            break;
        default:
            if(!alert){
                alerting_fn("unexpect command",{"command": command })
            }
    }
    
    // const output = id.monitor.command;

    // console.log('Received command data:', data[data.boardNow].command.command);
    // const line = document.createElement("div");
    // line.textContent =
    //     `${data[data.boardNow].command.command}`;  
    // output.appendChild(line);

    // // keep only last 200 lines (optional, prevents memory bloat)
    // if (output.childNodes.length > 200) {
    //     output.removeChild(output.firstChild);
    // }
    // output.scrollTop = output.scrollHeight;
}
/* ============================================= Update SMALL Data ============================================= */

export function checkAndUpdateData(){
    let boardDatas = data[data.boardNow].sensor.dataIn;
    let boardData = {};
    for(const name of Object.keys(boardDatas)){
        boardData[name] = boardDatas[name][boardDatas[name].length - 1];
    }
    
    const limitDatas = dataradialBar;
    // boardID
    if(freq != boardData["freq"] && freq != null) {  alerting_fn("freq",{"freq": boardData["freq"]});  }
    if(boardData["RocketName"] != data.boardNow)   {  alerting_fn("RocketName",{"RocketName": boardData["RocketName"]});  }

    freq = boardData["freq"];

    // Limit
    for(let [[name],Mx,Mn,direction] of limitDatas){
      if(Mx < Mn){  
        Mx += Mn;
        Mn = Mx - Mn;
        Mx = Mx - Mn;
      }
      let limitData;
      if(direction = "+"){
        limitData = Mx;
      }
      else{
        limitData = Mn;
      }
      if(limitData < boardData[name]){
          alerting_fn("limit",{name : name , value : boardData[name] , limit : limitData , direction : direction})
          // console.log("LIMITDATA",name,boardData[name],limitData,direction)
      }
    }

}

/* ============================================= Map ============================================= */

export function initializeMap(){
    map = L.map(id.map).setView([15.036422727194878, 100.9128553472129], data.setting.key[data.boardNow].map.zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);
    rocketMarker = L.marker([14.8566086, 100.6362539,12]).addTo(map).bindPopup('Rocket Location');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            Location = L.marker([lat, lng]).addTo(map).bindPopup("Location From Map")

            // Optionally move map view to this location
            map.setView([lat, lng], 13);
        });
        } else {
        alerting("Geolocation is not supported by this browser.");
    }
    // ourPosition = L.marker([15.036422727194878, 100.9128553472129]).addTo(map).bindPopup('Ground Station'); 
}

export function updateMap(){
    const dataIn = data[data.boardNow].sensor.dataIn;
    
    const nameLat = data.setting.key[data.boardNow].map.lat
    const nameLon = data.setting.key[data.boardNow].map.lon
    const dataLat = dataIn[nameLat][dataIn[nameLat].length - 1]
    const dataLon = dataIn[nameLon][dataIn[nameLon].length - 1]

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            Location.setLatLng([lat, lng])
        });
        } else {
        alerting("Geolocation is not supported by this browser.");
    }

    
    rocketMarker.setLatLng([dataLat, dataLon]);
    
    id.location.textContent = getGoogleMapsPinLink(dataLat,dataLon);
}

/* ============================================= Graph ============================================= */

// Instead of canvas, create a div container for ApexCharts
export function placeChartSlot() {
  let realID;

  const empty = qsa('.graph-slot.is-empty')[0];
  const slot = document.createElement('div');
  slot.className = 'graph-slot resizable';
  // slot.style.setProperty('heigth','600px');
  // slot.style.setProperty('--min-w','1300px'); // full width of grid cell

  // wrap in card
  const card = document.createElement('div');
  card.className = 'card--graph';
  // card.style.setProperty('heigth','600px');
  // card.style.setProperty('--min-w','1300px'); // full width of grid cell

  const content = document.createElement('div');
  content.className = 'card--graph-content';
  // content.style.setProperty('heigth','600px');
  // content.style.setProperty('--min-w','1300px'); // full width of grid cell

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



export function createRadialChart({
  label = 'Gauge',
  value = 0,
  id = null,
  initGraph = true,
  Mn = null,
  Mx = null,
  position = "+"
}) {
  // Create a container if no id provided
  let chartDiv,realID;
  if(!id){
    [chartDiv,realID] = placeChartSlot();
  }

  // Determine color based on value
  let color = '#00bfff'; // default blue
  if (value >= 80) color = '#ff4d4d'; // red if close to 100

  // ApexCharts radial bar options
  const chartOptions = {
    chart: {
      type: 'radialBar',
      height: '480px',
      width: '1300px',
      fontFamily: 'Helvetica, Arial, sans-serif',
      foreColor: '#000000ff',
      id: realID,
      toolbar: { show: true }
    },
    series: [value], // current value
    labels: [label],
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: { size: '60%' },
        track: { background: '#eee' },
        dataLabels: {
          name: { fontSize: '14px', color: '#333' },
          value: {
            fontSize: '20px',
            color: color,
            formatter: function(val,opts) {
              console.log(opts)
              const xName = opts.config.labels[0][0];
              const dataChart = data[data.boardNow].sensor.dataIn;
              value = dataChart[xName][dataChart[xName].length - 1];
              return value;
            }
          }
        }
      }
    },
    colors: [color],
    stroke: { lineCap: 'round' },
    tooltip: {
      enabled: true,
      shared: false
    },
    title: {
      text: label,
      align: 'center',
      margin: 10,
      style: { fontSize: '14px', fontWeight: 'bold' }
    },
    options: {
      yaxis: {
        min: Mn,
        max: Mx
      }
    }
  };


  // Create chart
  const chart = new ApexCharts(chartDiv, chartOptions);

  if (initGraph) chart.render();

  // Track chart if needed

  data[data.boardNow].workingPage.n_chart += 1;
  data[data.boardNow].workingPage.charts.push(chart);
  data[data.boardNow].workingPage.chartOptions.push(chartOptions);

  divChart[realID] = label;

  return chart;
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
        height: "500px",
        width: "850px",
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
        type: 'category',
        title: { text: xValue, style: { fontSize: '12px', fontWeight: 'bold', color: '#000000ff' } },
        // annotations: {
        //    xaxis: (data[data.boardNow].sensor.priority[xValue] || []).map(idx => {
        //     const xVal = data[data.boardNow].sensor.dataIn[xValue][idx]; // get actual x from index
        //     return {
        //       x: xVal,
        //       borderColor: '#ff0',
        //       strokeDashArray: 4,
        //       label: {
        //         text: `Priority ${xVal}`,
        //         style: { color: '#000', background: '#ff0' }
        //       }
        //     };
        //   })
        // }
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
  data[data.boardNow].workingPage.n_chart += 1;
  data[data.boardNow].workingPage.charts.push(chart);
  data[data.boardNow].workingPage.chartOptions.push(chartOptions);

  divChart[realID] = chartOptions.title.text;
}

export function initGraph(){
    for (let [y,yMx,yMn] of dataGraph) {
        const x = "indice";

        if(yMx < yMn){
          yMx += yMn;
          yMn = yMx - yMn;
          yMx = yMx - yMn;
        }
        // use optional chaining + nullish coalescing ??
        const xMx = null;   // default 0 if missing
        const xMn = null;

        const type = "line";

        createChart({xValue: x,yValue: y,xMx: xMx,xMn: xMn,yMx: yMx,yMn: yMn,type: type});
    }
    for (let [name,Mx,Mn,position] of dataradialBar) {
        if(Mx < Mn){
          Mx += Mn;
          Mn = Mx - Mn;
          Mx = Mx - Mn;
        }
        createRadialChart({label: name,Mx: Mx,Mn: Mn,position: position});
    }
}

function updateGauge(chart,label,lastData) {
    console.log(label)
    let num = findByNameRadialBar(label);
    console.log(num)
    let [[name],Mx,Mn,position] = dataradialBar[num];
    if(Mx < Mn){
      Mx += Mn;
      Mn = Mx - Mn;
      Mx = Mx - Mn;
    }
    
    let pos;
    if(position == "+"){
      pos = 1
    }
    else{
      pos = -1;
    }
    lastData *= pos;
    Mx *= pos;
    Mn *= pos;
    if(Mx < Mn){
      Mx += Mn;
      Mn = Mx - Mn;
      Mx = Mx - Mn;
    }

    const val = mapValue(lastData,Mn,Mx,0,100);

    const gaugeValue = Math.min(Math.max(val, 0), 100);
    chart.updateOptions({ fill: { colors: [getColor(gaugeValue)] } });
    chart.updateSeries([gaugeValue]);
}

// Helper for dynamic color
function getColor(val) {
    if (val < 60) return "#22c55e";
    if (val < 85) return "#facc15";
    return "#ef4444";
}

export function updateGraph(){
    console.log("UPDATE GRAPH")
    
    let dataChart = data[data.boardNow].sensor.dataIn;
    let index = 0;

    while (index < data[data.boardNow].workingPage.n_chart) {
        let chartOptions = data[data.boardNow].workingPage.chartOptions[index];
        console.log(chartOptions.chart.type)

        if(chartOptions.chart.type == "radialBar"){
          const chart = data[data.boardNow].workingPage.charts[index]
          const name = chartOptions.labels[0][0]
          const lastData = dataChart[name][dataChart[name].length - 1]
          console.log("name: ",name)
          updateGauge(chart,name,lastData);
        }
        else{
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
              chartOptions.series[i].data = xData.map((x, idx) => {
                  return { x: x, y: yData[idx] };
              });
          }
          // ✅ Only update series
          data[data.boardNow].workingPage.charts[index].updateSeries(chartOptions.series);
        }
        index++;
    }
}

/* ============================================= 9+ ============================================= */


/* ============================================= Uplink ============================================= */

export function initializeUplink(){
    let value,label
    id.uplink.selected.innerHTML = '<option value="">-- Select Command --</option>'; // reset
    for(let uplinkNumber of data.uplink[data.boardNow]){
        value = uplinkNumber.value;
        label = uplinkNumber.label;
        const option = document.createElement('option');
        option.value = value;        // ค่าที่จะส่งไป server
        option.textContent = label;  // ข้อความที่แสดงใน select
        id.uplink.selected.appendChild(option);        
    }
}

export function uplinkSending(){
    let now = 0;
    let msg = id.uplink.selected.value;
    let placeholder = false;
    if(msg.length == 0){
        msg = id.uplink.placeholder.value;
        placeholder = true;
    }
    else if(id.uplink.placeholder.value == "now"){
      now = 1;
    }
    socket.emit("uplink",{boardNumber: data.boardNow,msg: msg,placeholder: placeholder,now: now});

    id.uplink.result.textContent = "Wait for uplink...";
    id.uplink.result.style.color = "white";


    const indice = data[data.boardNow].sensor.dataIn;
    const nowIndice = indice[indice.length - 1];
    
    const interval = setInterval(() => {
        let last_ack = data[data.boardNow].sensor.dataIn["last_ack"];
        let last_nack = data[data.boardNow].sensor.dataIn["last_nack"];
        if(last_ack[last_ack.length - 1] != last_ack[last_ack.length - 2] /* && last_ack[last_ack.length - 1] != oldack */ ){
            oldack = last_ack[last_ack.length - 1];
            id.uplink.result.textContent = "Success";
            id.uplink.result.style.color = "green";
            clearInterval(interval);
        }
        else if(last_nack[last_nack.length - 1] != last_nack[last_nack.length - 2] /* && last_nack[last_nack.length - 1] != oldnack */ ){
            oldnack = last_nack[last_nack.length - 2];
            id.uplink.result.textContent = "Lora send error";
            id.uplink.result.style.color = "yellow";
            clearInterval(interval);
        } 
        else if(nowIndice - indice > 2){
            id.uplink.result.textContent = "False";
            id.uplink.result.style.color = "red";
            alerting_fn("uplink",{"uplink": msg})
            clearInterval(interval);
        }
    },10)

    setTimeout(() => {
        id.uplink.result.textContent = "Wait for uplink...";
        id.uplink.result.style.color = "white";
    }, 3000);
}

/* ============================================= Event ============================================= */

export function event(){
    id.clearGraph.btn.addEventListener("click", () => {
        console.log(id.clearGraph)
        socket.emit("clear",{boardNumber: data.boardNow, number: id.clearGraph.placeholder.value});
    });
    id.uplink.button.addEventListener("click", () => {
      uplinkSending();
    })
}

/* ============================================= SERVO ============================================= */
function servo(){
  let boardDatas = data[data.boardNow].sensor.dataIn;
  let boardData = {};
  for(const name of Object.keys(boardDatas)){
      boardData[name] = boardDatas[name][boardDatas[name].length - 1];
  }
  if(!boardData["servoCheck"]){
    document.getElementById("servoValue").textContent = "FALSE"
  }
  else{
    document.getElementById("servoValue").textContent = "TRUE"
  }
  // console.log("SERVOOO " + document.getElementById("servoValue").value)
  // console.log("SERRRPPPPOOOOOPOKDKJAJKSDKJDAKSD " + boardData["servoCheck"])

}

/* ============================================= STATE ============================================= */

function state(){
  let boardDatas = data[data.boardNow].sensor.dataIn;
  let boardData = {};
  for(const name of Object.keys(boardDatas)){
      boardData[name] = boardDatas[name][boardDatas[name].length - 1];
  }
  document.getElementById("stageValue").textContent = boardData["state"];
}

/* ============================================= update ============================================= */

export function update_workingPageCommand(){
    handelCommand();
}

export function update_workingPageSensor(){
    checkAndUpdateData();
    updateGraph();
    updateMap();
    updateTable();
    servo();
    state();
}

export function initWorkingPage(){
    initializeTable();
    initializeMap();
    initGraph();
    initializeUpdateDataIO();
    initializeUplink();
}

/* ============================================= syncData ============================================= */

export function syncData_workingPage(dataIn){
    data = dataIn;
}

/* ============================================= boardID ============================================= */

export function listBoardNumber(){
  let value,label;
  id.boardID.innerHTML = '<option value="">-- Select Port --</option>'; // reset
  for(let boardNum of Object.keys(data.data_setting)){
      value = boardNum;
      label = boardNum;
      const option = document.createElement('option');
      option.value = value;        // ค่าที่จะส่งไป server
      option.textContent = label;  // ข้อความที่แสดงใน select
      id.boardID.appendChild(option);        
  }
}
export function difBoard(){
  const interval1 = setInterval(() => {
    if(id.boardID.value != data.boardNow){
      data.boardNow = id.boardID.value;
    }
  }, 100);

  const interval2 = setInterval(() => {
    console.log("BoardNow: " + String(data.boardNow))
  }, 2000);
}

/* ============================================= IO ============================================= */

export function initializeUpdateDataIO(){
    if(socket){
        socket.on("sensor-data", (dataIn) => { 
            let dataGet = data[dataIn.boardNumber].sensor.dataIn;
            for(let name of Object.keys(dataGet)){
                if(Number.isFinite(dataIn[name][0])){
                    dataGet[name] = changeDataTypeArr(dataIn[name],parseFloat);
                    // console.log(`counter: ${dataIn["counter"]}`)
                }
                else{
                    dataGet[name] = dataIn[name];
                }
            }
            data[data.boardNow].updateDataOrNot.sensor = true;
            // console.log(`Get sensor: ${dataIn}`);
        });
        socket.on("cmd-data" , (dataIn) => {
            data[dataIn.boardNumber].command.counter = dataIn.counter;
            data[dataIn.boardNumber].command.command = dataIn.command;
            data[data.boardNow].updateDataOrNot.command = true;
            // console.log(`Get command: ${dataIn}`)
        });
    }
}


(async () => {
    console.log("start");

    const { initSyncData } = await import(`../sync_data_client.js`);
    console.log("sync_data_client.js import success");

    console.log("connect to server success")

    data = initSyncData();
    data.boardNow = "";
    console.log(data);
    
    listBoardNumber();
    difBoard();

    console.log("list board available success")


    /* Start */
    const interval = setInterval(() => {
      if(data.boardNow != ""){

        if(!init){
          init = true;
          initWorkingPage();
        }
        console.log("Start New Board");

        // SENSOR
        const sensor_interval = setInterval(() => {
            if(data[data.boardNow].updateDataOrNot.sensor == true){
                data[data.boardNow].updateDataOrNot.sensor = false;

                update_workingPageSensor();

                console.log("update sensor data")
            }
        },100)

        console.log("Client UPDATE SENSOR success");

        // COMMAND
        const command_interval = setInterval(() => {
            if(data[data.boardNow].updateDataOrNot.command == true){
                data[data.boardNow].updateDataOrNot.command = false;

                update_workingPageCommand();

                console.log("update command data")
            }
        },100)

        console.log("Client UPDATE COMMAND success");

        event();
        
        console.log("Client setup event success");

        const visual_data = setInterval(() => {
            console.log("data:")
            console.log(data)
        },2000)
        
        clearInterval(interval);
      }
    },100);
})();
