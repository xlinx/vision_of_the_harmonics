import React, {useEffect, useRef, useState} from 'react'
import {create} from 'zustand';
import {Route, Routes, useLocation, useNavigate,} from 'react-router-dom'
import {
    Button, Card,
    Divider,
    FloatingPanel,
    Form,
    Input,
    List,
    NavBar,
    NoticeBar,
    Space,
    Swiper,
    Switch,
    TabBar, Selector,
    Tag, TextArea,
    Toast, Grid
} from 'antd-mobile';
import {Skeleton} from 'antd-mobile'
import {
    AaOutline,
    AntOutline,
    AppOutline,
    HistogramOutline,
    MessageOutline,
    PicturesOutline,
    PieOutline, RightOutline,
    UnorderedListOutline,
    UserOutline,
} from 'antd-mobile-icons'
import Marquee from 'react-fast-marquee';
import {Line} from "@ant-design/charts";
import {WebsocketClientR} from "./WebsocketClientR.js";
import * as Tone from "tone";
import 'react-piano/dist/styles.css';
import {Piano, KeyboardShortcuts, MidiNumbers} from 'react-piano';
import {QRCode} from 'antd';

const firstNote = MidiNumbers.fromNote('c3');
const lastNote = MidiNumbers.fromNote('f5');
const keyboardShortcuts = KeyboardShortcuts.create({
    firstNote: firstNote,
    lastNote: lastNote,
    keyboardConfig: KeyboardShortcuts.HOME_ROW,
});
const aaa={a:'',aa:''};
const MQTT_OPTIONS_shiftr= {
    host:  "wss://vision-of-the-harmonics:rdGwsbIuoNx2sQin@vision-of-the-harmonics.cloud.shiftr.io"
}
const MQTT_OPTIONS_hivemq= {
    host: "wss://YUJHENHUANG:Vv910404@56508c45f740420585b48a7a7e5333e7.s1.eu.hivemq.cloud:8884/mqtt",
}
const MQTT_OPTIONS_mqttgo= {
    host: "ws://mqttgo.io:1883",
}

const doremi = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']
const synth = new Tone.Synth().toDestination();

const useStore = create((set) => ({
    RX_JSON: {}, RX_TS: 0, WSs_IDs: new Set(),
    Songs: ['望春風', '蝴蝶', '造飛機', '三輪車跑得快', '野玫瑰', '鱒魚', '倫敦鐵橋垮下來', '歡樂頌'],
    WhichSongIndex: -1,
    setWSs_IDs: (rx_id) => set((state) => ({count: state.WSs_IDs.add(rx_id)})),
    status_allJson_TS: 0,
    MCU_ID:'',
    MCU_TS:'',
    MCU_ALIVE:false,
    toggle_MCU_ALIVE: () => set((state) => ({MCU_ALIVE: !state.MCU_ALIVE})),
    chartDataFPS: [
        {year: '0:0:0', value: 0, type: 'fps'},
    ],
    inc: () => set((state) => ({count: state.count + 1})),
    bears: 0,
    MQTT_OPTIONS:MQTT_OPTIONS_hivemq,
    ws_readyStatus: -2,
    increaseFPSchart: () => set((state) => ({
        chartDataFPS: [
            ...state.chartDataFPS,
            {
                type: 'fps',
                year: new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds(),
                value: state.status_FPS
            }
        ]
    })),
    setData: () => set({bears: 0}),
    updateBears: (newBears) => set({bears: newBears}),
}));

let INIT_MQTT = true;
let websocketClientR = undefined;
let WSS_ID_RANDOM = "9999";
setInterval(clock1000, 1000);

function on_msg_from_WSC(data) {
    // console.log("[RC][on_msg_from_WSC]",data);
    try {
        // ARG_INFO.FPS=data2JSON.FPS;
        // ARG_INFO.WSs=data2JSON.WSs;
        let J = JSON.parse(data);

        useStore.setState({RX_JSON: J});
        useStore.getState().setWSs_IDs(J.ID);
        useStore.setState({RX_TS: Date.now()});
        useStore.getState().increaseFPSchart();
        if(J.hasOwnProperty('CUE')&&J['CUE'].split('/')[2]==='SONG'){
            let cued_song_index=parseInt(J['CUE'].split('/')[3])
            useStore.setState({WhichSongIndex: cued_song_index});
        }else if(J.hasOwnProperty('CUE')&&J['CUE'].split('/')[2]==='MCU'){
            let mcu_info=J['CUE'].split('/')
            useStore.setState({MCU_ID: mcu_info[3]});
            useStore.setState({MCU_TS: mcu_info[4]});
            useStore.getState().toggle_MCU_ALIVE();

        }

    } catch (e) {
        return console.error("[X][RC][on_msg_from_WSC]", data.toString(), e); // error in the above string (in this case, yes)!
    }
}

function clock1000() {
    if (INIT_MQTT) {
        INIT_MQTT = false;
        const NOW = new Date();
        WSS_ID_RANDOM = "[AWS_LAMBDA][DECADE.TW]:" + NOW.getTime();
        websocketClientR = new WebsocketClientR(this, useStore.getState().MQTT_OPTIONS, WSS_ID_RANDOM, on_msg_from_WSC);

        console.log("[disable][decade.tw][module-websocket]");
        console.log("[enable][decade.tw][module-mqtt]", useStore.getState().MQTT_OPTIONS);

        return
    }

    if (websocketClientR !== undefined && websocketClientR.readyStatusX) {
        let outMsg = {
            TS: Date.now(),
            WHO: "RC",
            CUE: "/CUE/WSS/ECHO",
            ID: WSS_ID_RANDOM,
        };
        websocketClientR.sendMsgX(JSON.stringify(outMsg));
        useStore.setState({ws_readyStatus: websocketClientR.isReady});
    }
}

function handleClickRC(e) {
    // let index=useStore.getState().Songs.findIndex((w)=>{return w===e[0]})
    let index = parseInt(e[0])
    console.log("[handleClickRC]", e, index);
    useStore.setState({WhichSongIndex: index});

    let d = {
        CUE: "/CUE/SONG/" + index,
        WHO: "RC",
        ID: WSS_ID_RANDOM,
        TS: Date.now(),
    };
    let j = JSON.stringify(d);
    websocketClientR.sendMsgX(j);
    synth.triggerAttackRelease(doremi[index], "8n");
}

function ButtonRC() {
    // constructor(props) {
    //     super(props);
    //     this.state = ({props: props, clickCount: 0})
    // }
    return (
        <>
            {/*// <Button style={{'width': '99%'}} size={"large"} onClick={this.handleClickRC} color={this.props.color} fill={this.props.fill} shape={this.props.shape}>*/}
            {/*//     {this.props.showText ? this.props.showText : this.props.id}*/}
            {/*// </Button>*/}
            <Selector style={{
                '--border-radius': '10px',
                '--border': 'solid transparent 1px',
                '--checked-border': 'solid var(--adm-color-primary) 1px',
                '--padding': '8px 24px',
                '--color': 'var(--adm-color-primary)',

            }}
                      value={[useStore.getState().WhichSongIndex]}
                      columns={1}
                      multiple={false}
                      showCheckMark={true}
                      options={
                          useStore.getState().Songs.map((e, index) => {
                                  return {label: e, value: index}
                              }
                          )}
                      onChange={(e) => handleClickRC(e)}>

            </Selector>
        </>
    );

}


function FpsDOM() {
    const {WSs_IDs, RX_TS} = useStore()

    // function updateFps() {
    //   setFps(ARG_INFO.fps);
    // }
    return (
        <span>
            {useStore.getState().MCU_ALIVE ? "🔼" : "🔽"} MCU {useStore.getState().MCU_ID}@{useStore.getState().MCU_TS} |
            {WSs_IDs.size >= 1 ? "✅" : "❌"} 遙控器人數:{WSs_IDs.size} |
            {(Date.now() - RX_TS) > 2000 ? "❌" : "✅"}延遲 {(Date.now() - RX_TS) + "ms "+useStore.getState().MQTT_OPTIONS.host.split('@')[0].split(':')[1].replaceAll('//','')}
    </span>
    );
};
const BottomNaviBar = () => {
    const history = useNavigate();
    const location = useLocation();
    const {pathname} = location;

    const setRouteActive = (value) => {
        history(value);
    }

    const tabs = [
        {
            key: '/tab1',
            title: 'Vision of The Harmonics',
            icon: <AppOutline/>,
        },
        {
            key: '/tab2',
            title: 'Remote Control',
            icon: <UnorderedListOutline/>,
        },
        {
            key: '/tab3',
            title: 'Device Log',
            icon: <MessageOutline/>,
        },
        {
            key: '/tab4',
            title: 'Special',
            icon: <UserOutline/>,
        },
    ]

    return (
        <TabBar safeArea={true} activeKey={pathname} onChange={value => setRouteActive(value)}>
            {tabs.map(item => (
                <TabBar.Item key={item.key} icon={item.icon} title={item.title}/>
            ))}
        </TabBar>
    )
};
const back = () =>
    Toast.show({
        content: 'Vision of The Harmonics - Control Center',
        duration: 1000,
    });


const colors = ['#ace0ff', '#bcffbd', '#e4fabd', '#ffcfac'];
const imgss = ['https://i.imgur.com/pfM7bQf.png',
    'https://i.imgur.com/V56jNyM.png',
    'https://i.imgur.com/u7rA2rC.png',
    'https://i.imgur.com/LOid4rn.png']
const items = colors.map((color, index) => (
    <Swiper.Item key={index}>
        <div
            style={{'height': '100px'}}
            onClick={() => {
                Toast.show(`pick ${index + 1}`)
            }}
        >
            <img alt="xlinx" src={imgss[index]} style={{'width': '100%', 'backgroundPositionY': 'center'}}></img>
            {index + 1}
        </div>
    </Swiper.Item>
));

const LineChartX = () => {
    const data = useStore((state) => state.chartDataFPS)
    if (data.length > 10)
        data.shift();
    const config = {
        data,
        // title: {
        //     visible: true,
        //     text: 'info',
        // },
        height: 200,
        xField: 'year',
        yField: 'value',
        type: 'view',
        children: [
            {type: "line", encode: {shape: "smooth"}},
            {type: "point", encode: {shape: "point"}, tooltip: true},
        ],
        encode: {x: "year", y: "value", color: "red", shape: "hvh", series: () => undefined},
        axis: {y: {labelFormatter: (d) => d + "fps/sec"}},
        scale: {x: {utc: true}, y: {nice: true}, color: {palette: "turbo"}},
        style: {gradient: "y", lineWidth: 2, lineJoin: "round"},
        autoFit: true,

    };
    return <Line {...config} />;
};

function App() {
    document.documentElement.setAttribute(
        'data-prefers-color-scheme',
        'dark'
    );
    const [argod_fps] = useState({fps: -1, x: 0, y: 0});
    const RadioMode = () => {
        const [value, setValue] = useState('1')
        return (
            <Selector
                options={options}
                value={[value]}
                onChange={v => {
                    if (v.length) {
                        setValue(v[0])
                    }
                }}
            />
        )
    }
    return (
        <>
            <div className={'app2'}>
                <NavBar className={'top2'} back='' onBack={back} backArrow={false}>
                    Vision of The Harmonics
                </NavBar>

                <Swiper
                    loop
                    autoplay
                    onIndexChange={i => {
                        // console.log(i, 'onIndexChange1')
                    }}
                    style={{
                        '--border-radius': '81px',
                    }}
                >
                    ${argod_fps.fps}
                    {items}
                </Swiper>
                <NoticeBar content={<Marquee gradient={false}>
                    Vision of The Harmonics {' | ' + useStore().Songs.join(' | ')}
                </Marquee>} color='gray'/>


                <Routes>
                    <Route path='/tab1' element={<Tab1/>}/>
                    <Route path='/tab2' element={<Tab2/>}/>
                    <Route path='/tab3' element={<Tab3/>}/>
                    <Route path='/tab4' element={<Tab4/>}/>
                    <Route path='*' element={<Tab2/>}/>
                    {/*<Route path='/notfound' element={<NoFound/>}/>*/}
                </Routes>
                <FloatingPanel anchors={[window.innerHeight * 0.1]}>
                    {/*<div className={styles.footer2}>*/}
                    <BottomNaviBar/>
                    {/*<Link to='/home'>*/}
                    {/*  <Footer label='ARGod InfoVis - Control Center v.202405'></Footer>*/}
                    {/*</Link>*/}
                    {/*</div>*/}
                </FloatingPanel>
            </div>

        </>
    )
}


function Tab1() {
    return (<>
        <Divider>About Artwork</Divider>

        <Card
            icon={<AaOutline style={{color: '#fff'}}/>}
            title={<div style={{fontWeight: 'normal'}}>作品介紹 - 異象音列</div>}
            extra={<RightOutline/>}
            onBodyClick={() => {
            }}
            onHeaderClick={() => {
            }}
            style={{margin: '15px', borderRadius: '16px'}}
        >
            <div>
                <Divider>Vision of the Harmonics</Divider>
                此作品名為異象音列，在創作過程中研究3D列印機及步進馬達的機械噪音，整理出機器運作時，其機械噪音之音高的規律和限制。利用事先建模及編程的方式控制機械噪音，讓機器演奏大家耳熟能詳的經典樂句。觀看作品時，觀眾可在桌面上掃描QRCode，進入網站選取您喜歡的歌曲。
                <Divider style={{borderColor: '#7cb305',borderStyle: 'dashed'}}></Divider>
                過去的作品我都在試著挑戰音樂和聲音藝術的界線，當作品出現機械噪音、沒有音高時，狹義上會將作品歸類為聲音藝術。當作品有了音高、旋律、調性、曲式等等的這些規則，作品就被歸類到了音樂的範疇。那麼如果作品是機械噪音，同時演奏出了耳熟能詳的作品時，又該怎麼區別呢？又或者說，約翰凱基的4：33秒，長時間的寂靜無聲都可以是音樂，那大家認為的聲音藝術能不能是音樂呢？
                {/*<Skeleton.Title animated/>*/}
            </div>
            <div className={{
                'paddingTop': '11px',
                'borderTop': '1px solid #e5e5e5',
                'display': 'flex',
                'justifyCcontent': 'flex-end',
            }} onClick={e => e.stopPropagation()}>

            </div>
        </Card>

        <Divider></Divider>
    </>)
}

function Tab2() {

    return <>
        <FpsDOM/>


        {/*<Divider contentPosition='right'>今天想聽點甚麼呢?<HistogramOutline fontSize={22}/> </Divider>*/}
        <Card
            icon={<AaOutline style={{color: '#fff'}}/>}
            title={<div style={{fontWeight: 'normal'}}>今天想聽點甚麼呢?</div>}
            extra={<RightOutline/>}
            onBodyClick={() => {
            }}
            onHeaderClick={() => {
            }}
            style={{margin: '15px', borderRadius: '16px'}}
        >
            <Grid columns={1} gap={10}>

                <ButtonRC/>
                {/*{Songs.map((item, index) => {*/}
                {/*        return <ButtonRC color='primary' key={'key_'+item} showText={item} id={'song_' + index}/>*/}
                {/*    }*/}
                {/*)}*/}

            </Grid>
        </Card>
        <Divider contentPosition='right'> </Divider>
        <Piano
            noteRange={{first: firstNote, last: lastNote}}
            playNote={(midiNumber) => {
                // Play a given note - see notes below
            }}
            stopNote={(midiNumber) => {
                // Stop playing a given note - see notes below
            }}
            // widthth={"100%"}

            keyboardShortcuts={keyboardShortcuts}
        />
    </>
}

function Tab3() {
    return <>

        {/*<LineChartX style={{background:'#fff'}}/>*/}
        <Divider>Log Panel - MQTT</Divider>
        <iframe src="https://vision-of-the-harmonics.cloud.shiftr.io/embed?widgets=1" style={{transform: 'scale(1)'}}
                width="100%" height="500px"
                frameBorder="0"
                allowFullScreen></iframe>
        <Divider>Log Panel</Divider>
        <Card
            icon={<AaOutline style={{color: '#fff'}}/>}
            title={<div style={{fontWeight: 'normal'}}>Vision of the Harmonics</div>}
            extra={<RightOutline/>}
            onBodyClick={() => {
            }}
            onHeaderClick={() => {
            }}
            style={{margin: '15px', borderRadius: '16px'}}
        >
            <TextArea>{JSON.stringify(useStore().RX_JSON)}</TextArea>
        </Card>
    </>
}

function Tab4() {
    const [text, setText] = useState('https://api.decade.tw/harmonics');

    return <>
        <Divider>ARGod Setup</Divider>
        <Card
            icon={<AaOutline style={{color: '#fff'}}/>}
            title={<div style={{fontWeight: 'normal'}}>QR COde</div>}
            extra={<RightOutline/>}
            onBodyClick={() => {
            }}
            onHeaderClick={() => {
            }}
            style={{margin: '15px', borderRadius: '16px'}}
        >
            {/*<Space direction={"vertical"}>*/}
                <QRCode style={{"backgroundColor": "white"}} value={text || '-'}/>
                <Input
                    style={{width: '100%'}}
                    placeholder="-"
                    maxLength={160}
                    value={text}
                    onChange={(e) => setText(e)}
                />
            {/*</Space>*/}
        </Card>

        <List header='設定'>
            <List.Item extra={<Switch defaultChecked/>}>ENABLE RX/TX</List.Item>


            <List.Item extra='https://api.decade.tw/harmonics/' clickable>
                Vision of The Harmonics
            </List.Item>

        </List>
        <Form layout='vertical'>

            <Form.Item label='AccessToken' name='password'>
                <Input placeholder='DECADE' clearable type='password'/>
            </Form.Item>
        </Form>
        <TextArea warp placeholder='RemoteCommand' value={JSON.stringify(useStore().RX_JSON)} clearable>

        </TextArea>
        {/*<ResultPage*/}
        {/*  status='success'*/}
        {/*  title='操作成功'*/}
        {/*  description='Connect to ARGod remote.'*/}
        {/*/>*/}
    </>

}

export default App;
