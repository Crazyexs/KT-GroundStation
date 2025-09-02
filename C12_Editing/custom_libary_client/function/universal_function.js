const key_state = ["STARTUP","IDLE_SAFE","ARMED","PAD_PREOP","POWERED","COASTING","DROG_DEPL","DROG_DESC","MAIN_DEPL","MAIN_DESC","LANDED","REC_SAFE"];
const allLabel = ["counter","state","gps_latitude","gps_longitude","apogee","last_ack","last_nack"];


/* Length text */
function length_text(label){
  switch(label){
    case 'state': return key_state.length; 
  }
  return 0;
}

/* Text to Key */
function text_to_key(label,text){
  switch(label){
    case 'state' :
      for(let i = 0;i < key_state.length;i++){
        if(key_state[i].toLowerCase() == text) { return i }
      }
      break;
  }
}
/* Key to Text */
function key_to_text(label,key){
  switch(label){
    case 'state' :
      return key_state[key];
      break;
    case 'pyro_a' || 'pyro_b' :
      return key_pyro[key];
      break;
  }
}

/* Value From Key*/
function getValueFromKey(key, data) {
  let value;
  switch (key) {
    case "counter":
      value = parseInt(data.counter, 10);
      break;
    case "state":
      value = text_to_key('state',data.state);
      break;
    case "gps_latitude":
      value = parseFloat(data.gps_latitude);
      break;
    case "gps_longitude":
      value = parseFloat(data.gps_longitude);
      break;
    case "apogee":
      value = parseFloat(data.apogee);
      break;
    case "last_ack":
      value = parseInt(data.last_ack, 10);
      break;
    case "last_nack":
      value = parseInt(data.last_nack, 10);
      break;
    default:
      value = null;
  }
  return value;
}

function getColorByState(state) {
  switch(state.toLowerCase()) {
    case 'startup':     return '#A9A9A9';
    case 'idle_safe':   return '#708090';
    case 'armed':       return '#FFD700';
    case 'pad_preop':   return '#FFA500';
    case 'powered':     return '#FF4500';
    case 'coasting':    return '#FF6347';
    case 'drog_depl':   return '#FF8C00';
    case 'drog_desc':   return '#FF7F50';
    case 'main_depl':   return '#DC143C';
    case 'main_desc':   return '#B22222';
    case 'landed':      return '#228B22';
    case 'rec_safe':    return '#2E8B57';
    default:            return '#000000'; // สีดำถ้าไม่ตรงกับ state ใดๆ
  }
}

/* Is value's label is text ot not */
function isText(label){
  if(label == 'state') { return 1; }
  return 0;
}
