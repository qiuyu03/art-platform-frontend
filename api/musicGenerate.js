const express = require('express');
const axios = require('axios');
const { loadRules } = require('./utils/ruleLoader');
const { saveWorkToDB } = require('./utils/workSaver');
const clientPromise = require('./utils/db');

const router = express.Router();
const BEATOVEN_API_BASE_URL = 'https://public-api.beatoven.ai/api/v1';
const BEATOVEN_API_KEY = process.env.BEATOVEN_API_KEY;

const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${BEATOVEN_API_KEY}`
};

// 根据情感选择乐器组合并调整参数
async function selectInstrumentsAndAdjustParams(emotion) {
    let instruments = [];
    let volumeRange = [80, 100]; // 默认音量范围

    try {
        const client = await clientPromise;
        const db = client.db('ArtPlatform');
        const collection = db.collection('EmotionInstrumentMatrix');

        const matrixEntry = await collection.findOne({ emotion });
        if (matrixEntry) {
            const instrumentWeights = matrixEntry.instruments;
            const sortedInstruments = Object.entries(instrumentWeights).sort((a, b) => b[1] - a[1]);
            instruments = sortedInstruments.slice(0, 3).map(([instrument, weight]) => instrument);
        }

        // 动态调整参数
        if (emotion === "忧郁") {
            instruments = ["大提琴", "单簧管"];
            volumeRange = [60, 70];
        }
    } catch (error) {
        console.error('从数据库获取关联矩阵失败:', error);
    }

    return { instruments, volumeRange };
}

// 封装为服务函数，供 textGenerate.js 调用
async function generateMusicService({ text = '', emotion = 'happy', tempo = 'medium', genre = 'electronica', duration = 30000 }) {
    if (!text || typeof text !== 'string') {
        console.error('收到的 text 无效:', text);
        throw new Error('无效的文本输入');
    }

    if (duration < 15000 || duration > 300000) {
        throw new Error('持续时间必须在 15 到 300 秒之间');
    }

    const rule = await loadRules(text, emotion);

    let description = '';
    if (typeof rule.text === 'object') {
        const { keywords = [], narrative_pace = '' } = rule.text;
        description = `关键词：${keywords.join('、')}，节奏：${narrative_pace}`;
    } else {
        description = rule.text;
    }

    // 根据情感选择乐器组合并调整参数
    const { instruments, volumeRange } = await selectInstrumentsAndAdjustParams(emotion);

    const musicRequestPayload = {
        prompt: { text: description },
        format: 'wav',
        looping: false,
        instruments,
        volumeRange
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
    if (!taskId) throw new Error('未能获取 Task ID');

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

    // 保存作品到数据库
    const work = {
        type: 'music',
        prompt: description,
        rulesRef: rule._id, // 假设 rule 对象中有 _id 属性
        timestamp: new Date(),
        url: audioUrl,
        metadata: {
            duration: duration / 1000
        }
    };
    await saveWorkToDB(work);

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