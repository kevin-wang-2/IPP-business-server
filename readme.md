### 业务服务器

根目录: /business

- 订单相关API
  - POST /business/order 创建订单
  - GET /business/order/id 列出指定订单
  - GET /business/order 列出所有订单

- 航线相关API
  - GET /business/flight/id 根据订单ID列出航线
  - GET /business/flight 列出所有航线

- 货物相关API
  - POST /business/product 提交货物
  - GET /business/product/id 根据订单ID列出货物
  - GET /business/product 列出所有货物

- 飞行相关API
  - GET /business/status/id 根据订单ID列出当前飞行状态信息
  - GET /business/status-record/id 根据订单ID列出该订单历史飞行状态信息