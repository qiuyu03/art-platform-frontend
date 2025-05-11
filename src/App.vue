<template>
  <div class="app-container" :class="theme">
    <AppNavbar
      @theme-change="toggleTheme"
      :current-theme="theme"
      @save="handleSave"
      @export="handleExport"
    />

    <div class="generation-matrix">
      <!-- 音乐生成模块 -->
      <div class="control-matrix">
        <MusicGenerator 
          ref="musicGenerator"
          :disabled="isGenerating"
          :music-url="generatedMusicUrl"
          @generate="handleAudioGeneration"
          :keywords="generatedKeywords"
          :emotion="generatedEmotion"
          class="quantum-trigger animate-pulse"
        />
      </div>

      <!-- 图像生成模块 -->
      <div class="quantum-core animate-fade-in">
        <ImageGenerator 
          ref="imageGen"
          :prompt="imagePrompt"
          :steps="imageParams.steps"
          :image-url="generatedImageUrl"
          @generate-start="handleVisualGeneration"
          :keywords="generatedKeywords"
          :emotion="generatedEmotion"
          class="hologram-surface"
        />
      </div>

      <!-- 文本生成 + 状态面板 -->
      <div class="generation-console">
        <TextGenerator 
          @textGenerated="handleTextGenerated"
          :content="generationLog"
          class="neural-feed animate-fade-in"
        />

        <div v-if="isGenerating" class="wave-loader">
          <span v-for="n in 5" :key="n" class="wave-bar"></span>
        </div>
      </div>
    </div>

    <!-- Rule Debugger 调试模块 -->
    <RuleDebugger class="dev-panel" @apply-rule="applyMatchedRule" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { generateImageService, generateMusicService } from '../api/services';

import AppNavbar from '@/components/AppNavbar.vue'; 
import ImageGenerator from '@/components/generators/ImageGenerator.vue'; 
import TextGenerator from '@/components/generators/TextGenerator.vue';
import MusicGenerator from '@/components/generators/MusicGenerator.vue';
import RuleDebugger from '@/components/RuleDebugger.vue';

const theme = ref('light');

// 全局状态
const generatedMusicUrl = ref('');
const generatedImageUrl = ref('');
const generationLog = ref('## 系统就绪\n量子生成引擎待命');
const isGenerating = ref(false);
const generatedKeywords = ref([]);
const generatedEmotion = ref('默认');

// 参数配置
const imagePrompt = ref('');
const imageParams = reactive({
  steps: 75,
  creativity: 9.5
});

const musicParams = reactive({
  bpm: 128,
  duration: 60,
  chordType: '量子叠加和弦'
});

// ref 引用
const musicGenerator = ref(null); // ✅ ref 名称统一为 musicGenerator（和模板一致）

// 主题切换
const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
};

// 图像生成处理函数
const handleVisualGeneration = async () => {
  generationLog.value += '\n## 视觉生成启动\n正在解构多维空间参数';
  try {
    const result = await generateImageService({
      prompt: imagePrompt.value,
      params: imageParams
    });
    
    // 日志输出，检查生成结果
    console.log('Image generation result:', result);
    
    generatedImageUrl.value = result.imageUrl;
    generationLog.value += `\n✅ 视觉生成完成: ${result.message}`;
  } catch (error) {
    generationLog.value += `\n❌ 视觉生成失败: ${error.message}`;
  }
};

// 音频生成处理函数
const handleAudioGeneration = async (text) => {
  generationLog.value += '\n## 音频生成启动\n构建混沌振荡场';
  isGenerating.value = true;
  try {
    const result = await generateMusicService({
      bpm: musicParams.bpm,
      duration: musicParams.duration * 1000,
      chordType: musicParams.chordType,
      text
    });
    generatedMusicUrl.value = result.musicUrl;
    generationLog.value += `\n✅ 音频生成完成: ${result.message}`;
    
    const audio = new Audio(result.musicUrl);
    audio.play();
  } catch (error) {
    generationLog.value += `\n❌ 音频生成失败: ${error.message}`;
  } finally {
    isGenerating.value = false;
  }
};

// 文本生成结果处理
const handleTextGenerated = (data) => {
  generatedKeywords.value = data.keywords;
  generatedEmotion.value = data.emotion;

  generationLog.value += `\n🎯 文本生成完成: ${data.content}`;

  imagePrompt.value = data.content;
  musicParams.chordType = data.emotion;

  // 动态注入样式参数
  if (data.image?.style) {
    imageParams.style = data.image.style;
  }
  if (data.music?.bpm) {
    musicParams.bpm = data.music.bpm;
  }

  // 并发生成音频和图像
  handleVisualGeneration();
  handleAudioGeneration(data.content);

  // 可选调用子组件方法（若有定义）
  if (musicGenerator.value?.startMusicGeneration) {
    musicGenerator.value.startMusicGeneration(data.content);
  }
};

// 规则调试器处理函数
const applyMatchedRule = (rule) => {
  console.log('应用规则:', rule);
  if (rule.visualPrompt) imagePrompt.value = rule.visualPrompt;
  if (rule.musicParams) Object.assign(musicParams, rule.musicParams);

  generationLog.value += `\n🎯 应用规则: ${rule.emotion}`;
};

onMounted(() => {
  // 可用于未来初始化逻辑
});
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(to bottom right, #e0f7fa, #c0f2ef);
  transition: background 0.3s ease;
  position: relative;
}

.light {
  background: linear-gradient(to bottom right, #e0f7fa, #c0f2ef);
  color: #212121;
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

.control-matrix {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  backdrop-filter: blur(12px);
  background-color: rgba(255, 255, 255, 0.05);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  width: 350px; /* 增加音乐生成模块的宽度 */
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

/* ✅ RuleDebugger 固定在右下角 */
.dev-panel {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 100;
  max-width: 300px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid #00e1ff;
  border-radius: 12px;
  padding: 1rem;
  font-size: 0.85rem;
  color: #fff;
}
</style>
