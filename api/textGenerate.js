const express = require('express');
const router = express.Router();
const { getRuleByEmotion } = require('./utils/ruleLoader');
const axios = require('axios');

// 中间件：根据图像模块参数调整规则
router.use((req, res, next) => {
  // 接收来自图像模块的参数 
  if (req.body.imageParams) {
    const { palette, style } = req.body.imageParams;

    // 根据图像参数调整规则 
    if (style === '水墨风') {
      req.body.emotion = req.body.emotion || '古典';
    }

    if (palette === '冷色调') {
      req.body.keywords = [...(req.body.keywords || []), '寒冷', '孤独'];
    }
  }

  next();
});

// POST /generate 路由处理函数
router.post('/generate', async (req, res) => {
  const { keywords, emotion = 'default' } = req.body;

  // 确保 keywords 是一个数组
  if (!Array.isArray(keywords)) {
    return res.status(400).json({
      success: false,
      error: 'Expected an array of keywords.'
    });
  }

  // 获取规则参数 
  const rule = getRuleByEmotion(emotion);

  // 构建提示词 
  const prompt = `根据以下要素创作内容：
  关键词：${keywords.join(', ')}
  要求：${rule.text?.keywords?.join('、') || ''}
  节奏：${rule.text?.叙事节奏 || '适中'}
  字数限制：300字以内`;

  try {
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