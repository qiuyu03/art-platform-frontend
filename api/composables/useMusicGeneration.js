import { ref } from 'vue'
import { useAudioContext } from './useAudioContext'
 
export const useMusicGeneration = () => {
  const { ctx } = useAudioContext()
  const isGenerating = ref(false)
  const generationProgress = ref(0)
  
  // AI音乐生成管道 
  const generateMusic = async (params) => {
    try {
      isGenerating.value  = true 
      const audioBuffer = await ctx.value.decodeAudioData( 
        await generateAI(params)
      )
      
      // 创建音频处理链 
      const source = ctx.value.createBufferSource() 
      const compressor = ctx.value.createDynamicsCompressor() 
      const reverb = ctx.value.createConvolver() 
      
      source.buffer  = audioBuffer 
      source.connect(compressor) 
      compressor.connect(reverb) 
      reverb.connect(ctx.value.destination) 
      
      // 动态参数控制 
      compressor.threshold.setValueAtTime(-24,  ctx.value.currentTime) 
      compressor.ratio.setValueAtTime(12,  ctx.value.currentTime) 
      
      return {
        source,
        play: () => source.start(0), 
        stop: () => source.stop(), 
        export: () => encodeAudioBuffer(audioBuffer)
      }
    } finally {
      isGenerating.value  = false 
    }
  }
 
  // 核心生成逻辑 
  const generateAI = async ({ bpm, chordProgression, style }) => {
    const response = await fetch('/api/generate-music', {
      method: 'POST',
      body: JSON.stringify({ 
        bpm,
        chords: chordProgression,
        genre: style,
        length: 30 // 默认30秒 
      })
    })
    
    const reader = response.body.getReader() 
    const chunks = []
    let received = 0 
    
    while(true) {
      const { done, value } = await reader.read() 
      if(done) break 
      chunks.push(value) 
      received += value.length  
      generationProgress.value  = (received / response.headers.get('Content-Length'))  * 100 
    }
    
    return new Blob(chunks)
  }
 
  return {
    generateMusic,
    isGenerating,
    generationProgress 
  }
}