const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');
const textGenRouter = require('./api/textGenerate.js');
const { loadRules } = require('./api/utils/ruleLoader.js');

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' });
}

const app = express();

// 添加 JSON 解析中间件
app.use(express.json());

const allowedOrigins = [
  'https://art-platform-frontend-b96a.vercel.app',
  'http://localhost:8080', // 添加本地开发支持
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  methods: ['GET', 'POST', 'PUT'],
  credentials: true,
}));

const connectDB = async () => {
  try {
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
    global.dbConnected = true;
    return client;
  } catch (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
};

app.use((req, res, next) => {
  req.context = {
    start: Date.now(),
    isColdStart: !global.dbConnected, // 检测冷启动
  };
  next();
});

app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error: ${err.message}`);
  res.status(500).json({
    error: 'Internal Server Error',
    requestId: req.headers['x-vercel-id'],
  });
});

const initialize = async () => {
  try {
    await connectDB();
    await loadRules();

    app.use('/api/textGenerate', textGenRouter);

    app.get('/api/health', (req, res) => {
      res.json({
        status: 'ok',
        dbStatus: global.dbConnected ? 'connected' : 'disconnected',
        memoryUsage: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)}MB`,
      });
    });

    if (process.env.VERCEL) {
      module.exports = app;
    } else {
      const PORT = process.env.SERVER_PORT || 5000;
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    }
  } catch (err) {
    console.error('Initialization failed:', err);
    process.exit(1);
  }
};

initialize().catch(err => {
  console.error('Initialization failed:', err);
  process.exit(1);
});