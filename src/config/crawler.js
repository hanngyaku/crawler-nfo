// 爬虫配置
export default {
    headless: undefined, // 无头模式，设置为 false 可以看到浏览器窗口
    maxConcurrency: 1,  // 最大并发数，设置为 1 可以避免被反爬
    minConcurrency: 3,  // 最小并发数
    maxRequestRetries: 3,  // 最大重试次数
    maxRequestsPerMinute: 30,  // 每分钟最大请求数    
}