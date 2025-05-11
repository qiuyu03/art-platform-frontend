const express = require('express');
const router = express.Router();
const axios = require('axios');
const { loadRules } = require('./utils/ruleLoader');
const { generateImageService } = require('./imageGenerate');
const { generateMusicService } = require('./musicGenerate');
const multer = require('multer');
const sharp = require('sharp');
const Tesseract = require('tesseract.js');

// 配置上传文件的存储
const upload = multer({ dest: 'uploads/' });

// 提取图片关键词（示例：通过OCR提取文本）
router.post('/extractKeywordsFromImage', upload.single('image'), async (req, res) => {
  const { file } = req;

  if (!file) {
    return res.status(400).json({ success: false, error: '未上传图片' });
  }

  try {
    // 使用OCR提取图片中的文字
    const { data: { text } } = await Tesseract.recognize(file.path, 'eng', {
      logger: (m) => console.log(m),
    });

    // 基本的关键词提取，可以用正则表达式等进行更复杂的处理
    const keywords = text.split(/\s+/).filter(Boolean).slice(0, 5);  // 获取前5个关键词

    res.json({ success: true, keywords });
  } catch (err) {
    res.status(500).json({ success: false, error: '图片解析失败' });
  }
});

// 生成文本、图片和音乐的接口
router.post('/', async (req, res) => {
  const { keywords, emotion = 'default', imageParams = {}, musicParams = {}, additionalText = '' } = req.body;

  if (!Array.isArray(keywords) || keywords.length === 0) {
    return res.status(400).json({
      success: false,
      error: '参数错误：keywords 应为非空数组'
    });
  }

  try {
    const validEmotion = emotion === '默认' ? 'default' : emotion;
    const rule = await loadRules({ emotion: validEmotion });

    if (!rule || !rule.text) {
      console.error('❌ 无效规则:', rule);
      return res.status(500).json({
        success: false,
        error: '无法加载情绪规则'
      });
    }

    // ✨ 生成文本提示，包含上传提取的 additionalText
    const textPrompt = `
根据以下要素创作内容：
关键词：${keywords.join(', ')}
附加信息：${additionalText.slice(0, 500)}
要求：${rule.text?.keywords?.join('、') || '逻辑清晰、表达生动'}
节奏：${rule.text?.叙事节奏 || '适中'}
字数限制：500字以内
`;

    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: "deepseek-chat",
        messages: [{ role: "user", content: textPrompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('💬 DeepSeek 返回结构:', JSON.stringify(response.data, null, 2));

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string' || !content.trim()) {
      console.error('❌ 文本生成失败: 返回为空或结构异常', response.data);
      return res.status(500).json({
        success: false,
        error: '文本生成失败，内容为空或格式异常'
      });
    }

    const generatedText = content.trim();

    const [imageResult, musicResult] = await Promise.all([
      generateImageService({ ...imageParams, emotion: validEmotion, prompt: generatedText }),
      generateMusicService({ ...musicParams, text: generatedText, keywords, emotion: validEmotion })
    ]);

    res.json({
      success: true,
      content: generatedText,
      image: imageResult,
      music: musicResult
    });

  } catch (error) {
    console.error('❌ 生成流程失败:', error.response?.data || error.message || error);
    res.status(500).json({
      success: false,
      error: '生成失败，请检查日志和环境配置'
    });
  }
});

module.exports = router;
