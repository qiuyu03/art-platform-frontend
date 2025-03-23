const express = require('express');
const router = express.Router();
const { loadRules } = require('./utils/ruleLoader');
const axios = require('axios');

router.use((req, res, next) => {
  if (req.body && req.body.imageParams) {
    const { palette, style } = req.body.imageParams;

    if (style === '水墨风') {
      req.body.emotion = req.body.emotion || '古典';
    }

    if (palette === '冷色调') {
      req.body.keywords = [...(req.body.keywords || []), '寒冷', '孤独'];
    }
  }

  next();
});

router.post('/', async (req, res) => {
  const { keywords, emotion = 'default' } = req.body;

  if (!Array.isArray(keywords)) {
    return res.status(400).json({
      success: false,
      error: 'Expected an array of keywords.'
    });
  }

  try {
    const rule = await loadRules(emotion); // 等待规则加载完成

    if (!rule || !rule.text) {
      console.error('无效规则:', rule);
      return res.status(500).json({
        success: false,
        error: '无法获取有效的规则，请检查数据库'
      });
    }

    const prompt = `根据以下要素创作内容：
    关键词：${keywords.join(', ')}
    要求：${rule.text?.keywords?.join('、') || ''}
    节奏：${rule.text?.叙事节奏 || '适中'}
    字数限制：300字以内`;

    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      content: response.data.choices[0].message.content
    });

  } catch (error) {
    console.error('API 调用失败:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: '生成失败，请检查输入参数和环境变量设置'
    });
  }
});

module.exports = router;