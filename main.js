const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const CryptoJS = require('crypto-js'); // 引入加密库

(async () => {
    // 创建浏览器实例
    const browser = await chromium.launch({ headless: false });

    // 创建上下文并加载保存的状态
    const context = await browser.newContext({
        storageState: './storage/state.json'
    });

    // 创建页面
    const page = await context.newPage();

    // 打开dashboard页面
    await page.goto('https://sell.smartstore.naver.com/#/home/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('load');

    // 检测当前url是否被重定向到 /home/about
    if (page.url().includes('/home/about')) {
        console.log('当前未登录，正在登录...');
        // url到 登录
        await page.goto('https://accounts.commerce.naver.com/login?url=https%3A%2F%2Fsell.smartstore.naver.com%2F%23%2Flogin-callback')
        await page.waitForLoadState('networkidle');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForLoadState('load');
        //输入账号
        await page.locator('xpath=//*[@id="root"]/div/div[1]/div/div/div[4]/div[1]/div/ul[1]/li[1]/input').fill('stevensjrjohnedward@naver.com');
        //输入密码
        await page.locator('xpath=//*[@id="root"]/div/div[1]/div/div/div[4]/div[1]/div/ul[1]/li[2]/input').fill('sdh112211@');
        //点击登录
        await page.locator('xpath=//*[@id="root"]/div/div[1]/div/div/div[4]/div[1]/div/div/button').click();
        await page.waitForLoadState('networkidle');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForLoadState('load');
        //点击验证码发送
        await page.locator('xpath=//*[@id="root"]/div/div[1]/div/div/div/ul/li[1]/div/div[1]/div/div/div[2]/button').click();
        await page.waitForLoadState('networkidle');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForLoadState('load');
        //关闭确认弹窗
        await page.locator('xpath=//*[@id="root"]/div[1]/div/div/div/button[2]').click();
        await page.waitForLoadState('networkidle');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForLoadState('load');
        //等待控制台输入验证码
        const verificationCode = await new Promise(resolve => {
            process.stdout.write('请输入验证码：');
            process.stdin.once('data', data => {
                resolve(data.toString().trim());
            });
        })
        //输入验证码
        await page.locator('xpath=//*[@id="root"]/div/div[1]/div/div/div/ul/li[1]/div/div[3]/div/div[1]/div/div[1]/div/input').fill(verificationCode);
        await page.waitForLoadState('networkidle');
        await page.waitForLoadState('domcontentloaded')
        await page.waitForLoadState('load');
        // 点击登录
        await page.locator('xpath=//*[@id="root"]/div/div[1]/div/div/div/div[2]/button').click();
        await page.waitForLoadState('networkidle');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForLoadState('load');
        // 等待进入dashboard页面
        await page.waitForURL('**/home/dashboard');
        // 保存状态
        await context.storageState({ path: './storage/state.json' });

    }
    if (page.url().includes('/certify')) {
        console.log('当前未登录，正在登录...');
        //点击验证码发送
        await page.locator('xpath=//*[@id="root"]/div/div[1]/div/div/div/ul/li[1]/div/div[1]/div/div/div[2]/button').click();
        await page.waitForLoadState('networkidle');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForLoadState('load');
        //关闭确认弹窗
        await page.locator('xpath=//*[@id="root"]/div[1]/div/div/div/button[2]').click();
        await page.waitForLoadState('networkidle');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForLoadState('load');
        //等待控制台输入验证码
        const verificationCode = await new Promise(resolve => {
            process.stdout.write('请输入验证码：');
            process.stdin.once('data', data => {
                resolve(data.toString().trim());
            });
        })
        //输入验证码
        await page.locator('xpath=//*[@id="root"]/div/div[1]/div/div/div/ul/li[1]/div/div[3]/div/div[1]/div/div[1]/div/input').fill(verificationCode);
        await page.waitForLoadState('networkidle');
        await page.waitForLoadState('domcontentloaded')
        await page.waitForLoadState('load');
        // 点击登录
        await page.locator('xpath=//*[@id="root"]/div/div[1]/div/div/div/div[2]/button').click();
        await page.waitForLoadState('networkidle');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForLoadState('load');
        // 等待进入dashboard页面
        await page.waitForURL('**/home/dashboard');
        // 保存状态
        await context.storageState({ path: './storage/state.json' });
    }

    //检查当前目录是否有某个文件夹
    const folderName = 'run';
    const folderPath = path.join(__dirname, folderName);
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
    }

    //   查找文件夹下所有的excel文件
    const excelFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.xlsx'));
    //   遍历excel文件
    for (const excelFile of excelFiles) {
        //   读取excel文件
        const workbook = XLSX.readFile(path.join(folderPath, excelFile));
        // 转换成json
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        // 遍历json数据
        for (const row of jsonData) {
            // 打开商品详情页
            await page.goto(row['검색 URL']);
            await page.waitForLoadState('networkidle');
            await page.waitForLoadState('domcontentloaded');
            await page.waitForLoadState('load');
            var rcpt_num = 0;
            // 检查是否存在验证码
            while (await page.$('xpath=//*[@id="rcpt_img"]')) {
                console.log(`尝试第${rcpt_num}次输入验证码`);

                //点击刷新验证码
                await page.locator('xpath=//*[@id="rcpt_reload"]').click();
                await page.waitForLoadState('networkidle');
                await page.waitForLoadState('domcontentloaded');
                await page.waitForLoadState('load');
                //提取验证码图片 src
                const imageSrc = await page.locator('xpath=//*[@id="rcpt_img"]').getAttribute('src');
                //将base64转换为图片
                const base64Data = imageSrc.replace(/^data:image\/\w+;base64,/, "");
                const dataBuffer = Buffer.from(base64Data, 'base64');
                //随机生成一个文件名
                const fileName = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + '.jpg';
                console.log(`验证码图片文件名:${fileName}`);
                //使用左糖消除水印
                //获取oss凭证
                var res = await fetch("https://aw.aoscdn.com/app/picwish/authorizations/oss?product_id=482&language=zh", {
                    "headers": {
                        "accept": "application/json",
                        "accept-language": "zh-CN,zh;q=0.9",
                        "authorization": "Bearer v2,71351623,482,97b98214761168f25d9f8e06177ca429",
                        "cache-control": "no-cache",
                        "content-type": "application/json",
                        "pragma": "no-cache",
                        "priority": "u=1, i",
                        "referrer-policy": "no-referrer-when-downgrade",
                        "sec-ch-ua": "\"Google Chrome\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
                        "sec-ch-ua-mobile": "?0",
                        "sec-ch-ua-platform": "\"Windows\"",
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "cross-site",
                        "Referer": "https://picwish.cn/remove-image-watermark",
                        "Referrer-Policy": "no-referrer-when-downgrade"
                    },
                    "body": `{"filenames":["${fileName}"]}`,
                    "method": "POST"
                })
                res = await res.json()
                console.log(`获取oss凭证,status:${res.status}`);
                //使用左糖消除水印  
                if (res.status === 200) {
                    // 获取必要的签名参数
                    const accessKeySecret = res.data.credential.access_key_secret;
                    const verb = 'PUT';
                    const contentMD5 = CryptoJS.enc.Base64.stringify(
                        CryptoJS.MD5(CryptoJS.lib.WordArray.create(dataBuffer))
                    );
                    const contentType = 'image/jpeg';
                    // 使用标准的GMT格式日期
                    const date = new Date().toUTCString();

                    // 构建规范化的OSS头部
                    const ossHeaders = {};

                    // 添加x-oss-security-token头部（如果存在）
                    if (res.data.credential.security_token) {
                        ossHeaders['x-oss-security-token'] = res.data.credential.security_token;
                    }

                    // 按字典序排序OSS头部
                    const canonicalizedOSSHeaders = Object.keys(ossHeaders)
                        .sort()
                        .map(key => `${key}:${ossHeaders[key]}\n`)
                        .join('');

                    // 构建规范化的资源
                    const bucket = 'picwishsz';
                    const canonicalizedResource = `/${bucket}/${res.data.objects[fileName]}`;

                    // 构建字符串待签名
                    const stringToSign = verb + "\n"
                        + contentMD5 + "\n"
                        + contentType + "\n"
                        + date + "\n"
                        + canonicalizedOSSHeaders
                        + canonicalizedResource;

                    // 使用HMAC-SHA1计算签名并进行Base64编码
                    const signature = CryptoJS.enc.Base64.stringify(
                        CryptoJS.HmacSHA1(stringToSign, accessKeySecret)
                    );
                    res = await fetch(`https://picwishsz.oss-cn-shenzhen.aliyuncs.com/${res.data.objects[fileName]}`, {
                        "headers": {
                            "accept": "application/json",
                            "accept-language": "zh-CN,zh;q=0.9",
                            "authorization": `OSS ${res.data.credential.access_key_id}:${signature}`,
                            "content-type": "image/jpeg",
                            "sec-ch-ua": "\"Google Chrome\";v=\"135\", \"Not-A.Brand\";v=\"8\", \"Chromium\";v=\"135\"",
                            "sec-ch-ua-mobile": "?0",
                            "sec-ch-ua-platform": "\"macOS\"",
                            "sec-fetch-dest": "empty",
                            "sec-fetch-mode": "cors",
                            "sec-fetch-site": "cross-site",
                            "x-oss-callback": Buffer.from(JSON.stringify(res.data.callback)).toString('base64'),
                            "x-oss-date": date,
                            "x-oss-security-token": res.data.credential.security_token,
                            "Referer": "https://picwish.cn/remove-image-watermark",
                            "Referrer-Policy": "no-referrer-when-downgrade"
                        },
                        "body": `${dataBuffer}`,
                        "method": "PUT"
                    })

                    res = await res.json()

                    console.log(`上传oss,status:${res.status}`);
                    if (res.status === 200) {
                        // 调用左糖请求处理图片
                        res = await fetch("https://aw.aoscdn.com/app/picwish/tasks/login/auto-watermark-image?product_id=482&language=zh", {
                            "headers": {
                                "accept": "application/json",
                                "accept-language": "zh-CN,zh;q=0.9",
                                "authorization": "Bearer v2,71351623,482,97b98214761168f25d9f8e06177ca429",
                                "cache-control": "no-cache",
                                "content-type": "application/json",
                                "pragma": "no-cache",
                                "priority": "u=1, i",
                                "sec-ch-ua": "\"Google Chrome\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
                                "sec-ch-ua-mobile": "?0",
                                "sec-ch-ua-platform": "\"Windows\"",
                                "sec-fetch-dest": "empty",
                                "sec-fetch-mode": "cors",
                                "sec-fetch-site": "cross-site",
                                "Referer": "https://picwish.cn/remove-image-watermark",
                                "Referrer-Policy": "no-referrer-when-downgrade"
                            },
                            "body": `{"source_resource_id":"${res.data.resource_id}","task_type":""}`,
                            "method": "POST"
                        })

                        res = await res.json()
                        console.log(`调用左糖请求处理图片,status:${res.status}`);
                        if (res.status === 200) {
                            var after_url = "";
                            while (after_url === "") {
                                res = await fetch(`https://aw.aoscdn.com/app/picwish/tasks/login/auto-watermark-image/${res.data.task_id}?product_id=482&language=zh`, {
                                    "headers": {
                                        "accept": "application/json",
                                        "accept-language": "zh-CN,zh;q=0.9",
                                        "authorization": "Bearer v2,71351623,482,97b98214761168f25d9f8e06177ca429",
                                        "cache-control": "no-cache",
                                        "pragma": "no-cache",
                                        "priority": "u=1, i",
                                        "sec-ch-ua": "\"Google Chrome\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
                                        "sec-ch-ua-mobile": "?0",
                                        "sec-ch-ua-platform": "\"Windows\"",
                                        "sec-fetch-dest": "empty",
                                        "sec-fetch-mode": "cors",
                                        "sec-fetch-site": "cross-site",
                                        "Referer": "https://picwish.cn/remove-image-watermark",
                                        "Referrer-Policy": "no-referrer-when-downgrade"
                                    },
                                    "body": null,
                                    "method": "GET"
                                })
                                res = await res.json()
                                console.log(`获取处理结果,status:${res.status}`);
                                if (res.status === 200) {
                                    if (res.data.image !== "") {
                                        after_url = res.data.image;
                                        console.log(`处理结果:${after_url}`);
                                    }
                                }
                                // 等待1秒
                                sleep(1000);
                            }

                            //下载图片
                            const response = await fetch(after_url);
                            const buffer = await response.arrayBuffer();
                            const imageBuffer = Buffer.from(buffer);
                            
                        }


                    }

                }

                // 等待1秒
                sleep(1000);
                rcpt_num++;
            }



        }
    }


})();