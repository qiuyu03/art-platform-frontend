<template>
  <div class="neural-card animate-fade-in text-generator">
    <h5 class="section-title">文本生成</h5>

    <div class="input-group">
      <input 
        v-model="inputKeywords" 
        placeholder="输入你想要生成的故事描述"
        @keyup.enter="handleGenerate" 
      />
      <select v-model="selectedEmotion">
        <option v-for="emotion in emotionOptions" :key="emotion">
          {{ emotion }}
        </option>
      </select>
    </div>

    <!-- 文件上传区 -->
    <div class="upload-group">
      <label class="upload-label">
        选择文件（PDF, DOCX, TXT, PNG, JPG, JPEG）:
        <input type="file" accept=".pdf,.docx,.txt,image/*" @change="handleFileUpload" />
      </label>
    </div>

    <div v-if="extractedText" class="extracted-text">
      <h6>提取内容（可编辑）</h6>
      <textarea v-model="extractedText" rows="6" />
    </div>

    <button 
      :disabled="isGenerating || !inputKeywords.trim()"
      @click="handleGenerate"
      class="action-button"
    >
      {{ isGenerating ? '生成中...' : '开始创作' }}
    </button>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="generatedText" class="output-box">
      <pre>{{ generatedText }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineEmits } from 'vue';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { GlobalWorkerOptions } from 'pdfjs-dist/build/pdf';

const emit = defineEmits(['textGenerated']);

const inputKeywords = ref('');
const selectedEmotion = ref('默认');
const extractedText = ref('');  // 新增：提取出来的文件内容
const generatedText = ref('');
const isGenerating = ref(false);
const error = ref('');
const imageKeywords = ref([]);  // 存储从图片中提取的关键词

const emotionOptions = JSON.parse(process.env.VUE_APP_EMOTION_OPTIONS || '["默认","热血","悲伤","古典"]');
const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001';

const formattedKeywords = computed(() => {
  return [...new Set([
    ...inputKeywords.value.split(',').map(k => k.trim()).filter(Boolean),
    ...imageKeywords.value  // 合并图片提取的关键词
  ])];
});

const emotionMap = {
  默认: '普通',
  热血: '激情',
  悲伤: '忧郁',
  古典: '宁静'
};

const processedEmotion = computed(() => {
  return emotionMap[selectedEmotion.value] || '普通';
});

GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// 处理文件上传：文本文件和图片文件
const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    if (file.type === 'application/pdf') {
      const pdf = await pdfjsLib.getDocument(await file.arrayBuffer()).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(' ');
      }
      extractedText.value = text.trim();
    } else if (file.name.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer();
      const { value } = await mammoth.extractRawText({ arrayBuffer });
      extractedText.value = value.trim();
    } else if (file.type.startsWith('text/')) {
      extractedText.value = await file.text();
    } else if (file.type.startsWith('image/')) {
      // 上传图片并提取关键词
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`${API_BASE_URL}/api/extractKeywordsFromImage`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('图片处理失败');

      const data = await response.json();

      if (data.keywords) {
        imageKeywords.value = data.keywords;  // 更新提取的关键词
      } else {
        error.value = '图片未能提取到有效的关键词';
      }
    } else {
      error.value = '仅支持 PDF, DOCX, TXT 或 图片 文件';
    }
  } catch (err) {
    error.value = '文件解析失败: ' + (err.message || '未知错误');
  }
};

const handleGenerate = async () => {
  if (!formattedKeywords.value.length) {
    error.value = '请输入至少一个关键词';
    return;
  }

  try {
    isGenerating.value = true;
    error.value = '';
    generatedText.value = '';

    const requestBody = {
      keywords: formattedKeywords.value,
      emotion: processedEmotion.value,
      imageParams: { style: '水墨风', palette: '冷色调' },
      additionalText: extractedText.value  // 把提取的文本也发送到后端
    };

    console.log('请求数据:', requestBody);

    const response = await fetch(`${API_BASE_URL}/api/textGenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();

    if (!data.content) throw new Error('未返回生成内容');

    generatedText.value = data.content;

    emit('textGenerated', {
      content: data.content,
      keywords: formattedKeywords.value,
      emotion: processedEmotion.value,
      image: data.image,
      music: data.music
    });

  } catch (err) {
    error.value = `生成失败：${err.message || '未知错误'}`;
  } finally {
    isGenerating.value = false;
  }
};
</script>

<style scoped>
.text-generator {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #000;
  margin: 0;
  text-align: left;
}

.input-group {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
}

input, select, textarea {
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: var(--input-bg, #fff);
  color: var(--input-color, #333);
  transition: border-color 0.2s ease;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: #00e1ff;
}

textarea {
  width: 100%;
  resize: vertical;
}

.upload-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.upload-label {
  font-size: 0.95rem;
  color: #333;
}

.extracted-text {
  margin-top: 1rem;
}

.action-button {
  padding: 0.75rem 1.2rem;
  background: linear-gradient(135deg, #00e1ff, #6cf0e5);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.3s;
}

.action-button:hover:not(:disabled) {
  transform: scale(1.03);
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.output-box {
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
  padding: 1rem;
  border-radius: 0.75rem;
  backdrop-filter: blur(6px);
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-family: 'JetBrains Mono', monospace;
  max-height: 300px;
  overflow-y: auto;
}

.error-message {
  color: #ff6b6b;
  font-size: 0.9rem;
  padding-left: 0.5rem;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.6s ease both;
}

.dark .text-generator {
  background: rgba(0, 0, 0, 0.6);
}

.dark input, .dark select, .dark textarea {
  background-color: var(--input-bg-dark, #333);
  color: var(--input-color-dark, #fff);
  border-color: #444;
}

.dark .action-button {
  background: linear-gradient(135deg, #00e1ff, #6cf0e5);
  color: #000;
}

.dark .output-box {
  background: rgba(255, 255, 255, 0.12);
  color: inherit;
  border-color: rgba(255, 255, 255, 0.2);
}

.dark .error-message {
  color: #ff6b6b;
}
</style>