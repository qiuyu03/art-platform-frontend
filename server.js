const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();

// 加载自定义模块
const textGenRouter = require("./api/textGenerate");
const { loadRules } = require("./api/utils/ruleLoader");

// 初始化
loadRules();

// 使用 CORS 中间件，并指定允许的源和方法
app.use(cors({
  origin: 'http://localhost:3001', // 允许来自 http://localhost:3001 的请求
  methods: ['POST'] // 仅允许 POST 请求
}));

// 解析 JSON 请求体
app.use(express.json());

// 路由
app.use("/api/text", textGenRouter);

// 监听端口
const PORT = process.env.PORT || 5000; // 如果 .env 中未定义 PORT，则使用 5000 作为默认端口
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});