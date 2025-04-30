const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const CryptoJS = require('crypto-js'); // 引入加密库

// 创建日志目录
const logDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// 创建截图目录
const screenshotDir = path.resolve(process.cwd(), 'screenshots');
if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir);
}

// 创建日志文件
const logFile = path.join(logDir, `auto_price_${new Date().toISOString().replace(/[:.]/g, '-')}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// 日志函数
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message);
    logStream.write(logMessage);
}

// 截图函数
async function takeScreenshot(page, error) {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const screenshotPath = path.join(screenshotDir, `error_${timestamp}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        log(`错误截图已保存: ${screenshotPath}`);
        log(`错误信息: ${error.message}`);
    } catch (screenshotError) {
        log(`截图失败: ${screenshotError.message}`);
    }
}

(async () => {
    try {
        log('程序启动');
        // 当前时间大于 2025-05-15
        const now = new Date();
        const targetDate = new Date('2025-05-15');
        if (now > targetDate) {
            // log('程序已过期');
            return;
        }

        // 创建浏览器实例
        log('启动浏览器');
        const browser = await chromium.launch({ 
            headless: false,
            executablePath: './ms-playwright/chromium-1161/chrome-win/chrome.exe'  // 打包需要放出来//
         });

        // 创建上下文
        log('创建浏览器上下文');
        const context = await browser.newContext({
            viewport: { width: 1920, height: 1080 },  // 设置更大的窗口尺寸
            incognito: true  // 启用无痕模式
        });

        // 创建页面
        const page = await context.newPage();

        // 打开dashboard页面
        log('打开dashboard页面');
        await page.goto('https://sell.smartstore.naver.com/#/home/dashboard');
        await page.waitForLoadState('networkidle');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForLoadState('load');
        log(`当前url：${page.url()}`);

        // 检测当前url是否被重定向到 /home/about
        if (page.url().includes('/home/about')) {
            // url到 登录
            await page.goto('https://accounts.commerce.naver.com/login?url=https%3A%2F%2Fsell.smartstore.naver.com%2F%23%2Flogin-callback')
            await page.waitForLoadState('networkidle');
            await page.waitForLoadState('domcontentloaded');
            await page.waitForLoadState('load');
            await page.locator('xpath=//*[@id="root"]/div/div[1]/div/div/div[4]/div[1]/div/ul[1]/li[1]/input').fill('stevensjrjohnedward@naver.com');
            //输入密码
            await page.locator('xpath=//*[@id="root"]/div/div[1]/div/div/div[4]/div[1]/div/ul[1]/li[2]/input').fill('sdh112211@');
            await new Promise(resolve => {
                process.stdout.write('请在浏览器中登录后按回车继续...');
                process.stdin.once('data', () => {
                    resolve();
                });
            })
            // 等待进入dashboard页面
            await page.waitForURL('**/home/dashboard');

        }
        if (page.url().includes('/login')) {
            await page.locator('xpath=//*[@id="root"]/div/div[1]/div/div/div[4]/div[1]/div/ul[1]/li[1]/input').fill('stevensjrjohnedward@naver.com');
            //输入密码
            await page.locator('xpath=//*[@id="root"]/div/div[1]/div/div/div[4]/div[1]/div/ul[1]/li[2]/input').fill('sdh112211@');
            await new Promise(resolve => {
                process.stdout.write('请在浏览器中登录后按回车继续...');
                process.stdin.once('data', () => {
                    resolve();
                });
            })

            await page.waitForURL('**/home/dashboard');
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
        }

        //使用预定义的目录结构
        const folderName = 'run';
        const folderPath = path.resolve(process.cwd(), folderName);
        log(`开始处理文件夹：${folderPath}`);
        while (true) {
            //   查找文件夹下所有的excel文件
            const excelFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.xlsx'));
            log(`找到 ${excelFiles.length} 个Excel文件`);
            //   遍历excel文件
            for (const excelFile of excelFiles) {
                log(`处理文件：${excelFile}`);
                //   读取excel文件
                const workbook = XLSX.readFile(path.join(folderPath, excelFile));
                // 转换成json
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);
                log(`文件 ${excelFile} 包含 ${jsonData.length} 条数据`);
                // 遍历json数据
                for (const row of jsonData) {
                    log(`处理商品：${row['상품번호']}`);
                    //关闭除了第一个页面
                    const pages = await context.pages();
                    if (pages.length > 1) {
                        for (let i = 1; i < pages.length; i++) {
                            await pages[i].close();
                        }
                    }

                    // 打开 管理端页面
                    log('开始打开管理端页面');
                    await page.goto('https://center.shopping.naver.com/product/manage');
                    await page.waitForLoadState('networkidle');
                    await page.waitForLoadState('domcontentloaded');
                    await page.waitForLoadState('load');
                    log('管理端页面加载完成');

                    // 随机等待 2-5 秒
                    const waitTime1 = 2000 + Math.random() * 3000;
                    log(`等待 ${Math.round(waitTime1/1000)} 秒后继续`);
                    await page.waitForTimeout(waitTime1);

                    log('开始打开价格比较页面');
                    await page.goto('https://adcenter.shopping.naver.com/iframe/product/manage/service/list.nhn?status=MODEL_MATCHED#');
                    await page.waitForLoadState('networkidle');
                    await page.waitForLoadState('domcontentloaded');
                    await page.waitForLoadState('load');
                    log('价格比较页面加载完成');

                    // 随机等待 1-3 秒
                    const waitTime2 = 1000 + Math.random() * 2000;
                    log(`等待 ${Math.round(waitTime2/1000)} 秒后继续`);
                    await page.waitForTimeout(waitTime2);

                    log(`开始处理商品：${row['상품번호']}`);
                    log(`商品URL：${row['검색 URL']}`);
                    log(`最低价限制：${row["최저가"]}`);

                    // 在input 输入产品码，模拟人工输入
                    log('开始输入产品码');
                    const input = await page.locator('xpath=//*[@id="mallPidList"]');
                    await input.click();
                    await input.fill('');
                    for (const char of row['상품번호']) {
                        await input.type(char);
                        const charWaitTime = 100 + Math.random() * 200;
                        await page.waitForTimeout(charWaitTime);
                    }
                    log('产品码输入完成');

                    // 随机等待 0.5-2 秒
                    const waitTime3 = 500 + Math.random() * 1500;
                    log(`等待 ${Math.round(waitTime3/1000)} 秒后点击查询`);
                    await page.waitForTimeout(waitTime3);

                    // 点击查询
                    log('点击查询按钮');
                    await page.locator('xpath=//*[@id="searchBtn"]').click();
                    await page.waitForLoadState('networkidle');
                    await page.waitForLoadState('domcontentloaded');
                    await page.waitForLoadState('load');
                    log('查询完成，等待结果加载');

                    // 随机等待 2-4 秒
                    const waitTime4 = 2000 + Math.random() * 2000;
                    log(`等待 ${Math.round(waitTime4/1000)} 秒后继续`);
                    await page.waitForTimeout(waitTime4);

                    // 处理url
                    const url = row['검색 URL'];
                    const productId = url.match(/(\d+)$/)[1];
                    log(`提取商品ID：${productId}`);

                    const price_map = new Map();  // 移到这里，在 try 块外面声明
                    let secondPage;  // 同样移到这里

                    try {
                        log('开始点击商品链接');
                        const link = await page.locator(`xpath=//a[contains(text(), '${productId}')]`).first();
                        await link.click();
                        log('商品链接点击完成');

                        // 等待新标签页打开
                        log('等待新标签页打开');
                        let retryCount = 0;
                        while (retryCount < 10) {
                            const pages = await context.pages();
                            if (pages.length >= 2) {
                                log('新标签页已打开');
                                break;
                            }
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            retryCount++;
                            log(`等待新标签页，第 ${retryCount} 次尝试`);
                        }
                        
                        const pages = await context.pages();
                        if (pages.length < 2) {
                            log('新标签页打开失败，跳过当前商品');
                            continue;
                        }
                        secondPage = pages[1];
                        await secondPage.bringToFront();
                        log('切换到新标签页');
                        
                        // 等待页面加载完成
                        log('等待页面加载');
                        try {
                            // 等待页面基本加载
                            await secondPage.waitForLoadState('domcontentloaded', { timeout: 30000 });
                            
                            // 等待关键元素出现
                            await secondPage.waitForSelector('xpath=//*[@id="content"]/div[1]/div/div[2]/div[2]/table/tbody', {
                                state: 'visible',
                                timeout: 30000
                            });
                            
                            // 等待表格内容加载
                            const tbody = await secondPage.locator('xpath=//*[@id="content"]/div[1]/div/div[2]/div[2]/table/tbody');
                            await tbody.waitFor({ state: 'visible', timeout: 30000 });
                            
                            // 确保表格有内容
                            const trs = await secondPage.locator('xpath=//*[@id="content"]/div[1]/div/div[2]/div[2]/table/tbody/tr').all();
                            if (trs.length === 0) {
                                log('表格内容为空，跳过当前商品');
                                continue;
                            }
                            
                            log('页面加载完成');
                        } catch (loadError) {
                            log(`页面加载出现问题: ${loadError.message}`);
                            // 尝试截图记录问题
                            try {
                                await secondPage.screenshot({ 
                                    path: path.join(screenshotDir, `load_error_${new Date().toISOString().replace(/[:.]/g, '-')}.png`),
                                    fullPage: true 
                                });
                            } catch (screenshotError) {
                                log(`截图失败: ${screenshotError.message}`);
                            }
                            log('跳过当前商品，继续处理下一个');
                            continue;
                        }

                        const tbody = await secondPage.locator('xpath=//*[@id="content"]/div[1]/div/div[2]/div[2]/table/tbody');
                        const isTbodyVisible = await tbody.isVisible();
                        log(`价格表格是否可见：${isTbodyVisible}`);

                        if (isTbodyVisible) {
                            const trs = await secondPage.locator('xpath=//*[@id="content"]/div[1]/div/div[2]/div[2]/table/tbody/tr').all();
                            log(`找到 ${trs.length} 个价格记录`);
                            
                            for (const tr of trs) {
                                const price = await tr.locator('td:nth-child(2) a strong').textContent();
                                const shop_name = await tr.locator('td:nth-child(1) div a').textContent();
                                price_map.set(shop_name, price.replace(/,/g, ''));
                                log(`店铺 ${shop_name} 的价格：${price}`);
                            }
                        }

                        const local_shop_name = "한빛2020";
                        const local_price = price_map.get(local_shop_name);
                        log(`本地店铺 ${local_shop_name} 的价格：${local_price}`);
                        
                        // 找到除自己之外的最低价
                        let min_price = Infinity;
                        let min_price_shop = '';
                        
                        for (const [shop_name, price] of price_map) {
                            if (shop_name === local_shop_name) {
                                log(`跳过本地店铺 ${shop_name}`);
                                continue;
                            }
                            const price_num = Number(price);
                            log(`检查店铺 ${shop_name} 的价格：${price_num}`);
                            
                            if (price_num - 10 < Number(row["최저가"])) {
                                log(`店铺 ${shop_name} 的价格低于最低价限制，跳过`);
                                continue;
                            }
                            
                            if (price_num < min_price) {
                                min_price = price_num;
                                min_price_shop = shop_name;
                                log(`更新最低价：${min_price} (店铺：${min_price_shop})`);
                            }
                        }
                        
                        if (min_price < Number(local_price)) {
                            log(`发现更低价格：${min_price} (店铺：${min_price_shop})`);
                            log(`当前价格：${local_price}，差价：${Number(local_price) - min_price}`);
                            
                            //执行改价逻辑
                            log('开始执行调价操作');
                            // 从第一个页面提取商品id
                            const productLink = await page.locator(`xpath=//a[contains(text(), '${productId}')]`).first();
                            const productTr = await productLink.locator('xpath=ancestor::tr').first();

                            //提取第三个td 下的 div下的 第二个p标签的文字
                            const productName = await productTr.locator('td:nth-child(3) div p:nth-child(2)').textContent();
                            log('商品ID：', productName);

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
                            log('当前销售价格', current_price);
                            // 获取当前销售价格中的数字
                            const current_price_number = Number(current_price.replace(/,/g, ''));
                            log('当前销售价格数字', current_price_number);
                            // 当前销售价格应当减去 Number(local_price) - Number(min_price) - 10
                            const final_price = current_price_number - (Number(local_price) - Number(min_price) + 10);
                            log('最终价格', final_price);
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
                            
                            log(`调价完成，新价格：${final_price}`);
                        } else {
                            log('当前价格已经是最低，无需调价');
                        }
                    } catch (e) {
                        log(`处理商品时发生错误：${e.message}`);
                        log(`错误堆栈：${e.stack}`);
                        continue;
                    }
                }
            }
            // 每轮处理完后等待一段时间
            log('本轮处理完成，等待下一轮');
            await new Promise(resolve => setTimeout(resolve, 30000 + Math.random() * 30000));
        }
    } catch (error) {
        log(`发生错误: ${error.message}`);
        // 尝试获取当前页面并截图
        try {
            const pages = await context.pages();
            if (pages.length > 0) {
                await takeScreenshot(pages[0], error);
            }
        } catch (screenshotError) {
            log(`无法获取页面进行截图: ${screenshotError.message}`);
        }
        log('按任意键退出...');
        process.stdin.once('data', () => {
            log('程序退出');
            logStream.end();
            process.exit(1);
        });
    }
})();