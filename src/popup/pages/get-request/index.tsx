import { CopyOutlined, LinkOutlined, UndoOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Divider, List, message, Pagination, Segmented, Select, Space } from 'antd';
import ButtonGroup from 'antd/es/button/button-group';
import FormItem from 'antd/es/form/FormItem';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import browser from 'webextension-polyfill';
import type Browser from 'webextension-polyfill';
import { ConfigContext } from '~popup';
import { copyToClipboard, getLoginAccessURL, openPage, reloadPage } from '~popup/utils';

const loginAccessMap = {
  test: {
    'scene-1': {
      reg: '.*',
    },
    'scene-2': {
      reg: '.*',
    },
  },
  st: {
    'scene-1': {
      reg: '.*',
    },
    'scene-2': {
      reg: '.*',
    },
  },
  prod: {
    'scene-1': {
      reg: '.*',
    },
    'scene-2': {
      reg: '.*',
    },
  },
};

const { Option } = Select;

export default function App() {
  const { tab } = useContext(ConfigContext);
  const [selectedEnv, setSelectedEnv] = useState('test');
  const [selectedType, setSelectedType] = useState('scene-1');
  const [urlReg, setUrlReg] = useState('');
  const [open, setOpen] = useState(false);
  const [links, setLinks] = useState<{ url: string; key: number }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const paginatedLinks = links.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const port = useRef<Browser.Runtime.Port | null>();

  const handleOpen = async (open: boolean) => {
    setLinks([]);
    try {
      port.current = browser.runtime.connect({ name: 'popup' });
      port.current?.postMessage({ tabId: tab.id, urlReg, enable: open });
    } catch {
      message.error('与background通信失败，请手动刷新页面重试');
    }
  };
  const handleGetLoginAccessURL = async () => {
    const res = await getLoginAccessURL('test');
    if (!open) {
      message.error('请先打开请求监听');
      return;
    }
    if (!res.length) message.error('未获取到请求链接，尝试刷新页面');
    setLinks(res);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    setUrlReg(loginAccessMap[selectedEnv][selectedType].reg);
    setOpen(false);
  }, [selectedEnv, selectedType]);
  useEffect(() => {
    handleOpen(open);
    return () => {
      handleOpen(false);
    };
  }, [open]);

  return (
    <Card title="获取请求链接" extra={<p>定制一个请求匹配规则，然后可以获取到当前这个网页中的这个请求的URL</p>}>
      <Alert message="先打开请求监听，再点击刷新页面，即可获取请求链接" description="" showIcon />
      <Divider dashed />
      <FormItem label="环境">
        <Select value={selectedEnv} onChange={(value) => setSelectedEnv(value)} style={{ width: 200, marginRight: 20 }}>
          {Object.keys(loginAccessMap).map((env) => (
            <Option key={env} value={env}>
              {env}
            </Option>
          ))}
        </Select>
      </FormItem>
      <FormItem label="场景">
        <Select value={selectedType} onChange={(value) => setSelectedType(value)} style={{ width: 200 }}>
          {Object.keys(loginAccessMap[selectedEnv]).map((type) => (
            <Option key={type} value={type}>
              {type}
            </Option>
          ))}
        </Select>
      </FormItem>
      <div>当前匹配规则：{urlReg}</div>
      <Divider dashed />
      <Space direction="vertical">
        <Segmented
          options={[
            { label: '打开监听', value: true },
            { label: '关闭监听', value: false },
          ]}
          defaultValue={false}
          value={open}
          onChange={(val) => setOpen(val)}
        />
        <ButtonGroup>
          <Button type="primary" disabled={!open} onClick={() => handleGetLoginAccessURL()}>
            获取请求链接
          </Button>
          <Button type="primary" icon={<UndoOutlined />} onClick={() => (links && setLinks([]), reloadPage(tab))}>
            刷新页面
          </Button>
        </ButtonGroup>
      </Space>
      <Divider dashed />
      <List
        itemLayout="horizontal"
        dataSource={paginatedLinks}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(item.url)}>
                复制
              </Button>,
              <Button icon={<LinkOutlined />} onClick={() => openPage(tab, item.url)}>
                跳转
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={
                <div
                  style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.url}
                </div>
              }
            />
          </List.Item>
        )}
      />
      <Pagination
        current={currentPage}
        pageSize={pageSize}
        total={links.length}
        onChange={handlePageChange}
        style={{ marginTop: 20, textAlign: 'center' }}
      />
      <Divider dashed plain>
        历史请求链接(考虑做，评估实用性)
      </Divider>
    </Card>
  );
}
