const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');
const textGenRouter = require('./api/textGenerate.js'); 
const { loadRules } = require('./api/utils/ruleLoader.js'); 
 
// ====================
// 环境配置初始化 
// ====================
if (process.env.NODE_ENV  !== 'production') {
  dotenv.config({  path: '.env.local'  });
}
 
// ====================
// Express应用配置 
// ====================
const app = express();
 
// 中间件配置 
app.use(express.json()); 
app.use(requestLogger());   // 自定义请求日志 
 
// CORS配置（安全增强版）
configureCORS(app);
 
// ====================
// 全局状态管理 
// ====================
const appState = {
  dbClient: null,
  rulesLoaded: false,
  lastHealthCheck: null 
};
 
// ====================
// 核心功能模块 
// ====================
const initializeApp = async () => {
  try {
    // 数据库连接（带重试机制）
    appState.dbClient  = await connectDBWithRetry(3);
    
    // 规则加载（并发优化）
    await Promise.all([ 
      loadRules(),
      preheatAPIConnections() // 预先建立API连接 
    ]);
    
    // 路由挂载 
    mountRoutes();
    
    console.log('🟢  应用初始化完成');
  } catch (err) {
    console.error('🔴  致命初始化错误:', err);
    process.exit(1); 
  }
};
 
// ====================
// 功能函数实现 
// ====================
function configureCORS(app) {
  const allowedOrigins = new Set([
    'https://art-platform-frontend-b96a.vercel.app', 
    'http://localhost:8080'
  ]);
 
  app.use(cors({ 
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin))  {
        callback(null, true);
      } else {
        console.warn(`🚨  CORS阻断请求来源: ${origin}`);
        callback(new Error('CORS策略限制'));
      }
    },
    methods: ['GET', 'POST', 'PUT'],
    credentials: true 
  }));
}
 
async function connectDBWithRetry(retries) {
  while (retries > 0) {
    try {
      const client = await MongoClient.connect(process.env.MONGODB_URI,  {
        serverSelectionTimeoutMS: 5000,
        heartbeatFrequencyMS: 30000 
      });
      console.log('📦  MongoDB连接成功');
      return client;
    } catch (err) {
      retries--;
      console.warn(`⚠️  数据库连接失败，剩余重试次数: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  throw new Error('无法连接数据库');
}
 
function mountRoutes() {
  // 业务路由 
  app.use('/api/textGenerate',  textGenRouter);
  
  // 系统监控 
  app.get('/api/health',  (req, res) => {
    appState.lastHealthCheck  = new Date();
    res.json({ 
      status: 'healthy',
      uptime: process.uptime(), 
      memoryUsage: `${(process.memoryUsage().heapUsed  / 1024 / 1024).toFixed(2)}MB`,
      dbStatus: appState.dbClient  ? 'connected' : 'disconnected'
    });
  });
}
 
function requestLogger() {
  return (req, res, next) => {
    const start = Date.now(); 
    res.on('finish',  () => {
      console.log(`🌐  ${req.method}  ${req.url}  - ${res.statusCode}  (${Date.now()  - start}ms)`);
    });
    next();
  };
}
 
// ====================
// 错误处理中间件 
// ====================
app.use((err,  req, res, next) => {
  console.error(`💥  未处理异常: ${err.stack}`); 
  res.status(500).json({ 
    error: 'SYSTEM_ERROR',
    message: '服务器内部错误',
    incidentId: req.headers['x-vercel-id']  || Date.now().toString(36) 
  });
});
 
// ====================
// 部署适配模块 
// ====================
if (process.env.VERCEL)  {
  // Vercel无服务器函数适配 
  module.exports  = async (req, res) => {
    if (!appState.dbClient)  {
      await initializeApp();
    }
    return app(req, res);
  };
} else {
  // 本地开发模式 
  const startLocalServer = async () => {
    await initializeApp();
    const PORT = process.env.SERVER_PORT  || 5000;
    app.listen(PORT,  () => {
      console.log(`🚀  本地服务运行中: http://localhost:${PORT}`);
    });
  };
 
  startLocalServer().catch(err => {
    console.error(' 本地启动失败:', err);
    process.exit(1); 
  });
}