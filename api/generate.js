// /api/generate.js  核心逻辑 
import { HfInference } from '@huggingface/inference'
 
export default async (req, res) => {
  // 基础验证 
  if(req.method  !== 'POST') return res.status(405).json({  error: '量子通道仅接受POST请求' })
  
  try {
    const { prompt, steps=20, guidance_scale=9.5, height=512, width=512 } = JSON.parse(req.body) 
    
    // 参数安全过滤 
    const safePrompt = prompt.slice(0,  200).replace(/[^a-zA-Z0-9\u4e00-\u9fa5，。！？]/g, '')
    const safeSteps = Math.min(Math.max(steps,  20), 50)
    
    const hf = new HfInference(process.env.HF_API_KEY) 
    const blob = await hf.textToImage({ 
      model: "stabilityai/stable-diffusion-2",
      inputs: safePrompt,
      parameters: { 
        num_inference_steps: safeSteps,
        guidance_scale: Math.min(guidance_scale,  15),
        height: Math.min(height,  1024),
        width: Math.min(width,  1024)
      }
    })
 
    // 返回优化 
    res.setHeader('Content-Type',  'image/png')
    res.setHeader('Cache-Control',  'public, max-age=86400')
    res.send(Buffer.from(await  blob.arrayBuffer())) 
    
  } catch (e) {
    console.error(`[${new  Date().toLocaleString()}] 量子异常:`, e)
    const status = e.response?.status  || 500 
    res.status(status).json({  
      error: status === 429 ? '算力过载，请稍后重试' : '时空扭曲导致生成失败' 
    })
  }
}