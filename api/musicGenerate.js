const express = require('express');
const router = express.Router();
const axios = require('axios');
const { loadRules } = require('./utils/ruleLoader');

const BEATOVEN_API_BASE_URL = 'https://public-api.beatoven.ai/api/v1';
const BEATOVEN_API_KEY = process.env.BEATOVEN_API_KEY;

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${BEATOVEN_API_KEY}`
};

router.post('/', async (req, res) => {
  try {
    const { text, emotion = 'happy', tempo = 'medium', genre = 'electronica', duration = 30000 } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: '无效的文本输入' });
    }

    if (duration < 15000 || duration > 300000) {
      return res.status(400).json({ error: '持续时间必须在15到300秒之间' });
    }

    // 加载规则生成歌词内容（预处理）
    const rule = await loadRules(text, emotion);

    // 构建 description 字符串
    let description = '';
    if (typeof rule.text === 'object') {
      const { keywords = [], narrative_pace = '' } = rule.text;
      description = `关键词：${keywords.join('、')}，节奏：${narrative_pace}`;
    } else {
      description = rule.text;
    }

    // 构建请求体
    const musicRequestPayload = {
      prompt: {
        text: description
      },
      format: 'wav',
      looping: false
    };

    console.log(' 正在生成音乐...');
    console.log(' 请求体:', musicRequestPayload);

    const axiosConfig = {
      headers,
      timeout: 30000
    };

    const musicResponse = await axios.post(
      `${BEATOVEN_API_BASE_URL}/tracks/compose`,
      musicRequestPayload,
      axiosConfig
    );

    console.log(' 音乐生成响应:', musicResponse.data);

    const taskId = musicResponse.data.task_id;
    if (!taskId) throw new Error('未能获取Task ID');

    // 轮询渲染状态
    console.log(' 开始轮询渲染状态...');
    let isCompleted = false;
    let audioUrl = null;
    const maxAttempts = 20;
    let attempts = 0;

    while (!isCompleted && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log(` 轮询第 ${attempts + 1} 次...`);

      const renderStatus = await axios.get(
        `${BEATOVEN_API_BASE_URL}/tasks/${taskId}`,
        axiosConfig
      );
      console.log(' 渲染状态响应:', renderStatus.data);

      if (renderStatus.data.status === 'composed' && renderStatus.data.meta.track_url) {
        isCompleted = true;
        audioUrl = renderStatus.data.meta.track_url;
      }

      attempts++;
    }

    if (!isCompleted || !audioUrl) {
      throw new Error('生成超时或失败，请稍后重试');
    }

    console.log(' 音乐生成成功，音频地址:', audioUrl);
    res.json({ success: true, musicUrl: audioUrl });
  } catch (error) {
    console.error(' 生成音乐失败:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });

    if (error.response && error.response.status === 422) {
      console.error(' 请求格式有误，请求体:', req.body);
      console.error(' 错误详情:', error.response.data.detail);
    }

    res.status(500).json({
      success: false,
      error: error.response?.data?.error || error.message
    });
  }
});

module.exports = router;
