const clientPromise = require('./db'); // 引入 MongoDB 客户端

let cachedRules = null;

/**
 * 预加载所有规则，仅执行一次（供初始化时调用）
 */
async function preloadRules() {
  if (!cachedRules) {
    try {
      const client = await clientPromise;
      const db = client.db('ArtPlatform');

      const rules = await db
        .collection('StyleRules')
        .find({}, { projection: { _id: 0 } })
        .toArray();

      cachedRules = rules;
      console.log(`✅ 成功预加载 ${rules.length} 条规则`);
    } catch (error) {
      console.error('❌ 规则预加载失败:', error);
      throw error;
    }
  }
}

/**
 * 加载匹配规则，支持模糊匹配 emotion + keyword
 * @param {Object} options
 * @param {string} options.emotion - 情绪标签，例如 "温暖"
 * @param {string} [options.keyword] - 可选关键词，例如 "童话森林"
 * @returns 匹配的规则对象
 */
async function loadRules({ emotion = 'default', keyword } = {}) {
  try {
    if (!cachedRules) {
      await preloadRules();
    }

    let matched = null;

    // 1. 精确匹配 emotion + keyword
    if (keyword) {
      matched = cachedRules.find(
        rule => rule.emotion === emotion && rule.keyword === keyword
      );
    }

    // 2. 模糊匹配 emotion + keyword（keyword 包含关系，不区分大小写）
    if (!matched && keyword) {
      const keywordLower = keyword.toLowerCase();
      matched = cachedRules.find(
        rule =>
          rule.emotion === emotion &&
          rule.keyword &&
          rule.keyword.toLowerCase().includes(keywordLower)
      );
    }

    // 3. 单字段匹配 emotion
    if (!matched) {
      matched = cachedRules.find(rule => rule.emotion === emotion);
    }

    // 4. fallback：返回默认第一条规则
    return matched || cachedRules[0];
  } catch (error) {
    console.error('规则加载失败:', error);
    throw error;
  }
}

module.exports = { preloadRules, loadRules };
