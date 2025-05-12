import { Button, Card, List, Pagination, Tabs, Input, Form, Modal, Space, Popconfirm, message } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  LinkOutlined,
  PlusOutlined,
  SaveOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import React, { useContext, useMemo, useState, useEffect } from 'react';
import { ConfigContext } from '~popup';
import { openPage, randomString } from '~popup/utils';
import { useStorage } from '@plasmohq/storage/hook';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const { TabPane } = Tabs;

// 定义链接类型
type LinkItem = {
  id: string;
  title: string;
  url: string;
};

// 定义类别类型
type CategoryItem = {
  id: string;
  title: string;
};

export default function App() {
  const { tab } = useContext(ConfigContext);

  // 持久化存储的链接
  const [storedLinks, setStoredLinks] = useStorage<Record<string, LinkItem[]>>('quickJumpLinks', {});

  // 持久化存储的标签页类别
  const [categories, setCategories] = useStorage<CategoryItem[]>('quickJumpCategories', []);

  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('1');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentLink, setCurrentLink] = useState<LinkItem | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  // 标签页管理相关状态
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<CategoryItem | null>(null);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');

  const pageSize = 5;
  const paginatedLinks = useMemo(() => {
    const links = storedLinks?.[activeTab] || [];
    return links.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [currentPage, activeTab, storedLinks]);

  // 确保activeTab始终有效
  useEffect(() => {
    if (categories.length > 0 && !categories.some((cat) => cat.id === activeTab)) {
      setActiveTab(categories[0].id);
    }
  }, [categories, activeTab]);

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

  // === 标签页管理相关函数 ===

  // 打开添加标签页模态框
  const showAddCategoryModal = () => {
    setCurrentCategory(null);
    setNewCategoryTitle('');
    setIsCategoryModalVisible(true);
  };

  // 打开编辑标签页模态框
  const showEditCategoryModal = (category: CategoryItem) => {
    setCurrentCategory(category);
    setNewCategoryTitle(category.title);
    setIsCategoryModalVisible(true);
  };

  // 保存标签页（添加或更新）
  const handleSaveCategory = () => {
    if (!newCategoryTitle.trim()) return;

    if (currentCategory) {
      // 更新现有标签页
      setCategories(
        categories.map((cat) => (cat.id === currentCategory.id ? { ...cat, title: newCategoryTitle } : cat))
      );
    } else {
      // 添加新标签页
      const newId = randomString(5);
      setCategories([...categories, { id: newId, title: newCategoryTitle }]);
    }
  };

  // 删除标签页
  const handleDeleteCategory = (categoryId: string) => {
    // 查找待删除标签页的索引
    const categoryIndex = categories.findIndex((cat) => cat.id === categoryId);
    if (categoryIndex === -1 || categories.length <= 1) {
      message.error('至少需要保留一个标签页');
      return;
    }

    // 决定删除后应该激活哪个标签页
    const newActiveTab = categories[categoryIndex === 0 ? 1 : categoryIndex - 1].id;

    // 更新标签页列表
    setCategories(categories.filter((cat) => cat.id !== categoryId));

    // 更新链接存储，移除该标签页下的链接
    setStoredLinks((prev) => {
      const { [categoryId]: _, ...rest } = prev;
      return rest;
    });

    // 如果删除的是当前激活的标签页，则切换到另一个标签页
    if (activeTab === categoryId) {
      setActiveTab(newActiveTab);
    }
  };

  const handleCategoryDragEnd = (result) => {
    if (!result.destination) return;

    const newCategories = Array.from(categories);
    const [reorderedItem] = newCategories.splice(result.source.index, 1);
    newCategories.splice(result.destination.index, 0, reorderedItem);

    setCategories(newCategories);
  };

  return (
    <Card title="相关链接" extra={<p>快捷跳转到对应文档、工具链接；需要自行配置</p>} style={{ minHeight: 500 }}>
      <Tabs
        defaultActiveKey="1"
        activeKey={activeTab}
        onChange={handleTabChange}
        tabBarExtraContent={
          <Space>
            <Button icon={<SettingOutlined />} onClick={showAddCategoryModal}>
              管理标签页
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
              添加链接
            </Button>
          </Space>
        }
      >
        {categories.map((category) => (
          <TabPane tab={category.title} key={category.id}></TabPane>
        ))}
      </Tabs>
      <List
        itemLayout="horizontal"
        dataSource={paginatedLinks}
        renderItem={(item) => (
          <List.Item
            key={item.id}
            actions={[
              <Button icon={<LinkOutlined />} type="text" onClick={() => openPage(tab, item.url)}>
                打开
              </Button>,
              <Button icon={<EditOutlined />} type="text" onClick={() => showEditModal(item)}>
                编辑
              </Button>,
              <Button icon={<DeleteOutlined />} type="text" danger onClick={() => handleDeleteLink(item.id)}>
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

      {/* 标签页管理模态框 */}
      <Modal
        title="管理标签页"
        open={isCategoryModalVisible}
        footer={null}
        onCancel={() => setIsCategoryModalVisible(false)}
      >
        <Form style={{ marginBottom: 16 }}>
          <Form.Item label={currentCategory === null ? '新标签页名称' : '编辑标签页名称'} required>
            <Space.Compact block>
              <Input
                value={newCategoryTitle}
                onChange={(e) => setNewCategoryTitle(e.target.value)}
                placeholder="输入标签页名称"
              />
              <Button type="primary" onClick={handleSaveCategory} disabled={!newCategoryTitle.trim()}>
                {currentCategory === null ? '保存' : '更新'}
              </Button>
              <Button
                type={currentCategory === null ? 'primary' : 'default'}
                icon={<PlusOutlined />}
                onClick={() => {
                  setCurrentCategory(null);
                  setNewCategoryTitle('');
                }}
              >
                新建
              </Button>
            </Space.Compact>
          </Form.Item>
        </Form>
        <DragDropContext onDragEnd={handleCategoryDragEnd}>
          <Droppable droppableId="categories">
            {(provided) => (
              <List
                {...provided.droppableProps}
                ref={provided.innerRef}
                itemLayout="horizontal"
                dataSource={categories}
                style={{ maxHeight: 240, overflow: 'auto' }}
                renderItem={(item: CategoryItem, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided) => (
                      <List.Item
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        key={item.id}
                        actions={[
                          <Button icon={<EditOutlined />} type="text" onClick={() => showEditCategoryModal(item)}>
                            编辑
                          </Button>,
                          <Popconfirm
                            title="确定要删除这个标签页吗?"
                            description="删除后，该标签页下的所有链接也将被删除。"
                            onConfirm={() => handleDeleteCategory(item.id)}
                            okText="是"
                            cancelText="否"
                            disabled={categories.length <= 1}
                          >
                            <Button icon={<DeleteOutlined />} type="text" danger disabled={categories.length <= 1}>
                              删除
                            </Button>
                          </Popconfirm>,
                        ]}
                      >
                        <List.Item.Meta title={item.title} />
                      </List.Item>
                    )}
                  </Draggable>
                )}
              />
            )}
          </Droppable>
        </DragDropContext>
      </Modal>
    </Card>
  );
}
