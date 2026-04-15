// ==UserScript==
// @name         Gemini Firefox 剪贴板图片重命名修复
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  拦截 Firefox 下的粘贴事件，动态篡改事件中的文件对象并放行，原生兼容
// @author       Ran with Gemini 3.1 Pro
// @match        https://gemini.google.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // 必须挂载在 window 上，确保是第一个捕获到 paste 事件的监听器
    window.addEventListener('paste', function(e) {
        if (!e.clipboardData || !e.clipboardData.files || e.clipboardData.files.length === 0) {
            return;
        }

        const files = e.clipboardData.files;
        let hasImage = false;

        // DataTransfer 用于构建新的文件列表
        const dt = new DataTransfer();

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // 检查是否为图片文件
            if (file.type.startsWith('image/')) {
                hasImage = true;

                // 提取原后缀，生成全新的带时间戳和随机数的文件名
                const extension = file.name.includes('.') ? file.name.split('.').pop() : 'png';
                const newName = `screenshot_${Date.now()}_${Math.floor(Math.random()*1000)}.${extension}`;

                // 利用原文件的 Blob 数据创建一个新 File 对象，绝对不修改图片像素
                const newFile = new File([file], newName, { type: file.type });
                dt.items.add(newFile);
            } else {
                // 如果是其他类型的文件，保持原样
                dt.items.add(file);
            }
        }

        if (hasImage) {
            // 【核心修改】：不阻断事件 (去掉 preventDefault 和 stopPropagation)
            // 直接覆盖原生事件对象的 clipboardData 属性，欺骗 Gemini 的前端框架
            Object.defineProperty(e, 'clipboardData', {
                value: dt,
                configurable: true,
                enumerable: true
            });

            // 就像什么都没发生过一样，让带有新文件名的事件继续传递给 Gemini 的原生处理程序
            console.log("[Tampermonkey] 成功伪装剪贴板图片，已交由 Gemini 自身处理。");
        }
    }, true);
})();