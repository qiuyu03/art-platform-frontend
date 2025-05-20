<template>
  <div class="neural-card animate-fade-in music-generator">
    <h5 class="section-title">音乐生成</h5>

    <div class="input-group">
      <textarea
        v-model="inputText"
        placeholder="请输入音乐描述"
        required
      ></textarea>
      <select v-model="selectedEmotion">
        <option v-for="emotion in emotionOptions" :key="emotion" :value="emotion">
          {{ emotionLabels[emotion] || emotion }}
        </option>
      </select>
    </div>

    <div class="input-group">
      <select v-model="selectedTempo">
        <option v-for="tempo in tempoOptions" :key="tempo" :value="tempo">
          {{ tempoLabels[tempo] || tempo }}
        </option>
      </select>
      <select v-model="selectedGenre">
        <option v-for="genre in genreOptions" :key="genre" :value="genre">
          {{ genreLabels[genre] || genre }}
        </option>
      </select>
    </div>

    <div class="input-group">
      <input
        type="number"
        min="15"
        max="300"
        v-model.number="musicParams.duration"
        placeholder="持续时间（秒）"
      />
    </div>

    <button @click="generateMusic" :disabled="isLoading" class="action-button">
      <span v-if="isLoading" class="spinner"></span>
      {{ isLoading ? '生成中...' : '生成音乐' }}
    </button>

    <div v-if="error" class="error-message">{{ error }}</div>

    <div v-if="computedMusicUrl" class="output-box">
      <h6>生成结果：</h6>
      <audio controls :src="computedMusicUrl"></audio>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    disabled: Boolean,
    externalMusicUrl: String,
    keywords: Array,
    emotion: String,
    musicUrl: String
  },
  data() {
    return {
      inputText: '',
      // 更新情感选项，确保与后端关联矩阵中的情感标签一致
      selectedEmotion: '欢快',
      selectedTempo: 'medium',
      selectedGenre: 'electronica',
      generatedMusic: null,
      isLoading: false,
      error: null,
      musicParams: {
        duration: 60
      },
      // 更新情感选项，确保与后端关联矩阵中的情感标签一致
      emotionOptions: ['宁静', '激昂', '忧郁', '欢快', '愤怒', '恐惧', '惊喜', '温柔'],
      emotionLabels: {
        宁静: '宁静',
        激昂: '激昂',
        忧郁: '忧郁',
        欢快: '欢快',
        愤怒: '愤怒',
        恐惧: '恐惧',
        惊喜: '惊喜',
        温柔: '温柔'
      },
      tempoOptions: ['slow', 'medium', 'fast'],
      tempoLabels: {
        slow: '慢速',
        medium: '中速',
        fast: '快速'
      },
      genreOptions: ['electronica', 'cinematic', 'indie', 'ambient', 'pop', 'rock'],
      genreLabels: {
        electronica: '电子',
        cinematic: '电影配乐',
        indie: '独立',
        ambient: '氛围',
        pop: '流行',
        rock: '摇滚'
      }
    };
  },
  computed: {
    API_BASE_URL() {
      return process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001';
    },
    computedMusicUrl() {
      return this.generatedMusic?.musicUrl || this.musicUrl || this.externalMusicUrl;
    }
  },
  watch: {
    emotion(newVal) {
      if (newVal) this.selectedEmotion = newVal;
    },
    keywords(newVal) {
      if (Array.isArray(newVal)) this.inputText = newVal.join(', ');
    }
  },
  methods: {
    async generateMusic() {
      if (this.musicParams.duration < 15 || this.musicParams.duration > 300) {
        this.error = '持续时间必须在15-300秒之间';
        return;
      }

      this.isLoading = true;
      this.error = null;
      this.generatedMusic = null;

      try {
        const response = await fetch(`${this.API_BASE_URL}/api/musicGenerate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: this.inputText,
            emotion: this.selectedEmotion,
            tempo: this.selectedTempo,
            genre: this.selectedGenre,
            duration: this.musicParams.duration * 1000
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `请求失败：${response.status}`);
        }

        const data = await response.json();
        this.generatedMusic = { musicUrl: data.musicUrl };
      } catch (err) {
        this.error = `生成失败：${err.message}`;
      } finally {
        this.isLoading = false;
      }
    },
    startMusicGeneration(text) {
      this.inputText = text;
      this.generateMusic();
    }
  }
};
</script>

<style scoped>
.music-generator {
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

textarea,
input,
select {
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: var(--input-bg, #fff);
  color: var(--input-color, #333);
  transition: border-color 0.2s ease;
  width: 100%;
  resize: vertical;
}

textarea:focus,
input:focus,
select:focus {
  outline: none;
  border-color: #00e1ff;
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

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #fff;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-right: 8px;
  vertical-align: middle;
}

.output-box {
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
  padding: 1rem;
  border-radius: 0.75rem;
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-height: 300px;
  overflow-y: auto;
}

.output-box audio {
  width: 100%;
  margin-top: 0.5rem;
}

.error-message {
  color: #ff6b6b;
  font-size: 0.9rem;
  padding-left: 0.5rem;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.6s ease both;
}

/* Dark Mode Styles */
.dark .music-generator {
  background: rgba(0, 0, 0, 0.6);
}

.dark textarea,
.dark input,
.dark select {
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