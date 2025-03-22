<template>
  <div class="app-container" :style="globalStyles">
    <!-- 全息投影层 -->
    <SketchCanvas ref="hologramCanvas" class="quantum-hologram" />
 
    <main class="neural-interface">
      <!-- 导航控制 -->
      <AppNavbar 
        @theme-change="toggleTheme"
        :current-theme="theme"
      />
 
      <!-- 生成矩阵 -->
      <div class="generation-matrix">
        <!-- 参数控制区 -->
        <div class="control-matrix">
          <MusicControls 
            v-model:bpm="musicParams.bpm" 
            v-model:duration="musicParams.duration" 
            class="neural-card"
          />
          <StyleControls 
            :params="uiParams"
            @param-update="queueStyleUpdate"
            class="neural-card"
          />
        </div>
 
        <!-- 核心画布 -->
        <div class="quantum-core">
          <ImageGenerator 
            ref="imageGen"
            :prompt="imagePrompt"
            :steps="imageParams.steps" 
            @generate-start="handleVisualGeneration"
            class="hologram-surface"
          />
        </div>
 
        <!-- 生成控制台 -->
        <div class="generation-console">
          <TextGenerator 
            :content="generationLog"
            class="neural-feed"
          />
          <MusicGenerator 
            :disabled="isGenerating"
            @generate="handleAudioGeneration"
            class="quantum-trigger"
          />
        </div>
      </div>
    </main>
  </div>
</template>
 
<script setup>
import { ref, reactive, onMounted } from 'vue'
// 核心逻辑层 
import { useCanvas } from '../api/composables/useCanvas'
import { useStyleControls } from '../api/composables/useStyleControls'
import { useImageGeneration } from '../api/composables/useImageGeneration'
 
// 原子组件层 
import AppNavbar from '@/components/AppNavbar.vue' 
import SketchCanvas from '@/components/canvas/SketchCanvas.vue' 
import MusicControls from '@/components/controls/MusicControls.vue' 
import StyleControls from '@/components/controls/StyleControls.vue' 
import ImageGenerator from '@/components/generators/ImageGenerator.vue' 
import MusicGenerator from '@/components/generators/MusicGenerator.vue' 
import TextGenerator from '@/components/generators/TextGenerator.vue' 
 
// 量子状态初始化 
const hologramCanvas = ref(null)
const { ctx: hologramCtx } = useCanvas(hologramCanvas)
 
const { 
  theme,
  uiParams,
  globalStyles,
  toggleTheme,
  queueStyleUpdate 
} = useStyleControls('dark')
 
const {
  generateMusic,
  generateImage,
  isGenerating
} = useImageGeneration()
 
// 响应式数据场 
const musicParams = reactive({
  bpm: 128,
  duration: 60,
  chordType: '量子叠加和弦'
})
 
const imagePrompt = ref('赛博神经音乐可视化矩阵')
const imageParams = reactive({
  steps: 75,
  creativity: 9.5 
})
 
const generationLog = ref('## 系统就绪\n量子生成引擎待命')
 
// 事件处理器 
const handleVisualGeneration = async () => {
  generationLog.value  = '## 视觉生成启动\n正在解构多维空间参数'
  await generateImage({
    prompt: imagePrompt.value, 
    params: imageParams 
  })
}
 
const handleAudioGeneration = async () => {
  generationLog.value  = '## 音频生成启动\n构建混沌振荡场'
  const audio = await generateMusic(musicParams)
  audio.play() 
}
 
// 生命周期同步 
onMounted(() => {
  hologramCtx.value?.initializeParticleSystem() 
})
</script>
 
<style scoped>
.app-container {
  --quantum-gradient: radial-gradient(circle at 50% 100%, #fdfdfd 0%, #fbfbfb 100%);
  height: 100vh;
  background: var(--quantum-gradient);
}
 
.neural-interface {
  display: grid;
  grid-template-rows: 60px 1fr;
  height: 100%;
  position: relative;
  overflow: hidden;
}
 
.generation-matrix {
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  gap: 1.5rem;
  padding: 1.5rem;
}
 
.neural-card {
  background: rgba(249, 249, 250, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid #7F5AF0;
  border-radius: 16px;
  margin-bottom: 1rem;
  padding: 1.2rem;
}
 
.quantum-core {
  position: relative;
  border: 2px solid #7F5AF0;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(127, 90, 240, 0.2);
}
 
.generation-console {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}
 
.quantum-trigger {
  align-self: flex-end;
  margin-top: auto;
}
 
.neural-feed {
  height: 200px;
  overflow-y: auto;
}
</style>