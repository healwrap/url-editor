import { message } from 'antd';
import type Browser from 'webextension-polyfill';
import browser from 'webextension-polyfill';

import { sendMessage } from '~messaging';

export const getCurrentURL = (tab: Browser.Tabs.Tab) => {
  if (!tab?.id) {
    console.error('无法获取tab信息');
    return '';
  }
  return tab.url || '';
};

export const setURL = async (tab: Browser.Tabs.Tab, url: string) => {
  if (!tab?.id) return false;
  try {
    await browser.tabs.update(tab.id, { url });
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

export const openPage = async (tab: Browser.Tabs.Tab, url: string) => {
  try {
    await browser.tabs.create({ url });
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

export const reloadPage = async (tab: Browser.Tabs.Tab, url?: string) => {
  if (!tab?.id) return false;
  try {
    if (url) {
      await browser.tabs.update(tab.id, { url });
    } else {
      await browser.tabs.reload(tab.id);
    }
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

export const forwardAndBack = async (tab: Browser.Tabs.Tab, action: 'forward' | 'back') => {
  if (!tab?.id) return false;
  try {
    if (action === 'forward') {
      await browser.tabs.goForward(tab.id);
    } else if (action === 'back') {
      await browser.tabs.goBack(tab.id);
    }
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

export const getRequestURL = async (key: string) => {
  return await sendMessage('getRequestURL', key);
};

export const getLinks = async (tab: Browser.Tabs.Tab, categories: string[]) => {
  return await sendMessage('getLinks', categories, { tabId: tab.id });
};

export const openAndCloseRequestListener = async (tabId: number, enable: boolean) => {
  return await sendMessage('openAndCloseRequestListener', { enable, tabId });
};

export const copyToClipboard = (value: string, msg?: string) => {
  navigator.clipboard.writeText(value);
  message.success(msg ?? '已复制到剪贴板！');
};

export const randomString = (length: number) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  return result;
};

export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function (...args: Parameters<T>) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}
