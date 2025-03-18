<template>
  <div class="container">
    <!-- 顶部导航栏 -->
    <nav class="navbar">
      <h1>智能艺术创作平台</h1>
      <div class="nav-buttons">
        <button @click="saveProject">保存项目</button>
        <button @click="exportProject">导出</button>
      </div>
    </nav>

    <div class="main-content">
      <!-- 左侧输入面板 -->
      <div class="left-panel">
        <!-- 文本输入 -->
        <div class="input-group">
          <h3>文本描述</h3>
          <textarea 
            v-model="prompt" 
            placeholder="请输入创作描述（如：科幻风格的未来城市）"
          ></textarea>
        </div>

        <!-- 画板区域 -->
        <div class="input-group">
          <h3>草图绘制 <button @click="clearCanvas">清空</button></h3>
          <canvas id="canvas" width="400" height="300"></canvas>
        </div>

        <!-- 音乐参数 -->
        <div class="input-group">
          <h3>音乐参数</h3>
          <div class="slider-group">
            <label>BPM：{{ bpm }}</label>
            <input 
              type="range" 
              min="60" 
              max="200" 
              v-model="bpm"
            >
          </div>
          <div class="select-group">
            <label>和弦类型：</label>
            <select v-model="selectedChord">
              <option v-for="chord in chords" :key="chord">{{ chord }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 中间生成区 -->
      <div class="center-panel">
        <!-- 图像预览 -->
        <div class="preview-section">
          <h3>图像生成结果</h3>
          <div class="image-preview">
            <img :src="generatedImage" v-if="generatedImage">
            <div v-else class="placeholder">等待生成...</div>
          </div>
        </div>

        <!-- 音乐播放 -->
        <div class="preview-section">
          <h3>音乐生成结果</h3>
          <audio 
            controls 
            :src="generatedMusic" 
            v-if="generatedMusic"
          ></audio>
          <div v-else class="placeholder">等待生成...</div>
        </div>

        <!-- 文本结果 -->
        <div class="preview-section">
          <h3>文本生成结果</h3>
          <div class="text-output">
            {{ generatedText || "等待生成..." }}
          </div>
        </div>
      </div>

      <!-- 右侧控制面板 -->
      <div class="right-panel">
        <div class="control-group">
          <h3>风格控制</h3>
          <div class="emotion-selector">
            <button 
              v-for="emotion in emotions" 
              :key="emotion" 
              @click="selectEmotion(emotion)"
              :class="{ active: selectedEmotion === emotion }"
            >
              {{ emotion }}
            </button>
          </div>
        </div>

        <div class="control-group">
          <h3>高级参数</h3>
          <div class="color-picker">
            <label>主色调：</label>
            <input type="color" v-model="selectedColor">
          </div>
          <div class="slider-group">
            <label>对比度：{{ contrast }}%</label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              v-model="contrast"
            >
          </div>
        </div>

        <button 
          class="generate-button" 
          @click="generateAll"
          :disabled="isGenerating"
        >
          {{ isGenerating ? '生成中...' : '开始生成' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fabric } from 'fabric'

// 画板实例
let canvas = null

// 响应式数据
const prompt = ref('A futuristic cityscape with neon lights, cyberpunk style')
const generatedImage = ref('')
const generatedMusic = ref('')
const generatedText = ref('')
const apiUrl = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1"
const apiKey = "YOUR_HF_API_KEY" // 替换为实际API密钥
const isGenerating = ref(false)

// 音乐参数
const bpm = ref(120)
const chords = ref(['强力和弦', '小调和弦', '七和弦'])
const selectedChord = ref('强力和弦')

// 风格参数
const emotions = ref(['热血', '悲伤', '温馨', '科幻'])
const selectedEmotion = ref('热血')
const selectedColor = ref('#ff4500')
const contrast = ref(80)

// 初始化画板
onMounted(() => {
  canvas = new fabric.Canvas('canvas', {
    isDrawingMode: true,
    backgroundColor: '#f0f0f0'
  })
})

// 清空画板
const clearCanvas = () => {
  canvas.clear()
}

// 生成所有内容
const generateAll = async () => {
  try {
    isGenerating.value = true;
    const sketchData = canvas.toDataURL();
    
    // 并行生成所有内容
    await Promise.allSettled([
      generateImage(sketchData),
      generateMusic(),
      generateText()
    ]);
    
  } catch (error) {
    alert('部分生成失败，请检查控制台');
  } finally {
    isGenerating.value = false;
  }
}

// 生成图像
const generateImage = async (sketch) => {
  try {
    const payload = {
      inputs: prompt.value,
      parameters: {
        num_inference_steps: 50,
        guidance_scale: 7.5,
      }
    };

    // 如果包含草图
    if (sketch) {
      payload.parameters.image = dataURItoBlob(sketch);
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // 处理排队情况
    if (response.status === 503) {
      const result = await response.json();
      return await handleModelLoading(result.estimated_time);
    }

    const blob = await response.blob();
    generatedImage.value = URL.createObjectURL(blob);
  } catch (error) {
    console.error('生成失败:', error);
    alert(`生成失败: ${error.message}`);
  }
}

// 生成音乐
const generateMusic = async () => {
  try {
    // 调用自建音乐生成API（需部署在云服务器）
    const response = await fetch('https://your-music-api.com/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: prompt.value,
        bpm: bpm.value,
        duration: 30 // 生成30秒音乐
      })
    });

    const audioBlob = await response.blob();
    generatedMusic.value = URL.createObjectURL(audioBlob);
  } catch (error) {
    console.error('音乐生成失败:', error);
  }
}

// 生成文本
const generateText = async () => {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VUE_APP_DEEPSEEK_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'user',
          content: `根据以下要求生成故事大纲：\n主题：${prompt.value}\n风格：${selectedEmotion.value}`
        }]
      })
    });

    const data = await response.json();
    generatedText.value = data.choices[0].message.content;
  } catch (error) {
    console.error('文本生成失败:', error);
  }
}

// 在selectEmotion方法中触发参数更新
const selectEmotion = (emotion) => {
  selectedEmotion.value = emotion;
  
  // 根据规则库更新参数
  const rules = {
    热血: { color: '#ff4500', bpm: 140, contrast: 80 },
    悲伤: { color: '#2f4f4f', bpm: 65, contrast: 40 },
    温馨: { color: '#ffb6c1', bpm: 100, contrast: 60 }
  };
  
  if (rules[emotion]) {
    selectedColor.value = rules[emotion].color;
    bpm.value = rules[emotion].bpm;
    contrast.value = rules[emotion].contrast;
  }
}

// 处理模型加载等待
const handleModelLoading = async (estimatedTime) => {
  await new Promise(resolve => setTimeout(resolve, estimatedTime * 1000));
  return generateImage(); // 重新尝试请求
}


// 辅助函数：DataURL转Blob
function dataURItoBlob(dataURI) {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }

  return new Blob([uint8Array], { type: mimeString });
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #2c3e50;
  color: white;
}

.main-content {
  display: flex;
  flex: 1;
  gap: 1rem;
  padding: 1rem;
}

.left-panel, .right-panel {
  flex: 1;
  min-width: 300px;
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
}

.center-panel {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-group {
  margin-bottom: 1.5rem;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.preview-section {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  flex: 1;
}

.image-preview img {
  max-width: 100%;
  border-radius: 4px;
}

.placeholder {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  color: #666;
  border-radius: 4px;
}

.generate-button {
  width: 100%;
  padding: 12px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.generate-button:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.emotion-selector button {
  margin: 4px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 20px;
  background: white;
  cursor: pointer;
}

.emotion-selector button.active {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.slider-group {
  margin: 1rem 0;
}

.slider-group input[type="range"] {
  width: 100%;
}

@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
  }
}
</style>