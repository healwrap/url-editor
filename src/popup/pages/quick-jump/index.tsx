import { Button, Card, List, Pagination, Tabs, Input, Form, Modal, Space } from 'antd';
import { DeleteOutlined, EditOutlined, LinkOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import React, { useContext, useMemo, useState, useEffect } from 'react';
import { ConfigContext } from '~popup';
import { openPage, randomString } from '~popup/utils';
import { useStorage } from '@plasmohq/storage/hook';

const { TabPane } = Tabs;

// 定义链接类型
type LinkItem = {
  id: string;
  title: string;
  url: string;
};

// 定义链接分类
const linkCategories = {
  '1': '测试链接',
  '2': '平台直达',
  '3': '测试工具',
};

export default function App() {
  const { tab } = useContext(ConfigContext);

  // 持久化存储的链接
  const [storedLinks, setStoredLinks] = useStorage<Record<string, LinkItem[]>>('quickJumpLinks', {});

  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('1');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentLink, setCurrentLink] = useState<LinkItem | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const pageSize = 5;
  const paginatedLinks = useMemo(() => {
    const links = storedLinks?.[activeTab] || [];
    return links.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [currentPage, activeTab, storedLinks]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setCurrentPage(1); // 切换 Tab 时重置当前页码
  };

  // 打开添加链接模态框
  const showAddModal = () => {
    setCurrentLink(null);
    setNewTitle('');
    setNewUrl('');
    setIsModalVisible(true);
  };

  // 打开编辑链接模态框
  const showEditModal = (link: LinkItem) => {
    setCurrentLink(link);
    setNewTitle(link.title);
    setNewUrl(link.url);
    setIsModalVisible(true);
  };

  // 保存链接（添加或更新）
  const handleSaveLink = () => {
    if (!newTitle.trim() || !newUrl.trim()) return;

    setStoredLinks((prev) => {
      const links = [...(prev[activeTab] || [])];

      if (currentLink) {
        // 更新现有链接
        const index = links.findIndex((item) => item.id === currentLink.id);
        if (index !== -1) {
          links[index] = { ...links[index], title: newTitle, url: newUrl };
        }
      } else {
        // 添加新链接
        links.push({ id: randomString(10), title: newTitle, url: newUrl });
      }

      return { ...prev, [activeTab]: links };
    });

    setIsModalVisible(false);
  };

  // 删除链接
  const handleDeleteLink = (id: string) => {
    setStoredLinks((prev) => {
      const links = (prev[activeTab] || []).filter((item) => item.id !== id);
      return { ...prev, [activeTab]: links };
    });
  };

  return (
    <Card title="相关链接" extra={<p>快捷跳转到对应文档，支持自定义链接</p>}>
      <Tabs
        defaultActiveKey="1"
        activeKey={activeTab}
        onChange={handleTabChange}
        tabBarExtraContent={
          <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
            添加链接
          </Button>
        }
      >
        {Object.entries(linkCategories).map(([key, title]) => (
          <TabPane tab={title} key={key}></TabPane>
        ))}
      </Tabs>
      <List
        itemLayout="horizontal"
        dataSource={paginatedLinks}
        renderItem={(item) => (
          <List.Item
            key={item.id}
            actions={[
              <Button icon={<LinkOutlined />} onClick={() => openPage(tab, item.url)}>
                打开
              </Button>,
              <Button icon={<EditOutlined />} onClick={() => showEditModal(item)}>
                编辑
              </Button>,
              <Button icon={<DeleteOutlined />} danger onClick={() => handleDeleteLink(item.id)}>
                删除
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={item.title}
              description={
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.url}</div>
              }
            />
          </List.Item>
        )}
        locale={{ emptyText: '暂无链接，点击"添加链接"按钮新建' }}
      />

      {(storedLinks?.[activeTab]?.length || 0) > pageSize && (
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={storedLinks?.[activeTab]?.length || 0}
          onChange={handlePageChange}
          style={{ marginTop: 20, textAlign: 'center' }}
        />
      )}

      {/* 添加/编辑链接的模态框 */}
      <Modal
        title={currentLink ? '编辑链接' : '添加链接'}
        open={isModalVisible}
        onOk={handleSaveLink}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form layout="vertical">
          <Form.Item label="标题" required>
            <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="输入链接标题" />
          </Form.Item>
          <Form.Item label="URL" required>
            <Input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="输入完整URL，包含http(s)://"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
