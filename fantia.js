import { PlaywrightCrawler } from 'crawlee';
import FunctionTools from './functions.js';
import { format } from 'date-fns/format';
import fs from 'fs';

const COOKIE_FILE = 'fantia.json';
const NORMALIZED_COOKIE_FILE = "fantia_normalized.json";
const cookies = FunctionTools.loadAndNormalize(COOKIE_FILE, NORMALIZED_COOKIE_FILE);

const crawler = new PlaywrightCrawler({
    async requestHandler({ page, request, log }) {
        log.info(`访问中: ${request.url}`);

        // 创作者页面标题
        const title = await page.title();
        console.log('页面标题:', title);

        // 获取作品标题
        const posts = await page.$$eval('.post-title a', els => els.map(e => e.textContent.trim()));
        console.log('作品标题:', posts);

        // 作品缩略图
        const thumbnails = await page.$$eval('.post-thumbnail.bg-gray.mt-30.mb-30.full-xs img', els => els.map(e => e.src));
        console.log('作品缩略图:', thumbnails);

        // 作品标签        
        const tags = await page.$$eval('.btn.btn-xs.btn-default.mr-5.mb-5', els => els.map(e => e.textContent.trim()));
        console.log('标签:', tags);

        // 作品studio
        const studios = await page.$$eval('.fanclub-name a', els => els.map(e => e.textContent.trim()));
        console.log('工作室:', studios);

        // 作品简介
        const plot = await page.$eval('.wysiwyg.mb-30', el =>{
            // 把 <br> 替换为换行符
            el.querySelectorAll('br').forEach(br => (br.outerHTML = '\n'));
            // 返回纯文本（去掉 HTML 标签）
            return el.innerText.trim();
        });        
        console.log('简介:', plot);

        // 上传时间
        const uploadTime = await page.$eval('.post-meta.d-flex.align-items-center.justify-content-between span', el => el.textContent.trim());
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
        // 下载缩略图保存文件
    },

    preNavigationHooks: [
        async ({ page, request, log }) => {
            // 注入 cookie
            if (fs.existsSync(NORMALIZED_COOKIE_FILE)) {
                // const cookies = JSON.parse(fs.readFileSync(NORMALIZED_COOKIE_FILE));
                await page.context().addCookies(cookies);
                log.info('已载入登录 cookie');
            }
        },
    ],
});

// 登录后才能访问的创作者页面示例
await crawler.run([
    'https://fantia.jp/posts/3072923'
]);
