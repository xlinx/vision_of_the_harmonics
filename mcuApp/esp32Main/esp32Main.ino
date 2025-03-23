#ifdef ESP8266
 #include <ESP8266WiFi.h>  // Pins for board ESP8266 Wemos-NodeMCU
 #else
 #include <WiFi.h>
#endif
#include <ArduinoJson.h>
#include <PubSubClient.h>
#include <WiFiClientSecure.h>

//---- WiFi settings
const char* ssid = "BUBU";
const char* password = "29133824@";

//---- MQTT Broker settings
const char* mqtt_server = "56508c45f740420585b48a7a7e5333e7.s1.eu.hivemq.cloud"; // replace with your broker url
const char* mqtt_username = "YUJHENHUANG";
const char* mqtt_password = "Vv910404";
const int mqtt_port =8883;



WiFiClientSecure espClient;   // for no secure connection use WiFiClient instead of WiFiClientSecure
//WiFiClient espClient;
PubSubClient client(espClient);


#define MSG_BUFFER_SIZE	(50)
char msg[MSG_BUFFER_SIZE];


int sensor1 = 0;
float sensor2 = 0;
int command1 =0;
String clientId = "ESP32_"+String(random(0xffff), HEX);   // Create a random client ID


const char* sensor1_topic= "CMD";
// const char*  sensor2_topic="sensor2";
//const char*  sensor2_topic="sensor3";

const char* command1_topic="CMD";
//const char* command1_topic="command2";


unsigned long previousMillis = 0;
unsigned long previousMillis300=0,previousMillis1000=0,previousMillis2000=0;
int count_flashLED=0;
int whichSong=0;
StaticJsonDocument<512> doc;


static const char *root_ca PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4
WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu
ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY
MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc
h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+
0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U
A5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW
T8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH
B5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC
B5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv
KBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn
OlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn
jh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw
qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI
rU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV
HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq
hkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL
ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ
3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK
NFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5
ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur
TkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwdC
jNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZAJzVc
oyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq
4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPA
mRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57d
emyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1AnX5iItreGCc=
-----END CERTIFICATE-----
)EOF";


//==========================================
void setup_wifi() {
  delay(10);
  Serial.print("\nConnecting to ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  randomSeed(micros());
  Serial.println("\nWiFi connected\nIP address: ");
  Serial.println(WiFi.localIP());
}


//=====================================
void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");

    // Attempt to connect
    if (client.connect(clientId.c_str(), mqtt_username, mqtt_password)) {
      Serial.println("connected");

      client.subscribe(command1_topic);   // subscribe the topics here
      //client.subscribe(command2_topic);   // subscribe the topics here
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");   // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

String splitX(String data, char separator, int index){
    int found = 0;
    int strIndex[] = { 0, -1 };
    int maxIndex = data.length() - 1;
    for (int i = 0; i <= maxIndex && found <= index; i++) {
        if (data.charAt(i) == separator || i == maxIndex) {
            found++;
            strIndex[0] = strIndex[1] + 1;
            strIndex[1] = (i == maxIndex) ? i+1 : i;
        }
    }
    return found > index ? data.substring(strIndex[0], strIndex[1]) : "";
}


void parseJsonX(String inputXstr){
  DeserializationError error = deserializeJson(doc, inputXstr);
  JsonObject obj_Json = doc.as<JsonObject>();
  if (error) {
    Serial.print(F("deserializeJson() failed: "));
    Serial.println(error.f_str());
    return;
  }
  String CUE_STR=obj_Json[String("CUE")];
  String CUE_STR_SONG=splitX(CUE_STR,'/',2);
  String CUE_STR_WHICH=splitX(CUE_STR,'/',3); // /CUE/SONG/123
  if(CUE_STR_SONG=="SONG" && CUE_STR_WHICH.length()>0){
    whichSong=CUE_STR_WHICH.toInt();
    count_flashLED=(whichSong+1)*2;
    Serial.println(CUE_STR);
  }
    

}
void callback(char* topic, byte* payload, unsigned int length) {
  String incommingMessage = "";
  for (int i = 0; i < length; i++) incommingMessage+=(char)payload[i];

  Serial.println("[][DECADE][RX]TOPIC="+String(topic)+", VAL="+incommingMessage);
  if( strcmp(topic,command1_topic) == 0){
     parseJsonX(incommingMessage);
  }
}

void setup() {
  Serial.begin(115200);
  while (!Serial) delay(1);
  setup_wifi();
  pinMode(BUILTIN_LED, OUTPUT);     // Initialize the BUILTIN_LED pin as an output


  #ifdef ESP8266
    espClient.setInsecure();
  #else   // for the ESP32
    espClient.setCACert(root_ca);      // enable this line and the the "certificate" code for secure connection
  #endif

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}
void publishMessage(const char* topic, String payload , boolean retained){
  if (client.publish(topic, payload.c_str(), true))
      Serial.println("Message publised ["+String(topic)+"]: "+payload);
}
void send_heartBeat(){
    publishMessage(sensor1_topic,"{\"CUE\":\"/cue/MCU/"+clientId+"/"+String(millis())+"\"}",true);
}


void flashLED_byTime(){
  if(count_flashLED>=0){
    digitalWrite(BUILTIN_LED, count_flashLED%2==0?HIGH:LOW);
    count_flashLED--;
  }
}
void loop_300ms(unsigned long now) {
  if (now - previousMillis300 >= 100) {
    previousMillis300 = now;
    flashLED_byTime();
  }
}
void loop_2000ms(unsigned long now) {
  if (now - previousMillis2000 >= 2000) {
    previousMillis2000 = now;
    send_heartBeat();
  }
}
void loop_1000ms(unsigned long now) {
  if (now - previousMillis1000 >= 1000) {
    previousMillis1000 = now;
  }
}
void loop() {
  if (!client.connected()) reconnect();
    client.loop();

  loop_300ms(millis());
  loop_1000ms(millis());
  loop_2000ms(millis());

}

