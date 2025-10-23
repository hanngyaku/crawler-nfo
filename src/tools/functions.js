import fs from 'fs';
import path from 'path';
import axios from 'axios';

// const fs = require('fs');
// const path = require('path');
// const axios = require('axios');

var FunctionTools = {
    normalizeCookie: function (c) {
        // sameSite normalization
        let ss = c.sameSite;
        let sameSite;
        if (typeof ss === 'string') {
            const s = ss.toLowerCase();
            if (s === 'lax') sameSite = 'Lax';
            else if (s === 'strict') sameSite = 'Strict';
            else if (s === 'no_restriction' || s === 'none' || s === 'unspecified') sameSite = 'None';
            else sameSite = 'Lax';
        } else {
            sameSite = 'Lax';
        }

        const secure = !!c.secure;

        // Playwright requires SameSite=None cookies to be Secure
        if (sameSite === 'None' && !secure) {
            sameSite = 'Lax';
        }

        // expirationDate -> expires (integer seconds), if missing use -1
        let expires = -1;
        if (c.expirationDate !== undefined && c.expirationDate !== null) {
            try {
                expires = Math.floor(Number(c.expirationDate));
            } catch (e) {
                expires = -1;
            }
        }

        return {
            name: c.name,
            value: c.value,
            domain: c.domain,
            path: c.path || '/',
            expires,
            httpOnly: !!c.httpOnly,
            secure,
            sameSite,
        };
    },
    loadAndNormalize: function (rawPath, outPath) {
        if (!fs.existsSync(rawPath)) throw new Error(`Cannot find ${rawPath}`);
        const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
        const normalized = raw.map(FunctionTools.normalizeCookie);
        fs.writeFileSync(outPath, JSON.stringify(normalized, null, 2));
        return normalized;
    },

    /** 
     * 保存作品nfo
     * @param {string} path 保存路径
     * @param {{tags, title, studio, plot, originaltitle, year, premiered, releasedate}} nfo 作品nfo
     */
    SaveNfo: function (savePath, nfo) {
        // 确保目录存在
        const dir = path.dirname(savePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // 构建 XML 内容
        let xmlContent = `<?xml version='1.0' encoding='utf-8'?>
<movie>
`;

        // 添加 plot 标签
        if (nfo.plot) {
            xmlContent += `    <plot>${nfo.plot}</plot>
`;
        }

        // 添加 title 标签
        if (nfo.title) {
            xmlContent += `    <title>${nfo.title}</title>
`;
        }

        // 添加 originaltitle 标签
        if (nfo.originaltitle) {
            xmlContent += `    <originaltitle>${nfo.originaltitle}</originaltitle>
`;
        }

        // 添加 year 标签
        if (nfo.year) {
            xmlContent += `    <year>${nfo.year}</year>
`;
        }

        // 添加 premiered 标签
        if (nfo.premiered) {
            xmlContent += `    <premiered>${nfo.premiered}</premiered>
`;
        }

        // 添加 releasedate 标签
        if (nfo.releasedate) {
            xmlContent += `    <releasedate>${nfo.releasedate}</releasedate>
`;
        }

        // 添加 genre 标签（可能有多个）
        if (nfo.genre && Array.isArray(nfo.genre)) {
            nfo.genre.forEach(genre => {
                xmlContent += `    <genre>${genre}</genre>
`;
            });
        }

        // 添加 studio 标签
        if (nfo.studio) {
            xmlContent += `    <studio>${nfo.studio}</studio>
`;
        }

        // 关闭根标签
        xmlContent += `</movie>`;

        // 保存到文件
        fs.writeFileSync(savePath, xmlContent, 'utf-8');
        console.log(`NFO 文件已保存到: ${savePath}`);
    },

    DownloadImage: async function (url, savePath) {
        const writer = fs.createWriteStream(savePath);

        const response = await axios({
            method: 'GET',
            url,
            responseType: 'stream',  // 获取图片数据流
        });

        response.data.pipe(writer);  // 将流写入文件

        // 通过 writer 的 'finish' 事件来同步等待文件写入完成
        writer.on('finish', () => {
            console.log(`Downloaded ${url} to ${savePath}`);
        });

        writer.on('error', (err) => {
            console.error(`Error downloading ${url}:`, err);
        });
    },
    /**
     * 查找指定后缀的文件
     * @param {string} dir 目录路径
     * @param {string[]} suffix 后缀名，例如 '[".txt", ".md"]'
     * @returns {string[]} 找到的文件路径数组
     */
    findFilesBySuffix: function (dir, suffix) {
        let results = [];
        const list = fs.readdirSync(dir);  // 读取目录下的所有文件和文件夹

        list.forEach(file => {
            file = path.join(dir, file);  // 构建完整的文件路径
            const stat = fs.statSync(file);  // 获取文件状态

            if (stat && stat.isDirectory()) {
                // 如果是目录，递归查找
                results = results.concat(this.findFilesBySuffix(file, suffix));
            } else {
                // 如果是文件，检查后缀
                if (suffix.includes(path.extname(file))) {
                    results.push(file);  // 添加到结果数组
                }
            }
        })
        return results;
    },
    extractNumbersFromFilename: function (filename) {
        // 匹配文件名中的数字部分，不包括扩展名
        // 假设数字位于文件名末尾，扩展名之前
        const match = filename.match(/(\d+)\.[a-zA-Z0-9]+$/);
        if (match && match[1]) {
            return match[1]; // 返回匹配到的数字字符串
        }
        return null; // 如果没有找到数字，返回null
    }
}
// module.exports = FunctionTools

export default FunctionTools;