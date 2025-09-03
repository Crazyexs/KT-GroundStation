const { dir } = await import('../../dir_client.js');
const { id } = await import('../../id.js');
const { config } = await import(dir.config);

let data;

export function initializeGraph(){

}

export function createChart(){
    
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
            createChart(xLabel = xName,yLabel = yName)
        });
    });
}

export function shiftValue(){
    
}

export function deleteGrpah(){

}

export function updateChart(){
    
}

export function syncData_graph(dataIn){
    data = dataIn;
}