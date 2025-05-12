import { Tabs } from 'antd';
import React, { useEffect, useState } from 'react';
import type Browser from 'webextension-polyfill';
import browser from 'webextension-polyfill';

import styles from './index.module.scss';
import EditCurrent from './pages/edit-current';
import GetRequest from './pages/get-request';
import GetUrls from './pages/get-urls';
import QuickJump from './pages/quick-jump';
import GithubBanner from './components/github-banner';

const { TabPane } = Tabs;

export const ConfigContext = React.createContext<{ tab?: Browser.Tabs.Tab }>({});

const App = () => {
  const [tab, setTab] = useState<Browser.Tabs.Tab>();
  
  // 改进获取当前tab的方式，使用activeTab权限更可靠
  useEffect(() => {
    const getCurrentTab = async () => {
      try {
        // 使用查询参数获取当前标签页
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        
        if (tabs && tabs.length > 0) {
          console.log('成功获取当前标签页:', tabs[0]);
          setTab(tabs[0]);
        } else {
          console.error('无法获取当前标签页信息');
        }
      } catch (error) {
        console.error('获取当前标签页出错:', error);
      }
    };
    
    getCurrentTab();
  }, []);
  
  return (
    <ConfigContext.Provider value={{ tab }}>
      <div className={styles['popup-container']}>
        <Tabs defaultActiveKey="1" onChange={(key) => key === '4' && window.open('./options.html', '__blank')}>
          <TabPane tab="编辑URL" key="1">
            <EditCurrent></EditCurrent>
          </TabPane>
          <TabPane tab="抓取链接" key="2">
            <GetUrls></GetUrls>
          </TabPane>
          <TabPane tab="快捷跳转" key="3">
            <QuickJump></QuickJump>
          </TabPane>
          <TabPane tab="使用教程" key="4"></TabPane>
          <TabPane tab="获取请求链接" key="5" disabled>
            <GetRequest></GetRequest>
          </TabPane>
        </Tabs>
        <GithubBanner />
      </div>
    </ConfigContext.Provider>
  );
};

export default App;
