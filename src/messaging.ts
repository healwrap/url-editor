import { defineExtensionMessaging } from '@webext-core/messaging';

interface ProtocolMap {
  getLinks(data: string[]): { [key in string]: { url: string; key: number }[] };
  getRequestURL(data: string): any[];
  openAndCloseRequestListener(data: { enable: boolean; tabId: number }): boolean;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
