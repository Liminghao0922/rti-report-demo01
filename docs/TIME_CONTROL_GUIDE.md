# 时间控制功能使用说明

## 功能概述

时间控制组件已经完全集成到应用中，支持两种模式：

### 模式 1：历史数据模式
- 选择日期和时间段（开始时间和结束时间）
- 使用进度条拖拽到任意时间点
- 点击"播放"按钮自动播放，每秒前进1秒
- 播放到结束时间自动停止
- 时间变化会自动同步到 Power BI 和 Omniverse

### 模式 2：当前时间模式（实时模式）
- 自动显示当前服务器时间
- 每秒自动刷新
- 时间变化会自动同步到 Power BI 和 Omniverse

## 自动集成

时间变化会自动同步到：

1. **Power BI Report**：通过高级过滤器更新时间筛选
2. **Omniverse/Kit**：通过 WebRTC 消息传递时间更新

## 环境变量配置

在 `.env` 文件中添加以下配置（如果还没有的话）：

```bash
# Power BI 时间列名称（必需）
POWERBI_TIME_COLUMN_NAME='DateTime'

# Power BI 表名（已有）
POWERBI_TABLE_NAME='YourTableName'
```

## 组件架构

### 核心组件

1. **TimeControlComponent** (`src/components/TimeControlComponent.tsx`)
   - 用户界面组件
   - 处理用户交互（日期选择、播放控制等）
   - 更新 Redux state

2. **TimeIntegrationComponent** (`src/components/TimeIntegrationComponent.tsx`)
   - 无 UI 组件
   - 监听时间状态变化
   - 触发 Power BI 和 Omniverse 的同步

3. **timeControlSlice** (`src/state/slice/timeControlSlice.ts`)
   - Redux state 管理
   - 存储当前模式、时间、播放状态等

### 服务层

1. **PowerBIFilterService** (`src/service/PowerBIFilterService.ts`)
   - 扩展了 `applyTimeFilter()` 方法
   - 扩展了 `applyTimeRangeFilter()` 方法
   - 使用 Power BI Advanced Filter API

2. **TimeIntegrationService** (`src/service/TimeIntegrationService.ts`)
   - 协调时间同步
   - 并行更新 Power BI 和 Omniverse
   - 包含防抖和节流逻辑

## Omniverse/Kit 端集成

在你的 Omniverse Kit Extension 中，需要处理以下消息：

### 1. 时间更新消息

```python
# 接收消息示例
{
    "event_type": "timeUpdate",
    "payload": {
        "currentTime": "2025-12-15T10:30:45.000Z",  # ISO 8601 格式
        "timestamp": 1702639845000                   # Unix 时间戳（毫秒）
    }
}
```

### 2. 模式切换消息

```python
{
    "event_type": "timeModeChange",
    "payload": {
        "mode": "historical"  # 或 "realtime"
    }
}
```

### Kit Extension 实现示例

```python
import omni.ext
import json

class TimeControlExtension(omni.ext.IExt):
    def on_startup(self, ext_id):
        # 注册消息处理器
        self._message_bus_sub = omni.kit.app.get_app().get_message_bus_event_stream().create_subscription_to_pop(
            self._on_message, name="timeControl"
        )
    
    def _on_message(self, event):
        try:
            message = json.loads(event.payload)
            event_type = message.get("event_type")
            payload = message.get("payload", {})
            
            if event_type == "timeUpdate":
                current_time = payload.get("currentTime")
                timestamp = payload.get("timestamp")
                self._update_scene_time(current_time, timestamp)
                
            elif event_type == "timeModeChange":
                mode = payload.get("mode")
                self._handle_mode_change(mode)
                
        except Exception as e:
            print(f"Error handling message: {e}")
    
    def _update_scene_time(self, current_time: str, timestamp: int):
        """根据时间更新场景"""
        # 实现你的逻辑：
        # - 加载对应时间的 USD 文件
        # - 更新场景中的时间轴
        # - 显示/隐藏特定时间的对象
        print(f"Updating scene to time: {current_time}")
        pass
    
    def _handle_mode_change(self, mode: str):
        """处理模式切换"""
        print(f"Time mode changed to: {mode}")
        pass
```

## Power BI 数据集要求

确保你的 Power BI 数据集包含一个日期时间列，例如：

| DateTime            | AssetID | Value |
|---------------------|---------|-------|
| 2025-12-15 09:00:00 | Asset1  | 100   |
| 2025-12-15 09:00:01 | Asset1  | 101   |
| 2025-12-15 09:00:02 | Asset2  | 102   |

时间列应该：
- 是 DateTime 数据类型
- 包含精确的时间戳（建议包含秒）
- 格式化为 ISO 8601 或标准 datetime 格式

## 测试

1. 启动应用并登录
2. 在页面顶部看到时间控制组件
3. 切换到"历史数据"模式
4. 选择日期和时间段
5. 拖动进度条或点击播放
6. 观察 Power BI report 和 Omniverse 场景的同步更新

## 调试

打开浏览器控制台，你会看到以下日志：

- `⏱️ Time changed to: ...` - 时间变化
- `📊 Power BI updated to time: ...` - Power BI 更新
- `🎬 Omniverse updated to time: ...` - Omniverse 更新
- `🔄 Time mode changed to: ...` - 模式切换

## 性能优化

- 时间更新使用了防抖（100ms），避免过于频繁的更新
- 播放状态下的更新会稍微节流
- Power BI 和 Omniverse 更新是并行执行的
- 重复的时间值会被跳过

## 文件清单

### 新建文件
- `src/state/slice/timeControlSlice.ts` - Redux state
- `src/components/TimeControlComponent.tsx` - UI 组件
- `src/components/TimeControlComponent.css` - 样式
- `src/components/TimeIntegrationComponent.tsx` - 集成组件
- `src/service/TimeIntegrationService.ts` - 集成服务

### 修改文件
- `src/service/PowerBIFilterService.ts` - 添加时间过滤方法
- `src/state/store.ts` - 注册 timeControl reducer
- `src/PageLayout.tsx` - 添加组件
- `.env.example` - 添加环境变量说明

## 下一步

如果需要自定义：

1. **修改更新频率**：在 `TimeIntegrationComponent.tsx` 中调整防抖延迟
2. **改变时间格式**：在 `TimeControlComponent.tsx` 中修改 `formatDateTime` 函数
3. **添加更多目标**：在 `TimeIntegrationService.ts` 中添加新的同步方法
4. **自定义 Omniverse 消息**：在 `TimeIntegrationService.ts` 中修改 `updateOmniverse` 方法
