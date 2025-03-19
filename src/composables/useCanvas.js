import { ref, onMounted, onUnmounted } from 'vue'

export const useCanvas = (canvasRef) => {
  const ctx = ref(null)
  const drawingState = ref(false)
  const resolution = ref([1920, 1080])

  // 初始化画布引擎 
  const initCanvas = () => {
    if (!canvasRef.value) {
      console.error('Canvas element is not found or not ready.')
      return
    }

    const dpr = window.devicePixelRatio || 1
    const canvas = canvasRef.value
    canvas.width = resolution.value[0] * dpr
    canvas.height = resolution.value[1] * dpr

    try {
      ctx.value = canvas.getContext('2d')
      if (!ctx.value) {
        throw new Error('Failed to get 2D context from the canvas.')
      }
      ctx.value.scale(dpr, dpr)
      console.log('Canvas initialized successfully.')
    } catch (error) {
      console.error('Error initializing canvas:', error)
    }
  }

  // 动态波形绘制 
  const drawAudioWaveform = (audioBuffer, styleConfig = {}) => {
    if (!ctx.value) {
      console.error('Canvas context is not ready.')
      return
    }

    const { gradientStart = '#7F00FF', gradientEnd = '#E100FF' } = styleConfig
    const gradient = ctx.value.createLinearGradient(0, 0, canvasRef.value.width, 0)
    gradient.addColorStop(0, gradientStart)
    gradient.addColorStop(1, gradientEnd)

    const data = audioBuffer.getChannelData(0)
    const step = Math.ceil(data.length / resolution.value[0])

    ctx.value.clearRect(0, 0, ...resolution.value)
    ctx.value.beginPath()

    for (let i = 0; i < resolution.value[0]; i++) {
      const amplitude = data.slice(i * step, (i + 1) * step)
        .reduce((a, b) => Math.max(a, Math.abs(b)), 0)
      const y = (amplitude * resolution.value[1] / 2) + resolution.value[1] / 2
      ctx.value.lineTo(i, y)
    }

    ctx.value.strokeStyle = gradient
    ctx.value.lineWidth = 2
    ctx.value.stroke()
  }

  onMounted(() => {
    if (canvasRef && canvasRef.value) {
      initCanvas()
    } else {
      console.error('Canvas reference is invalid.')
    }
  })

  onUnmounted(() => {
    ctx.value = null
  })

  return {
    ctx,
    resolution,
    drawAudioWaveform,
    startDrawing: () => drawingState.value = true,
    endDrawing: () => drawingState.value = false,
    exportAsImage: (type = 'image/png') => canvasRef.value ? canvasRef.value.toDataURL(type) : null
  }
}