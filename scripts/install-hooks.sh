#!/bin/bash
# filepath: /Users/pepedd/Desktop/github/healwrap/url-editor/scripts/install-hooks.sh

#!/bin/bash
HOOK_DIR=".git/hooks"
PROJECT_DIR=$(git rev-parse --show-toplevel)

# 创建pre-push钩子
cat > $PROJECT_DIR/$HOOK_DIR/pre-push << 'EOF'
#!/bin/bash

remote="$1"
url="$2"

# 用于标记是否找到了推送的分支信息
found_push_info=0

# 从标准输入获取每个要推送的引用
while read local_ref local_sha remote_ref remote_sha; do
  found_push_info=1
  
  # 提取推送的分支名
  PUSHING_BRANCH=${remote_ref#refs/heads/}
  
  # 检查是否是推送到 meituan-intern 分支
  if [ "$PUSHING_BRANCH" = "meituan-intern" ]; then
    # 检查remote是否是美团的git仓库
    if [[ $url != *"meituan"* ]] && [[ $remote != *"meituan"* ]]; then
      echo "错误: meituan-intern分支只允许推送到美团的远程仓库。"
      echo "当前尝试推送到: $remote ($url)"
      exit 1
    fi
  fi
done

# 如果没有从标准输入读取到推送信息
# 这可能是因为分支是新的，或者其他特殊情况
if [ $found_push_info -eq 0 ]; then
  # 获取当前分支名称作为备选方案
  CURRENT_BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "")
  
  # 检查是否是meituan-intern分支推送到非美团远程
  if [ "$CURRENT_BRANCH" = "meituan-intern" ]; then
    # 检查remote是否是美团的git仓库
    if [[ $url != *"meituan"* ]] && [[ $remote != *"meituan"* ]]; then
      echo "错误: meituan-intern分支只允许推送到美团的远程仓库。"
      echo "当前尝试推送到: $remote ($url)"
      exit 1
    fi
  fi
fi

# 推送允许继续
exit 0
EOF

# 设置执行权限
chmod +x $PROJECT_DIR/$HOOK_DIR/pre-push

echo "Git hooks安装完成！"