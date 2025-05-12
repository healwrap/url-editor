import { onMessage, sendMessage } from '~/messaging';

onMessage('getLinks', (message) => {
  console.log(`获取${message.data}链接`);
  const res = {};
  Object.values(message.data).forEach((key) => {
    switch (key) {
      case 'iframe':
        const iframes = document.querySelectorAll('iframe');
        res[key] = Array.from(iframes)
          .map((iframe) => iframe.src)
          .filter((src) => src)
          .map((item, index) => ({ url: item, key: index }));
        break;
      case 'a':
        const aElems = document.querySelectorAll<HTMLAnchorElement>('a');
        res[key] = Array.from(aElems)
          .map((link) => link.href)
          .filter((link) => link)
          .map((link, index) => ({ url: link, key: index }));
        break;
      case 'img':
        const imgElems = document.querySelectorAll<HTMLImageElement>('img');
        res[key] = Array.from(imgElems)
          .map((img) => img.src)
          .filter((src) => src)
          .map((src, index) => ({ url: src, key: index }));
        break;
      default:
        break;
    }
  });
  return res;
});
