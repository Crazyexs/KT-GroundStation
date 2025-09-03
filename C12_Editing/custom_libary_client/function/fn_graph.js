const { dir } = await import('../../dir_client.js');
const { id } = await import('../../id.js');
const { config } = await import(dir.config);

let data;

export function createChart(xValue,yValue,xMx=null ,xMn=null ,yMx=null ,yMn=null ,type="linear" ){
    var chartOptions = {
        chart: {
            height: 400,
            type: type,
            fontFamily: 'Helvetica, Arial, sans-serif',
            foreColor: '#6E729B',
            toolbar: {
            show: false,
            },
        },
        stroke: {
            curve: 'smooth',
            width: 2,
        },
        series: [
        ],
        title: {
            text: "Graph",
            align: 'left',
            offsetY: 25,
            offsetX: 5,
            style: {
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#373d3f',
            },
        },
        markers: {
            size: 6,
            strokeWidth: 0,
            hover: {
            size: 9,
            },
        },
        grid: {
            show: true,
            padding: {
            bottom: 0,
            },
        },
        labels: [],
        xaxis: {
            min: xMn,
            max: xMx,
            tooltip: {
            enabled: false,
            },
            categories: [1, 2, 3, 4, 5],
            title: {
            text: xValue,   // ✅ ชื่อแกน X
                style: {
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#555'
                }
            }
        },
        yaxis: {
            min: yMn,
            max: yMx,  
            title: {
                text: yValue,
                style: {
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#555'
                }
            }
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right',
            offsetY: -10,
            labels: {
            colors: '#373d3f',
            },
        },
        grid: {
            borderColor: '#D9DBF3',
            xaxis: {
            lines: {
                show: true,
            },
            },
        },
    };
    let title = `Graph Between ${xValue} and`;
    if(Array.isArray(yValue))
    {
        for(ySubValue of yValue){
            chartOptions.series.push({name:ySubValue, data:[]})
        }
        title += ` ${ySubValue},`
    }
    else
    {
        chartOptions.series.push({name:yValue, data:[]}) 
        title +=  ` ${yValue}`
        yValue = [yValue];
    }    
    chartOptions.title.text = title;
    const container = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 300;
    id.graph.container.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    var chart = new ApexCharts(ctx, chartOptions);

    data[data.boardNow].n_chart += 1;
    data[data.boardNow].charts.label.push({x:xValue,y:yValue})
    data[data.boardNow].charts.charts.push(chart);
}

export function initializeGraph(){
    let x, y, xMx, xMn, yMx, yMn,type;

    for (let valueGraph of data.setting.key[data.boardNow].plot) {
        x = valueGraph.x;
        y = valueGraph.y;

        // use optional chaining + nullish coalescing ??
        xMx = valueGraph?.xMx ?? null;   // default 0 if missing
        xMn = valueGraph?.xMn ?? null;
        yMx = valueGraph?.yMx ?? null;
        yMn = valueGraph?.yMn ?? null;

        type = valueGraph?.type ?? "linear";

        createChart(xValue=x,yValue=y,xMx=xMx,xMn=xMn,yMx=yMx,yMn=yMn,type=type);
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

    createChart(container,{xLabel: x, yLabel: y,xMin : xMn, xMax : xMx, yMin : yMn, yMax : yMx});
    id.graph.xMn.value = '';
    id.graph.xMx.value = '';
    id.graph.yMn.value = '';
    id.graph.yMx.value = '';
}

export function autoAddGraph(){
    data[data.boardNow].data_format.array.forEach(({xName,xType},index) => {
        data[data.boardNow].data_format.array.forEach(({yName,yType},index) => {
            if(xType != "TEXT" && yType != "TEXT"){
                createChart(xLabel = xName,yLabel = yName)
            }
        });
    });
}

export function shiftValue(){
    data.shiftValue = id.graph.shiftValue.placeholder;
}

export function deleteGrpah(){
    localStorage.clear();  // ลบข้อมูลทุก key ใน localStorage
}

export function updateChart(){
    dataChart = data[data.boardNow].sensor.dataIn;
    let index = 0;
    while(index < data.n_chart){
        let xValue = data[data.boardNow].charts[index].chartOptions.label
        let xTitle = data[data.boardNow].charts[index].chartOptions.xaxis.title.text;
        let yValue = data[data.boardNow].charts[index].chartOptions.series
        let len;
        for(let yName of Object.keys(yValue)){
            len = data[data.boardNow].sensor.dataIn[yName].lenght
            if(data.shiftValue < len){
                yValue[yName] = arr.slice(0,len)
            }
            else{
                yValue[yname] = arr.slice(len-shiftValue,len)
            }
        }
        len = data[data.boardNow].sensor.dataIn[xTitle].lenght;
        if(data.shiftValue < len){
            xValue = arr.slice(0,len)
        }
        else{
            xValue = arr.slice(len-shiftValue,len)
        }
    }
}

export function syncData_graph(dataIn){
    data = dataIn;
}