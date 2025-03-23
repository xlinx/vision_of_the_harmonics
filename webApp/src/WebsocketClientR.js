import mqtt from 'mqtt';
export class WebsocketClientR {
  constructor(papa,WHERE,WSS_ID_RANDOM,callBack) {
    console.log("[WebsocketClientR][constructor]",papa );
    this.last_MSG_FROM_WSS="";
    this.PAPA=papa;
    this.callBack=callBack;
    this.maxReconnect=3;
    //this.connectInfo='ws://xwin.local:44444';//https://1922-42-72-107-66.ngrok-free.app/
    this.wss_server = window.location.host.toString().split(':')[0];
    this.WHERE = WHERE ;
    this.TOPIC='CMD';
    this.WSS_ID_RANDOM=WSS_ID_RANDOM
    this.mqttX=undefined
  }
  readyStatusX(){

    if(this.mqttX===undefined||!(this.mqttX.connected))
      return false;
    else
      return true
  }
  sendMsgX(msg,newTOPIC=this.TOPIC){
    if(this.mqttX===undefined){
      this.mqttX=this.initMQTT();
    }else{
      this.mqttX.publish(newTOPIC, msg);
    }
  }
  initMQTT(){
    if(this.maxReconnect>0){
      console.log("[MQTT][init]this.ss.maxReconnect=",this.maxReconnect);
      // if(this.WHERE.host.includes('shiftr.io')) {
      //   console.log("[MQTT][on connect][shiftr.io]",this.maxReconnect);
      //   this.mqttX = mqtt.connect(this.WHERE.host, {
      //     clientId: this.WSS_ID_RANDOM
      //   });
      // }else {
      //   console.log("[MQTT][on connect][hivemq]",this.maxReconnect);
      //   this.mqttX = mqtt.connect( this.WHERE);
      // }
      // if(this.WHERE.host.include(':')) {
      //   let hostx=this.WHERE.host.split(':')
      //   this.mqttX = mqtt.connect(hostx[0],parseInt(hostx[1]));
      //   console.log("[MQTT][connect][usingPort]",hostx[0],parseInt(hostx[1]));
      // }
      // else
        this.mqttX = mqtt.connect( this.WHERE.host);
      // this.mqttX = mqtt.connect({
      //   protocol: 'ws',
      //   host: 'mqttgo.io',
      //   port: 1883,
      // });

      this.mqttX.on("connect", () => {
        console.log('[MQTT]Connected',this.WHERE.host);

        this.mqttX.subscribe(this.TOPIC, (err) => {
          if (!err) {
            this.mqttX.publish(this.TOPIC, JSON.stringify({
              TS: Date.now(),
              WHO: "RC",
              TX: "INIT",
              ID: this.WSS_ID_RANDOM,
            }));
          }
        });
      });
      this.mqttX.on('error', function (error) {
        console.log('[MQTT]error',this.WHERE.host);
      });
      this.mqttX.on("message", (topic, message) => {
        // message is Buffer
        console.log(new Date().toISOString(),"MY_ID",this.WSS_ID_RANDOM,"RX",message.toString());
        this.callBack(message)
      });

    }
    this.maxReconnect--;
    return this.mqttX;


  }
}
