import { ref } from 'vue'
 
export const useImageGeneration = () => {
  const isGenerating = ref(false)
  const error = ref(null)
 
  const generateImage = async (prompt, params) => {
    isGenerating.value  = true 
    error.value  = null 
    
    try {
      const response = await fetch('../generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: prompt.slice(0,  150), // 基础长度限制 
          steps: Math.min(params.steps,  40), // 客户端简单验证 
          resolution: 512 // 固定分辨率 
        })
      })
 
      if (!response.ok)  throw new Error('服务器响应异常')
      return await response.blob() 
      
    } catch (e) {
      error.value  = e.message.includes('aborted')  
        ? '用户取消操作' 
        : `生成失败: ${e.message}` 
    } finally {
      isGenerating.value  = false 
    }
  }
 
  return { isGenerating, error, generateImage }
}