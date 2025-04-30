const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const CryptoJS = require('crypto-js'); // 引入加密库

(async () => {
    try {

        // 当前时间大于 2025-05-15
        const now = new Date();
        const targetDate = new Date('2025-05-15');
        if (now > targetDate) {
            return;
        }

        // 创建浏览器实例
        const browser = await chromium.launch({ 
            headless: false,
            executablePath: './ms-playwright/chromium-1161/chrome-win/chrome.exe'  // 打包需要放出来
         });

        // 创建上下文并加载保存的状态
        const storagePath = path.resolve(process.cwd(), 'storage/state.json');
        const context = await browser.newContext({
            storageState: storagePath,
            viewport: { width: 1920, height: 1080 }  // 设置更大的窗口尺寸
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
            await context.storageState({ path: storagePath });

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
            await context.storageState({ path: storagePath });
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
            await context.storageState({ path: storagePath });
        }

        //使用预定义的目录结构
        const folderName = 'run';
        const folderPath = path.resolve(process.cwd(), folderName);
        while (true) {
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


                    console.log('获取产品码=>', row['상품번호']);
                    const productCode = row['상품번호'];

                    // 在input 输入产品码 //*[@id="mallPidList"]
                    await page.locator('xpath=//*[@id="mallPidList"]').fill(productCode);

                    // 点击查询 //*[@id="searchBtn"]
                    await page.locator('xpath=//*[@id="searchBtn"]').click();
                    await page.waitForLoadState('networkidle');
                    await page.waitForLoadState('domcontentloaded');
                    await page.waitForLoadState('load');

                    // 处理url
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
                        // 使用 JavaScript 点击元素
                        await page.evaluate((pid) => {
                            const elements = document.evaluate(
                                `//a[contains(text(), '${pid}')]`,
                                document,
                                null,
                                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                                null
                            );
                            if (elements.snapshotLength > 0) {
                                elements.snapshotItem(0).click();
                            }
                        }, productId);

                        // 等待新标签页打开
                        let retryCount = 0;
                        while (retryCount < 10) {
                            const pages = await context.pages();
                            if (pages.length >= 2) {
                                break;
                            }
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            retryCount++;
                        }
                        
                        const pages = await context.pages();
                        if (pages.length < 2) {
                            console.log('没有打开新标签页');
                            continue;
                        }
                        secondPage = pages[1];
                        await secondPage.bringToFront();
                        
                        // 等待页面加载完成
                        await secondPage.waitForLoadState('domcontentloaded');
                        await secondPage.waitForLoadState('load');
                        // 等待页面内容加载
                        await secondPage.waitForFunction(() => document.readyState === 'complete');
                    } catch (e) {
                        console.log('没有找到商品=>', e);
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
                    
                    // 找到除自己之外的最低价
                    let min_price = Infinity;
                    let min_price_shop = '';
                    
                    for (const [shop_name, price] of price_map) {
                        if (shop_name === local_shop_name) continue;
                        if (Number(price) - 10 < Number(row["최저가"])) {
                            continue;
                        }
                        const price_num = Number(price);
                        if (price_num < min_price) {
                            min_price = price_num;
                            min_price_shop = shop_name;
                        }
                    }
                    
                    if (min_price < Number(local_price)) {
                        console.log(`${min_price_shop} 的价格比本价格低`);
                        
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

                        //点击价格，使用 col-id 属性定位 and role  gridcell
                        //获取当前销售价格
                        const current_price = await secondPage.locator('xpath=//div[@col-id="salePrice" and @role="gridcell"]').textContent();
                        console.log('当前销售价格', current_price);
                        // 获取当前销售价格中的数字
                        const current_price_number = Number(current_price.replace(/,/g, ''));
                        console.log('当前销售价格数字', current_price_number);
                        // 当前销售价格应当减去 Number(local_price) - Number(min_price) - 10
                        const final_price = current_price_number - (Number(local_price) - Number(min_price) + 10);
                        console.log('最终价格', final_price);
                        await secondPage.locator('xpath=//div[@col-id="salePrice" and @role="gridcell"]').click();
                        await secondPage.waitForLoadState('networkidle');
                        await secondPage.waitForLoadState('domcontentloaded');
                        await secondPage.waitForLoadState('load');

                        //修改 //*[@id="seller-content"]/ui-view/div[3]/ui-view[2]/div[1]/div[2]/div[3]/div/div/div/div/div[3]/div[2]/div/div/div/div[3]/span/input
                        await secondPage.locator('xpath=//div[@col-id="salePrice" and @role="gridcell"]/span/input').fill(final_price.toString());

                        //点击保存 //*[@id="seller-content"]/ui-view/div[3]/ui-view[2]/div[1]/div[3]/div/button
                        await secondPage.locator('xpath=//*[@id="seller-content"]/ui-view/div[3]/ui-view[2]/div[1]/div[3]/div/button').click();
                        await secondPage.waitForLoadState('networkidle');
                        await secondPage.waitForLoadState('domcontentloaded');
                        await secondPage.waitForLoadState('load');
                        
                    }
                }
            }
        }
    } catch (error) {
        console.error('发生错误:', error);
        console.log('按任意键退出...');
        process.stdin.once('data', () => {
            process.exit(1);
        });
    }
})();