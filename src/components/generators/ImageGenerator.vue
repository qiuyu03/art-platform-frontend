<template>
  <div class="quantum-generator">
    <!-- 指令输入舱 -->
    <div class="input-pod">
      <h3 class="cyber-title">量子创作核心</h3>
      <textarea 
        v-model="prompt"
        placeholder="输入时空坐标（示例：赛博朋克机甲战士，暗黑霓虹，8K电影级画质）"
        class="neon-input"
      ></textarea>
    </div>
 
    <!-- 参数控制台 -->
    <div class="control-panel">
      <div class="param-module">
        <label>迭代精度</label>
        <input 
          type="range"
          v-model.number="params.steps" 
          min="20"
          max="50"
          class="glow-slider"
        >
        <span class="param-value">{{ params.steps  }}阶</span>
      </div>
    </div>
 
    <!-- 生成中枢 -->
    <button 
      @click="generate"
      :disabled="isGenerating"
      class="quantum-trigger"
    >
      {{ isGenerating ? '时空解算中...' : '启动量子渲染' }}
    </button>
 
    <!-- 结果展示舱 -->
    <div v-if="imageUrl" class="output-pod">
      <img :src="imageUrl" class="hologram-output">
      <button @click="download" class="data-saver">
        ▼ 捕获时空片段 
      </button>
    </div>
 
    <!-- 异常警告层 -->
    <div v-if="error" class="quantum-alarm">
      ⚠ 时空扰动：{{ error }}
      <button @click="error=null" class="alarm-close">⊗</button>
    </div>
  </div>

   <div class="demo-panel">
  <button 
    v-for="(item, idx) in DEMO_CASES"
    :key="idx"  
    @click="loadDemo(idx)"
    class="demo-case"
  >
    {{ item.title }}
  </button>
</div>
</template>
 
<script setup>
import { ref, reactive } from 'vue'
import { useImageGeneration } from '../../../api/composables/useImageGeneration'
 
const { generateImage, isGenerating, error } = useImageGeneration()
 
// 核心状态矩阵 
const prompt = ref('')
const params = reactive({
  steps: 30,      // 默认值匹配Vercel限制 
  creativity: 7.5, // 使用标准参数名 
  resolution: 512  // 固定分辨率 
})
const imageUrl = ref(null)
 
// 生成协议执行器 
const generate = async () => {
  try {
    const safePrompt = prompt.value.slice(0,  100) // 基础安全过滤 
    const blob = await generateImage(safePrompt, {
      steps: Math.min(params.steps,  50), // 强制安全上限 
      guidance_scale: params.creativity, 
      resolution: params.resolution  
    })
    imageUrl.value  = URL.createObjectURL(blob) 
  } catch (e) {
    console.error(' 量子坍缩记录:', e)
  }
}
 
// 数据捕获协议 
const download = () => {
  const link = document.createElement('a') 
  link.href  = imageUrl.value  
  link.download  = `quantum_${Date.now()}.png` 
  link.click() 
}

const DEMO_CASES = [
  {
    title: "赛博都市",
    prompt: "未来主义城市景观，全息广告与悬浮载具交织，超清细节",
    params: { steps: 35, creativity: 8 }
  },
  {
    title: "机甲战士", 
    prompt: "蒸汽朋克风格机甲，精密机械结构，动态光影渲染",
    params: { steps: 40, creativity: 9 }
  }
]

const loadDemo = (index) => {
  const demo = DEMO_CASES[index]
  prompt.value  = demo.prompt  
  params.steps  = demo.params.steps  
  params.creativity  = demo.params.creativity  
}
</script>
 
<style scoped>
.quantum-generator {
  --quantum-blue: #2CB67D;
  --cyber-border: 1px solid rgba(255,255,255,0.2);
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background: rgba(251, 251, 251, 0.9);
  border-radius: 12px;
  box-shadow: 0 0 30px rgba(44, 182, 125, 0.2);
}
 
.neon-input {
  width: 100%;
  height: 100px;
  padding: 1rem;
  background: rgba(255,255,255,0.05);
  border: var(--cyber-border);
  color: #fff;
  font-size: 1.1em;
  transition: all 0.3s quantum-ease;
}
 
.glow-slider {
  width: 100%;
  height: 6px;
  background: linear-gradient(90deg, #2CB67D 0%, #4FFFB0 100%);
}
 
.quantum-trigger {
  background: linear-gradient(135deg, #2CB67D 0%, #4FFFB0 100%);
  padding: 1rem 3rem;
  border-radius: 50px;
  font-weight: bold;
  transition: transform 0.2s quantum-ease;
}
 
.hologram-output {
  width: 100%;
  border: 2px solid var(--quantum-blue);
  border-radius: 8px;
  margin-top: 1.5rem;
}
 
.quantum-alarm {
  background: rgba(255, 77, 79, 0.15);
  border: 1px solid #ff4d4f;
  padding: 1rem;
  margin-top: 1rem;
  border-radius: 6px;
}
</style>