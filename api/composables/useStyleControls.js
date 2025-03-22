import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'
 
export const useStyleControls = (initialTheme = 'dark') => {
  const theme = useStorage('gen-style-theme', initialTheme)
  const uiParams = ref({
    shadowIntensity: 0.3,
    colorVariance: 0.7,
    motionSpeed: 1.2,
    textureScale: 50 
  })
 
  // 动态CSS变量注入 
  const globalStyles = computed(() => ({
    '--shadow-intensity': uiParams.value.shadowIntensity, 
    '--color-variance': uiParams.value.colorVariance, 
    '--motion-speed': `${uiParams.value.motionSpeed}s`, 
    '--texture-scale': `${uiParams.value.textureScale}%` 
  }))
 
  // 主题切换引擎 
  const toggleTheme = () => {
    theme.value  = theme.value  === 'dark' ? 'light' : 'dark'
    applyThemePresets(theme.value) 
  }
 
  const applyThemePresets = (themeType) => {
    const presets = {
      dark: {
        shadowIntensity: 0.5,
        colorVariance: 0.6 
      },
      light: {
        shadowIntensity: 0.2,
        colorVariance: 0.8 
      }
    }
    Object.assign(uiParams.value,  presets[themeType])
  }
 
  // 参数变化节流 
  let updateTimeout 
  const queueStyleUpdate = (newParams) => {
    clearTimeout(updateTimeout)
    updateTimeout = setTimeout(() => {
      Object.assign(uiParams.value,  newParams)
    }, 300)
  }
 
  return {
    theme,
    uiParams,
    globalStyles,
    toggleTheme,
    queueStyleUpdate 
  }
}