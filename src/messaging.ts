import { defineExtensionMessaging } from '@webext-core/messaging';

interface ProtocolMap {
  getURL(data: string): string;
  setURL(data: string): boolean;
  openURL(data: string): boolean;
  getLinks(data: string[]): { [key in string]: { url: string; key: number }[] };
  reloadPage(data: string): boolean;
  forwardAndBack(data: { action: 'forward' | 'back'; n?: number }): boolean;
  getLoginAcessURL(data: string): any[];
  openAndCloseRequestListener(data: { enable: boolean; tabId: number }): boolean;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
