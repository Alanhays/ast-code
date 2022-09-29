import requests
def logon(uid,pwd):
    headers = {
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
    cookies = {
        "ylogin": "1156530",
        "phpdisk_info": "AzZSYQNkBT8EMwRnDGZbCFQwUVoOZlwzAzZVNQU0U2FUZgM2VjFWb1VmDlcNYARqU2UFNQA6AGcHMghoBWIEPgM1UjIDNAUwBGUENwxmWzJUNlEyDjZcaAM5VT0FYlMwVDUDNlZiVmxVYw48DV4Eb1M7BTEAaQBgBzQIbgU0BDMDMlJh",
        "uag": "fefab721b7dae0e3e1acfd8d87738db4",
        "PHPSESSID": "60v0q5goei0t48h0790fs6voaqsi6e7e",
        "__51cke__": "",
        "__tins__21412745": "%7B%22sid%22%3A%201664444346299%2C%20%22vd%22%3A%201%2C%20%22expires%22%3A%201664446146299%7D",
        "__51laig__": "4",
        "folder_id_c": "6157664"
    }
    url = "http://up.woozooo.com/mlogin.php"
    data = {
            "task": "3",
            "uid": uid,
            "pwd": pwd,
            "setSessionId": "",
            "setSig": "",
            "setScene": "",
            "setToken": "",
            "formhash": "8157cea7"
        }
    response = requests.post(url, headers=headers, data=data)
    return response.headers['Set-Cookie']

cookie = logon("18607067551","suran0310#*")
print(cookie)

