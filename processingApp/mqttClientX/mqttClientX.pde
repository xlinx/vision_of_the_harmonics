import mqtt.*;

MQTTClient client;

void setup() {
  client = new MQTTClient(this);
  client.connect("wss://vision-of-the-harmonics:rdGwsbIuoNx2sQin@vision-of-the-harmonics.cloud.shiftr.io", "processing");
  client.subscribe("hello");
}

void draw() {}

void keyPressed() {
  client.publish("hello", "world");
}

void messageReceived(String topic, byte[] payload) {
  println( topic + ": " + new String(payload));
}