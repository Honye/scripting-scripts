# 红果鉴 · Scripting

参考 `/Users/jun/Work/guoapp`，使用 Scripting TSX 原生界面。目前仅接入红果，通过 `DramaProvider` 接口组织站源。当前版本 **1.1.0 开发快照**。

## 播放与原项目的对应

已移除内嵌网页播放器和网页播放按钮。目录、搜索、详情仍在设备上请求；读取网页时只解析其中的媒体数据，不显示网页。

| 环节 | 实现 |
| --- | --- |
| 取流顺序 | 红果 App 接口 → 官网返回的媒体数据 → 原项目的备用取流 API |
| App 请求重试 | 默认共两次；网络、服务端错误或空响应时重试，每次重新生成时间戳和签名；普通 4xx、无效 JSON 或业务错误直接交给下一入口 |
| 签名 | X-Gorgon、X-Khronos、X-SS-STUB、X-SS-Req-Ticket，并补齐上游的 X-Argus、X-Ladon |
| 候选线路 | 保留同一集的不同清晰度、主地址和备用地址，按清晰度排序、去重，跳过不支持的编码 |
| 播放错误 | 900 毫秒后复核；优先切换备用线路，没有备用线路时重新取流一次；整个自动恢复过程最多三次 |
| 播放停滞 | 前台播放进度停滞 20 秒触发恢复；暂停与后台不触发停滞恢复 |
| 观看进度 | 切线路和刷新地址时保留实际进度；手动重试会重新取流；每 5 秒、进入后台和退出时保存进度 |
| 站源选择 | 与原项目一样，红果播放失败不自动换成其他站点或其他剧集 |

取流、候选线路和自动恢复策略分别参考 `provider_hongguo.go`、`provider_hongguo_app.go`、`provider_hongguo_native_media.go`、`provider_hongguo_playback.go`、`app_playback_routes.go` 与 `lib/playback_recovery.dart`。本地参考版本的签名字段不完整，本次同时参考上游 [provider_hongguo_player_sign.go](https://github.com/Xanerix/guoapp/blob/main/native/core/provider_hongguo_player_sign.go) 补齐播放签名；原参考项目未改动。

原项目由 libmpv 接收 CENC 密钥并播放。Scripting 的 AVPlayer 没有对应的密钥参数，因此采用设备端适配：普通媒体直接播放；加密分集先通过 Scripting `DownloadManager` 缓冲，再用自带 FFmpeg 解密并无损封装为临时 MP4，交给 AVPlayer 播放。准备加密分集会增加起播等待时间，不具备原项目 libmpv 的边取流边解码行为。

无需自建服务，不安装额外二进制。分集退出或准备失败时清理本次临时文件；取消准备会取消下载。FFmpeg 本地封装已启动时会在当前命令退出后清理，命令最长 60 秒，不会在取消后启动播放器。媒体密钥仅在当前播放准备过程中使用，不写入 Storage 或持久化备份。登录、授权、密钥版本或编码不支持时显示原生错误，不用试看集替代目标分集。

## 其他功能

- 发现：真人剧、漫剧、AI 剧，继续加载与刷新；初页可以回退网页目录，刷新失败保留当前列表。
- 搜索：官网综合搜索与剧名索引合并，300 毫秒联想，最近 20 次搜索，部分失败提示。
- 详情：海报、简介、完整分集，每组 50 集，输入集数跳转。
- 追剧：想看、在看、已看，筛选、搜索与移除。
- 历史：最近 100 部剧集的真实观看进度与续播。
- 设置：默认倍速、自动连播、清理搜索和观看历史。

其他站源、离线剧库、弹幕、用户权限与跨设备同步尚未接入。

## 运行

在仓库根目录执行 `pnpm start`，在 Scripting 中连接桌面编辑服务，打开 `Guo` 并运行 `index.tsx`。中文名称为「红果鉴」。

## 验证

```sh
node_modules/.bin/tsc -p scripts/Guo/tsconfig.json
node --test scripts/Guo/tests/check.cjs
GUO_FFMPEG=1 node --test scripts/Guo/tests/check.cjs
```

第三条命令使用开发机已有的 FFmpeg 生成合成 CENC 视频，再实际解密封装并完整解码。23 项检查通过，覆盖独立签名向量、SM3、媒体密钥、备用接口 v2 响应、媒体资源 ID 与分集 ID 的区别、取流顺序、请求重试、路线恢复上限、续播、资源释放、取消与临时文件清理。默认不请求站源图片或视频。

2026-10-26 已在 macOS Scripting 验证：App 目录返回 16 部，真实详情返回完整分集；《反派拿捏！第三季》第 2 集由 App 接口返回 1080P 加密媒体和一条备用线路，设备端处理后由 AVPlayer 原生播放，随后自动播放第 3 集。结束验证时已保存第 3 集 0:46 的进度，详情显示「继续第 3 集」。全程没有内嵌网页播放器。

在 Scripting 内运行合成媒体验证，可使用 URL Scheme：

```text
scripting://run/Guo?verifyMedia=1
```

该验证只在本机生成一秒合成视频，检查实际 Scripting 的签名运算、备用接口响应解码、FFmpeg 加密生成、解密封装与完整解码，结束后清理文件，不请求站源媒体。Scripting 自带 FFmpeg 的本机验证已通过。

可选联网目录与详情文本检查：

```sh
GUO_LIVE=1 node --test scripts/Guo/tests/check.cjs
GUO_PROXY=http://127.0.0.1:你的端口 GUO_LIVE=1 node --test scripts/Guo/tests/check.cjs
```

`GUO_PROXY` 仅让测试通过系统 curl 使用已有 HTTP 代理，不修改系统网络设置。本机仍可能发生 TLS 建连中断；合成数据和媒体测试通过不代表所有站源接口、分集、iPhone / iPad 或画中画已完成验收。

## 代码

| 文件 | 用途 |
| --- | --- |
| `hongguo.ts`、`parse.ts` | 目录、搜索、详情、取流分派、JSON 与长整数 ID |
| `sign.ts`、`player_sign.ts` | 基础签名、完整播放签名与 SM3 |
| `playback_crypto.ts`、`playback_routes.ts` | 备用接口响应、媒体密钥、候选线路、恢复策略 |
| `prepare_media.ts` | 加密媒体缓冲、FFmpeg 适配、取消及临时文件释放 |
| `views/Player.tsx` | 原生播放、20 秒停滞检测、自动恢复和进度保存 |
| `store.ts`、其余 `views/` | 本地状态与原生界面 |
| `tests/` | 合成数据、媒体、设备组件与可选联网验证 |

数据保存在脚本私有存储 `guo.v1.library`，请求设备标识为 `guo.v1.device`。独立 `tsconfig.json` 避免 Safari 浏览器脚本的 DOM 类型与 Scripting 全局 API 冲突。仓库原有声明文件和其他项目没有为此修改。
