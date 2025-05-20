const express = require('express');
const axios = require('axios');
const { loadRules } = require('./utils/ruleLoader');
const { saveWorkToDB } = require('./utils/workSaver');
const huggingface = require('@huggingface/inference');

const router = express.Router();

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const ALI_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis';

const defaultParams = {
  steps: 40,
  guidance_scale: 9.5,
  size: '1024*1024',
  emotion: 'neutral',
  prompt_extend: true,
  watermark: false
};

// 生成注意力掩码
async function generateAttentionMask(prompt) {
  const tokenizer = new huggingface.CLIPTokenizer({ modelName: 'openai/clip-vit-large-patch14' });
  const textEncoder = new huggingface.CLIPTextModel({ modelName: 'openai/clip-vit-large-patch14' });
  
  const tokens = tokenizer(prompt);
  const textFeatures = await textEncoder(tokens);
  // 这里需要根据具体的 U-Net 结构和图像特征图进行点积运算
  // 简化示例，假设已经有图像特征图 imageFeatures
  const imageFeatures = []; 
  const attentionMask = textFeatures.map((feature) => {
    return imageFeatures.map((imgFeature) => {
      return feature * imgFeature;
    });
  });
  return attentionMask;
}

// 🎯 图像生成主逻辑
async function generateImageService(inputParams) {
  const params = {
    ...defaultParams,
    ...inputParams,
    prompt: inputParams.prompt?.slice(0, 800) || '默认图像描述'
  };

  const rule = await loadRules(params.emotion);
  if (!rule || !rule.text) {
    throw new Error('无法获取有效的规则，请检查数据库或规则文件');
  }

  const fullPrompt = `${rule.text} ${params.prompt}`.trim();

  // 生成注意力掩码
  const attentionMask = await generateAttentionMask(fullPrompt);

  const requestData = {
    model: "wanx2.1-t2i-turbo",
    input: {
      prompt: fullPrompt,
      negative_prompt: "",
      attention_mask: attentionMask // 添加注意力掩码
    },
    parameters: {
      size: params.size,
      n: 1,
      guidance_scale: params.guidance_scale,
      steps: params.steps,
      prompt_extend: params.prompt_extend,
      watermark: params.watermark
    }
  };

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
    'X-DashScope-Async': 'enable'
  };

  const createTaskResponse = await axios.post(ALI_API_URL, requestData, { headers });
  const taskId = createTaskResponse.data.output?.task_id;
  if (!taskId) throw new Error('创建任务失败，未返回 task_id');

  // 轮询任务状态
  const queryUrl = `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`;
  let taskStatus, imageResult;
  const maxAttempts = 12;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    const queryTaskResponse = await axios.get(queryUrl, { headers });

    taskStatus = queryTaskResponse.data.output.task_status;

    if (taskStatus === 'FAILED') {
      throw new Error(`任务执行失败: ${JSON.stringify(queryTaskResponse.data.error)}`);
    }

    if (taskStatus === 'SUCCEEDED') {
      const results = queryTaskResponse.data.output.results;
      if (results?.length > 0 && results[0].url) {
        imageResult = results[0].url;

        // 🧪 测试这个链接是否能直接访问
        try {
          const headRes = await axios.head(imageResult);
          if (headRes.status !== 200) {
            throw new Error('图像链接无效或被限制访问');
          }
        } catch (err) {
          console.warn('⚠️ 图像链接可能无法嵌入显示:', err.message);
        }

        break;
      } else {
        throw new Error('任务成功但未返回图像');
      }
    }
  }

  if (!imageResult) {
    throw new Error('生成图像超时，请稍后重试');
  }

  // 保存作品到数据库
  const work = {
    type: 'image',
    prompt: fullPrompt,
    rulesRef: rule._id, // 假设 rule 对象中有 _id 属性
    timestamp: new Date(),
    url: imageResult,
    metadata: {
        resolution: params.size
    }
  };
  await saveWorkToDB(work);

  return {
    success: true,
    image: imageResult
  };
}

// 🖼️ API 路由接口
router.post('/', async (req, res) => {
  try {
    const result = await generateImageService(req.body.imageParams || {});
    res.json({
      success: true,
      imageUrl: result.image
    });
  } catch (error) {
    console.error('❌ 图像生成失败:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
module.exports.generateImageService = generateImageService;