
/*
 * @Author: 扑了空
 
 * @按照枫慕大佬一键上传例子修改的
 
 * @QQ:929320331，枫慕大佬QQ:766158258
 
 * @versioin: 1.0.0
 
 * @Date: 2021-02-23 14:0:05
 
 * @功能：一键上传到蓝奏云，增加文件路径选择与及优化UI界面

 */


"ui";

ui.statusBarColor("#FFFFA300");
ui.layout(
    <drawer id="drawer">
        <vertical>
            <appbar bg="#FFFFA300">
                <linear orientation="horizontal" gravity="center" >
                    <img src="file://./res/logo.png" gravity="center"w="30" h="30"  margin="10 10 10 10" />
                    <text id="公告栏" text="蓝奏云"textStyle="bold" textSize="30sp" textColor="#ffffff" singleLine = "true" ems="1" ellipsize="marquee" w="*" />
                </linear>
            </appbar>
            <viewpager id="viewpager" >
                {/*第一页singleLine="true"内容*/}
                <frame>
                    <vertical >
                        <card cardBackgroundColor="#FFFFA300" alpha="0.8" w="*" h="auto" margin="10 10 10 0" cardElevation="0" >
                        <card w="*" h="36" margin="1 1 1 1"  cardElevation="2dp" gravity="center_vertical"  cardBackgroundColor="#FFFFFF" foreground="?attr/selectableItemBackground" clickable="true">
                            <linear orientation="horizontal" gravity="center||left">
                                <img src="@drawable/ic_mood_black_48dp" w="20" h="20" circle="true" tint="#452507" margin="10 5" />
                                <text text="悬浮窗权限" textColor="#452507" textStyle="bold" textSize="15sp" />
                                <horizontal layout_width="match_parent"  gravity="right">
                                    <Switch id="overlayService" checked="{{Suspended}}" padding="8 0 8 0" textSize="15sp" textStyle="bold"  sclickable="true"/>
                                </horizontal>
                            </linear>
                        </card>
                        </card>
                        <card cardBackgroundColor="#FFFFA300" alpha="0.8" w="*" h="auto" margin="10 20 10 10" cardElevation="0" >
                            <card  alpha="1" margin="1 1 1 1" w="*" h="auto" cardElevation="2" >
                                <vertical >
                                    <horizontal>
                                        <text margin="10" text="蓝奏云账号:"/>
                                        <input id="账号" margin="10" layout_weight="1" textColor="#FFE23E45" textSize="12"     password="true" hint="请输入账号"/>
                                    </horizontal>
                                    
                                    <horizontal>
                                        <text margin="10" text="蓝奏云密码:"/>
                                        <input id="密码" margin="10" layout_weight="1" textColor="#FFE23E45" textSize="12"  hint="请输入密码" password="true"/>
                                    </horizontal>
                                    <horizontal>
                                        <text margin="10" text="folder_id:"/>
                                        <input id="folder_id" margin="10" layout_weight="1" textColor="#FFE23E45" textSize="12"  hint="抓包folder_id数据"/>
                                    </horizontal>
                                    
                                    <horizontal>
                                        <text margin="10" text="上传文件路径:"/>
                                        <input margin="10"id="text_test" text="" textColor="#FFE23E45" margin="10" layout_weight="1" textSize="13" hint="null"/>
                                        <card  id="calc" align="center"   margin="10 10 10 10" cardCornerRadius="5dp" cardElevation="0dp"  cardBackgroundColor="#FFFFA300" foreground="?selectableItemBackground">
                                            <text margin="10" gravity="center"w="auto" h="auto" textColor="black" text="文件选择"textSize="12"/>
                                        </card>
                                    </horizontal>
                                </vertical>
                            </card>
                        </card>
                        <horizontal margin="10" >
                            <text text="运行日记:"/>
                            <text margin="240 0 0 0" text="北京时间："/>
                            <text id="秒" w="auto"  />
                        </horizontal>
                        {/*运行日记*/}
                        <card cardBackgroundColor="#FFFFA300" alpha="0.8" margin="10 0 10 10" w="*" h="auto" cardElevation="0" >
                            <card  alpha="1" margin="1 1 1 1" w="*" h="800px" cardElevation="2" >
                                <com.stardust.autojs.core.console.ConsoleView id="console" margin="5 5 5 5" textSize="11sp" w="*"  />
                            </card>
                        </card>
                        <card  id="一键上传" gravity="center" margin="10 20 10 10" cardCornerRadius="5dp" cardElevation="0dp"  cardBackgroundColor="#FFFFA300" foreground="?selectableItemBackground">
                            <text margin="10" gravity="center"w="auto" h="26" textColor="black" text="一键上传"/>
                        </card>
                    </vertical>
                </frame>
                {/*第二页内容*/}
                <frame>
                    <vertical gravity="center" >
                        <androidx.swiperefreshlayout.widget.SwipeRefreshLayout id="swipe">
                            <webview id="str" h="*"/>
                        </androidx.swiperefreshlayout.widget.SwipeRefreshLayout>
                    </vertical>
                </frame>
                {/*分段*/}
            </viewpager>
        </vertical>
        
    </drawer>
);

//开启悬浮窗权限
var Suspended = android.provider.Settings.canDrawOverlays(context.getApplicationContext());
ui.overlayService.checked = Suspended
ui.overlayService.on("check", function(checked) {
    // 用户勾选悬浮窗的选项时，跳转到页面让用户去开启
    if (checked && !Suspended) {
        importClass(android.content.Intent);
        importClass(android.net.Uri);
        importClass(android.provider.Settings);
        var intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + context.getPackageName()));
        app.startActivity(intent); 
        toast("悬浮窗权限申请成功...");
    } else {
        //toast("已关闭悬浮窗权限");
    }
});

if (getStorage("账号")) {
    ui.账号.setText(getStorage("账号"))
}
if (getStorage("密码")) {
    ui.密码.setText(getStorage("密码"))
}
if (getStorage("folder_id")) {
    ui.folder_id.setText(getStorage("folder_id"))
}
if (getStorage("text_test")) {
    ui.text_test.setText(getStorage("text_test"))
}

ui.一键上传.on("click", function() {
    threads.start(function() {
        账号 = ui.账号.getText().toString()
        密码 = ui.密码.getText().toString()
        folder_id = ui.folder_id.getText().toString()
        text_test = ui.text_test.getText().toString()
        putStorage("账号", 账号);
        putStorage("密码", 密码);
        putStorage("folder_id", folder_id);
        putStorage("text_test", text_test);
        log("开始上传")
        up_files(text_test, folder_id, lzy_cookie(账号, 密码))
    })

})

function lzy_cookie(账号, 密码) {
    var temp = http.post("http://up.woozooo.com/mlogin.php", {
        "task": "3",
        "uid": 账号,
        "pwd": 密码,
        "setSessionId": "",
        "setSig": "",
        "setScene": "",
        "setToken": "",
        "formhash": "8157cea7"
    }, {
        "headers": {
            "Host": "up.woozooo.com",
            "Connection": "keep-alive",
            "Content-Length": "96",
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Origin": "https://up.woozooo.com",
            "X-Requested-With": "XMLHttpRequest",
            "User-Agent": "Mozilla/5.0 (Linux; Android 10; Redmi K20 Pro Build/QKQ1.190825.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/81.0.4044.138 Mobile Safari/537.36",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Dest": "empty",
            "Referer": "https://up.woozooo.com/mlogin.php?v",
            "Accept-Language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        }
    })
    var ck = temp.headers["Set-Cookie"]
    cookie = ck[0].toString().split(";")[0] + ";" + ck[1].toString().split(";")[0]
    // log(cookie)
    return cookie
}

function up_files(本地文件目录, folder_id, lzy_cookie) {
    if (!files.exists(本地文件目录)) {
        toastLog("文件不存在")
        return
    }
    log("请等待……")
    var up = http.postMultipart("https://up.woozooo.com/fileup.php", {
        "task": "1",
        "folder_id": folder_id.toString(),
        "upload_file": open(本地文件目录, "r")
    }, {
        "headers": {
            "Connection": "Keep-Alive",
            "Charset": "UTF-8",
            "Accept": "*/*",
            "Host": "up.woozooo.com",
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Redmi K30 Build/QKQ1.190825.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/83.0.4103.101 Mobile Safari/537.36',
            "Cookie": lzy_cookie
        }
    });
    log(up.body.json().info)
    return up.body.json().info
}

function putStorage(name, value) {
    var storage = storages.create("蓝奏云");
    storage.put(name, value);
}

function getStorage(name) {
    var storage = storages.create("蓝奏云");
    return storage.get(name);
}

function pathToArray(dir) {
    current_dir_array = new Array();
    current_dir_array = ["返回上级目录"];
    files.listDir(dir.join("")).forEach((i) => {
        if (files.isDir(dir.join("") + i)) {
            current_dir_array.push(i + "/");
        } else if (files.isFile(dir.join("") + i)) {
            current_dir_array.push(i);
        }
    });
    return current_dir_array;
}

ui.calc.click(() => {
    var current_dir_array, dir = ["/", "/sdcard/脚本/", "/"]; //存储当前目录
    function file_select(select_index) {
        switch (select_index) {
            case undefined:
                break;
            case -1:
                return;
            case 0:
                if (dir.length > 3) {
                    dir.pop();
                }
                break;
            default:
                if (files.isFile(files.join(dir.join(""), current_dir_array[select_index]))) {
                    let file_name = (files.join(dir.join(""), current_dir_array[select_index]))
                    //toast(file_name)
                    ui.text_test.setText(file_name);
                    return;

                } else if (files.isDir(files.join(dir.join(""), current_dir_array[select_index]))) {
                    dir.push(current_dir_array[select_index])
                }

        };
        current_dir_array = pathToArray(dir)
        dialogs.select("文件选择", current_dir_array).then(n => {
            file_select(n)
        });
    };
    file_select();
});

//北京时间
var resource = context.getResources();
input_container = activity.findViewById(getResourceID("input_container", "id"));

function getResourceID(name, defType) {
    return resource.getIdentifier(name, defType, context.getPackageName());
};

function logstr(str) {
    var date = new Date();
    var a = date.getHours();
    var b = date.getMinutes(); 
    var c = date.getSeconds(); 
    var time = "[" + a + ":" + b + ":" + c + "]";
    log(time + ":" + str);
}
threads.start(function() {
    setInterval(() => {
        ui.run(function() {
            ui.秒.setText(String(sj()))
        })
    }, 300)  
})

function sj() {
    var f = new Date();
    var f1 = f.getHours();
    var f2 = f.getMinutes();
    var f3 = f.getSeconds();
    return f1 + ":" + f2 + ":" + f3
}
//运行日记
function log(str) {
    let date = new Date()
    let h = date.getHours();
    h = h < 10 ? ("0" + h) : h;
    let minute = date.getMinutes();
    minute = minute < 10 ? ('0' + minute) : minute;
    let second = date.getSeconds();
    second = second < 10 ? ('0' + second) : second;
    console.verbose("[" + h + ':' + minute + ':' + second + "]" + "—" + str)
}
ui.console.setColor("V", "#FFE23E45");
ui.console.setConsole(runtime.console);
//调整大小
recy = ui.console.logList
adapter = recy.getAdapter()
recy.setAdapter(new JavaAdapter(Packages[adapter.getClass().getName()], {
    onBindViewHolder: function(vh, i) {
        adapter.onBindViewHolder(vh, i)
        vh.textView.setTextSize(14)
    }
}, ui.console, null));
ui.console.setInputEnabled(false);
activity.window.setFlags(
    android.view.WindowManager.LayoutParams.FLAG_FULLSCREEN,
    android.view.WindowManager.LayoutParams.FLAG_FULLSCREEN
);
ui.str.loadUrl("https://pc.woozooo.com/mydisk.php");
//设置颜色
importClass(android.graphics.Color);
ui.swipe.setColorSchemeColors(Color.RED);
//监听刷新事件 
ui.swipe.setOnRefreshListener({
    onRefresh: function() {
        setTimeout(function() {
            ui.str.loadUrl("https://pc.woozooo.com/mydisk.php");
            ui.swipe.setRefreshing(false);
        }, 600);
    },
});