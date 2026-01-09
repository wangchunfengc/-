import socket from '@ohos.net.socket';
import wifiManager from '@ohos.wifiManager';
import systemDateTime from '@ohos.systemDateTime';
import util from '@ohos.util';


let udpSocket = socket.constructUDPSocketInstance();


let ipNum = wifiManager.getIpInfo().ipAddress;

let localIp = (ipNum >>> 24) + '.' + (ipNum >> 16 & 0xFF) + '.' + (ipNum >> 8 & 0xFF) + '.' + (ipNum & 0xFF);


interface Medicine {
  position: number;
  name: string;
  dosage: string;
  time: string;
}

@Entry
@Component
struct Index {
  @State msgHistory: string = ''
  @State localPort: number = 9990
  @State targetIp: string = "192.168.45.34"
  @State targetPort: number = 6666
  @State timerId: number = 0
  @State timeTimerId: number = 0
  @State sendInterval: number = 1000
  @State medicines: Medicine[] = [
    { position: 1, name: "未设置", dosage: "未设置", time: "未设置" },
    { position: 2, name: "未设置", dosage: "未设置", time: "未设置" },
    { position: 3, name: "未设置", dosage: "未设置", time: "未设置" },
    { position: 4, name: "未设置", dosage: "未设置", time: "未设置" }
  ]
  @State sendPosition: number = 1
  @State sendName: string = ''
  @State sendDosage: string = ''
  @State sendTime: string = ''
  scroller: Scroller = new Scroller()
  mainScroller: Scroller = new Scroller()

  build() {
    Row() {
      Column() {

        Scroll(this.mainScroller) {
          Column() {

            Text("药品管理UDP通讯")
              .fontSize(16)
              .fontWeight(FontWeight.Bold)
              .width('100%')
              .textAlign(TextAlign.Center)
              .padding(10)

            Flex({ justifyContent: FlexAlign.Start, alignItems: ItemAlign.Center }) {
              Text("本地IP和端口：")
                .width(110)
                .fontSize(14)
                .flexGrow(0)
              Text(localIp)
                .width(80)
                .fontSize(14)
                .flexGrow(0)
              TextInput({ text: this.localPort.toString() })
                .type(InputType.Number)
                .onChange((value) => {
                  this.localPort = parseInt(value)
                })
                .width(100)
                .flexGrow(3)

              Button("绑定")
                .onClick(() => {
                  this.bind2Port()
                })
                .width(80)
                .fontSize(14)
                .flexGrow(0)

            }.width('100%')
            .padding(10)


            Text("药品信息 (4个药仓)")
              .fontSize(18)
              .fontWeight(FontWeight.Bold)
              .width('100%')
              .textAlign(TextAlign.Center)
              .padding(10)


            Row() {

              Column() {
                Text("药仓1")
                  .fontSize(16)
                  .fontWeight(FontWeight.Bold)
                  .margin({ bottom: 5 })

                Row() {
                  Text('药品:')
                    .fontSize(16)
                    .fontWeight(FontWeight.Bold)
                    .width(60)
                  Text(this.medicines[0].name)
                    .fontSize(16)
                }.margin({ bottom: 5 })

                Row() {
                  Text('剂量:')
                    .fontSize(16)
                    .fontWeight(FontWeight.Bold)
                    .width(60)
                  Text(this.medicines[0].dosage)
                    .fontSize(16)
                }.margin({ bottom: 5 })

                Row() {
                  Text('时间:')
                    .fontSize(16)
                    .fontWeight(FontWeight.Bold)
                    .width(60)
                  Text(this.medicines[0].time)
                    .fontSize(16)
                }
              }
              .width('48%')
              .padding(15)
              .backgroundColor(0xF5F5F5)
              .borderRadius(10)
              .margin({ right: '2%' })


              Column() {
                Text("药仓2")
                  .fontSize(16)
                  .fontWeight(FontWeight.Bold)
                  .margin({ bottom: 5 })

                Row() {
                  Text('药品:')
                    .fontSize(16)
                    .fontWeight(FontWeight.Bold)
                    .width(60)
                  Text(this.medicines[1].name)
                    .fontSize(16)
                }.margin({ bottom: 5 })

                Row() {
                  Text('剂量:')
                    .fontSize(16)
                    .fontWeight(FontWeight.Bold)
                    .width(60)
                  Text(this.medicines[1].dosage)
                    .fontSize(16)
                }.margin({ bottom: 5 })

                Row() {
                  Text('时间:')
                    .fontSize(16)
                    .fontWeight(FontWeight.Bold)
                    .width(60)
                  Text(this.medicines[1].time)
                    .fontSize(16)
                }
              }
              .width('48%')
              .padding(15)
              .backgroundColor(0xF5F5F5)
              .borderRadius(10)
              .margin({ left: '2%' })
            }
            .width('100%')
            .margin({ bottom: 10 })


            Row() {
              // 药仓3
              Column() {
                Text("药仓3")
                  .fontSize(16)
                  .fontWeight(FontWeight.Bold)
                  .margin({ bottom: 5 })

                Row() {
                  Text('药品:')
                    .fontSize(16)
                    .fontWeight(FontWeight.Bold)
                    .width(60)
                  Text(this.medicines[2].name)
                    .fontSize(16)
                }.margin({ bottom: 5 })

                Row() {
                  Text('剂量:')
                    .fontSize(16)
                    .fontWeight(FontWeight.Bold)
                    .width(60)
                  Text(this.medicines[2].dosage)
                    .fontSize(16)
                }.margin({ bottom: 5 })

                Row() {
                  Text('时间:')
                    .fontSize(16)
                    .fontWeight(FontWeight.Bold)
                    .width(60)
                  Text(this.medicines[2].time)
                    .fontSize(16)
                }
              }
              .width('48%')
              .padding(15)
              .backgroundColor(0xF5F5F5)
              .borderRadius(10)
              .margin({ right: '2%' })


              Column() {
                Text("药仓4")
                  .fontSize(16)
                  .fontWeight(FontWeight.Bold)
                  .margin({ bottom: 5 })

                Row() {
                  Text('药品:')
                    .fontSize(16)
                    .fontWeight(FontWeight.Bold)
                    .width(60)
                  Text(this.medicines[3].name)
                    .fontSize(16)
                }.margin({ bottom: 5 })

                Row() {
                  Text('剂量:')
                    .fontSize(16)
                    .fontWeight(FontWeight.Bold)
                    .width(60)
                  Text(this.medicines[3].dosage)
                    .fontSize(16)
                }.margin({ bottom: 5 })

                Row() {
                  Text('时间:')
                    .fontSize(16)
                    .fontWeight(FontWeight.Bold)
                    .width(60)
                  Text(this.medicines[3].time)
                    .fontSize(16)
                }
              }
              .width('48%')
              .padding(15)
              .backgroundColor(0xF5F5F5)
              .borderRadius(10)
              .margin({ left: '2%' })
            }
            .width('100%')
            .margin({ bottom: 10 })


            Text("发送药品信息")
              .fontSize(16)
              .fontWeight(FontWeight.Bold)
              .width('100%')
              .textAlign(TextAlign.Center)
              .padding(10)


            Flex({ justifyContent: FlexAlign.SpaceBetween, alignItems: ItemAlign.Center }) {
              Text("药仓位置:")
                .fontSize(14)
                .width(80)
              Radio({ value: '1', group: 'position' })
                .checked(this.sendPosition === 1)
                .onChange((isChecked) => {
                  if (isChecked) {
                    this.sendPosition = 1
                  }
                })
                .width(60)
              Text("1")
                .width(20)
              Radio({ value: '2', group: 'position' })
                .checked(this.sendPosition === 2)
                .onChange((isChecked) => {
                  if (isChecked) {
                    this.sendPosition = 2
                  }
                })
                .width(60)
              Text("2")
                .width(20)
              Radio({ value: '3', group: 'position' })
                .checked(this.sendPosition === 3)
                .onChange((isChecked) => {
                  if (isChecked) {
                    this.sendPosition = 3
                  }
                })
                .width(60)
              Text("3")
                .width(20)
              Radio({ value: '4', group: 'position' })
                .checked(this.sendPosition === 4)
                .onChange((isChecked) => {
                  if (isChecked) {
                    this.sendPosition = 4
                  }
                })
                .width(60)
              Text("4")
                .width(20)
            }
            .width('100%')
            .padding(10)


            Flex({ justifyContent: FlexAlign.Start, alignItems: ItemAlign.Center }) {
              Text("药品名称:")
                .fontSize(14)
                .width(80)
              TextInput({ placeholder: "输入药品名称", text: this.sendName })
                .onChange((value) => {
                  this.sendName = value
                })
                .width(200)
            }
            .width('100%')
            .padding(10)


            Flex({ justifyContent: FlexAlign.Start, alignItems: ItemAlign.Center }) {
              Text("药品剂量:")
                .fontSize(14)
                .width(80)
              TextInput({ placeholder: "输入药品剂量", text: this.sendDosage })
                .onChange((value) => {
                  this.sendDosage = value
                })
                .width(200)
            }
            .width('100%')
            .padding(10)


            Flex({ justifyContent: FlexAlign.Start, alignItems: ItemAlign.Center }) {
              Text("服药时间:")
                .fontSize(14)
                .width(80)
              TextInput({ placeholder: "输入服药时间(如08:00)", text: this.sendTime })
                .onChange((value) => {
                  this.sendTime = value
                })
                .width(200)
            }
            .width('100%')
            .padding(10)


            Button("发送药品信息")
              .width('90%')
              .height(40)
              .margin(10)
              .onClick(() => {
                this.sendMedicineInfo()
              })


            Flex({ justifyContent: FlexAlign.Start, alignItems: ItemAlign.Center }) {
              Text("对端IP和端口：")
                .fontSize(14)
                .width(110)
                .flexGrow(1)

              TextInput({ text: this.targetIp })
                .onChange((value) => {
                  this.targetIp = value
                })
                .width(100)
                .flexGrow(4)

              Text(":")
                .width(5)
                .flexGrow(0)

              TextInput({ text: this.targetPort.toString() })
                .type(InputType.Number)
                .onChange((value) => {
                  this.targetPort = parseInt(value)
                })
                .flexGrow(2)
                .width(60)
            }
            .width('100%')
            .padding(10)


            Flex({ justifyContent: FlexAlign.SpaceAround, alignItems: ItemAlign.Center }) {
              Text("发送间隔(ms):")
                .fontSize(14)
              TextInput({ text: this.sendInterval.toString() })
                .type(InputType.Number)
                .onChange((value) => {
                  this.sendInterval = parseInt(value) || 1000
                })
                .width(80)

              Button(this.timerId ? "停止发送" : "开始定时发送")
                .onClick(() => {
                  if (this.timerId) {
                    this.stopSending()
                  } else {
                    this.startSending()
                  }
                })
                .width(120)
                .backgroundColor(this.timerId ? 0xFF0000 : 0x07C160)
            }
            .width('100%')
            .padding(10)


            Text("通讯日志")
              .fontSize(16)
              .fontWeight(FontWeight.Bold)
              .width('100%')
              .textAlign(TextAlign.Center)
              .padding(10)

            Scroll(this.scroller) {
              Text(this.msgHistory)
                .textAlign(TextAlign.Start)
                .padding(10)
                .width('100%')
                .backgroundColor(0xeeeeee)
                .fontSize(14)
            }
            .align(Alignment.Top)
            .backgroundColor(0xeeeeee)
            .height(200)
            .flexGrow(1)
            .scrollable(ScrollDirection.Vertical)
            .scrollBar(BarState.On)
            .scrollBarWidth(20)
          }
          .width('100%')
        }
        .width('100%')
        .height('100%')
        .scrollable(ScrollDirection.Vertical)
        .scrollBar(BarState.On)
        .scrollBarWidth(20)
      }
      .width('100%')
      .height('100%')
    }
    .height('100%')
  }


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


    const messageToSend = `position=${this.sendPosition},name=${this.sendName},dosage=${this.sendDosage},time=${this.sendTime}`;

    udpSocket.send({ data: messageToSend, address: remoteAddress })
      .then(async () => {
        this.msgHistory += "发送药品信息:" + messageToSend + await getCurrentTimeString() + "\r\n";


        if (this.sendPosition >= 1 && this.sendPosition <= 4) {
          this.medicines[this.sendPosition - 1] = {
            position: this.sendPosition,
            name: this.sendName,
            dosage: this.sendDosage,
            time: this.sendTime
          };
          this.medicines = [...this.medicines];
        }
      })
      .catch((e: Error) => {
        this.msgHistory += '发送失败: ' + e.message + "\r\n";
      });
  }


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


    const currentTime = await getCurrentTimeString();
    const timeOnly = currentTime.match(/\[(.*?)\]/)?.[1] || "未知时间";


    udpSocket.send({ data: `real_time=${timeOnly}`, address: remoteAddress })
      .then(() => {
        this.msgHistory += "发送当前时间: " + timeOnly + "\r\n";
      })
      .catch((e: Error) => {
        this.msgHistory += '发送时间失败: ' + e.message + "\r\n";
      });
  }


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

        this.startTimeSending();
      })
      .catch((e: Error) => {
        this.msgHistory = 'bind fail' + e.message + "\r\n";
      })

    udpSocket.on("message", async (value) => {
      let msg = buf2String(value.message)
      let remoteIP = value.remoteInfo.address
      let remotePort = value.remoteInfo.port.toString()
      let remoteAddr = "[" + remoteIP + ":" + remotePort + "]:"
      let time = await getCurrentTimeString()
      this.msgHistory += remoteAddr + msg + time + "\r\n"


      this.parseMedicineInfo(msg);
    })
  }


  parseMedicineInfo(msg: string) {
    try {

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


        if (position >= 1 && position <= 4) {
          this.medicines[position - 1] = newMedicine;
          this.medicines = [...this.medicines];
        }
      }
    } catch (e) {
      this.msgHistory += `解析药品信息失败: ${msg}\r\n`;
    }
  }


  startSending() {
    if (this.timerId) {
      clearInterval(this.timerId)
    }


    this.sendMedicineInfo();


    this.timerId = setInterval(() => {
      this.sendMedicineInfo()
    }, this.sendInterval)

    this.msgHistory += `开始定时发送药品信息，间隔 ${this.sendInterval}ms\r\n`
  }


  private startTimeSending() {
    if (this.timeTimerId) {
      clearInterval(this.timeTimerId)
    }


    this.sendCurrentTime();


    this.timeTimerId = setInterval(() => {
      this.sendCurrentTime();
    }, 1000);

    this.msgHistory += "开始定时发送时间信息，间隔 1000ms\r\n"
  }


  stopSending() {
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = 0
      this.msgHistory += "已停止定时发送药品信息\r\n"
    }
  }


  aboutToDisappear() {
    this.stopSending()
    if (this.timeTimerId) {
      clearInterval(this.timeTimerId)
      this.timeTimerId = 0
    }
  }
}


async function getCurrentTimeString() {
  let time = ""
  await systemDateTime.getDate().then(
    (date) => {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      time = `${hours}:${minutes}:${seconds}`;
    }
  )
  return "[" + time + "]";
}


function buf2String(buf: ArrayBuffer) {
  let msgArray = new Uint8Array(buf);
  let textDecoder = util.TextDecoder.create("utf-8");
  return textDecoder.decodeWithStream(msgArray)
}