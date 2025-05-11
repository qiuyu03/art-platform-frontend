<script setup>
import { ref } from 'vue';

const emotion = ref('');
const keyword = ref('');
const matchedRule = ref(null);
const errorMessage = ref(null); // 错误消息

const testRule = async () => {
  try {
    const res = await fetch('http://localhost:3001/api/rules/match-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emotion: emotion.value,
        keyword: keyword.value
      })
    });

    // 检查请求是否成功
    if (!res.ok) {
      throw new Error(`请求失败: ${res.statusText}`);
    }

    const data = await res.json();
    matchedRule.value = data.rule;
    errorMessage.value = null; // 清除之前的错误信息
  } catch (error) {
    errorMessage.value = `发生错误: ${error.message}`;
    matchedRule.value = null; // 清除之前的匹配结果
  }
};
</script>

<template>
  <div class="rule-debugger neural-card">
    <h3 class="text-xl font-bold mb-2">🎛 跨模态规则调试</h3>

    <div class="form-group">
      <label>情绪</label>
      <input v-model="emotion" class="input" placeholder="如：温暖" />
    </div>

    <div class="form-group">
      <label>关键词</label>
      <input v-model="keyword" class="input" placeholder="如：童话森林" />
    </div>

    <button class="btn mt-2" @click="testRule">测试规则</button>

    <div v-if="errorMessage" class="error mt-4">
      <p class="text-red-500">{{ errorMessage }}</p>
    </div>

    <div v-if="matchedRule" class="result mt-4">
      <p><strong>图像风格:</strong> {{ matchedRule.imageStyle }}</p>
      <p><strong>音乐风格:</strong> {{ matchedRule.musicStyle }}</p>
      <p><strong>BPM:</strong> {{ matchedRule.bpm }}</p>
      <p><strong>和弦类型:</strong> {{ matchedRule.chordType }}</p>
    </div>
  </div>
</template>

<style scoped>
/* 添加错误信息的样式 */
.error {
  padding: 1rem;
  background-color: rgba(255, 0, 0, 0.2);
  color: #ff0000;
  border-radius: 0.5rem;
}

.rule-debugger {
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 1rem;
  background: rgba(0, 0, 0, 0.3);
}

.form-group {
  margin-bottom: 0.75rem;
}

.input {
  width: 100%;
  padding: 0.4rem;
  border-radius: 0.5rem;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.btn {
  background: #00e1ff;
  color: #000;
  padding: 0.5rem 1rem;
  border-radius: 0.75rem;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.btn:hover {
  transform: scale(1.05);
}
</style>
