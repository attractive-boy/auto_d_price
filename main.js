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
    console.log('当前url：', page.url());

    // 检测当前url是否被重定向到 /home/about
    if (page.url().includes('/home/about')) {
        // url到 登录
        await page.goto('https://accounts.commerce.naver.com/login?url=https%3A%2F%2Fsell.smartstore.naver.com%2F%23%2Flogin-callback')
        await page.waitForLoadState('networkidle');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForLoadState('load');
        await new Promise(resolve => {
            process.stdout.write('请在浏览器中登录后按回车继续...');
            process.stdin.once('data', () => {
                resolve();
            });
        })
        // 等待进入dashboard页面
        await page.waitForURL('**/home/dashboard');
        // 保存状态
        await context.storageState({ path: './storage/state.json' });

    }
    if (page.url().includes('/login')) {
        await new Promise(resolve => {
            process.stdout.write('请在浏览器中登录后按回车继续...');
            process.stdin.once('data', () => {
                resolve();
            });
        })

        await page.waitForURL('**/home/dashboard');

        // 保存状态
        await context.storageState({ path: './storage/state.json' });
    }
    if (page.url().includes('/certify')) {
        await new Promise(resolve => {
            process.stdout.write('请在浏览器中登录后按回车继续...');
            process.stdin.once('data', () => {
                resolve();
            });
        })

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

            //关闭除了第一个页面
            const pages = await context.pages();
            if (pages.length > 1) {
                for (let i = 1; i < pages.length; i++) {
                    await pages[i].close();
                }
            }

            // 打开 管理端页面
            await page.goto('https://center.shopping.naver.com/product/manage');
            await page.waitForLoadState('networkidle');
            await page.waitForLoadState('domcontentloaded');
            await page.waitForLoadState('load');

            await page.goto('https://adcenter.shopping.naver.com/iframe/product/manage/service/list.nhn?status=MODEL_MATCHED#');
            await page.waitForLoadState('networkidle');
            await page.waitForLoadState('domcontentloaded');
            await page.waitForLoadState('load');
            console.log('处理url', row['검색 URL']);
            const url = row['검색 URL'];
            // https://search.shopping.naver.com/catalog/35675942365 提取 35675942365
            const productId = url.match(/(\d+)$/)[1];
            //test
            // const productId = '50504036503';
            console.log('productId:', productId);
            let secondPage;
            // 点击包含 35675942365 的 a标签  //a[contains(text(), '${productId}')]
            try {
                await page.locator(`xpath=//a[contains(text(), '${productId}')]`).click();
                // 等待新标签页打开
                await page.waitForTimeout(2000); // 给予足够时间让新标签页打开
                const pages = await context.pages();
                if (pages.length < 2) {
                    continue;
                }
                secondPage = pages[1];
                await secondPage.bringToFront();
                await secondPage.waitForLoadState('networkidle');
                await secondPage.waitForLoadState('domcontentloaded');
                await secondPage.waitForLoadState('load');
            } catch (e) {
                continue;
            }
            const price_map = new Map();
            //遍历 tbody //*[@id="content"]/div[1]/div/div[2]/div[2]/table/tbody
            const tbody = await secondPage.locator('xpath=//*[@id="content"]/div[1]/div/div[2]/div[2]/table/tbody');

            console.log('tbody', await tbody.isVisible());
            if (await tbody.isVisible()) {
                const trs = await secondPage.locator('xpath=//*[@id="content"]/div[1]/div/div[2]/div[2]/table/tbody/tr').all();
                for (const tr of trs) {
                    const price = await tr.locator('td:nth-child(2) a strong').textContent();
                    const shop_name = await tr.locator('td:nth-child(1) div a').textContent();
                    price_map.set(shop_name, price.replace(/,/g, ''));
                }
            }
            console.log('price_map', price_map);
            const local_shop_name = "한빛2020";
            const local_price = price_map.get(local_shop_name);
            console.log('local_price', local_price);
            //遍历map 查询是否有比本价格低的价格
            if (local_price) {
                // 找到比本价格低的价格
                for (const [shop_name, price] of price_map) {
                    if (Number(price) < Number(local_price) ) {
                        if (shop_name == local_shop_name) {
                            continue;
                        }
                        if (Number(price) - 10 < Number(row["최저가"])) {
                            continue;
                        }
                        
                        console.log(`${shop_name} 的价格比本价格低`);
                        
                        //执行改价逻辑
                    
                        // 从第一个页面提取商品id
                        const productLink = await page.locator(`xpath=//a[contains(text(), '${productId}')]`).first();
                        const productTr = await productLink.locator('xpath=ancestor::tr').first();

                        //提取第三个td 下的 div下的 第二个p标签的文字
                        const productName = await productTr.locator('td:nth-child(3) div p:nth-child(2)').textContent();
                        console.log('商品ID：', productName);

                        //第二个页面跳转到  https://sell.smartstore.naver.com/#/products/origin-list
                        await secondPage.goto('https://sell.smartstore.naver.com/#/products/origin-list');
                        await secondPage.waitForLoadState('networkidle');
                        await secondPage.waitForLoadState('domcontentloaded');
                        await secondPage.waitForLoadState('load');

                        //输入商品id //*[@id="seller-content"]/ui-view/div[3]/ui-view[1]/div[2]/form/div[1]/div/ul/li[1]/div/div/div[2]/textarea 然后点击查询
                        await secondPage.locator('xpath=//*[@id="seller-content"]/ui-view/div[3]/ui-view[1]/div[2]/form/div[1]/div/ul/li[1]/div/div/div[2]/textarea').fill(productName);
                        //点击查询 //*[@id="seller-content"]/ui-view/div[3]/ui-view[1]/div[2]/form/div[2]/div/button[1]
                        await secondPage.locator('xpath=//*[@id="seller-content"]/ui-view/div[3]/ui-view[1]/div[2]/form/div[2]/div/button[1]').click();
                        await secondPage.waitForLoadState('networkidle');
                        await secondPage.waitForLoadState('domcontentloaded');
                        await secondPage.waitForLoadState('load');

                        //选择商品 //*[@id="seller-content"]/ui-view/div[3]/ui-view[2]/div[1]/div[2]/div[3]/div/div/div/div/div[3]/div[1]/div/div[1]/div/span[1]
                        await secondPage.locator('xpath=//*[@id="seller-content"]/ui-view/div[3]/ui-view[2]/div[1]/div[2]/div[3]/div/div/div/div/div[3]/div[1]/div/div[1]/div/span[1]').click();
                        await secondPage.waitForLoadState('networkidle');
                        await secondPage.waitForLoadState('domcontentloaded');
                        await secondPage.waitForLoadState('load');

                        //点击价格 //*[@id="seller-content"]/ui-view/div[3]/ui-view[2]/div[1]/div[2]/div[3]/div/div/div/div/div[3]/div[2]/div/div/div/div[3]
                        await secondPage.locator('xpath=//*[@id="seller-content"]/ui-view/div[3]/ui-view[2]/div[1]/div[2]/div[3]/div/div/div/div/div[3]/div[2]/div/div/div/div[3]').click();
                        await secondPage.waitForLoadState('networkidle');
                        await secondPage.waitForLoadState('domcontentloaded');
                        await secondPage.waitForLoadState('load');

                        //修改 //*[@id="seller-content"]/ui-view/div[3]/ui-view[2]/div[1]/div[2]/div[3]/div/div/div/div/div[3]/div[2]/div/div/div/div[3]/span/input
                        await secondPage.locator('xpath=//*[@id="seller-content"]/ui-view/div[3]/ui-view[2]/div[1]/div[2]/div[3]/div/div/div/div/div[3]/div[2]/div/div/div/div[3]/span/input').fill(Number(price) - 10);

                        //点击保存 //*[@id="seller-content"]/ui-view/div[3]/ui-view[2]/div[1]/div[3]/div/button
                        await secondPage.locator('xpath=//*[@id="seller-content"]/ui-view/div[3]/ui-view[2]/div[1]/div[3]/div/button').click();
                        await secondPage.waitForLoadState('networkidle');
                        await secondPage.waitForLoadState('domcontentloaded');
                        await secondPage.waitForLoadState('load');
                        
                    }
                }
            }
        }
    }


})();