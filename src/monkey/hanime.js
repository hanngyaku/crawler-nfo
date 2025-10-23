// ==UserScript==
// @name         Hanime1 NFO保存器（双输入框版）
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  一键爬取Hanime视频信息并生成NFO文件下载（带系列与命名输入框）
// @match        https://hanime1.me/watch*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    window.addEventListener('load', async () => {
        // 添加按钮
        const saveBtn = document.createElement('button');
        saveBtn.innerText = '💾 保存NFO';
        Object.assign(saveBtn.style, {
            position: 'fixed',
            top: '80px',
            right: '20px',
            zIndex: 9999,
            padding: '10px 20px',
            background: '#4CAF50',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
        });
        document.body.appendChild(saveBtn);

        // 点击按钮
        saveBtn.onclick = async () => {
            try {
                // 抓取网页信息
                const titleOrig = document.title.trim();
                const post = document.querySelector('.video-details-wrapper')?.textContent.trim() || '';
                // const tags = Array.from(document.querySelectorAll('.single-video-tag a')).map(e => e.textContent.trim());
                const plot = document.querySelector('.video-caption-text.caption-ellipsis')?.textContent.trim() || '';
                const studios = Array.from(document.querySelectorAll('#video-artist-name')).map(e => e.textContent.trim());
                const title = document.querySelector('.video-details-wrapper .video-description-panel > div:nth-child(2)')?.textContent.trim() || '';
                const dateText = document.querySelector('.video-details-wrapper .video-description-panel > div:nth-child(1)')?.textContent.trim() || '';
                const dateMatch = dateText.match(/(\d{4}-\d{2}-\d{2})/);
                const date = dateMatch ? dateMatch[0] : '';
                // 作品标签（清洗：去掉#、去掉括号数字、去掉最后两个add/remove）
                let tags = Array.from(document.querySelectorAll('.single-video-tag a'))
                    .map(e => e.textContent.trim())           // 原始文本
                    .map(t => t.replace(/^#/, ''))            // 去掉开头的 #
                    .map(t => t.trim())            // 去掉开头的 #
                    .map(t => t.replace(/\s*\(\d+\)\s*$/, ''))// 去掉后面的 (数字)
                    .filter(t => t && !/^(add|remove)$/i.test(t)); // 去掉空的和 add/remove
                // 去掉最后两个标签（通常是“add”、“remove”按钮）
                if (tags.length > 2) tags = tags.slice(0, -2);

                // 创建弹窗背景
                const overlay = document.createElement('div');
                Object.assign(overlay.style, {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 10000
                });

                // 弹窗框
                const modal = document.createElement('div');
                Object.assign(modal.style, {
                    background: '#fff',
                    padding: '20px',
                    borderRadius: '10px',
                    width: '320px',
                    textAlign: 'center',
                    boxShadow: '0 0 10px rgba(0,0,0,0.3)',
                    fontFamily: 'sans-serif'
                });
                modal.innerHTML = `
                    <h3 style="margin-bottom:10px;">保存 NFO</h3>
                    <div style="text-align:left;margin-bottom:10px;">
                        <label>系列名：</label><br>
                        <input id="seriesInput" type="text" placeholder="可留空" style="width:100%;padding:5px;border-radius:5px;border:1px solid #ccc;">
                    </div>
                    <div style="text-align:left;margin-bottom:15px;">
                        <label>文件名：</label><br>
                        <input id="fileNameInput" type="text" value="${title || titleOrig}" style="width:100%;padding:5px;border-radius:5px;border:1px solid #ccc;">
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <button id="cancelBtn" style="padding:6px 12px;background:#ccc;border:none;border-radius:5px;cursor:pointer;">取消</button>
                        <button id="confirmBtn" style="padding:6px 12px;background:#4CAF50;color:#fff;border:none;border-radius:5px;cursor:pointer;">保存</button>
                    </div>
                `;
                overlay.appendChild(modal);
                document.body.appendChild(overlay);

                // 事件绑定
                const cancelBtn = modal.querySelector('#cancelBtn');
                const confirmBtn = modal.querySelector('#confirmBtn');
                const seriesInput = modal.querySelector('#seriesInput');
                const fileNameInput = modal.querySelector('#fileNameInput');

                cancelBtn.onclick = () => {
                    document.body.removeChild(overlay);
                    alert('❌ 已取消保存。');
                };

                confirmBtn.onclick = () => {
                    const series = seriesInput.value.trim();
                    const fileName = fileNameInput.value.trim();
                    if (!fileName) {
                        alert('❌ 文件名不能为空！');
                        return;
                    }
                    document.body.removeChild(overlay);

                    // 构建NFO数据
                    const nfoData = {
                        plot,
                        title: title || titleOrig,
                        originaltitle: post,
                        year: date ? date.slice(0, 4) : '',
                        premiered: date,
                        releasedate: date,
                        genre: tags,
                        studio: studios.join(', '),
                        series: series
                    };

                    // 生成XML
                    let xmlContent = `<?xml version='1.0' encoding='utf-8'?>\n<movie>\n`;
                    if (nfoData.plot) xmlContent += `  <plot>${nfoData.plot}</plot>\n`;
                    if (nfoData.title) xmlContent += `  <title>${nfoData.title}</title>\n`;
                    if (nfoData.originaltitle) xmlContent += `  <originaltitle>${nfoData.originaltitle}</originaltitle>\n`;
                    if (nfoData.year) xmlContent += `  <year>${nfoData.year}</year>\n`;
                    if (nfoData.premiered) xmlContent += `  <premiered>${nfoData.premiered}</premiered>\n`;
                    if (nfoData.releasedate) xmlContent += `  <releasedate>${nfoData.releasedate}</releasedate>\n`;
                    if (nfoData.genre?.length > 0)
                        nfoData.genre.forEach(g => xmlContent += `  <genre>${g}</genre>\n`);
                    if (nfoData.studio) xmlContent += `  <studio>${nfoData.studio}</studio>\n`;
                    if (nfoData.series) xmlContent += `  <set>${nfoData.series}</set>\n`;
                    xmlContent += `</movie>`;

                    // 下载文件
                    const blob = new Blob([xmlContent], { type: 'application/xml' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = `${fileName}.nfo`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(a.href);

                    alert(`✅ NFO 已保存：${fileName}.nfo`);
                };
            } catch (err) {
                console.error('保存NFO时出错:', err);
                alert('❌ 保存失败，请查看控制台。');
            }
        };
    });
})();
