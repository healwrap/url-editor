import { Card, Image } from 'antd';
import React from 'react';

export default function App() {
  return (
    <Card title="使用教程" styles={{ body: { maxWidth: 600 } }}>
      <h2>安装插件、固定到工具栏</h2>
      <p>1. 将编译产物，以解压拓展程序的方式引入</p>
      <Image src="https://picgo-img-repo.oss-cn-beijing.aliyuncs.com/img/2ca01e450d49f7faac6f8ede1b5ca98b.png" alt="" />
      <p>2. 固定到工具栏，方便调试</p>
      <Image src="https://picgo-img-repo.oss-cn-beijing.aliyuncs.com/img/63d6a309342baf90bcc952cdbf351ffd.png" />
      <h2>编辑页面URL</h2>
      <p>1. 启动插件，选择第一个Tab，可以使用编辑页面URL功能</p>
      <p>
        2. 或者使用快捷键 <code>Ctrl/Cmd+Shift+1</code> 打开插件
      </p>
    </Card>
  );
}
