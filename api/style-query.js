// /api/style-query.js  
import { connectToDatabase } from './utils/db.js' 
import Cors from 'cors'
 
/**
 * 风格参数查询接口 v1.0 
 * 核心功能：
 * - 多维度参数联合查询（情感/视觉/音乐/文本）
 * - 分页查询支持 
 * - 模糊匹配与范围过滤 
 */

// 初始化CORS中间件 
const cors = Cors({
  origin: [
    'http://localhost:3000',    // 本地开发环境 
    'https://art-platform.com',  // 生产域名 
    'https://studio.example'     // 设计工具域名 
  ],
  methods: ['GET', 'OPTIONS'],  // 允许的HTTP方法 
  allowedHeaders: ['Content-Type', 'Authorization']
})
 
// 中间件运行器 
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result)
      return resolve(result)
    })
  })
}
 
const MAX_PAGE_SIZE = 50 // 最大单页数据量 
 
export default async function handler(req, res) {
  // 执行CORS预检 
  await runMiddleware(req, res, cors)
  
  // 处理OPTIONS请求 
  if (req.method  === 'OPTIONS') {
    return res.status(204).end() 
  }

  const client = await connectToDatabase()
  const db = client.db('ArtPlatform') 
  const collection = db.collection('StyleRules') 

  // 在响应头追加安全策略 
  res.setHeader('Access-Control-Expose-Headers',  'X-Total-Count')
  res.setHeader('X-Content-Type-Options',  'nosniff')
 
  try {
    // 方法验证 
    if (req.method  !== 'GET') {
      return res.status(405).json({ 
        error: '仅支持GET请求',
        supportedMethods: ['GET']
      })
    }
 
    // 解析查询参数 
    const { 
      emotion,      // 情感类型 
      color,        // 颜色值（支持模糊匹配）
      minBPM,       // 最低BPM值 
      keyword,      // 文本关键词 
      page = 1,     // 当前页码 
      pageSize = 20 // 每页数量 
    } = req.query  
 
    // 构建查询条件 
    const styleFilter = {
      ...(emotion && { emotion: { $regex: emotion, $options: 'i' } }),
      ...(color && { 'image.color':  { $regex: color.slice(0,4),  $options: 'i' } }),
      ...(minBPM && { 'music.bpm':  { $gte: Number(minBPM) } }),
      ...(keyword && { 'text.keywords':  keyword })
    }
 
    // 执行数据库查询 
    const [data, total] = await Promise.all([ 
      collection.find(styleFilter) 
        .sort({ 'music.bpm':  -1 }) // 按BPM降序 
        .skip((page - 1) * pageSize)
        .limit(Math.min(pageSize,  MAX_PAGE_SIZE))
        .toArray(),
      collection.countDocuments(styleFilter) 
    ])
 
    // 构建响应数据 
    res.status(200).json({ 
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total  / pageSize),
        totalItems: total 
      },
      results: data.map(item  => ({
        emotion: item.emotion, 
        image: {
          color: item.image.color, 
          contrast: item.image.contrast  + '%'
        },
        music: {
          bpm: item.music.bpm, 
          chords: item.music.chords  
        },
        keywords: item.text.keywords  
      }))
    })
 
  } catch (dbError) {
    console.error(' 数据库查询失败:', dbError)
    res.status(500).json({ 
      error: '服务端数据查询异常',
      errorCode: 'DB_QUERY_FAILED'
    })
  } finally {
    if (client && client.topology.isConnected())  {
      await client.close() 
    }
  }
}