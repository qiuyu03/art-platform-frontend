const express = require('express');
const axios = require('axios');
const { loadRules } = require('./utils/ruleLoader');

const router = express.Router();
const BEATOVEN_API_BASE_URL = 'https://public-api.beatoven.ai/api/v1';
const BEATOVEN_API_KEY = process.env.BEATOVEN_API_KEY;

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${BEATOVEN_API_KEY}`
};

// 封装为服务函数，供 textGenerate.js 调用
async function generateMusicService({ text = '', emotion = 'happy', tempo = 'medium', genre = 'electronica', duration = 30000 }) {
  if (!text || typeof text !== 'string') {
    console.error('收到的 text 无效:', text);
    throw new Error('无效的文本输入');
  }

  if (duration < 15000 || duration > 300000) {
    throw new Error('持续时间必须在15到300秒之间');
  }

  const rule = await loadRules(text, emotion);

  let description = '';
  if (typeof rule.text === 'object') {
    const { keywords = [], narrative_pace = '' } = rule.text;
    description = `关键词：${keywords.join('、')}，节奏：${narrative_pace}`;
  } else {
    description = rule.text;
  }

  const musicRequestPayload = {
    prompt: { text: description },
    format: 'wav',
    looping: false
  };

  const axiosConfig = {
    headers,
    timeout: 30000
  };

  const musicResponse = await axios.post(
    `${BEATOVEN_API_BASE_URL}/tracks/compose`,
    musicRequestPayload,
    axiosConfig
  );

  const taskId = musicResponse.data.task_id;
  if (!taskId) throw new Error('未能获取Task ID');

  let isCompleted = false;
  let audioUrl = null;
  const maxAttempts = 20;
  let attempts = 0;

  while (!isCompleted && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    const renderStatus = await axios.get(
      `${BEATOVEN_API_BASE_URL}/tasks/${taskId}`,
      axiosConfig
    );

    if (renderStatus.data.status === 'composed' && renderStatus.data.meta.track_url) {
      isCompleted = true;
      audioUrl = renderStatus.data.meta.track_url;
    }

    attempts++;
  }

  if (!isCompleted || !audioUrl) {
    throw new Error('生成超时或失败，请稍后重试');
  }

  return {
    success: true,
    musicUrl: audioUrl
  };
}

// 原 POST 路由：用于测试
router.post('/', async (req, res) => {
  try {
    const musicResult = await generateMusicService(req.body);
    res.json(musicResult);
  } catch (error) {
    console.error('生成音乐失败:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
module.exports.generateMusicService = generateMusicService;
