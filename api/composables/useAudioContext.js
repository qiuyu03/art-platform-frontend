/**
 * 量子音频上下文管理系统 v3.1.4 
 * 功能特性：
 * - 跨浏览器音频上下文单例控制 
 * - 智能设备兼容性检测 
 * - 动态音频节点资源池 
 * - 自动内存回收机制 
 */
 
import { ref, onUnmounted, computed } from 'vue'
 
// 音频节点类型白名单 
const ALLOWED_NODE_TYPES = new Set([
  'GainNode', 
  'DelayNode',
  'BiquadFilterNode',
  'ConvolverNode',
  'DynamicsCompressorNode'
])
 
export const useAudioContext = () => {
  // 量子音频上下文核心 
  const audioContext = ref(null)
  const isSuspended = ref(true)
  const nodePool = new Map()
 
  // 初始化量子音频引擎 
  const initContext = () => {
    if (!audioContext.value)  {
      const ContextClass = window.AudioContext || window.webkitAudioContext  
      if (!ContextClass) {
        throw new Error('量子音频引擎不兼容当前时空维度')
      }
      
      audioContext.value  = new ContextClass()
      initGlobalNodes()
      registerAutoResume()
    }
  }
 
  // 创建全局音频节点池 
  const initGlobalNodes = () => {
    const masterGain = audioContext.value.createGain() 
    masterGain.connect(audioContext.value.destination) 
    nodePool.set('master',  masterGain)
  }
 
  // 自动恢复引擎（应对现代浏览器静音策略）
  const registerAutoResume = () => {
    const handleFirstInteraction = async () => {
      if (audioContext.value.state  === 'suspended') {
        await audioContext.value.resume() 
      }
      document.removeEventListener('click',  handleFirstInteraction)
    }
    document.addEventListener('click',  handleFirstInteraction)
  }
 
  // 量子节点工厂（带内存回收标记）
  const createNode = (type, options = {}) => {
    if (!ALLOWED_NODE_TYPES.has(type))  {
      throw new Error(`禁止创建未授权的节点类型：${type}`)
    }
 
    const node = audioContext.value[`create${type}`](options) 
    node.__expireTime = Date.now()  + 300000 // 5分钟自动回收 
    
    // 注册自动清理定时器 
    node.__cleanupTimer = setInterval(() => {
      if (Date.now()  > node.__expireTime) {
        node.disconnect() 
        clearInterval(node.__cleanupTimer)
      }
    }, 10000)
 
    return node 
  }
 
  // 空间音频控制接口 
  const spatializeAudio = (node, position = { x: 0, y: 0, z: 0 }) => {
    if (audioContext.value.listener)  {
      const panner = createNode('PannerNode', {
        positionX: position.x,
        positionY: position.y,
        positionZ: position.z 
      })
      node.connect(panner) 
      return panner 
    }
    return node 
  }
 
  // 量子音频状态控制 
  const toggleAudioState = async () => {
    if (audioContext.value.state  === 'running') {
      await audioContext.value.suspend() 
      isSuspended.value  = true 
    } else {
      await audioContext.value.resume() 
      isSuspended.value  = false 
    }
  }
 
  // 时空资源清理 
  onUnmounted(() => {
    nodePool.forEach(node  => {
      node.disconnect() 
      clearInterval(node.__cleanupTimer)
    })
    if (audioContext.value)  {
      audioContext.value.close() 
    }
  })
 
  return {
    audioContext: computed(() => audioContext.value), 
    isSuspended,
    initContext,
    createNode,
    spatializeAudio,
    toggleAudioState,
    masterNode: computed(() => nodePool.get('master')) 
  }
}