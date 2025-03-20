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
  }
  readyStatusX(){

    if(this.mqtt===undefined||!(this.mqtt.connected))
      return false;
    else
      return true
  }
  sendMsgX(msg,newTOPIC=this.TOPIC){
    if(this.mqtt===undefined){
      this.mqtt=this.initMQTT();
    }else{
      this.mqtt.publish(newTOPIC, msg);
    }
  }
  initMQTT(){
    let mqtt_client=this.mqtt
    if(this.maxReconnect>0){
      console.log("[MQTT][on open]this.ss.maxReconnect=",this.maxReconnect);
      mqtt_client= mqtt.connect(this.WHERE, {
        clientId: this.WSS_ID_RANDOM,
      });

      mqtt_client.on("connect", () => {
        mqtt_client.subscribe(this.TOPIC, (err) => {
          if (!err) {
            mqtt_client.publish(this.TOPIC, JSON.stringify({
              TS: Date.now(),
              WHO: "RC",
              TX: "INIT",
              ID: this.WSS_ID_RANDOM,
            }));
          }
        });
      });

      mqtt_client.on("message", (topic, message) => {
        // message is Buffer
        console.log(new Date().toISOString(),"MY_ID",this.WSS_ID_RANDOM,"RX",message.toString());
        this.callBack(message)
      });

    }
    this.maxReconnect--;
    return mqtt_client;


  }
}
