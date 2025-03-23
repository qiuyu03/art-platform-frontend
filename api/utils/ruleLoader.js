const clientPromise = require('./db'); // 引入 db.js 中的 MongoDB 客户端

// 缓存规则数据
let cachedRules = null;

// 加载规则函数
async function loadRules(emotion) {
  try {
    if (cachedRules) return cachedRules.find(rule => rule.emotion === emotion) || cachedRules[0]; // 如果已缓存，按情感筛选

    const client = await clientPromise;
    const db = client.db('ArtPlatform');

    const rules = await db.collection('StyleRules').find({}, { projection: { _id: 0 } }).toArray();

    cachedRules = rules;
    console.log(`成功加载 ${rules.length} 条规则`);

    return rules.find(rule => rule.emotion === emotion) || rules[0]; // 返回匹配的情感规则，或者默认规则
  } catch (error) {
    console.error('规则加载失败:', error);
    throw error;
  }
}

module.exports = { loadRules };