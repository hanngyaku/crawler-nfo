import { PlaywrightCrawler, ProxyConfiguration } from 'crawlee';
import FunctionTools from './tools/functions.js';
import fs from 'fs';

const COOKIE_FILE = 'hanime1.json';
const NORMALIZED_COOKIE_FILE = 'hanime1_normalized.json';
const cookies = FunctionTools.loadAndNormalize(COOKIE_FILE, NORMALIZED_COOKIE_FILE);
const PROXY = "http://127.0.0.1:10809"

const crawler = new PlaywrightCrawler({
    proxyConfiguration: new ProxyConfiguration({ proxyUrls: [PROXY] }),
    async requestHandler({ page, request, log }) {
        log.info(`访问中: ${request.url}`);

        // 创作者页面标题
        const titleOrig = await page.title();
        console.log('页面标题:', titleOrig);
                
        // 作品标题
        const post = await page.$eval('.video-details-wrapper', e =>  e.textContent.trim());
        console.log('作品标题:', post);

        // 作品标签        
        const tags = await page.$$eval('.single-video-tag a', els => els.map(e => e.textContent.trim()));
        console.log('标签:', tags);
        
        // 作品简介
        const plot = await page.$eval('.video-caption-text.caption-ellipsis', e => e.textContent.trim() );
        console.log('简介:', plot);

        // 作品studio
        const studios = await page.$$eval('#video-artist-name', els => els.map(e => e.textContent.trim()));
        console.log('工作室:', studios);

        // 提取视频标题
        const title = await page.$eval('.video-details-wrapper .video-description-panel > div:nth-child(2)', el => el.textContent.trim());
        console.log('视频标题:', title);

        // 提取发布日期
        const dateText = await page.$eval('.video-details-wrapper .video-description-panel > div:nth-child(1)', el => el.textContent.trim());        
        const dateMatch = dateText.match(/(\d{4}-\d{2}-\d{2})/);  // 匹配日期格式 YYYY-MM-DD
        const date = dateMatch ? dateMatch[0] : null;
        console.log('发布日期:', date);

        // await page.waitForTimeout(5000); // 等待2秒以确保页面加载完成
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

// hanime1手动处理并且输出结果
await crawler.run([
    'https://hanime1.me/watch?v=114599'
]);
