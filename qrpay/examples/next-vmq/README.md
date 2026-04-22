# Next.js 对接 V免签最小样例

这是一套示例文件，不会直接接入当前主项目。

目标：

- 创建 V免签订单
- 接收 V免签异步回调
- 接收 V免签同步跳转
- 验签
- 成功后调用你现有的发货逻辑

## 推荐映射

- `payId`：直接用你的业务订单号 `orderNo`
- `param`：可以继续放 `orderNo`
- `notifyUrl`：你的异步回调地址
- `returnUrl`：你的同步跳转地址

## 推荐环境变量

见：

- [.env.example](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/examples/next-vmq/.env.example)

## 你真正需要落到主项目的文件

### 1. 帮助方法

- [vmq.ts](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/examples/next-vmq/vmq.ts)

### 2. 创建订单时调用

- [create-vmq-order.ts](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/examples/next-vmq/create-vmq-order.ts)

### 3. 异步回调

- [notify-route.ts](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/examples/next-vmq/notify-route.ts)

### 4. 同步跳转

- [return-route.ts](/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka/qrpay/examples/next-vmq/return-route.ts)

## 接入建议

你当前项目已有：

- 订单创建接口
- 发货函数 `fulfillPaidOrder`
- 现成的支付回调路由风格

所以实际接入时建议：

1. 在现有订单创建流程里，加一个 `paymentMethod === "vmq"` 分支
2. 用 `create-vmq-order.ts` 生成支付链接
3. 在主项目里新增：
   - `app/api/payments/vmq/notify/route.ts`
   - `app/api/payments/vmq/return/route.ts`
4. 异步回调成功后调用：
   - `fulfillPaidOrder(orderNo, "vmq")`

## 注意

- V免签要求你的回调接口成功时返回纯文本 `success`
- 回调必须幂等
- 最终应以异步回调为准，同步跳转只负责用户体验
