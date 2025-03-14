import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  LinkOutlined,
  SettingOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { useStorage } from '@plasmohq/storage/hook';
import { Alert, Button, Card, Divider, Input, List, message, Modal, Pagination, Segmented, Select, Space } from 'antd';
import ButtonGroup from 'antd/es/button/button-group';
import FormItem from 'antd/es/form/FormItem';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import browser from 'webextension-polyfill';
import type Browser from 'webextension-polyfill';
import { ConfigContext } from '~popup';
import { copyToClipboard, getRequestURL, openPage, reloadPage } from '~popup/utils';

// 替换原有的静态配置
interface CustomConfig {
  [env: string]: {
    [scene: string]: {
      reg: string;
    };
  };
}
export default function App() {
  const { tab } = useContext(ConfigContext);
  // 新增状态管理自定义配置
  const [customConfig, setCustomConfig] = useStorage<CustomConfig>('requestConfig', {});
  const [newEnv, setNewEnv] = useState('');
  const [newScene, setNewScene] = useState('');
  const [newReg, setNewReg] = useState('');
  const [selectedEnv, setSelectedEnv] = useState('请选择环境');
  const [selectedType, setSelectedType] = useState('请选择场景');
  const [urlReg, setUrlReg] = useState('');
  const [open, setOpen] = useState(false);
  const [links, setLinks] = useState<{ url: string; key: number }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const paginatedLinks = links.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const port = useRef<Browser.Runtime.Port | null>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState<'add' | 'edit' | null>(null);
  const [editingEnv, setEditingEnv] = useState('');
  const [editingScene, setEditingScene] = useState('');
  const [editingReg, setEditingReg] = useState('');
  const [searchEnv, setSearchEnv] = useState('');
  const [searchScene, setSearchScene] = useState('');

  const handleOpen = async (open: boolean) => {
    setLinks([]);
    try {
      port.current = browser.runtime.connect({ name: 'popup' });
      port.current?.postMessage({ tabId: tab.id, urlReg, enable: open });
    } catch {
      message.error('与background通信失败，请手动刷新页面重试');
    }
  };
  const handleGetRequestURL = async () => {
    const res = await getRequestURL('');
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

  // 新增配置表单
  const handleAddConfig = () => {
    if (!newEnv || !newScene || !newReg) {
      message.error('请填写完整配置信息');
      return;
    }
    setCustomConfig((prev) => ({
      ...prev,
      [newEnv]: {
        ...prev[newEnv],
        [newScene]: { reg: newReg },
      },
    }));
    setNewEnv('');
    setNewScene('');
    setNewReg('');
  };

  // 修改原有的useEffect
  useEffect(() => {
    if (customConfig[selectedEnv]?.[selectedType]) {
      setUrlReg(customConfig[selectedEnv][selectedType].reg);
    }
    if (selectedEnv && customConfig[selectedEnv]) {
      const firstScene = Object.keys(customConfig[selectedEnv])[0];
      setSelectedType(firstScene || '请选择场景');
    }
    setOpen(false);
  }, [selectedEnv, selectedType, customConfig]);

  useEffect(() => {
    handleOpen(open);
    return () => {
      handleOpen(false);
    };
  }, [open]);

  const obj = {
    dev: {
      scene: {},
    },
    test: {
      scene: {},
    },
    st: {
      scene1: {},
    },
  };

  // 打开添加模式
  const openAddMode = () => {
    setEditMode('add');
    setEditingEnv('');
    setEditingScene('');
    setEditingReg('');
  };

  // 打开编辑模式
  const openEditMode = (env: string, scene: string) => {
    setEditMode('edit');
    setEditingEnv(env);
    setEditingScene(scene);
    setEditingReg(customConfig[env][scene].reg);
  };

  // 保存配置
  const saveConfig = () => {
    if (!editingEnv || !editingScene || !editingReg) {
      message.error('请填写完整配置信息');
      return;
    }

    setCustomConfig((prev) => {
      const newConfig = { ...prev };
      if (editMode === 'add') {
        // 添加新配置
        newConfig[editingEnv] = newConfig[editingEnv] || {};
        newConfig[editingEnv][editingScene] = { reg: editingReg };
      } else if (editMode === 'edit') {
        // 编辑现有配置
        newConfig[editingEnv][editingScene].reg = editingReg;
      }
      return newConfig;
    });

    message.success(`${editMode === 'add' ? '添加' : '更新'}配置成功`);
    setEditMode(null);
  };

  // 删除配置
  const deleteConfig = (env: string, scene: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除环境 "${env}" 下的场景 "${scene}" 配置吗？`,
      onOk: () => {
        setCustomConfig((prev) => {
          const newConfig = { ...prev };
          delete newConfig[env][scene];

          // 如果环境下没有场景了，也删除环境
          if (Object.keys(newConfig[env]).length === 0) {
            delete newConfig[env];
          }

          // 如果删除的是当前选中的配置，重置选择
          if (selectedEnv === env && selectedType === scene) {
            setSelectedEnv('请选择环境');
            setSelectedType('请选择场景');
          }

          message.success('删除配置成功');
          return newConfig;
        });
      },
    });
  };

  // 过滤配置
  const filteredConfig = useMemo(() => {
    const result: Array<{ env: string; scene: string; reg: string }> = [];

    Object.keys(customConfig).forEach((env) => {
      if (!searchEnv || env.toLowerCase().includes(searchEnv.toLowerCase())) {
        Object.keys(customConfig[env]).forEach((scene) => {
          if (!searchScene || scene.toLowerCase().includes(searchScene.toLowerCase())) {
            result.push({
              env,
              scene,
              reg: customConfig[env][scene].reg,
            });
          }
        });
      }
    });

    return result;
  }, [customConfig, searchEnv, searchScene]);

  return (
    <Card title="获取请求链接" extra={<p>定制一个请求匹配规则，然后可以获取到当前这个网页中的这个请求的URL</p>}>
      <Alert message="先打开请求监听，再点击刷新页面，即可获取请求链接" description="" showIcon />

      <Divider dashed plain>
        自定义匹配规则
      </Divider>
      <Space direction="vertical" style={{ width: '100%' }}>
        <FormItem label="环境">
          <Select
            value={selectedEnv}
            onChange={(value) => setSelectedEnv(value)}
            style={{ width: 200, marginRight: 20 }}
          >
            {Object.keys(customConfig).map((env) => (
              <Select.Option key={env} value={env}>
                {env}
              </Select.Option>
            ))}
          </Select>
        </FormItem>
        <FormItem label="场景">
          <Select value={selectedType} onChange={(value) => setSelectedType(value)} style={{ width: 200 }}>
            {selectedEnv &&
              Object.keys(customConfig[selectedEnv] || {}).map((type) => (
                <Select.Option key={type} value={type}>
                  {type}
                </Select.Option>
              ))}
          </Select>
        </FormItem>
        <Modal
          title="管理匹配规则配置"
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setEditMode(null);
          }}
          footer={null}
          width={700}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            {/* 搜索框 */}
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Input
                  placeholder="搜索环境"
                  value={searchEnv}
                  onChange={(e) => setSearchEnv(e.target.value)}
                  style={{ width: 150 }}
                />
                <Input
                  placeholder="搜索场景"
                  value={searchScene}
                  onChange={(e) => setSearchScene(e.target.value)}
                  style={{ width: 150 }}
                />
                <Button type="primary" onClick={() => openAddMode()}>
                  添加配置
                </Button>
              </Space>
            </div>
            {/* 编辑表单 */}
            {editMode && (
              <Card size="small" style={{ marginBottom: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <h3>{editMode === 'add' ? '添加新配置' : '编辑配置'}</h3>
                  <Space>
                    <FormItem label="环境">
                      <Input
                        value={editingEnv}
                        onChange={(e) => setEditingEnv(e.target.value)}
                        disabled={editMode === 'edit'}
                      />
                    </FormItem>
                    <FormItem label="场景">
                      <Input
                        value={editingScene}
                        onChange={(e) => setEditingScene(e.target.value)}
                        disabled={editMode === 'edit'}
                      />
                    </FormItem>
                    <FormItem label="正则表达式">
                      <Input value={editingReg} onChange={(e) => setEditingReg(e.target.value)} />
                    </FormItem>
                  </Space>
                  <Space>
                    <Button type="primary" onClick={saveConfig}>
                      保存
                    </Button>
                    <Button onClick={() => setEditMode(null)}>取消</Button>
                  </Space>
                </Space>
              </Card>
            )}

            {/* 配置列表 */}
            <List
              itemLayout="horizontal"
              dataSource={filteredConfig}
              style={{ maxHeight: 300, overflow: 'auto' }}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button type="text" icon={<EditOutlined />} onClick={() => openEditMode(item.env, item.scene)}>
                      编辑
                    </Button>,
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      danger
                      onClick={() => deleteConfig(item.env, item.scene)}
                    >
                      删除
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <span>
                        <strong>环境:</strong> {item.env} / <strong>场景:</strong> {item.scene}
                      </span>
                    }
                    description={
                      <span>
                        <strong>正则:</strong> {item.reg}
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
          </Space>
        </Modal>
        <Space style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
          <div>当前匹配规则：{urlReg}</div>
          <Button type="primary" icon={<SettingOutlined />} onClick={() => setModalVisible(true)}>
            管理配置
          </Button>
        </Space>
      </Space>
      <Divider dashed plain>
        设置监听
      </Divider>
      <Space direction="vertical">
        <Segmented
          options={[
            { label: '打开监听', value: true },
            { label: '关闭监听', value: false },
          ]}
          defaultValue={false}
          value={open}
          disabled={!urlReg || urlReg.trim().length === 0}
          onChange={(val) => setOpen(val)}
        />
        <ButtonGroup>
          <Button type="primary" disabled={!open} onClick={() => handleGetRequestURL()}>
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
