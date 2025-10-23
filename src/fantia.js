import { PlaywrightCrawler } from 'crawlee';
import FunctionTools from './tools/functions.js';
import { format } from 'date-fns/format';
import fs from 'fs';
import path from 'path';
import configFantia from './config/fantia.js'

var config = {
    'savePath': "", // 保存路径
    'exts': [], // 要查找的文件后缀,
    'findPath': "", // 查找路径
}
const COOKIE_FILE = './fantia.json';
const NORMALIZED_COOKIE_FILE = "./fantia_normalized.json";
const cookies = FunctionTools.loadAndNormalize(COOKIE_FILE, NORMALIZED_COOKIE_FILE);

function MoveFile(id, exts, savePath, findPath) {
    var files = FunctionTools.findFilesBySuffix(findPath, exts);
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var fileId = FunctionTools.extractNumbersFromFilename(file);
        if(fileId != id) continue;
        var ext = path.extname(file);
        var newPath = `${savePath}/${id}${ext}`;
        fs.renameSync(file, newPath);
        console.log(`移动文件: ${file} -> ${newPath}`);
        return;
    }
}

const crawler = new PlaywrightCrawler({
    async requestHandler({ page, request, log }) {
        log.info(`访问中: ${request.url}`);

        // 创作者页面标题
        
        const title = await page.title();
        // console.log('页面标题:', title);        
        
        // 作品缩略图
        await page.waitForSelector(configFantia.selector.thumbnail, { timeout: configFantia.selectorTimeout });
        const thumbnails = await page.$$eval(configFantia.selector.thumbnail, els => els.map(e => e.src));
        // console.log('作品缩略图:', thumbnails);

        // 作品标签        
        await page.waitForSelector(configFantia.selector.tags, { timeout: configFantia.selectorTimeout });
        const tags = await page.$$eval(configFantia.selector.tags, els => els.map(e => e.textContent.trim()));
        // console.log('标签:', tags);

        // 作品studio
        await page.waitForSelector(configFantia.selector.studio, { timeout: configFantia.selectorTimeout });
        const studios = await page.$eval(configFantia.selector.studio, el => el.textContent.trim());
        console.log('工作室:', studios);

        // 作品简介
        await page.waitForSelector(configFantia.selector.plot, { timeout: configFantia.selectorTimeout });
        const plot = await page.$eval(configFantia.selector.plot, el =>{
            // 把 <br> 替换为换行符
            el.querySelectorAll('br').forEach(br => (br.outerHTML = '\n'));
            // 返回纯文本（去掉 HTML 标签）
            return el.innerText.trim();
        });        
        // console.log('简介:', plot);

        // 上传时间
        await page.waitForSelector(configFantia.selector.uploadtime, { timeout: 5000 });
        const uploadTime = await page.$eval(configFantia.selector.uploadtime, el => el.textContent.trim());
        const date = new Date(uploadTime);
        var dateStr = format(date, 'yyyy-MM-dd');
        var year = format(date, 'yyyy');
        console.log('上传时间:', dateStr, year);
        // 生成作品nfo
        var nfo = {
            plot: plot,
            title: title,
            originaltitle: title,
            year: year,
            premiered: dateStr,
            releasedate: dateStr,
            genre: tags,
            studio: studios[0]
        }
        // 提取id
        const url = request.url;
        const match = url.match(/posts\/(\d+)/);
        console.log('URL:', url);
        var postId = "";
        if (match) {
            postId = match[1];
            console.log('Post ID:', postId);
        } else {
            console.log('No post ID found in', url);
            return;
        }        
        // 保存数据
        var savePath = `${config.savePath}/${postId}/${postId}.nfo`;   
        const dir = path.dirname(savePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        FunctionTools.SaveNfo(savePath, nfo);
        var ext = path.extname(thumbnails[0]);
        await FunctionTools.DownloadImage(thumbnails[0], `${config.savePath}/${postId}/${postId}${ext}`);
        // 移动视频到指定目录
        MoveFile(postId, config.exts, `${config.savePath}/${postId}`, config.findPath);
    },

    preNavigationHooks: [
        async ({ page, request, log }, gotoOptions) => {
            // 👇 修改等待事件为 'domcontentloaded'，比默认的 'load' 快很多
            gotoOptions.waitUntil = 'commit';

            // 注入 cookie
            if (fs.existsSync(NORMALIZED_COOKIE_FILE)) {
                // const cookies = JSON.parse(fs.readFileSync(NORMALIZED_COOKIE_FILE));
                await page.context().addCookies(cookies);
                log.info('已载入登录 cookie');
            }
        },
    ],
    
    // headless: false,
    // maxConcurrency: 1,  // 最大并发数
    // minConcurrency: 3,  // 最小并发数
    // maxRequestRetries: 3,  // 最大重试次数
    // maxRequestsPerMinute: 30,  // 每分钟最大请求数
    // keepAlive: true,  // 保持连接
    // launchContext: {
    //     useIncognitoPages: false, // ！不要每次新建隐身页面
    // },
    // persistCookiesPerSession: true, // 在 session 内保持 cookie
});

// 启动爬虫
async function Crawler() {
    // todo 需要的参数：
    // 1. 查找目录
    // 2. 查找文件后缀
    // 3. 保存目录
    var dir = 'D:\\test\\fantia\\FANTIA3662457';
    var suffix = ['.mp4', '.mkv'];
    var saveDir = 'D:\\test\\fantia\\#整理完成';

    var time = new Date();
    var files = FunctionTools.findFilesBySuffix(dir, suffix);
    var urls = [];
    files.forEach(file => {
        const numbers = FunctionTools.extractNumbersFromFilename(file);
        if(numbers) {
            urls.push(`https://fantia.jp/posts/${numbers}`);
        }        
    });
    // console.log(urls);
    config.savePath = saveDir;
    config.exts = suffix;
    config.findPath = dir;
    // 启动爬虫
    await crawler.run(urls);
    console.log(`共耗时: ${new Date() - time}ms`);
}
Crawler();