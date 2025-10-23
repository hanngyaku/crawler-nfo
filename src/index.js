// import { program } from "commander";
const { program } = require('commander');
const  Crawler = require('./fantia.js');
program
    .option('-m, --mode <string>', '运行模式', 'fantia')
    .option('-p, --path <string>', '目标url', )
    .option('-h, --headless <number>', '是否启动headless', 1)
    .option('-r, --retry <number>', '失败重试次数', 5)
    ;

program.parse(process.argv);
const options = program.opts();

console.log(options);

// 运行指定模式的脚本
Crawler();