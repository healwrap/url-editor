import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  LinkOutlined,
  PlusOutlined,
  SyncOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import {
  AutoComplete,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  message,
  Modal,
  Row,
  Space,
  Alert,
  type AutoCompleteProps,
  Segmented,
} from 'antd';
import { QRCodeSVG } from 'qrcode.react';
import React, { useContext, useEffect, useRef, useState } from 'react';
import URI from 'urijs';
import { useStorage } from '@plasmohq/storage/hook';

import { ConfigContext } from '~popup';
import { copyToClipboard, forwardAndBack, getCurrentURL, openPage, randomString, reloadPage } from '~popup/utils';

type ParamItem = {
  id: string;
  key: string;
  value: string;
};

// 定义主机数据类型
type HostDataType = {
  [host: string]: {
    param: {
      [key: string]: string[]; // 记录每个key对应的value列表
    };
    path: string[];
    fragment: string[];
  };
};

const mergeParams = (
  existing: ParamItem[], // 现有数组格式参数
  newParams: Record<string, string> // 新解析的键值对参数
): ParamItem[] => {
  // 创建快速查找表
  const existingMap = new Map<string, ParamItem>(existing.map((item) => [item.key, item]));

  const merged = Object.entries(newParams).map(([key, value]) => {
    // 保留已有条目的ID（如果存在）
    const existingItem = existingMap.get(key);
    return existingItem
      ? { ...existingItem, value } // 保留ID更新值
      : { id: randomString(10), key, value }; // 新建条目
  });

  return merged;
};

const EditCurrent: React.FC = () => {
  const [url, setUrl] = useState('');
  const [params, setParams] = useState<ParamItem[]>([]);
  const [fragment, setFragment] = useState('');
  const [host, setHost] = useState('');
  const [path, setPath] = useState('');
  const { tab } = useContext(ConfigContext);
  const paramIndex = useRef(0);

  // 添加二维码显示状态控制
  const [showQRCode, setShowQRCode] = useStorage<boolean>('showQRCode', true);

  const [currentParamKey, setCurrentParamKey] = useState<string>('');
  // 参数、主机、路径、片段的自动补全选项
  const [paramKeyOptions, setParamKeyOptions] = useState<AutoCompleteProps['options']>([]);
  const [pathOptions, setPathOptions] = useState<AutoCompleteProps['options']>([]);
  const [fragmentOptions, setFragmentOptions] = useState<AutoCompleteProps['options']>([]);
  const [paramValueOptions, setParamValueOptions] = useState<AutoCompleteProps['options']>([]);
  // 记录host相关数据
  const [hostData, setHostData] = useStorage<HostDataType>('hostData', {});
  // 修改host记录相关
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [hostDataText, setHostDataText] = useState('');
  const [parseError, setParseError] = useState('');

  const isFirstRender = useRef(true); // 用于标记是否首次渲染

  // 提取记录URL信息的逻辑到单独的函数
  const recordUrlInfo = (cur = '') => {
    try {
      const editUrl = url?.length <= 5 ? cur : url;
      const uri = new URI(editUrl);
      const currentHost = uri.host();
      const newParams = uri.query(true);

      if (currentHost && editUrl) {
        const newHostData = { ...hostData };

        // 初始化该host的数据结构
        if (!newHostData[currentHost]) {
          newHostData[currentHost] = { param: {}, path: [], fragment: [] };
        }

        // 记录参数keys和values
        Object.entries(newParams).forEach(([key, value]) => {
          if (!key) return;

          // 确保该key存在于param中
          if (!newHostData[currentHost].param[key]) {
            newHostData[currentHost].param[key] = [];
          }

          // 记录value (如果是新值)
          if (value && !newHostData[currentHost].param[key].includes(value)) {
            newHostData[currentHost].param[key] = [value, ...newHostData[currentHost].param[key]].slice(0, 20);
          }
        });

        // 记录path
        const currentPath = uri.path();
        if (currentPath && !newHostData[currentHost].path.includes(currentPath)) {
          newHostData[currentHost].path = [currentPath, ...newHostData[currentHost].path].slice(0, 10);
        }

        // 记录fragment
        const currentFragment = uri.fragment();
        if (currentFragment && !newHostData[currentHost].fragment.includes(currentFragment)) {
          newHostData[currentHost].fragment = [currentFragment, ...newHostData[currentHost].fragment].slice(0, 10);
        }

        setHostData(newHostData);
        console.log('记录URL信息成功', newHostData);
      }
    } catch (e) {
      message.error('记录URL信息失败');
      console.error(e);
    }
  };

  useEffect(() => {
    // 使用setTimeout让URL获取延迟执行，确保tab已完全加载
    const timer = setTimeout(() => {
      console.log('初始化URL编辑器');
      if (!tab?.id) {
        console.error('无法获取tab信息，请确保浏览器支持tabs API');
        return;
      }

      try {
        // 直接使用与刷新按钮相同的方式获取URL
        const currentURL = getCurrentURL(tab);
        console.log('获取到的原始URL:', currentURL);

        // 直接设置URL，与按钮行为一致
        setUrl(currentURL);

        // 仅在首次加载时记录URL信息
        if (isFirstRender.current && currentURL) {
          isFirstRender.current = false;
          console.log('记录历史数据');
          recordUrlInfo(currentURL);
        }
      } catch (error) {
        console.error('初始化URL编辑器失败:', error);
        message.error('无法获取当前页面URL，请刷新页面重试');
      }
    }, 100); // 添加100ms延迟确保tab对象已完全加载

    return () => clearTimeout(timer);
  }, [tab?.id]);

  // 用户手动更新 url 或重置时解析参数，但不记录
  useEffect(() => {
    try {
      // 解析新 url，更新 params
      const uri = new URI(url);

      // 解码查询参数
      const encodedParams = uri.query(true);
      const decodedParams: Record<string, string> = {};
      Object.entries(encodedParams).forEach(([key, value]) => {
        // 解码key和value，确保特殊字符正确显示
        try {
          const decodedKey = decodeURIComponent(key);
          const decodedValue = typeof value === 'string' ? decodeURIComponent(value) : value;
          decodedParams[decodedKey] = decodedValue;
        } catch (e) {
          // 如果解码失败，保留原值
          decodedParams[key] = value;
        }
      });
      setParams(mergeParams(params, decodedParams));

      // 解码fragment，确保特殊字符正常显示
      try {
        const decodedFragment = decodeURIComponent(uri.fragment());
        setFragment(decodedFragment);
      } catch (e) {
        setFragment(uri.fragment());
      }

      setHost(uri.host());

      // 解码path，确保中文等特殊字符正常显示
      try {
        const decodedPath = decodeURIComponent(uri.path());
        setPath(decodedPath);
      } catch (e) {
        setPath(uri.path());
      }
    } catch (error) {
      console.error('解析URL失败:', error);
    }
  }, [url]);

  // 更新自动补全选项
  useEffect(() => {
    if (host && hostData[host]) {
      setParamKeyOptions(Object.keys(hostData[host].param).map((k) => ({ value: k })));

      // 确保显示的path是解码后的内容
      setPathOptions(
        hostData[host].path.map((p) => {
          try {
            return { value: decodeURIComponent(p) };
          } catch (e) {
            return { value: p };
          }
        })
      );

      // 确保显示的fragment是解码后的内容
      setFragmentOptions(
        hostData[host].fragment.map((f) => {
          try {
            return { value: decodeURIComponent(f) };
          } catch (e) {
            return { value: f };
          }
        })
      );
    }
  }, [host, hostData]);

  useEffect(() => {
    try {
      const uri = new URI(url);

      // 处理查询参数，确保特殊字符被正确编码
      const newParams = {} as Record<string, string>;
      params.forEach((item) => {
        // 无需手动编码，URI.js会处理这部分
        newParams[item.key] = item.value;
      });
      uri.query(newParams);

      // 处理fragment，特殊字符需要编码
      uri.fragment(fragment);

      // 设置主机名
      uri.host(host);

      // 处理路径，确保特殊字符被正确编码
      try {
        // 检测path是否已经被编码
        const isAlreadyEncoded = path.includes('%') && decodeURIComponent(path) !== path;

        // 如果已编码，直接使用；否则交给URI.js处理
        if (isAlreadyEncoded) {
          uri.path(path);
        } else {
          // 让URI.js自己处理路径编码
          uri.path(path);
        }
      } catch (e) {
        // 如果出错，尝试直接设置
        uri.path(path);
      }

      // 如果URL有变化，更新状态
      const newUrl = uri.toString();
      if (newUrl !== url) {
        setUrl(newUrl);
      }
    } catch (error) {
      console.error('更新URL失败:', error);
    }
  }, [params, fragment, host, path]);

  const addParam = () => {
    setParams([
      ...params,
      { id: randomString(10), key: `newParam${++paramIndex.current}`, value: `value${paramIndex.current}` },
    ]);
  };

  const handleKeyChange = (id: string, oldKey: string, newKey: string) => {
    if (!newKey.trim() || oldKey === newKey) return;
    setParams(params.map((item) => (item.id === id ? { ...item, key: newKey } : item)));
    setCurrentParamKey(newKey); // 更新当前选中的参数key
  };

  const handleValueChange = (id: string, key: string, newValue: string) => {
    setParams(params.map((item) => (item.id === id ? { ...item, value: newValue } : item)));
  };

  const handleDeleteParam = (id: string) => {
    setParams(params.filter((item) => item.id !== id));
  };

  const handleReloadPage = () => {
    if (!url) return;
    recordUrlInfo(); // 记录URL信息
    reloadPage(tab, url);
  };

  const handleOpenPage = () => {
    if (!url) return;
    recordUrlInfo(); // 记录URL信息
    openPage(tab, url);
  };

  // 初始化当前参数key
  useEffect(() => {
    if (params.length > 0 && !currentParamKey) {
      setCurrentParamKey(params[0].key);
    }
  }, [params]);

  const showModal = () => {
    if (!host) {
      message.error('没有可编辑的域名信息');
      return;
    }

    // 获取当前域名下的数据
    const currentHostData = hostData[host] || { param: {}, path: [], fragment: [] };

    // 将数据转换为格式化的JSON字符串
    setHostDataText(JSON.stringify(currentHostData, null, 2));
    setParseError('');
    setIsModalVisible(true);
  };

  const hideModal = () => {
    setIsModalVisible(false);
    setParseError('');
  };

  const handleTextChange = (e) => {
    setHostDataText(e.target.value);
    setParseError('');
  };

  const handleSubmit = () => {
    if (!hostDataText || hostDataText.trim() === '') {
      // 空内容视为删除所有记录
      const newHostData = { ...hostData };
      delete newHostData[host];
      setHostData(newHostData);
      message.success('删除成功');
      setIsModalVisible(false);
      return;
    }
    try {
      // 尝试解析JSON
      const parsedData = JSON.parse(hostDataText);

      // 验证数据格式是否正确
      if (
        !parsedData.param ||
        typeof parsedData.param !== 'object' ||
        !Array.isArray(parsedData.path) ||
        !Array.isArray(parsedData.fragment)
      ) {
        setParseError('数据格式不正确，必须包含param、path、fragment字段');
        return;
      }

      // 验证param的结构
      for (const key in parsedData.param) {
        if (!Array.isArray(parsedData.param[key])) {
          setParseError(`param.${key} 必须是数组类型`);
          return;
        }
      }

      // 更新hostData
      const newHostData = { ...hostData };
      newHostData[host] = parsedData;
      setHostData(newHostData);

      message.success('更新成功');
      setIsModalVisible(false);
    } catch (error) {
      setParseError('JSON格式错误: ' + error.message);
    }
  };

  return (
    <Form layout="vertical">
      <Card title="编辑URL" extra={<p>方便调整URL，生成对应的二维码，便于手机调试</p>}>
        <Row
          style={{
            position: 'sticky',
            top: 10,
            zIndex: 999,
            backgroundColor: '#ffffff80',
            padding: 5,
            borderRadius: 7,
            border: '1px solid #f0f0f0',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Space.Compact block>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} onPressEnter={handleReloadPage} />
            <Button
              icon={<SyncOutlined />}
              onClick={() => {
                setUrl(getCurrentURL(tab));
              }}
            ></Button>
            <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(url)}></Button>
          </Space.Compact>
          <Space style={{ marginTop: 20, justifyContent: 'space-between', width: '100%' }}>
            <Space.Compact>
              <Button icon={<ArrowLeftOutlined />} type="primary" onClick={() => forwardAndBack(tab, 'back')}>
                回退
              </Button>
              <Button icon={<LinkOutlined />} type="primary" onClick={handleOpenPage}>
                新标签页打开
              </Button>
              <Button icon={<UndoOutlined />} type="primary" onClick={() => url && reloadPage(tab)}>
                刷新页面
              </Button>
              <Button icon={<ArrowRightOutlined />} type="primary" onClick={() => forwardAndBack(tab, 'forward')}>
                前进
              </Button>
            </Space.Compact>
            <Button icon={<EditOutlined />} type="primary" onClick={showModal}>
              编辑当前域名下的记录
            </Button>
            <Modal
              title={`编辑 ${host} 的记录`}
              open={isModalVisible}
              onOk={handleSubmit}
              onCancel={hideModal}
              width={700}
            >
              <Alert
                description="请在下方编辑当前域名的记录，编辑完成后点击确定保存。注意保持正确的JSON格式。提交空内容视为删除所有记录。"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              {parseError && <Alert description={parseError} type="error" showIcon style={{ marginBottom: 16 }} />}
              <Input.TextArea
                value={hostDataText}
                onChange={handleTextChange}
                rows={15}
                style={{ fontFamily: 'monospace', resize: 'none' }}
              />
            </Modal>
          </Space>
        </Row>
        <Divider dashed plain>
          在任意输入框按下回车会刷新当前页面
        </Divider>
        <Row>
          <Col span={10}>
            <Segmented
              options={[
                { label: '显示二维码', value: true },
                { label: '隐藏二维码', value: false },
              ]}
              value={showQRCode}
              style={{ margin: 10 }}
              onChange={(value) => setShowQRCode(value as boolean)}
            />
            {url && showQRCode && (
              <div style={{ marginTop: 10, position: 'sticky', top: 140 }}>
                <QRCodeSVG value={url} size={256} />
              </div>
            )}
          </Col>
          <Col span={showQRCode ? 14 : 24}>
            <Form.Item label="param">
              <Space direction="vertical">
                {params.map((item) => (
                  <Space.Compact block key={item.id}>
                    <AutoComplete
                      value={item.key}
                      options={paramKeyOptions}
                      onChange={(value) => handleKeyChange(item.id, item.key, value)}
                      onSelect={(value) => setCurrentParamKey(value)}
                    >
                      <Input onPressEnter={handleReloadPage} />
                    </AutoComplete>
                    <AutoComplete
                      value={item.value}
                      options={paramValueOptions}
                      onChange={(value) => handleValueChange(item.id, item.key, value)}
                      onFocus={() => setCurrentParamKey(item.key)}
                    >
                      <Input onPressEnter={handleReloadPage} />
                    </AutoComplete>
                    <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(item.value)}></Button>
                    <Button icon={<DeleteOutlined />} onClick={() => handleDeleteParam(item.id)} danger></Button>
                  </Space.Compact>
                ))}
                <Button icon={<PlusOutlined />} type="primary" onClick={addParam}>
                  添加新的参数
                </Button>
              </Space>
            </Form.Item>
            {host && (
              <Form.Item label="host">
                <Space.Compact block>
                  <Input value={host} onChange={(e) => setHost(e.target.value)} onPressEnter={handleReloadPage} />
                  <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(host)}></Button>
                </Space.Compact>
              </Form.Item>
            )}
            {path && (
              <Form.Item label="path">
                <Space.Compact block>
                  <AutoComplete value={path} options={pathOptions} onChange={(value) => setPath(value)}>
                    <Input onPressEnter={handleReloadPage} />
                  </AutoComplete>
                  <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(path)}></Button>
                </Space.Compact>
              </Form.Item>
            )}
            {fragment && (
              <Form.Item label="fragment">
                <Space.Compact block>
                  <AutoComplete value={fragment} options={fragmentOptions} onChange={(value) => setFragment(value)}>
                    <Input onPressEnter={handleReloadPage} />
                  </AutoComplete>
                  <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(fragment)}></Button>
                </Space.Compact>
              </Form.Item>
            )}
          </Col>
        </Row>
      </Card>
    </Form>
  );
};

export default EditCurrent;
