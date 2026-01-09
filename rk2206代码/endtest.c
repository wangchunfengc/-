#include "los_swtmr.h"
#include <stdio.h>
#include <stdbool.h>
#include "los_task.h"
#include "ohos_init.h"
#include "iot_adc.h"
#include "iot_errno.h"
#include "../include/picture.h"
#include "../include/lcd.h"
#include "iot_uart.h"

#include"cmsis_os2.h"
#include"config_network.h"
#include "lwip/udp.h"
#include "lwip/ip_addr.h"
#include "lwip/priv/tcp_priv.h"
#include "lwip/stats.h"
#include "lwip/inet_chksum.h"
#include "netinet/in.h"

#include"iot_gpio.h"

#include "eeprom.h"

#define EEPROM_SIZE 256  
#define MAX_SLOTS 4     

#define SLOT_SIZE (EEPROM_SIZE / MAX_SLOTS)  

#define SLOT1_ADDR 0
#define SLOT2_ADDR (SLOT1_ADDR + SLOT_SIZE)
#define SLOT3_ADDR (SLOT2_ADDR + SLOT_SIZE)
#define SLOT4_ADDR (SLOT3_ADDR + SLOT_SIZE)

typedef struct {
    uint8_t position;   
    char name[32];      
    char dosage[16];    
    char time[10];       
    uint8_t checksum;    
} __attribute__((packed)) EepromMedInfo;

extern const unsigned char gImage_isoftstone[IMAGE_MAXSIZE_ISOFTSTONE];

#define MOTOR1_PIN1 GPIO0_PA0
#define MOTOR1_PIN2 GPIO0_PA1
#define MOTOR2_PIN1 GPIO0_PA2
#define MOTOR2_PIN2 GPIO0_PA3
#define MOTOR3_PIN1 GPIO0_PB0
#define MOTOR3_PIN2 GPIO0_PB1
#define MOTOR4_PIN1 GPIO0_PB2
#define MOTOR4_PIN2 GPIO0_PB3


typedef enum {
    MOTOR_STOP,
    MOTOR_FORWARD,
    MOTOR_BACKWARD
} MotorState;

#define LOG_TAG    "udp"

#define TX_LOG(tag, fmt, ...)  do { \
    printf("[" tag ":]" fmt "\n", ##__VA_ARGS__); \
} while (0)

#define OC_SERVER_IP   "192.168.54.20"
#define SERVER_PORT        6666
#define CLIENT_LOCAL_PORT  6666

#define LCD_UPDATE_INTERVAL 20

#define BUFF_LEN           256

#define ROUTE_SSID "REDMI K80"
#define ROUTE_PASSWORD "041114caO"

WifiLinkedInfo wifiinfo;


#define KEY_ADC_CHANNEL 7

#define UART2_HANDLE EUART2_M1
#define VOICE_UART UART2_HANDLE 

typedef struct {
    int position;
    char name[32];
    char dosage[16];
    int hour;
    int minute;
    int second;
    bool valid;     
    bool reminded;  
    bool repeating; 
    int swtmr_id;   
    MotorState motor_state; 
} MedicineInfo;



static int g_key_value = 0;


MedicineInfo medicines[4] = {0}; 
int global_hour = 0;           
int global_minute = 0;          
int global_second = 0;         


static float adc_get_voltage();
void parse_medicine_data(const char* data_str);
void parse_real_time_data(const char* time_str);
void lcd_force_refresh();
void send_reminder();
void lcd_process(void *arg);
void adc_process();
static void su_03t_thread(void *arg);
void udp_server_msg_handle(int fd);
int udp_get_wifi_info(WifiLinkedInfo *info);
int wifi_udp_server(void* arg);
void wifi_udp_process(void *args);
void check_reminder_time();



void save_to_eeprom(uint8_t position, const char* name, const char* dosage, const char* time) {
    EepromMedInfo info;
    uint32_t addr;
    
    if(position < 1 || position > MAX_SLOTS) return;
    
    switch(position) {
        case 1: addr = SLOT1_ADDR; break;
        case 2: addr = SLOT2_ADDR; break;
        case 3: addr = SLOT3_ADDR; break;
        case 4: addr = SLOT4_ADDR; break;
    }
    
    info.position = position;
    strncpy(info.name, name, sizeof(info.name)-1);
    strncpy(info.dosage, dosage, sizeof(info.dosage)-1);
    strncpy(info.time, time, sizeof(info.time)-1);
    
    info.checksum = 0;
    uint8_t *p = (uint8_t*)&info;
    for(size_t i=0; i<sizeof(info)-1; i++) {
        info.checksum += p[i];
    }
    
    if(eeprom_write(addr, (uint8_t*)&info, sizeof(info)) != sizeof(info)) {
        printf("Failed to save slot %d\n", position);
    }
}



void motor_init() {
    IoTGpioInit(MOTOR1_PIN1);
    IoTGpioInit(MOTOR1_PIN2);
    IoTGpioSetDir(MOTOR1_PIN1, IOT_GPIO_DIR_OUT);
    IoTGpioSetDir(MOTOR1_PIN2, IOT_GPIO_DIR_OUT);
    
    IoTGpioInit(MOTOR2_PIN1);
    IoTGpioInit(MOTOR2_PIN2);
    IoTGpioSetDir(MOTOR2_PIN1, IOT_GPIO_DIR_OUT);
    IoTGpioSetDir(MOTOR2_PIN2, IOT_GPIO_DIR_OUT);
    
    IoTGpioInit(MOTOR3_PIN1);
    IoTGpioInit(MOTOR3_PIN2);
    IoTGpioSetDir(MOTOR3_PIN1, IOT_GPIO_DIR_OUT);
    IoTGpioSetDir(MOTOR3_PIN2, IOT_GPIO_DIR_OUT);
    
    IoTGpioInit(MOTOR4_PIN1);
    IoTGpioInit(MOTOR4_PIN2);
    IoTGpioSetDir(MOTOR4_PIN1, IOT_GPIO_DIR_OUT);
    IoTGpioSetDir(MOTOR4_PIN2, IOT_GPIO_DIR_OUT);
    
    for (int i = 1; i <= 4; i++) {
        set_motor_state(i, MOTOR_STOP);
    }
}




void set_motor_state(int motor_num, MotorState state) {
    unsigned int pin1, pin2;
    
    switch(motor_num) {
        case 1:
            pin1 = MOTOR1_PIN1;
            pin2 = MOTOR1_PIN2;
            break;
        case 2:
            pin1 = MOTOR2_PIN1;
            pin2 = MOTOR2_PIN2;
            break;
        case 3:
            pin1 = MOTOR3_PIN1;
            pin2 = MOTOR3_PIN2;
            break;
        case 4:
            pin1 = MOTOR4_PIN1;
            pin2 = MOTOR4_PIN2;
            break;
        default:
            return;
    }
    
    switch(state) {
        case MOTOR_STOP:
            IoTGpioSetOutputVal(pin1, IOT_GPIO_VALUE0);
            IoTGpioSetOutputVal(pin2, IOT_GPIO_VALUE0);
            break;
        case MOTOR_FORWARD:
            IoTGpioSetOutputVal(pin1, IOT_GPIO_VALUE1);
            IoTGpioSetOutputVal(pin2, IOT_GPIO_VALUE0);
            LOS_Msleep(800);
            IoTGpioSetOutputVal(pin1, IOT_GPIO_VALUE0);
            IoTGpioSetOutputVal(pin2, IOT_GPIO_VALUE0);

            break;
        case MOTOR_BACKWARD:
            IoTGpioSetOutputVal(pin1, IOT_GPIO_VALUE0);
            IoTGpioSetOutputVal(pin2, IOT_GPIO_VALUE1);
            LOS_Msleep(1000);
            IoTGpioSetOutputVal(pin1, IOT_GPIO_VALUE0);
            IoTGpioSetOutputVal(pin2, IOT_GPIO_VALUE0);
            break;
    }
    
    if (motor_num >= 1 && motor_num <= 4) {
        medicines[motor_num-1].motor_state = state;
    }
}




void check_reminder_time() {
    static int last_minute = -1;
    
    if (global_minute != last_minute) {
        last_minute = global_minute;
        for (int i = 0; i < 4; i++) {
            medicines[i].reminded = false;
        }
    }
    
    for (int i = 0; i < 4; i++) {
        if (medicines[i].valid) {
            if (medicines[i].hour == global_hour && 
                medicines[i].minute == global_minute && 
                medicines[i].second == global_second && 
                !medicines[i].reminded) {
                
                printf("Time to take medicine at position %d!\n", i+1);
                send_reminder();
                medicines[i].reminded = true;
                medicines[i].repeating = true;
                
                LOS_SwtmrCreate(10000, LOS_SWTMR_MODE_PERIOD, 
                               (SWTMR_PROC_FUNC)send_reminder, 
                               &medicines[i].position, 
                               &medicines[i].swtmr_id);
                LOS_SwtmrStart(medicines[i].swtmr_id);
            }
        }
    }
}


void parse_medicine_data(const char* data_str) {
    int pos;
    char name[32], dosage[16], time[10];
    
    if(sscanf(data_str, "position=%d,name=%[^,],dosage=%[^,],time=%[^,]",
             &pos, name, dosage, time) == 4) {
        
        if(pos >=1 && pos <=4) {
            medicines[pos-1].position = pos;
            strncpy(medicines[pos-1].name, name, 32);
            strncpy(medicines[pos-1].dosage, dosage, 16);
            sscanf(time, "%d:%d:%d",
                  &medicines[pos-1].hour,
                  &medicines[pos-1].minute,
                  &medicines[pos-1].second);
            medicines[pos-1].valid = true;
            
            save_to_eeprom(pos, name, dosage, time);
            
            printf("Saved slot %d to EEPROM\n", pos);
        }
    }
}
void parse_real_time_data(const char* time_str) {
    if (sscanf(time_str, "real_time=%d:%d:%d", 
               &global_hour,
               &global_minute,
               &global_second) == 3) {
        
        printf("Global time updated: %02d:%02d:%02d\n", 
               global_hour, global_minute, global_second);
        
        check_reminder_time();
    } else {
        printf("Failed to parse real time string\n");
    }
}


static unsigned int adc_dev_init()
{
    unsigned int ret = IoTAdcInit(KEY_ADC_CHANNEL);
    if(ret != IOT_SUCCESS) {
        printf("%s, %s, %d: ADC Init fail\n", __FILE__, __func__, __LINE__);
    }
    return ret;
}


static float adc_get_voltage()
{
    unsigned int ret = IOT_SUCCESS;
    unsigned int data = 0;

    ret = IoTAdcGetVal(KEY_ADC_CHANNEL, &data);
    if (ret != IOT_SUCCESS) {
        printf("%s, %s, %d: ADC Read Fail\n", __FILE__, __func__, __LINE__);
        return 0.0;
    }

    return (float)(data * 3.3 / 1024.0);
}


void lcd_force_refresh()
{
    printf("LCD forced refresh\n");
}


int light_flag=0;
void send_reminder()
{
    uint8_t protocol_frame[] = {
        0xAA, 0x55,                        
        0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x49,0x40,
        0x55, 0xAA                       
    };

    IoTGpioSetOutputVal(GPIO0_PA5, IOT_GPIO_VALUE1);
    light_flag = 1;

    IoTUartWrite(VOICE_UART, protocol_frame, sizeof(protocol_frame));
    printf("Reminder sent!\n");
}


int light = 0;

void adc_process() {
    float voltage;
    adc_dev_init();
    motor_init(); 

    while (1) {
        voltage = adc_get_voltage();
        
        if(voltage >3.2){
            g_key_value = 0;
        }else if (voltage > 1.50){
            g_key_value = 3;
        }else if (voltage > 1.0){
            g_key_value = 2;
        }else if (voltage > 0.5){
            g_key_value = 4;
        }else{
            g_key_value = 1;
        }
        
        if(g_key_value==3&&light_flag==1){
             IoTGpioSetOutputVal(GPIO0_PA5, IOT_GPIO_VALUE0);
             light_flag = 0;
        }

        if (g_key_value > 0 && g_key_value <= 4) {
            int pos = g_key_value - 1;
            
            if (medicines[pos].repeating) {
                LOS_SwtmrStop(medicines[pos].swtmr_id);
                LOS_SwtmrDelete(medicines[pos].swtmr_id);
                medicines[pos].repeating = false;
                printf("Stopped repeating reminder for position %d\n", g_key_value);
            }
            
            if (medicines[pos].motor_state == MOTOR_STOP || 
                medicines[pos].motor_state == MOTOR_BACKWARD) {
                set_motor_state(g_key_value, MOTOR_FORWARD);
                printf("Motor %d forward (pop out)\n", g_key_value);
            } else {
                set_motor_state(g_key_value, MOTOR_BACKWARD);
                printf("Motor %d backward (pull back)\n", g_key_value);
            }
            
            g_key_value = 0; 
            LOS_Msleep(1000); 
        }
        
        LOS_Msleep(50);
    }
}


void lcd_process(void *arg) {
    uint32_t ret = lcd_init();
    if (ret != 0) {
        printf("lcd_init failed(%d)\n", ret);
        return;
    }
    
    lcd_fill(0, 0, LCD_W, LCD_H, LCD_WHITE);
    
    while (1) {
        lcd_show_string(0, 10, "Medicine Reminder", LCD_RED, LCD_WHITE, 24, 0);
        
        char time_buf[20];
        snprintf(time_buf, sizeof(time_buf), "Current: %02d:%02d:%02d", 
                global_hour, global_minute, global_second);
        lcd_show_string(0, 40, time_buf, LCD_GREEN, LCD_WHITE, 16, 0);
        
        int y_pos = 70;
        for (int i = 0; i < 4; i++) {
            char pos_buf[20];
            snprintf(pos_buf, sizeof(pos_buf), "Position %d:", i+1);
            
            if (medicines[i].valid) {
                char info_buf[100];
                snprintf(info_buf, sizeof(info_buf), "%s %s %02d:%02d:%02d",
                        medicines[i].name,
                        medicines[i].dosage,
                        medicines[i].hour,
                        medicines[i].minute,
                        medicines[i].second);

                char motor_state[10];
                switch(medicines[i].motor_state) {
                    case MOTOR_STOP: strcpy(motor_state, "STOP"); break;
                    case MOTOR_FORWARD: strcpy(motor_state, "OUT"); break;
                    case MOTOR_BACKWARD: strcpy(motor_state, "IN"); break;
                }
                
                if (medicines[i].hour == global_hour && 
                    medicines[i].minute == global_minute && 
                    medicines[i].second == global_second && 
                    !medicines[i].reminded) {
                    lcd_show_string(0, y_pos, pos_buf, LCD_RED, LCD_WHITE, 16, 0);
                    lcd_show_string(120, y_pos, info_buf, LCD_RED, LCD_WHITE, 16, 0);
                } else {
                    lcd_show_string(0, y_pos, pos_buf, LCD_BLUE, LCD_WHITE, 16, 0);
                    lcd_show_string(120, y_pos, info_buf, LCD_BLUE, LCD_WHITE, 16, 0);
                }

                // lcd_show_string(200, y_pos, motor_state, 
                //                 medicines[i].motor_state == MOTOR_FORWARD ? LCD_RED : 
                //                 medicines[i].motor_state == MOTOR_BACKWARD ? LCD_BLUE : LCD_BLACK,
                //                 LCD_WHITE, 16, 0);
            } else {
                lcd_show_string(0, y_pos, pos_buf, LCD_BLUE, LCD_WHITE, 16, 0);
                lcd_show_string(160, y_pos, "Empty", LCD_BLUE, LCD_WHITE, 16, 0);
            }
            
            y_pos += 30;
        }
        
        LOS_Msleep(LCD_UPDATE_INTERVAL);
    }
}


static void su_03t_thread(void *arg)
{
    IotUartAttribute attr;
    double *data_ptr = NULL;
    unsigned int ret = 0;

    IoTUartDeinit(UART2_HANDLE);
    
    attr.baudRate = 115200;
    attr.dataBits = IOT_UART_DATA_BIT_8;
    attr.pad = IOT_FLOW_CTRL_NONE;
    attr.parity = IOT_UART_PARITY_NONE;
    attr.rxBlock = IOT_UART_BLOCK_STATE_NONE_BLOCK;
    attr.stopBits = IOT_UART_STOP_BIT_1;
    attr.txBlock = IOT_UART_BLOCK_STATE_NONE_BLOCK;
    
    ret = IoTUartInit(UART2_HANDLE, &attr);
    if (ret != IOT_SUCCESS)
    {
        printf("%s, %d: IoTUartInit(%d) failed!\n", __FILE__, __LINE__, ret);
        return;
    }

    while(1)
    {
        LOS_Msleep(2000);
    }
}

void udp_server_msg_handle(int fd) {
    char buf[BUFF_LEN];
    socklen_t len;
    int cnt = 0, count;
    struct sockaddr_in client_addr = {0};
    
    while (1) {
        memset(buf, 0, BUFF_LEN);
        len = sizeof(client_addr);
        printf("[udp server]------------------------------------------------\n");
        printf("[udp server] waiting client message!!!\n");
        
        count = recvfrom(fd, buf, BUFF_LEN, 0, (struct sockaddr*)&client_addr, &len);
        if (count == -1) {
            printf("[udp server] receive data fail!\n");
            LOS_Msleep(3000);
            break;
        }
        
        printf("[udp server] remote addr:%s port:%u\n",inet_ntoa(client_addr.sin_addr), ntohs(client_addr.sin_port));
        printf("[udp server] rev:%s\n", buf);
        
        if (strstr(buf, "position=") != NULL) {
            parse_medicine_data(buf);
        } else if (strstr(buf, "real_time=") != NULL) {
            parse_real_time_data(buf);
        } else {
            printf("[udp server] Unknown data format\n");
        }
    }
    lwip_close(fd);
}

int udp_get_wifi_info(WifiLinkedInfo *info)
{
    int ret = -1;
    int gw, netmask;
    memset(info, 0, sizeof(WifiLinkedInfo));
    unsigned int retry = 15;
    while (retry) {
        if (GetLinkedInfo(info) == WIFI_SUCCESS) {   
            if (info->connState == WIFI_CONNECTED) {
                if (info->ipAddress != 0) {
                    TX_LOG(LOG_TAG, "rknetwork IP (%s)", inet_ntoa(info->ipAddress));       
                    if (WIFI_SUCCESS == GetLocalWifiGw(&gw)) {
                        TX_LOG(LOG_TAG, "network GW (%s)", inet_ntoa(gw));
                    }
                    if (WIFI_SUCCESS == GetLocalWifiNetmask(&netmask)) {
                        TX_LOG(LOG_TAG, "network NETMASK (%s)", inet_ntoa(netmask));
                    }
                    if (WIFI_SUCCESS == SetLocalWifiGw()) {
                        TX_LOG(LOG_TAG, "set network GW");
                    }
                    if (WIFI_SUCCESS == GetLocalWifiGw(&gw)) {
                        TX_LOG(LOG_TAG, "network GW (%s)", inet_ntoa(gw));
                    }
                    if (WIFI_SUCCESS == GetLocalWifiNetmask(&netmask)) {
                        TX_LOG(LOG_TAG, "network NETMASK (%s)", inet_ntoa(netmask));
                    }
                    ret = 0;
                    goto connect_done;
                }
            }
        }
        LOS_Msleep(1000);
        retry--;
    }
connect_done:
    return ret;
}

int wifi_udp_server(void* arg)
{
    int server_fd, ret;
    while(1)
    {
        server_fd = socket(AF_INET, SOCK_DGRAM, 0);
        if (server_fd < 0)
        {
            printf("create socket fail!\n");
            return -1;
        }
        int flag = 1;
        ret = setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &flag, sizeof(int));
        if (ret != 0) {
            printf("[CommInitUdpServer]setsockopt fail, ret[%d]!\n", ret);
        }
        struct sockaddr_in serv_addr = {0};
        serv_addr.sin_family = AF_INET;    
        serv_addr.sin_addr.s_addr = htonl(INADDR_ANY);
        serv_addr.sin_port = htons(SERVER_PORT);                  
        ret = bind(server_fd, (struct sockaddr*)&serv_addr, sizeof(serv_addr));
        if (ret < 0)
        {
            printf("socket bind fail!\n");
            lwip_close(server_fd);
            return -1;
        }
        printf("[udp server] local  addr:%s,port:%u\n", inet_ntoa(wifiinfo.ipAddress), ntohs(serv_addr.sin_port));
        udp_server_msg_handle(server_fd);
        LOS_Msleep(1000);
    }
}

void wifi_udp_process(void *args)
{
    unsigned int threadID_client, threadID_server;
    WifiLinkedInfo info;
    uint8_t mac_address[6] = {0x00, 0xdc, 0xb6, 0x90, 0x00, 0x00};
    FlashInit();
    VendorSet(VENDOR_ID_WIFI_MODE, "STA", 3);
    VendorSet(VENDOR_ID_MAC, mac_address,6);
    VendorSet(VENDOR_ID_WIFI_ROUTE_SSID, ROUTE_SSID, sizeof(ROUTE_SSID));
    VendorSet(VENDOR_ID_WIFI_ROUTE_PASSWD, ROUTE_PASSWORD,sizeof(ROUTE_PASSWORD));
    SetWifiModeOff();
    SetWifiModeOn();
    while(udp_get_wifi_info(&info) != 0);
    wifiinfo = info;
    LOS_Msleep(1000);
    CreateThread(&threadID_server,  wifi_udp_server, NULL, "udp server@ process");
}


void load_all_from_eeprom() {
    for(uint8_t pos=1; pos<=MAX_SLOTS; pos++) {
        EepromMedInfo info;
        uint32_t addr;
        
        switch(pos) {
            case 1: addr = SLOT1_ADDR; break;
            case 2: addr = SLOT2_ADDR; break;
            case 3: addr = SLOT3_ADDR; break;
            case 4: addr = SLOT4_ADDR; break;
        }
        
        if(eeprom_read(addr, (uint8_t*)&info, sizeof(info)) != sizeof(info)) {
            continue;
        }
        
        uint8_t sum = 0;
        uint8_t *p = (uint8_t*)&info;
        for(size_t i=0; i<sizeof(info)-1; i++) {
            sum += p[i];
        }
        
        if(sum != info.checksum) {
            printf("Slot %d checksum error\n", pos);
            continue;
        }
        
        if(info.position >=1 && info.position <=4) {
            medicines[info.position-1].position = info.position;
            strncpy(medicines[info.position-1].name, info.name, 32);
            strncpy(medicines[info.position-1].dosage, info.dosage, 16);
            sscanf(info.time, "%d:%d:%d",
                  &medicines[info.position-1].hour,
                  &medicines[info.position-1].minute,
                  &medicines[info.position-1].second);
            medicines[info.position-1].valid = true;
            
            printf("Loaded slot %d: %s,%s,%s\n", 
                  info.position, info.name, info.dosage, info.time);
        }
    }
}


void test()
{

    IoTGpioInit(GPIO0_PA5);
    IoTGpioSetDir(GPIO0_PA5, IOT_GPIO_DIR_OUT);
    IoTGpioSetOutputVal(GPIO0_PA5, IOT_GPIO_VALUE0);
    eeprom_init();
    
    // load_all_medicine_info();
    load_all_from_eeprom();

    motor_init();


    unsigned int ret_udp = LOS_OK;
    unsigned int thread_id_udp;
    TSK_INIT_PARAM_S task_udp = {0};
    printf("%s start ....\n", __FUNCTION__);

    task_udp.pfnTaskEntry = (TSK_ENTRY_FUNC)wifi_udp_process;
    task_udp.uwStackSize = 10240;
    task_udp.pcName = "wifi_process";
    task_udp.usTaskPrio = 24;
    ret_udp = LOS_TaskCreate(&thread_id_udp, &task_udp);
    if (ret_udp != LOS_OK)
    {
        printf("Falied to create wifi_process ret:0x%x\n", ret_udp);
        return;
    }

    unsigned int thread_id_su;
    TSK_INIT_PARAM_S task_su = {0};
    unsigned int ret_su = LOS_OK;

    task_su.pfnTaskEntry = (TSK_ENTRY_FUNC)su_03t_thread;
    task_su.uwStackSize = 2048;
    task_su.pcName = "su-03t thread";
    task_su.usTaskPrio = 24;
    ret_su = LOS_TaskCreate(&thread_id_su, &task_su);
    if (ret_su != LOS_OK)
    {
        printf("Falied to create task ret:0x%x\n", ret_su);
        return;
    }


    unsigned int thread_id_key;
    TSK_INIT_PARAM_S task_key = {0};
    task_key.pfnTaskEntry = (TSK_ENTRY_FUNC)adc_process;
    task_key.uwStackSize = 2048;
    task_key.pcName = "adc process";
    task_key.usTaskPrio = 24;
    if (LOS_TaskCreate(&thread_id_key, &task_key) != LOS_OK) {
        printf("Failed to create ADC task\n");
        return;
    }
    
    unsigned int thread_id_lcd;
    TSK_INIT_PARAM_S task_lcd = {0};
    task_lcd.pfnTaskEntry = (TSK_ENTRY_FUNC)lcd_process;
    task_lcd.uwStackSize = 20480;
    task_lcd.pcName = "lcd process";
    task_lcd.usTaskPrio = 24;
    if (LOS_TaskCreate(&thread_id_lcd, &task_lcd) != LOS_OK) {
        printf("Failed to create LCD task\n");
        return;
    }
}

APP_FEATURE_INIT(test);