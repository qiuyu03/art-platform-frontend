const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');
const textGenRouter = require('./api/textGenerate.js'); 
const imageGenRouter = require('./api/imageGenerate.js'); 
const musicGenRouter = require('./api/musicGenerate.js');
const { preloadRules, loadRules } = require('./api/utils/ruleLoader.js');

// ====================
// 环境配置初始化 
// ====================
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' });
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
  lastHealthCheck: null,
  generatedData: {} // 新增生成的数据存储，用于跨模态协同
};

// ====================
// 核心功能模块 
// ====================
const initializeApp = async () => {
  try {
    // 数据库连接（带重试机制）
    appState.dbClient = await connectDBWithRetry(3);
    
    // 规则加载（并发优化）
    await Promise.all([ 
      preloadRules()
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
      if (!origin || origin === 'null' || allowedOrigins.has(origin))  {
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
  console.log('[DEBUG]  挂载路由前 textGenRouter 类型:', typeof textGenRouter);
  console.log('[DEBUG]  路由对象方法:', Object.keys(textGenRouter)); 
  
  // 业务路由 
  app.use('/api/textGenerate', textGenRouter);
  app.use('/api/imageGenerate', imageGenRouter);
  app.use('/api/musicGenerate', musicGenRouter);
  
  
  // 系统监控 
  app.get('/api/health',  (req, res) => {
    appState.lastHealthCheck = new Date();
    res.json({ 
      status: 'healthy',
      uptime: process.uptime(), 
      memoryUsage: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`,
      dbStatus: appState.dbClient ? 'connected' : 'disconnected'
    });
  });

  // 新增的跨模态协同接口
  app.post('/api/crossModalGenerate', async (req, res) => {
    const { textParams, imageParams, musicParams } = req.body;

    try {
      // 处理文本生成
      const textResult = await generateText(textParams);
      
      // 保存生成的关键词和情感
      appState.generatedData.keywords = textResult.keywords;
      appState.generatedData.emotion = textResult.emotion;

      // 生成图像
      const imageResult = await generateImage(imageParams);

      // 生成音乐
      const musicResult = await generateMusic(musicParams);

      // 返回合成的结果
      res.json({
        status: 'success',
        text: textResult,
        image: imageResult,
        music: musicResult
      });
    } catch (error) {
      console.error('跨模态生成失败:', error);
      res.status(500).json({
        status: 'error',
        message: '跨模态生成失败',
        error: error.message
      });
    }
  });

  // 新增的规则匹配接口
  console.log('📡 挂载路由中...');
  app.post('/api/rules/match-rules', async (req, res) => {
    const { emotion, keyword } = req.body;

    try {
      const matchedRule = await loadRules({ emotion, keyword });
      res.json({ rule: matchedRule });
    } catch (err) {
      console.error('规则匹配失败:', err);
      res.status(500).json({ error: '规则匹配失败' });
    }
  });
  console.log('[DEBUG] 路由挂载成功: /api/rules/match-rules');
}

// ====================
// 功能函数：调用生成服务 
// ====================
async function generateText(params) {
  // 发送到文本生成模块
  // 模拟文本生成逻辑并返回结果
  return {
    keywords: ['cyber', 'neural', 'visualization'],
    emotion: 'calm',
    content: '生成的文本内容...'
  };
}

async function generateImage(params) {
  // 发送到图像生成模块
  // 模拟图像生成并返回结果
  return {
    url: 'https://example.com/generated-image.png',
    message: '图像生成成功'
  };
}

async function generateMusic(params) {
  // 发送到音乐生成模块
  // 模拟音乐生成并返回结果
  return {
    url: 'https://example.com/generated-music.mp3',
    message: '音乐生成成功'
  };
}

function requestLogger() {
  return (req, res, next) => {
    const start = Date.now(); 
    res.on('finish',  () => {
      console.log(`🌐  ${req.method}  ${req.url}  - ${res.statusCode}  (${Date.now() - start}ms)`);
    });
    next();
  };
}

// ====================
// 错误处理中间件 
// ====================
app.use((err, req, res, next) => {
  console.error(`💥  未处理异常: ${err.stack}`); 
  res.status(500).json({ 
    error: 'SYSTEM_ERROR',
    message: '服务器内部错误',
    incidentId: req.headers['x-vercel-id'] || Date.now().toString(36) 
  });
});

// ====================
// 部署适配模块 
// ====================
if (process.env.VERCEL) {
  // Vercel无服务器函数适配 
  module.exports = async (req, res) => {
    if (!appState.dbClient) {
      await initializeApp();
    }
    return app(req, res);
  };
} else {
  // 本地开发模式 
  const startLocalServer = async () => {
    await initializeApp();
    const PORT = process.env.SERVER_PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀  本地服务运行中: http://localhost:${PORT}`);
    });
  };

  startLocalServer().catch(err => {
    console.error(' 本地启动失败:', err);
    process.exit(1); 
  });
}
