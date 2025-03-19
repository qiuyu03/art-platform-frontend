<template>
  <div class="input-group">
    <h3>草图绘制 <button @click="clearCanvas">清空</button></h3>
    <canvas ref="canvasElement" width="400" height="300"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, defineExpose } from 'vue'
import { fabric } from 'fabric'

const canvasElement = ref(null)
let canvasInstance = null 

onMounted(() => {
  // 确保 DOM 元素已经加载
  if (!canvasElement.value) {
    console.error('Canvas element is not found or not ready.');
    return;
  }

  try {
    // 尝试初始化 Fabric Canvas
    canvasInstance = new fabric.Canvas(canvasElement.value, {
      isDrawingMode: true,
      backgroundColor: '#f0f0f0'
    });
    console.log('Fabric Canvas initialized successfully.');
  } catch (error) {
    console.error('Error initializing Fabric Canvas:', error);
  }
})

const clearCanvas = () => {
  if (canvasInstance) {
    canvasInstance.clear();
  } else {
    console.error('Canvas instance is not ready.');
  }
}

defineExpose({
  getSketchData: () => {
    if (canvasInstance) {
      return canvasInstance.toDataURL();
    } else {
      console.error('Canvas instance is not ready.');
      return null;
    }
  }
})
</script>

<style scoped>
.input-group {
  display: flex;
  flex-direction: column;
  align-items: center;
}
canvas {
  border: 1px solid #ccc;
}
</style>