const express = require('express');
const router = express.Router();
const axios = require('axios');

// 引入规则加载工具函数
const { loadRules } = require('./utils/ruleLoader');

// 中间件：处理图像生成参数
router.use((req, res, next) => {
  console.log('📌 收到请求:', req.body); // 打印请求体
  if (req.body && req.body.imageParams) {
    const { prompt, steps, guidance_scale, height, width, emotion, prompt_extend, watermark } = req.body.imageParams;

    // 参数验证与默认值设置
    req.body.imageParams = {
      prompt: prompt?.slice(0, 800) || '默认图像描述', // 最大长度限制800字符
      steps: Math.min(steps || 40, 50), // 最大步数限制50
      guidance_scale: Math.min(guidance_scale || 9.5, 15), // 最大引导比例限制15
      size: '1024*1024', // 固定分辨率为 1024*1024
      emotion: emotion || 'neutral', // 默认情感为neutral
      prompt_extend: prompt_extend !== undefined ? prompt_extend : true, // 默认开启智能改写
      watermark: watermark !== undefined ? watermark : false // 默认不添加水印
    };
  }

  console.log('✅ 处理后的 imageParams:', req.body.imageParams);
  next();
});

// POST 请求路由：调用阿里云文生图V2版API进行图像生成
router.post('/', async (req, res) => {
  const { imageParams } = req.body;

  if (!imageParams || !imageParams.prompt) {
    console.error('❌ 缺少必要参数:', req.body);
    return res.status(400).json({
      success: false,
      error: '缺少必要的图像生成参数，请检查请求体中的 imageParams 字段'
    });
  }

  try {
    console.log('🔄 正在加载规则...');
    const rule = await loadRules(imageParams.emotion);

    if (!rule || !rule.text) {
      console.error('❌ 无效规则:', rule);
      return res.status(500).json({
        success: false,
        error: '无法获取有效的规则，请检查数据库或规则文件'
      });
    }

    // 组合 prompt
    imageParams.prompt = `${rule.text} ${imageParams.prompt}`.trim();
    console.log('📝 最终 prompt:', imageParams.prompt);

    // API 配置
    const ALI_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis';
    const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;

    if (!DASHSCOPE_API_KEY) {
      throw new Error('阿里云 DashScope API Key 未正确配置');
    }

    // 发送图像生成请求
    console.log('🚀 发送请求到阿里云 API...');
    const requestData = {
      model: "wanx2.1-t2i-turbo",
      input: {
        prompt: imageParams.prompt,
        negative_prompt: "", // 可选字段
      },
      parameters: {
        size: imageParams.size,
        n: 1,
        guidance_scale: imageParams.guidance_scale,
        steps: imageParams.steps,
        prompt_extend: imageParams.prompt_extend,
        watermark: imageParams.watermark
      }
    };

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
      'X-DashScope-Async': 'enable'
    };

    const createTaskResponse = await axios.post(ALI_API_URL, requestData, { headers });

    console.log('📩 阿里云 API 响应:', createTaskResponse.data);

    if (!createTaskResponse.data.output || !createTaskResponse.data.output.task_id) {
      throw new Error('创建任务失败，返回的数据中未包含 task_id');
    }

    const taskId = createTaskResponse.data.output.task_id;
    console.log(`🆔 任务创建成功，task_id: ${taskId}`);

    // 查询任务结果
    const queryUrl = `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`;
    let taskStatus;
    let imageResult;
    
    console.log('🔄 开始轮询任务状态...');
    do {
      await new Promise(resolve => setTimeout(resolve, 5000)); // 每隔5秒查询一次
      const queryTaskResponse = await axios.get(queryUrl, { headers });

      taskStatus = queryTaskResponse.data.output.task_status;
      console.log(`⏳ 当前任务状态: ${taskStatus}`);

      if (taskStatus === 'FAILED') {
        throw new Error(`任务执行失败，错误信息: ${JSON.stringify(queryTaskResponse.data.error)}`);
      }

      if (taskStatus === 'SUCCEEDED') {
        const results = queryTaskResponse.data.output.results;
        if (results && results.length > 0) {
          imageResult = results[0].url;
        } else {
          throw new Error('任务成功，但未返回图像结果');
        }
      }
    } while (taskStatus !== 'SUCCEEDED');

    console.log('🎉 任务完成，图像 URL:', imageResult);
    res.json({
      success: true,
      image: imageResult,
    });

  } catch (error) {
    console.error('❌ API 调用失败:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: `图像生成失败: ${error.message}`
    });
  }
});

module.exports = router;
