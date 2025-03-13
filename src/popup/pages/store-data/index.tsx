import { Card, Button, Input, List, message, Space } from 'antd';
import React, { useState } from 'react';

import { useStorage } from '@plasmohq/storage/hook';
import { copyToClipboard } from '~popup/utils';
import { DeleteOutlined, EditOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';

export default function App() {
  const [storage, setStorage] = useStorage<Partial<Record<string, string>>>('userStorage'); // 使用存储钩子
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [newKey, setNewKey] = useState<string>('');
  const [newValue, setNewValue] = useState<string>('');
  const [editingKeyName, setEditingKeyName] = useState<string>(''); // 新增状态，用于存储正在编辑的键名

  const handleAdd = () => {
    if (newKey && newValue) {
      if (storage[newKey]) {
        message.error('键名已存在，请使用其他键名'); // 提示键名重复
        return;
      }
      setStorage((prev) => ({ ...prev, [newKey]: newValue }));
      setNewKey('');
      setNewValue('');
    }
  };

  const handleEdit = (key: string) => {
    setEditingKey(key);
    setEditingKeyName(key); // 初始化编辑键名
    setEditingValue(storage[key]);
  };

  const handleSaveEdit = () => {
    if (editingKey) {
      if (editingKeyName !== editingKey && storage[editingKeyName]) {
        message.error('键名已存在，请使用其他键名'); // 提示键名重复
        return;
      }
      setStorage((prev) => {
        const { [editingKey]: _, ...rest } = prev; // 删除旧键
        return { ...rest, [editingKeyName]: editingValue }; // 添加新键值对
      });
      setEditingKey(null);
      setEditingKeyName(''); // 清空编辑键名
      setEditingValue('');
    }
  };

  const handleDelete = (key: string) => {
    setStorage((prev) => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  };

  return (
    <>
      <Card title="储存信息" extra={<p>简单存一些值，说不定能用上</p>}>
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="键"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            style={{ width: '40%', marginRight: 8 }}
          />
          <Input
            placeholder="值"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            style={{ width: '40%', marginRight: 8 }}
          />
          <Button icon={<PlusOutlined />} type="primary" onClick={handleAdd}>
            新增
          </Button>
        </div>
        <List
          dataSource={Object.entries(storage || {})}
          renderItem={([key, value]) => (
            <List.Item
              key={key}
              actions={[
                editingKey === key ? (
                  <Button icon={<SaveOutlined />} onClick={handleSaveEdit}>
                    保存
                  </Button>
                ) : (
                  <Button icon={<EditOutlined />} onClick={() => handleEdit(key)}>
                    编辑
                  </Button>
                ),
                <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(key)}>
                  删除
                </Button>,
              ]}
            >
              {editingKey === key ? (
                <Space.Compact block>
                  <Input
                    value={editingKeyName} // 编辑键名
                    onChange={(e) => setEditingKeyName(e.target.value)}
                  />
                  <Input
                    value={editingValue} // 编辑键值
                    onChange={(e) => setEditingValue(e.target.value)}
                  />
                </Space.Compact>
              ) : (
                <Space>
                  <Space.Compact block>
                    <Input value={key} readOnly />
                  </Space.Compact>
                  <Space.Compact>
                    <Input value={value} readOnly />
                    <Button onClick={() => copyToClipboard(value)}>复制</Button>
                  </Space.Compact>
                </Space>
              )}
            </List.Item>
          )}
        />
      </Card>
    </>
  );
}
