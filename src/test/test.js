import  FunctionTools from '../tools/functions.js';
import { format } from 'date-fns/format';
const nfo = {
    plot: '作品简介内容...',
    title: '3072923 ❤ スターレ〇ル 花〇...',
    originaltitle: '❤ スターレ〇ル 花〇...',
    year: '2024',
    premiered: '2024-10-26',
    releasedate: '2024-10-26',
    genre: ['综合(男性向)', 'Cosplay', 'コスプレ', '素人', 'POV', '中出し', /* 其他标签 */],
    studio: 'ありすほりっく (ありすほりっく)' 
}
var nfostr = FunctionTools.SaveNfo('test.nfo', nfo);
console.log(nfostr);

const dateString = '2024/10/26 05:44';
const date = new Date(dateString);
const timestamp = date.getTime();

var dateStr = format(date, 'yyyy-MM-dd');
console.log(dateStr);

// 图片下载测试
var url = "https://c.fantia.jp/uploads/post/file/3072923/main_e93c4ab9-4650-43c9-8f9c-5305fef2b865.jpeg"
FunctionTools.DownloadImage(url, "thumb.jpeg");