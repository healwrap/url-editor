import browser from 'webextension-polyfill';
import type Browser from 'webextension-polyfill';
import { onMessage } from '~messaging';
import URI from 'urijs';

// 扩展安装时打开选项页
browser.runtime.onInstalled.addListener(function (details) {
  if (details.reason === 'install') {
    // 打开指引页
    browser.tabs.create({ url: 'options.html' });
    // 打开popup
    browser.action.openPopup();
  }
});

browser.commands.onCommand.addListener((command) => {
  if (command === 'open-popup') {
    browser.action.openPopup();
  }
});

const urls = [];
let res = {};
let urlReg: RegExp;
const webRequestListener = (details: any) => {
  if (urlReg && urlReg.test(details.url)) urls.push(details);
};

onMessage('getRequestURL', (message) => {
  console.log('获取链接...');
  return urls;
});

// 打开监听
let isListenerActive = false;
browser.runtime.onConnect.addListener((port) => {
  type OpenListenerType = { tabId: number; enable: boolean; urlReg: string };
  if (port.name === 'popup') {
    port.onMessage.addListener((msg: OpenListenerType) => {
      if (!msg.tabId) return;
      console.log(msg);
      if (msg.urlReg) {
        urlReg = new RegExp(msg.urlReg);
      }
      if (msg.enable) {
        console.log('打开监听...');
        if (isListenerActive) {
          browser.webRequest.onBeforeRequest.removeListener(webRequestListener);
        }
        browser.webRequest.onBeforeRequest.addListener(webRequestListener, {
          urls: ['<all_urls>'],
          tabId: msg.tabId,
        });
        isListenerActive = true;
      } else {
        console.log('关闭监听...');
        browser.webRequest.onBeforeRequest.removeListener(webRequestListener);
        isListenerActive = false;
        urls.length = 0;
        res = {};
      }
    });
    port.onDisconnect.addListener(() => {
      console.log('关闭监听...');
      browser.webRequest.onBeforeRequest.removeListener(webRequestListener);
      isListenerActive = false;
      urls.length = 0;
      res = {};
    });
  }
});
