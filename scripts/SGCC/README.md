# SGCC 网上国网

网上国网小组件：电费余额、上期 / 年度电费电量、阶梯进度，以及按日或按月的用电柱状图。

> A [Scripting](https://scripting.fun/) widget for State Grid (网上国网) accounts,
> ported from the Scriptable `SGCC.js` in
> [Honye/scriptable-scripts](https://github.com/Honye/scriptable-scripts).

## 使用

1. 打开 App，填写网上国网**手机号**和**密码**（密码只存在本机钥匙串）。
2. 首次登录（新设备）国网会要求短信验证：点「发送短信验证码」，把收到的 6 位验证码填入「短信验证码」，再点「立即刷新」或预览小组件。
3. 添加小组件。支持小号、中号，以及锁屏的矩形、圆形、行内样式。

### 多户号

长按小组件 → 编辑小组件 → 参数，填从 0 开始的整数：`0` 为第一户（默认），`1` 为第二户，以此类推。最多读取 6 个户号。

### 设置项

- **柱状图**：每日 / 每月；**柱状图数量**：3–14
- **显示阶梯进度**：关闭后小组件不显示阶梯条
- **第一 / 第二阶梯上限**：默认 2160 / 4800 度（按年累计），按当地标准修改

## 数据与刷新

- 直连网上国网 App 接口，最多每 4 小时请求一次，其余时间使用缓存；请求失败时回退到缓存（中号组件右下角时间旁会显示 ⚠︎）。
- 「清除数据缓存」后下次刷新会重新请求。

## 致谢

协议（SM2 / SM3 / SM4 加密与 Turing 设备令牌）移植自
[stevenjoezhang/hass-state-grid](https://github.com/stevenjoezhang/hass-state-grid)，
MIT License, Copyright (c) 2026 stevenjoezhang，见 `vendor/sgcc_protocol.ts`。
