<template>
  <div class="app-container" :class="theme">
    <AppNavbar
      @theme-change="toggleTheme"
      :current-theme="theme"
      @save="handleSave"
      @export="handleExport"
    />

    <div class="generation-matrix">
      <div class="control-matrix">
        <MusicControls 
          v-model:bpm="musicParams.bpm" 
          v-model:duration="musicParams.duration" 
          class="neural-card animate-fade-in"
        />
        <StyleControls 
          :params="uiParams"
          @param-update="queueStyleUpdate"
          class="neural-card animate-fade-in"
        />
      </div>

      <div class="quantum-core animate-fade-in">
        <ImageGenerator 
          ref="imageGen"
          :prompt="imagePrompt"
          :steps="imageParams.steps" 
          @generate-start="handleVisualGeneration"
          class="hologram-surface"
        />
      </div>

      <div class="generation-console">
        <TextGenerator 
          :content="generationLog"
          class="neural-feed animate-fade-in"
        />
        <MusicGenerator 
          :disabled="isGenerating"
          @generate="handleAudioGeneration"
          class="quantum-trigger animate-pulse"
        />

        <div v-if="isGenerating" class="wave-loader">
          <span v-for="n in 5" :key="n" class="wave-bar"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useStyleControls } from '../api/composables/useStyleControls';
import { generateImageService, generateMusicService } from '../api/services';
import AppNavbar from '@/components/AppNavbar.vue'; 
import MusicControls from '@/components/generators/MusicGenerator.vue';
import ImageGenerator from '@/components/generators/ImageGenerator.vue'; 
import TextGenerator from '@/components/generators/TextGenerator.vue'; 

const { 
  theme,
  uiParams,
  toggleTheme,
  queueStyleUpdate 
} = useStyleControls('dark');

const musicParams = reactive({
  bpm: 128,
  duration: 60,
  chordType: '量子叠加和弦'
});

const imagePrompt = ref('赛博神经音乐可视化矩阵');
const imageParams = reactive({
  steps: 75,
  creativity: 9.5 
});

const generationLog = ref('## 系统就绪\n量子生成引擎待命');
const isGenerating = ref(false);

const handleVisualGeneration = async () => {
  generationLog.value = '## 视觉生成启动\n正在解构多维空间参数';
  try {
    const result = await generateImageService({
      prompt: imagePrompt.value, 
      params: imageParams 
    });
    generationLog.value += `\n视觉生成完成: ${result.message}`;
  } catch (error) {
    generationLog.value += `\n视觉生成失败: ${error.message}`;
  }
};

const handleAudioGeneration = async () => {
  generationLog.value = '## 音频生成启动\n构建混沌振荡场';
  isGenerating.value = true;
  try {
    const result = await generateMusicService(musicParams);
    generationLog.value += `\n音频生成完成: ${result.message}`;
    const audio = new Audio(result.audioUrl);
    audio.play();
  } catch (error) {
    generationLog.value += `\n音频生成失败: ${error.message}`;
  } finally {
    isGenerating.value = false;
  }
};

const handleSave = () => {
  console.log('保存项目触发');
};

const handleExport = () => {
  console.log('导出项目触发');
};

onMounted(() => {
  // 初始化操作
});
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(to bottom right, #e0f7fa, #c0f2ef);
  transition: background 0.3s ease;
}

.dark {
  background: linear-gradient(to bottom right, #121212, #1f1f1f);
  color: #e0e0e0;
}

.generation-matrix {
  display: flex;
  flex: 1;
  overflow: hidden;
  flex-wrap: wrap;
}

.control-matrix,
.quantum-core,
.generation-console {
  flex: 1 1 300px;
  padding: 1rem;
  min-width: 300px;
}

.control-matrix,
.generation-console {
  backdrop-filter: blur(12px);
  background-color: rgba(255, 255, 255, 0.05);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.quantum-core {
  display: flex;
  align-items: center;
  justify-content: center;
}

.neural-card,
.hologram-surface,
.neural-feed,
.quantum-trigger {
  margin-bottom: 1rem;
  padding: 1.2rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.neural-card:hover,
.hologram-surface:hover {
  transform: scale(1.02);
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.6s ease both;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

.animate-pulse {
  animation: pulse 2s infinite;
}

.wave-loader {
  display: flex;
  gap: 4px;
  justify-content: center;
  margin-top: 1rem;
}

.wave-bar {
  width: 6px;
  height: 20px;
  background: #00e1ff;
  border-radius: 4px;
  animation: wave 1s infinite ease-in-out;
}

.wave-bar:nth-child(1) { animation-delay: 0s; }
.wave-bar:nth-child(2) { animation-delay: 0.1s; }
.wave-bar:nth-child(3) { animation-delay: 0.2s; }
.wave-bar:nth-child(4) { animation-delay: 0.3s; }
.wave-bar:nth-child(5) { animation-delay: 0.4s; }

@keyframes wave {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(1.8); }
}

@media (max-width: 900px) {
  .generation-matrix {
    flex-direction: column;
  }
  .control-matrix,
  .quantum-core,
  .generation-console {
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
}
</style>
