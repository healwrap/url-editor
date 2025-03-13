import { message } from 'antd';
import type Browser from 'webextension-polyfill';

import { sendMessage } from '~messaging';

export const getCurrentURL = async (tab: Browser.Tabs.Tab) => {
  return await sendMessage('getURL', undefined, { tabId: tab.id });
};

export const getLinks = async (tab: Browser.Tabs.Tab, categories: string[]) => {
  return await sendMessage('getLinks', categories, { tabId: tab.id });
};

export const openPage = async (tab: Browser.Tabs.Tab, url: string) => {
  return await sendMessage('openURL', url, { tabId: tab.id });
};

export const reloadPage = async (tab: Browser.Tabs.Tab, url?: string) => {
  return await sendMessage('reloadPage', url, { tabId: tab.id });
};

export const forwardAndBack = async (tab: Browser.Tabs.Tab, action: 'forward' | 'back') => {
  return await sendMessage('forwardAndBack', { action }, { tabId: tab.id });
};

export const getLoginAccessURL = async (key: string) => {
  return await sendMessage('getLoginAcessURL', key);
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
