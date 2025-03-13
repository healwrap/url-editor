import { onMessage, sendMessage } from '~/messaging';

onMessage('getURL', (message) => {
  const url = window.location.href;
  console.log('获取URL', url);
  return url;
});

onMessage('setURL', (message) => {
  try {
    // 如果当前url==message.data，则不会刷新页面
    if (window.location.href === message.data) return;
    window.location.href = message.data;
  } catch (err) {
    console.error(err);
    return false;
  }
  return true;
});

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
          .map((img, index) => ({ url: img, key: index }));
        break;
      default:
        break;
    }
  });
  return res;
});

onMessage('reloadPage', (message) => {
  console.log('reloadPage');

  // 如果传入url，则在当前页面打开
  if (message.data) {
    // 如果当前url==message.data，则不会刷新页面
    if (window.location.href === message.data) return;
    window.location.href = message.data;
  } else {
    window.location.reload();
  }
  return true;
});

onMessage('openURL', (message) => {
  window.open(message.data);
  return true;
});

onMessage('forwardAndBack', (message) => {
  if (message.data.action === 'forward') {
    window.history.forward();
  }
  if (message.data.action === 'back') {
    window.history.back();
  }
});
