<template>
  <div class="music-generator">
    <h4 class="title">音乐参数</h4>

    <div class="form-container">
      <form @submit.prevent="generateMusic">
        <!-- 描述输入 -->
        <div class="input-group">
          <label for="inputText">输入描述：</label>
          <textarea
            id="inputText"
            v-model="inputText"
            placeholder="请输入音乐描述（例如：欢快的电子舞曲，带有强烈的节奏感）"
            required
          ></textarea>
        </div>

        <!-- 情感选择 -->
        <div class="input-group">
          <label for="emotion">选择情感：</label>
          <select id="emotion" v-model="selectedEmotion">
            <option v-for="emotion in emotionOptions" :key="emotion" :value="emotion">
              {{ emotionLabels[emotion] || emotion }}
            </option>
          </select>
        </div>

        <!-- 节奏选择 -->
        <div class="input-group">
          <label for="tempo">选择节奏：</label>
          <select id="tempo" v-model="selectedTempo">
            <option v-for="tempo in tempoOptions" :key="tempo" :value="tempo">
              {{ tempoLabels[tempo] || tempo }}
            </option>
          </select>
        </div>

        <!-- 风格选择 -->
        <div class="input-group">
          <label for="genre">选择风格：</label>
          <select id="genre" v-model="selectedGenre">
            <option v-for="genre in genreOptions" :key="genre" :value="genre">
              {{ genreLabels[genre] || genre }}
            </option>
          </select>
        </div>

        <!-- 持续时间控制 -->
        <div class="input-group">
          <label>持续时间（秒）：</label>
          <input
            type="number"
            min="15"
            max="300"
            :value="clampedDuration"
            @input="musicParams.duration = clampDuration($event.target.value)"
          />
        </div>

        <!-- 提交按钮 -->
        <button type="submit" :disabled="isLoading">
          <span v-if="isLoading" class="spinner"></span>
          {{ isLoading ? '生成中...' : '生成音乐' }}
        </button>
      </form>

      <!-- 错误信息显示 -->
      <div v-if="error" class="error-message">{{ error }}</div>

      <!-- 音乐播放结果 -->
      <transition name="fade">
        <div v-if="generatedMusic" class="result-container">
          <h3>生成结果：</h3>
          <audio controls v-if="generatedMusic.musicUrl">
            <source :src="generatedMusic.musicUrl" type="audio/mpeg" />
            您的浏览器不支持音频播放
          </audio>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      inputText: '',
      selectedEmotion: 'happy',
      selectedTempo: 'medium',
      selectedGenre: 'electronica',
      generatedMusic: null,
      isLoading: false,
      error: null,
      musicParams: {
        duration: 30
      },
      emotionOptions: ['happy', 'sad', 'epic', 'tense'],
      emotionLabels: {
        happy: '欢快',
        sad: '悲伤',
        epic: '史诗',
        tense: '紧张'
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
    clampedDuration() {
      return Math.min(Math.max(this.musicParams.duration, 15), 300);
    }
  },
  methods: {
    clampDuration(value) {
      return Math.min(Math.max(parseInt(value) || 30, 15), 300);
    },
    async generateMusic() {
      if (this.clampedDuration !== this.musicParams.duration) {
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
            duration: this.clampedDuration * 1000
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `请求失败：${response.status}`);
        }

        const data = await response.json();
        this.generatedMusic = { musicUrl: data.musicUrl };
      } catch (err) {
        console.error('生成失败:', err);
        this.error = err.message.startsWith('请求失败') ? err.message : `生成失败：${err.message}`;
      } finally {
        this.isLoading = false;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.music-generator {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;

  .title {
    font-size: 1.25rem;
    font-weight: bold;
    margin-bottom: 1rem;
    color: var(--text-color, #000);
  }

  .form-container {
    background: var(--bg-color, #e2eef0);
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .input-group {
    margin-bottom: 1.5rem;
    max-width: 400px;

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: var(--text-color, #000);
    }

    textarea,
    select,
    input {
      width: 100%;
      padding: 0.8rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: var(--input-bg, #fff);
      color: var(--input-color, #333);
      transition: border-color 0.2s ease;
    }
  }

  button {
    width: 100%;
    max-width: 400px;
    padding: 1rem;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: transform 0.2s ease, background 0.3s;
    position: relative;
    font-size: 1rem;

    &:hover:not(:disabled) {
      background-color: #2980b9;
      transform: scale(1.02);
    }

    &:disabled {
      background-color: #bdc3c7;
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
  }

  .error-message {
    margin-top: 1rem;
    padding: 1rem;
    background-color: #ffeef0;
    color: #ff3860;
    border-radius: 4px;
    max-width: 400px;
  }

  .result-container {
    margin-top: 2rem;
    padding: 1.5rem;
    background: #fff;
    border-radius: 8px;
    max-width: 400px;
    animation: fadeIn 1s ease forwards;

    audio {
      width: 100%;
      margin-top: 0.5rem;
    }
  }

  /* 动画样式 */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(15px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.8s;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
}

/* 暗黑模式适配 */
.dark .music-generator {
  background: #1e1e1e;

  .title {
    color: #f1f1f1;
  }

  .form-container {
    background: #2c2c2c;
  }

  .input-group textarea,
  .input-group select,
  .input-group input {
    background: #3b3b3b;
    color: #f1f1f1;
    border-color: #555;
  }

  button {
    background-color: #00c3ff;
    color: #000;

    .spinner {
      border-top: 3px solid #000;
    }

    &:hover:not(:disabled) {
      background-color: #00a9e0;
    }

    &:disabled {
      background-color: #666;
    }
  }

  .error-message {
    background-color: #5a1e2c;
    color: #ffe6e6;
  }

  .result-container {
    background: #2a2a2a;
    color: #fff;
  }
}
</style>
