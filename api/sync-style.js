// /api/sync-style.js
const { connectToDatabase } = require('./utils/db');

export default async function handler(req, res) {
  // 1. 仅允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 2. 解析请求参数
    const { emotion } = req.body;
    if (!emotion) {
      return res.status(400).json({ error: 'Missing emotion parameter' });
    }

    // 3. 连接数据库
    const client = await connectToDatabase();
    const db = client.db('ArtPlatform'); // 指定数据库名称
    const collection = db.collection('StyleRules'); // 指定集合名称

    // 4. 查询匹配的规则
    const rule = await collection.findOne({ emotion });
    if (!rule) {
      return res.status(404).json({ error: 'No matching style rule found' });
    }

    // 5. 返回跨模态参数
    res.setHeader('Access-Control-Allow-Origin', '*'); // 允许跨域
    res.status(200).json({
      imageParams: rule.image,
      musicParams: rule.music,
      textParams: rule.text
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}