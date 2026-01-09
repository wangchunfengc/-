if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface Index_Params {
    msgHistory?: string;
    localPort?: number;
    targetIp?: string;
    targetPort?: number;
    timerId?: number;
    timeTimerId?: number;
    sendInterval?: number;
    medicines?: Medicine[];
    sendPosition?: number;
    sendName?: string;
    sendDosage?: string;
    sendTime?: string;
    scroller?: Scroller;
    mainScroller?: Scroller;
}
import socket from "@ohos:net.socket";
import wifiManager from "@ohos:wifiManager";
import systemDateTime from "@ohos:systemDateTime";
import util from "@ohos:util";
// 执行UDP通讯的对象
let udpSocket = socket.constructUDPSocketInstance();
// 本地IP的数值形式
let ipNum = wifiManager.getIpInfo().ipAddress;
// 本地IP的字符串形式
let localIp = (ipNum >>> 24) + '.' + (ipNum >> 16 & 0xFF) + '.' + (ipNum >> 8 & 0xFF) + '.' + (ipNum & 0xFF);
// 药品数据结构
interface Medicine {
    position: number;
    name: string;
    dosage: string;
    time: string;
}
class Index extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__msgHistory = new ObservedPropertySimplePU(''
        // 本地端口
        , this, "msgHistory");
        this.__localPort = new ObservedPropertySimplePU(9990
        // 目的IP地址
        , this, "localPort");
        this.__targetIp = new ObservedPropertySimplePU("192.168.45.34"
        // 目的端口
        , this, "targetIp");
        this.__targetPort = new ObservedPropertySimplePU(6666
        // 定时器ID
        , this, "targetPort");
        this.__timerId = new ObservedPropertySimplePU(0
        // 时间定时器ID
        , this, "timerId");
        this.__timeTimerId = new ObservedPropertySimplePU(0
        // 发送间隔（毫秒）
        , this, "timeTimerId");
        this.__sendInterval = new ObservedPropertySimplePU(1000
        // 药品列表
        , this, "sendInterval");
        this.__medicines = new ObservedPropertyObjectPU([
            { position: 1, name: "未设置", dosage: "未设置", time: "未设置" },
            { position: 2, name: "未设置", dosage: "未设置", time: "未设置" },
            { position: 3, name: "未设置", dosage: "未设置", time: "未设置" },
            { position: 4, name: "未设置", dosage: "未设置", time: "未设置" }
        ]
        // 发送的药品信息
        , this, "medicines");
        this.__sendPosition = new ObservedPropertySimplePU(1, this, "sendPosition");
        this.__sendName = new ObservedPropertySimplePU('', this, "sendName");
        this.__sendDosage = new ObservedPropertySimplePU('', this, "sendDosage");
        this.__sendTime = new ObservedPropertySimplePU('', this, "sendTime");
        this.scroller = new Scroller();
        this.mainScroller = new Scroller();
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: Index_Params) {
        if (params.msgHistory !== undefined) {
            this.msgHistory = params.msgHistory;
        }
        if (params.localPort !== undefined) {
            this.localPort = params.localPort;
        }
        if (params.targetIp !== undefined) {
            this.targetIp = params.targetIp;
        }
        if (params.targetPort !== undefined) {
            this.targetPort = params.targetPort;
        }
        if (params.timerId !== undefined) {
            this.timerId = params.timerId;
        }
        if (params.timeTimerId !== undefined) {
            this.timeTimerId = params.timeTimerId;
        }
        if (params.sendInterval !== undefined) {
            this.sendInterval = params.sendInterval;
        }
        if (params.medicines !== undefined) {
            this.medicines = params.medicines;
        }
        if (params.sendPosition !== undefined) {
            this.sendPosition = params.sendPosition;
        }
        if (params.sendName !== undefined) {
            this.sendName = params.sendName;
        }
        if (params.sendDosage !== undefined) {
            this.sendDosage = params.sendDosage;
        }
        if (params.sendTime !== undefined) {
            this.sendTime = params.sendTime;
        }
        if (params.scroller !== undefined) {
            this.scroller = params.scroller;
        }
        if (params.mainScroller !== undefined) {
            this.mainScroller = params.mainScroller;
        }
    }
    updateStateVars(params: Index_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__msgHistory.purgeDependencyOnElmtId(rmElmtId);
        this.__localPort.purgeDependencyOnElmtId(rmElmtId);
        this.__targetIp.purgeDependencyOnElmtId(rmElmtId);
        this.__targetPort.purgeDependencyOnElmtId(rmElmtId);
        this.__timerId.purgeDependencyOnElmtId(rmElmtId);
        this.__timeTimerId.purgeDependencyOnElmtId(rmElmtId);
        this.__sendInterval.purgeDependencyOnElmtId(rmElmtId);
        this.__medicines.purgeDependencyOnElmtId(rmElmtId);
        this.__sendPosition.purgeDependencyOnElmtId(rmElmtId);
        this.__sendName.purgeDependencyOnElmtId(rmElmtId);
        this.__sendDosage.purgeDependencyOnElmtId(rmElmtId);
        this.__sendTime.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__msgHistory.aboutToBeDeleted();
        this.__localPort.aboutToBeDeleted();
        this.__targetIp.aboutToBeDeleted();
        this.__targetPort.aboutToBeDeleted();
        this.__timerId.aboutToBeDeleted();
        this.__timeTimerId.aboutToBeDeleted();
        this.__sendInterval.aboutToBeDeleted();
        this.__medicines.aboutToBeDeleted();
        this.__sendPosition.aboutToBeDeleted();
        this.__sendName.aboutToBeDeleted();
        this.__sendDosage.aboutToBeDeleted();
        this.__sendTime.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    // 连接、通讯历史记录
    private __msgHistory: ObservedPropertySimplePU<string>;
    get msgHistory() {
        return this.__msgHistory.get();
    }
    set msgHistory(newValue: string) {
        this.__msgHistory.set(newValue);
    }
    // 本地端口
    private __localPort: ObservedPropertySimplePU<number>;
    get localPort() {
        return this.__localPort.get();
    }
    set localPort(newValue: number) {
        this.__localPort.set(newValue);
    }
    // 目的IP地址
    private __targetIp: ObservedPropertySimplePU<string>;
    get targetIp() {
        return this.__targetIp.get();
    }
    set targetIp(newValue: string) {
        this.__targetIp.set(newValue);
    }
    // 目的端口
    private __targetPort: ObservedPropertySimplePU<number>;
    get targetPort() {
        return this.__targetPort.get();
    }
    set targetPort(newValue: number) {
        this.__targetPort.set(newValue);
    }
    // 定时器ID
    private __timerId: ObservedPropertySimplePU<number>;
    get timerId() {
        return this.__timerId.get();
    }
    set timerId(newValue: number) {
        this.__timerId.set(newValue);
    }
    // 时间定时器ID
    private __timeTimerId: ObservedPropertySimplePU<number>;
    get timeTimerId() {
        return this.__timeTimerId.get();
    }
    set timeTimerId(newValue: number) {
        this.__timeTimerId.set(newValue);
    }
    // 发送间隔（毫秒）
    private __sendInterval: ObservedPropertySimplePU<number>;
    get sendInterval() {
        return this.__sendInterval.get();
    }
    set sendInterval(newValue: number) {
        this.__sendInterval.set(newValue);
    }
    // 药品列表
    private __medicines: ObservedPropertyObjectPU<Medicine[]>;
    get medicines() {
        return this.__medicines.get();
    }
    set medicines(newValue: Medicine[]) {
        this.__medicines.set(newValue);
    }
    // 发送的药品信息
    private __sendPosition: ObservedPropertySimplePU<number>;
    get sendPosition() {
        return this.__sendPosition.get();
    }
    set sendPosition(newValue: number) {
        this.__sendPosition.set(newValue);
    }
    private __sendName: ObservedPropertySimplePU<string>;
    get sendName() {
        return this.__sendName.get();
    }
    set sendName(newValue: string) {
        this.__sendName.set(newValue);
    }
    private __sendDosage: ObservedPropertySimplePU<string>;
    get sendDosage() {
        return this.__sendDosage.get();
    }
    set sendDosage(newValue: string) {
        this.__sendDosage.set(newValue);
    }
    private __sendTime: ObservedPropertySimplePU<string>;
    get sendTime() {
        return this.__sendTime.get();
    }
    set sendTime(newValue: string) {
        this.__sendTime.set(newValue);
    }
    private scroller: Scroller;
    private mainScroller: Scroller;
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.height('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
            Column.height('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 主滚动区域 - 包裹整个内容
            Scroll.create(this.mainScroller);
            // 主滚动区域 - 包裹整个内容
            Scroll.width('100%');
            // 主滚动区域 - 包裹整个内容
            Scroll.height('100%');
            // 主滚动区域 - 包裹整个内容
            Scroll.scrollable(ScrollDirection.Vertical);
            // 主滚动区域 - 包裹整个内容
            Scroll.scrollBar(BarState.On);
            // 主滚动区域 - 包裹整个内容
            Scroll.scrollBarWidth(20);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // UDP通讯部分
            Text.create("药品管理UDP通讯");
            // UDP通讯部分
            Text.fontSize(16);
            // UDP通讯部分
            Text.fontWeight(FontWeight.Bold);
            // UDP通讯部分
            Text.width('100%');
            // UDP通讯部分
            Text.textAlign(TextAlign.Center);
            // UDP通讯部分
            Text.padding(10);
        }, Text);
        // UDP通讯部分
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Flex.create({ justifyContent: FlexAlign.Start, alignItems: ItemAlign.Center });
            Flex.width('100%');
            Flex.padding(10);
        }, Flex);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("本地IP和端口：");
            Text.width(110);
            Text.fontSize(14);
            Text.flexGrow(0);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(localIp);
            Text.width(80);
            Text.fontSize(14);
            Text.flexGrow(0);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ text: this.localPort.toString() });
            TextInput.type(InputType.Number);
            TextInput.onChange((value) => {
                this.localPort = parseInt(value);
            });
            TextInput.width(100);
            TextInput.flexGrow(3);
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel("绑定");
            Button.onClick(() => {
                this.bind2Port();
            });
            Button.width(80);
            Button.fontSize(14);
            Button.flexGrow(0);
        }, Button);
        Button.pop();
        Flex.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 药品信息显示区域 - 4个药仓
            Text.create("药品信息 (4个药仓)");
            // 药品信息显示区域 - 4个药仓
            Text.fontSize(18);
            // 药品信息显示区域 - 4个药仓
            Text.fontWeight(FontWeight.Bold);
            // 药品信息显示区域 - 4个药仓
            Text.width('100%');
            // 药品信息显示区域 - 4个药仓
            Text.textAlign(TextAlign.Center);
            // 药品信息显示区域 - 4个药仓
            Text.padding(10);
        }, Text);
        // 药品信息显示区域 - 4个药仓
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 第一行：药仓1和药仓2
            Row.create();
            // 第一行：药仓1和药仓2
            Row.width('100%');
            // 第一行：药仓1和药仓2
            Row.margin({ bottom: 10 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 药仓1
            Column.create();
            // 药仓1
            Column.width('48%');
            // 药仓1
            Column.padding(15);
            // 药仓1
            Column.backgroundColor(0xF5F5F5);
            // 药仓1
            Column.borderRadius(10);
            // 药仓1
            Column.margin({ right: '2%' });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("药仓1");
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.margin({ bottom: 5 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.margin({ bottom: 5 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('药品:');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.width(60);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.medicines[0].name);
            Text.fontSize(16);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.margin({ bottom: 5 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('剂量:');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.width(60);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.medicines[0].dosage);
            Text.fontSize(16);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('时间:');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.width(60);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.medicines[0].time);
            Text.fontSize(16);
        }, Text);
        Text.pop();
        Row.pop();
        // 药仓1
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 药仓2
            Column.create();
            // 药仓2
            Column.width('48%');
            // 药仓2
            Column.padding(15);
            // 药仓2
            Column.backgroundColor(0xF5F5F5);
            // 药仓2
            Column.borderRadius(10);
            // 药仓2
            Column.margin({ left: '2%' });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("药仓2");
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.margin({ bottom: 5 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.margin({ bottom: 5 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('药品:');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.width(60);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.medicines[1].name);
            Text.fontSize(16);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.margin({ bottom: 5 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('剂量:');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.width(60);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.medicines[1].dosage);
            Text.fontSize(16);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('时间:');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.width(60);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.medicines[1].time);
            Text.fontSize(16);
        }, Text);
        Text.pop();
        Row.pop();
        // 药仓2
        Column.pop();
        // 第一行：药仓1和药仓2
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 第二行：药仓3和药仓4
            Row.create();
            // 第二行：药仓3和药仓4
            Row.width('100%');
            // 第二行：药仓3和药仓4
            Row.margin({ bottom: 10 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 药仓3
            Column.create();
            // 药仓3
            Column.width('48%');
            // 药仓3
            Column.padding(15);
            // 药仓3
            Column.backgroundColor(0xF5F5F5);
            // 药仓3
            Column.borderRadius(10);
            // 药仓3
            Column.margin({ right: '2%' });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("药仓3");
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.margin({ bottom: 5 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.margin({ bottom: 5 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('药品:');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.width(60);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.medicines[2].name);
            Text.fontSize(16);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.margin({ bottom: 5 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('剂量:');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.width(60);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.medicines[2].dosage);
            Text.fontSize(16);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('时间:');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.width(60);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.medicines[2].time);
            Text.fontSize(16);
        }, Text);
        Text.pop();
        Row.pop();
        // 药仓3
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 药仓4
            Column.create();
            // 药仓4
            Column.width('48%');
            // 药仓4
            Column.padding(15);
            // 药仓4
            Column.backgroundColor(0xF5F5F5);
            // 药仓4
            Column.borderRadius(10);
            // 药仓4
            Column.margin({ left: '2%' });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("药仓4");
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.margin({ bottom: 5 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.margin({ bottom: 5 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('药品:');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.width(60);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.medicines[3].name);
            Text.fontSize(16);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.margin({ bottom: 5 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('剂量:');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.width(60);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.medicines[3].dosage);
            Text.fontSize(16);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('时间:');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.width(60);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.medicines[3].time);
            Text.fontSize(16);
        }, Text);
        Text.pop();
        Row.pop();
        // 药仓4
        Column.pop();
        // 第二行：药仓3和药仓4
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 发送药品信息区域
            Text.create("发送药品信息");
            // 发送药品信息区域
            Text.fontSize(16);
            // 发送药品信息区域
            Text.fontWeight(FontWeight.Bold);
            // 发送药品信息区域
            Text.width('100%');
            // 发送药品信息区域
            Text.textAlign(TextAlign.Center);
            // 发送药品信息区域
            Text.padding(10);
        }, Text);
        // 发送药品信息区域
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 药品位置选择
            Flex.create({ justifyContent: FlexAlign.SpaceBetween, alignItems: ItemAlign.Center });
            // 药品位置选择
            Flex.width('100%');
            // 药品位置选择
            Flex.padding(10);
        }, Flex);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("药仓位置:");
            Text.fontSize(14);
            Text.width(80);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Radio.create({ value: '1', group: 'position' });
            Radio.checked(this.sendPosition === 1);
            Radio.onChange((isChecked) => {
                if (isChecked) {
                    this.sendPosition = 1;
                }
            });
            Radio.width(60);
        }, Radio);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("1");
            Text.width(20);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Radio.create({ value: '2', group: 'position' });
            Radio.checked(this.sendPosition === 2);
            Radio.onChange((isChecked) => {
                if (isChecked) {
                    this.sendPosition = 2;
                }
            });
            Radio.width(60);
        }, Radio);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("2");
            Text.width(20);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Radio.create({ value: '3', group: 'position' });
            Radio.checked(this.sendPosition === 3);
            Radio.onChange((isChecked) => {
                if (isChecked) {
                    this.sendPosition = 3;
                }
            });
            Radio.width(60);
        }, Radio);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("3");
            Text.width(20);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Radio.create({ value: '4', group: 'position' });
            Radio.checked(this.sendPosition === 4);
            Radio.onChange((isChecked) => {
                if (isChecked) {
                    this.sendPosition = 4;
                }
            });
            Radio.width(60);
        }, Radio);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("4");
            Text.width(20);
        }, Text);
        Text.pop();
        // 药品位置选择
        Flex.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 药品名称输入
            Flex.create({ justifyContent: FlexAlign.Start, alignItems: ItemAlign.Center });
            // 药品名称输入
            Flex.width('100%');
            // 药品名称输入
            Flex.padding(10);
        }, Flex);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("药品名称:");
            Text.fontSize(14);
            Text.width(80);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: "输入药品名称", text: this.sendName });
            TextInput.onChange((value) => {
                this.sendName = value;
            });
            TextInput.width(200);
        }, TextInput);
        // 药品名称输入
        Flex.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 药品剂量输入
            Flex.create({ justifyContent: FlexAlign.Start, alignItems: ItemAlign.Center });
            // 药品剂量输入
            Flex.width('100%');
            // 药品剂量输入
            Flex.padding(10);
        }, Flex);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("药品剂量:");
            Text.fontSize(14);
            Text.width(80);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: "输入药品剂量", text: this.sendDosage });
            TextInput.onChange((value) => {
                this.sendDosage = value;
            });
            TextInput.width(200);
        }, TextInput);
        // 药品剂量输入
        Flex.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 服药时间输入
            Flex.create({ justifyContent: FlexAlign.Start, alignItems: ItemAlign.Center });
            // 服药时间输入
            Flex.width('100%');
            // 服药时间输入
            Flex.padding(10);
        }, Flex);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("服药时间:");
            Text.fontSize(14);
            Text.width(80);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: "输入服药时间(如08:00)", text: this.sendTime });
            TextInput.onChange((value) => {
                this.sendTime = value;
            });
            TextInput.width(200);
        }, TextInput);
        // 服药时间输入
        Flex.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 发送按钮
            Button.createWithLabel("发送药品信息");
            // 发送按钮
            Button.width('90%');
            // 发送按钮
            Button.height(40);
            // 发送按钮
            Button.margin(10);
            // 发送按钮
            Button.onClick(() => {
                this.sendMedicineInfo();
            });
        }, Button);
        // 发送按钮
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // UDP通讯控制区域
            Flex.create({ justifyContent: FlexAlign.Start, alignItems: ItemAlign.Center });
            // UDP通讯控制区域
            Flex.width('100%');
            // UDP通讯控制区域
            Flex.padding(10);
        }, Flex);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("对端IP和端口：");
            Text.fontSize(14);
            Text.width(110);
            Text.flexGrow(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ text: this.targetIp });
            TextInput.onChange((value) => {
                this.targetIp = value;
            });
            TextInput.width(100);
            TextInput.flexGrow(4);
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(":");
            Text.width(5);
            Text.flexGrow(0);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ text: this.targetPort.toString() });
            TextInput.type(InputType.Number);
            TextInput.onChange((value) => {
                this.targetPort = parseInt(value);
            });
            TextInput.flexGrow(2);
            TextInput.width(60);
        }, TextInput);
        // UDP通讯控制区域
        Flex.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 定时发送控制区域
            Flex.create({ justifyContent: FlexAlign.SpaceAround, alignItems: ItemAlign.Center });
            // 定时发送控制区域
            Flex.width('100%');
            // 定时发送控制区域
            Flex.padding(10);
        }, Flex);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("发送间隔(ms):");
            Text.fontSize(14);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ text: this.sendInterval.toString() });
            TextInput.type(InputType.Number);
            TextInput.onChange((value) => {
                this.sendInterval = parseInt(value) || 1000;
            });
            TextInput.width(80);
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel(this.timerId ? "停止发送" : "开始定时发送");
            Button.onClick(() => {
                if (this.timerId) {
                    this.stopSending();
                }
                else {
                    this.startSending();
                }
            });
            Button.width(120);
            Button.backgroundColor(this.timerId ? 0xFF0000 : 0x07C160);
        }, Button);
        Button.pop();
        // 定时发送控制区域
        Flex.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 通讯日志区域
            Text.create("通讯日志");
            // 通讯日志区域
            Text.fontSize(16);
            // 通讯日志区域
            Text.fontWeight(FontWeight.Bold);
            // 通讯日志区域
            Text.width('100%');
            // 通讯日志区域
            Text.textAlign(TextAlign.Center);
            // 通讯日志区域
            Text.padding(10);
        }, Text);
        // 通讯日志区域
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create(this.scroller);
            Scroll.align(Alignment.Top);
            Scroll.backgroundColor(0xeeeeee);
            Scroll.height(200);
            Scroll.flexGrow(1);
            Scroll.scrollable(ScrollDirection.Vertical);
            Scroll.scrollBar(BarState.On);
            Scroll.scrollBarWidth(20);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.msgHistory);
            Text.textAlign(TextAlign.Start);
            Text.padding(10);
            Text.width('100%');
            Text.backgroundColor(0xeeeeee);
            Text.fontSize(14);
        }, Text);
        Text.pop();
        Scroll.pop();
        Column.pop();
        // 主滚动区域 - 包裹整个内容
        Scroll.pop();
        Column.pop();
        Row.pop();
    }
    // 发送药品信息
    async sendMedicineInfo() {
        interface RemoteAddress {
            address: string;
            port: number;
            family: number;
        }
        let remoteAddress: RemoteAddress = {
            address: this.targetIp,
            port: this.targetPort,
            family: 1,
        };
        // 构建药品信息消息
        const messageToSend = `position=${this.sendPosition},name=${this.sendName},dosage=${this.sendDosage},time=${this.sendTime}`;
        udpSocket.send({ data: messageToSend, address: remoteAddress })
            .then(async () => {
            this.msgHistory += "发送药品信息:" + messageToSend + await getCurrentTimeString() + "\r\n";
            // 更新本地药品信息显示
            if (this.sendPosition >= 1 && this.sendPosition <= 4) {
                this.medicines[this.sendPosition - 1] = {
                    position: this.sendPosition,
                    name: this.sendName,
                    dosage: this.sendDosage,
                    time: this.sendTime
                };
                this.medicines = [...this.medicines]; // 触发UI更新
            }
        })
            .catch((e: Error) => {
            this.msgHistory += '发送失败: ' + e.message + "\r\n";
        });
    }
    // 发送当前时间（内部方法，不对外暴露）
    private async sendCurrentTime() {
        interface RemoteAddress {
            address: string;
            port: number;
            family: number;
        }
        let remoteAddress: RemoteAddress = {
            address: this.targetIp,
            port: this.targetPort,
            family: 1,
        };
        // 获取当前时间
        const currentTime = await getCurrentTimeString();
        const timeOnly = currentTime.match(/\[(.*?)\]/)?.[1] || "未知时间";
        // 发送时间信息
        udpSocket.send({ data: `real_time=${timeOnly}`, address: remoteAddress })
            .then(() => {
            this.msgHistory += "发送当前时间: " + timeOnly + "\r\n";
        })
            .catch((e: Error) => {
            this.msgHistory += '发送时间失败: ' + e.message + "\r\n";
        });
    }
    // 绑定本地端口
    async bind2Port() {
        interface SocketAddress {
            address: string;
            port: number;
            family: 1 | 2;
        }
        const localAddress: SocketAddress = {
            address: "0.0.0.0",
            port: this.localPort,
            family: 1,
        };
        await udpSocket.bind(localAddress)
            .then(() => {
            this.msgHistory = 'bind success' + "\r\n";
            // 绑定成功后启动时间发送定时器
            this.startTimeSending();
        })
            .catch((e: Error) => {
            this.msgHistory = 'bind fail' + e.message + "\r\n";
        });
        udpSocket.on("message", async (value) => {
            let msg = buf2String(value.message);
            let remoteIP = value.remoteInfo.address;
            let remotePort = value.remoteInfo.port.toString();
            let remoteAddr = "[" + remoteIP + ":" + remotePort + "]:";
            let time = await getCurrentTimeString();
            this.msgHistory += remoteAddr + msg + time + "\r\n";
            // 解析药品信息
            this.parseMedicineInfo(msg);
        });
    }
    // 解析药品信息
    parseMedicineInfo(msg: string) {
        try {
            // 格式示例: position=1,name=Aspirin,dosage=1pc,time=08:00
            const parts = msg.split(',');
            if (parts.length === 4) {
                const position = parseInt(parts[0].split('=')[1]);
                const name = parts[1].split('=')[1];
                const dosage = parts[2].split('=')[1];
                const time = parts[3].split('=')[1];
                const newMedicine: Medicine = {
                    position,
                    name,
                    dosage,
                    time
                };
                // 更新药品列表
                if (position >= 1 && position <= 4) {
                    this.medicines[position - 1] = newMedicine;
                    this.medicines = [...this.medicines]; // 触发UI更新
                }
            }
        }
        catch (e) {
            this.msgHistory += `解析药品信息失败: ${msg}\r\n`;
        }
    }
    // 开始定时发送药品信息
    startSending() {
        if (this.timerId) {
            clearInterval(this.timerId);
        }
        // 立即发送一次
        this.sendMedicineInfo();
        // 设置定时器
        this.timerId = setInterval(() => {
            this.sendMedicineInfo();
        }, this.sendInterval);
        this.msgHistory += `开始定时发送药品信息，间隔 ${this.sendInterval}ms\r\n`;
    }
    // 开始定时发送时间信息（1秒一次）
    private startTimeSending() {
        if (this.timeTimerId) {
            clearInterval(this.timeTimerId);
        }
        // 立即发送一次
        this.sendCurrentTime();
        // 设置定时器，每秒发送一次
        this.timeTimerId = setInterval(() => {
            this.sendCurrentTime();
        }, 1000);
        this.msgHistory += "开始定时发送时间信息，间隔 1000ms\r\n";
    }
    // 停止定时发送
    stopSending() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = 0;
            this.msgHistory += "已停止定时发送药品信息\r\n";
        }
    }
    // 组件销毁时清除定时器
    aboutToDisappear() {
        this.stopSending();
        if (this.timeTimerId) {
            clearInterval(this.timeTimerId);
            this.timeTimerId = 0;
        }
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "Index";
    }
}
// 同步获取当前时间的字符串形式(用于日志显示)
async function getCurrentTimeString() {
    let time = "";
    await systemDateTime.getDate().then((date) => {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        time = `${hours}:${minutes}:${seconds}`;
    });
    return "[" + time + "]";
}
// ArrayBuffer转utf8字符串
function buf2String(buf: ArrayBuffer) {
    let msgArray = new Uint8Array(buf);
    let textDecoder = util.TextDecoder.create("utf-8");
    return textDecoder.decodeWithStream(msgArray);
}
registerNamedRoute(() => new Index(undefined, {}), "", { bundleName: "com.example.myapplication", moduleName: "entry", pagePath: "pages/Index", pageFullPath: "entry/src/main/ets/pages/Index", integratedHsp: "false", moduleType: "followWithHap" });
