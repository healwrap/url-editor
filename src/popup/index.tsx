import { Tabs } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import type Browser from 'webextension-polyfill';
import browser from 'webextension-polyfill';

import styles from './index.module.scss';
import EditCurrent from './pages/edit-current';
import GetRequest from './pages/get-request';
import GetUrls from './pages/get-urls';
import QuickJump from './pages/quick-jump';
import StoreData from './pages/store-data';
import GithubBanner from './components/github-banner';

const { TabPane } = Tabs;

export const ConfigContext = React.createContext<{ tab?: Browser.Tabs.Tab }>({});

const App = () => {
  const [tab, setTab] = useState<Browser.Tabs.Tab>();
  useEffect(() => {
    browser.tabs.query({ active: true, currentWindow: true }).then((tab) => {
      console.log(tab);
      setTab(tab[0]);
    });
  }, []);
  return (
    <ConfigContext.Provider value={{ tab }}>
      <div className={styles['popup-container']}>
        <Tabs defaultActiveKey="1" onChange={(key) => key === '6' && window.open('./options.html', '__black')}>
          <TabPane tab="编辑当前页面" key="1">
            <EditCurrent></EditCurrent>
          </TabPane>
          <TabPane tab="获取请求链接" key="2">
            <GetRequest></GetRequest>
          </TabPane>
          <TabPane tab="获取链接" key="3">
            <GetUrls></GetUrls>
          </TabPane>
          <TabPane tab="储存信息" key="4">
            <StoreData></StoreData>
          </TabPane>
          <TabPane tab="相关链接" key="5">
            <QuickJump></QuickJump>
          </TabPane>
          <TabPane tab="使用教程(打开外链)" key="6"></TabPane>
        </Tabs>
        <GithubBanner />
      </div>
    </ConfigContext.Provider>
  );
};

export default App;
