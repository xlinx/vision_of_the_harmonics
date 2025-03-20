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
    TabBar,
    Tag,
    Toast
} from 'antd-mobile';
import { Skeleton } from 'antd-mobile'
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


const useStore = create((set) => ({
    RX_JSON:{},RX_TS:0, WSs_IDs: new Set(),
    Songs:['望春風','蝴蝶','造飛機','三輪車跑得快','野玫瑰','鱒魚','倫敦鐵橋垮下來','歡樂頌'],
    setWSs_IDs: (rx_id) => set((state) => ({count: state.WSs_IDs.add(rx_id)})),
    status_allJson_TS: 0,
    chartDataFPS: [
        {year: '0:0:0', value: 0, type: 'fps'},
    ],
    inc: () => set((state) => ({count: state.count + 1})),
    bears: 0,
    MQTT_URL: "wss://vision-of-the-harmonics:rdGwsbIuoNx2sQin@vision-of-the-harmonics.cloud.shiftr.io",
    // MQTT_URL: "wss://harmonics:EPk0PLcYoHzdDKt8@public.cloud.shiftr.io",
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

let INIT_MQTT=true;
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
        useStore.getState().setWSs_IDs(J.ID );
        useStore.setState({RX_TS: Date.now()});
        useStore.getState().increaseFPSchart();

    } catch (e) {
        return console.error("[X][RC][on_msg_from_WSC]", data.toString(), e); // error in the above string (in this case, yes)!
    }
}

function clock1000() {
    if(INIT_MQTT){
        INIT_MQTT=false;
        const NOW=new Date();
        WSS_ID_RANDOM = "[AWS_LAMBDA][DECADE.TW]:" + NOW.getTime();
        websocketClientR = new WebsocketClientR(this, useStore.getState().MQTT_URL,WSS_ID_RANDOM, on_msg_from_WSC);

        console.log("[disable][decade.tw][module-websocket]" );
        console.log("[enable][decade.tw][module-mqtt]",useStore.getState().MQTT_URL );

        return
    }

    if (websocketClientR!==undefined&&websocketClientR.readyStatusX) {
        let outMsg = {
            TS: Date.now(),
            WHO: "RC",
            TX: "/CUE/WSS/ECHO",
            ID: WSS_ID_RANDOM,
        };
        websocketClientR.sendMsgX(  JSON.stringify(outMsg));
        useStore.setState({ws_readyStatus: websocketClientR.isReady});
    }
}


function WS_OK_NG_DOM() {
    const storeX = useStore((state) => state.ws_readyStatus)
    return (
        <div style={{'float': 'right', 'borderRadius': '6px', 'fontSize': '23px'}}>
            {storeX === 1 ? "✅" : "❌"}
        </div>
    );
}

function OK_NG_DOM() {
    const storeX = useStore((state) => state.status_allJson_TS)

    return (
        <div style={{'float': 'right', 'borderRadius': '6px', 'fontSize': '23px'}}>
            {Date.now() - storeX === 0 ? "✅" : "❌"}
        </div>
    );
}

class ButtonRC extends React.Component {
    constructor(props) {
        super(props);

        this.state = ({props: props, clickCount: 0})
        // this.handleClickRC = this.handleClickRC.bind(this)

    }

    handleClickRC = (e) => {
        console.log("[handleClickRC]", this.props);
        this.setState({clickCount: this.state.clickCount + 1})
        let d = {
            TX: "/CUE/SONG/" + this.props.id,
            WHO: "RC",
            ID: WSS_ID_RANDOM,
            TS: Date.now(),
        };
        let j = JSON.stringify(d);
        websocketClientR.sendMsgX(j);
    }

    render() {
        return (
            <Button onClick={this.handleClickRC} color={this.props.color} fill={this.props.fill} shape={this.props.shape}>
                {this.props.showText ? this.props.showText : this.props.id}
            </Button>
        )
    }
}





function FpsDOM() {
    // const storeX = useStore((state) => state.status_allJson);
    // const storeX2 = useStore((state) => state.status_allJson_TS);
    const { WSs_IDs, RX_TS } = useStore()

    // function updateFps() {
    //   setFps(ARG_INFO.fps);
    // }
    return (
        <span>

            { WSs_IDs.size >= 1 ? "✅" : "❌"} 遙控器人數:{ WSs_IDs.size} |
            {(Date.now() -  RX_TS) > 2000 ? "❌" : "✅"}延遲 {(Date.now() -  RX_TS) + "ms"}
    </span>
    );
};
const BottomNaviBar= () => {
    const history = useNavigate();
    const location = useLocation();
    const {pathname} = location;

    const setRouteActive = (value) => {
        history(value);
    }

    const tabs = [
        {
            key: '/home',
            title: 'Vision of The Harmonics',
            icon: <AppOutline/>,
        },
        {
            key: '/todo',
            title: 'Remote Control',
            icon: <UnorderedListOutline/>,
        },
        {
            key: '/message',
            title: 'Device Log',
            icon: <MessageOutline/>,
        },
        {
            key: '/me',
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
const imgss = ['https://d3d9mb8xdsbq52.cloudfront.net/s3/240508/104314tud.jpg',
    'https://d3d9mb8xdsbq52.cloudfront.net/s3/240508/104301erw.jpg',
    'https://d3d9mb8xdsbq52.cloudfront.net/s3/240508/104254nwz.jpg',
    'https://d3d9mb8xdsbq52.cloudfront.net/s3/240508/104402szw.jpg']
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

    return (
        <>
            <div className={'app2'}>
                <NavBar className={ 'top2'} back='' onBack={back} backArrow={false}>
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
                    Vision of The Harmonics {' | '+useStore().Songs.join(' | ')}
                </Marquee>} color='gray'/>


                <Routes>
                    <Route path='/home' element={<Home/>}/>
                    <Route path='/todo' element={<Todo/>}/>
                    <Route path='/message' element={<Message/>}/>
                    <Route path='/me' element={<PersonalCenter/>}/>
                    <Route path='*' element={<Home/>}/>
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



function Home(argod_fps) {
    return (<>
        <Divider>About Artwork</Divider>

        <Card
            icon={<AaOutline  style={{ color: '#fff' }} />}
            title={<div style={{ fontWeight: 'normal' }}>Vision of the Harmonics</div>}
            extra={<RightOutline />}
            onBodyClick={()=>{}}
            onHeaderClick={()=>{}}
            style={{ margin:'15px',borderRadius: '16px' }}
        >
            <div  >
                作品介紹BRABRA
                <Skeleton.Title animated />
                <Skeleton.Paragraph lineCount={8} animated />
            </div>
            <div className={{ 'paddingTop': '11px' ,
                'borderTop': '1px solid #e5e5e5' ,
                'display': 'flex' ,
                'justifyCcontent': 'flex-end',}} onClick={e => e.stopPropagation()}>

            </div>
        </Card>

        <Divider>Status Panel</Divider>
    </>)
}

function Todo() {
    const { Songs } = useStore()

    return <>
        <Divider>Control Status Info</Divider>
        <FpsDOM/>


        <Divider contentPosition='right'>今天想聽點甚麼呢?<HistogramOutline
            fontSize={32}/><Tag round color='#2db7f5' children={"NOW=> All"}/> </Divider>
        <Space wrap align='center' style={{'--gap': '3px'}}>
            {Songs.map((item, index) => {
                return <ButtonRC color='primary' key={'key_'+item} showText={item} id={'song_' + index}/>
                }
            )}

        </Space>
        <Divider contentPosition='right'>美食 | 兒童 | 環保 | 科技 | 族群 | 宗教 | 桃花 <PicturesOutline fontSize={32}/><Tag
            round color='#2db7f5' children={"NOW=> 美食"}/></Divider>
        <Space wrap style={{'--gap': '12px'}}>
            <ButtonRC color='warning' showText="V1" id="RC_VIDEO_1"/>
            <ButtonRC color='warning' showText="V2" id="RC_VIDEO_2"/>
            <ButtonRC color='warning' showText="V3" id="RC_VIDEO_3"/>
            <ButtonRC color='warning' showText="V4" id="RC_VIDEO_4"/>
            <ButtonRC color='warning' showText="V5" id="RC_VIDEO_5"/>
            <ButtonRC color='warning' showText="V6" id="RC_VIDEO_6"/>
        </Space>
        <Divider contentPosition='right'>早 | 中 | 午 | 晚 切換 <PieOutline fontSize={32}/> <Tag round color='#2db7f5'
                                                                                                 children={"NOW=> 早"}/></Divider>
        <Space wrap style={{'--gap': '24px'}}>
            <ButtonRC block shape='rounded' fill='outline' color='success' showText="早" id="RC_TIMEBK_green"/>
            <ButtonRC block shape='rounded' fill='outline' color='warning' showText="中" id="RC_TIMEBK_yellow"/>
            <ButtonRC block shape='rounded' fill='outline' color='warning' showText="午" id="RC_TIMEBK_orange"/>
            <ButtonRC block shape='rounded' fill='outline' color='danger' showText="晚" id="RC_TIMEBK_red"/>

        </Space>


    </>
}

function Message() {
    return <>
        <Divider>Log Panel - Connection</Divider>
        <LineChartX style={{background:'#fff'}}/>
        <Divider>Log Panel - MQTT</Divider>
        <iframe src="https://vision-of-the-harmonics.cloud.shiftr.io/embed?widgets=1" style={{transform: 'scale(1)'}} width="100%" height="500px"
                frameBorder="0"
                allowFullScreen></iframe>
        <Divider>Log Panel</Divider>

    </>
}

function PersonalCenter() {
    return <>
        <Divider>ARGod Setup</Divider>

        <List header='設定'>
            <List.Item extra={<Switch defaultChecked/>}>ENABLE RX</List.Item>
            <List.Item extra={<Switch defaultChecked/>}>ENABLE TX</List.Item>

            <List.Item extra='https://api.decade.tw/harmonics/' clickable>
                Vision of The Harmonics
            </List.Item>

        </List>
        <Form layout='vertical'>

            <Form.Item label='AccessToken' name='password'>
                <Input placeholder='DECADE' clearable type='password'/>
            </Form.Item>
        </Form>
        <Input placeholder='RemoteCommand' clearable/>
        {/*<ResultPage*/}
        {/*  status='success'*/}
        {/*  title='操作成功'*/}
        {/*  description='Connect to ARGod remote.'*/}
        {/*/>*/}
    </>

}

export default App;
