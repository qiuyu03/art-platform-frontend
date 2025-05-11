import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? ''
  : 'http://localhost:3001';

export const generateImageService = async (payload) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/imageGenerate`, payload);
    return response.data;
  } catch (error) {
    console.error('图像生成失败:', error);
    throw new Error(error.response?.data?.message || '未知错误');
  }
};

export const generateMusicService = async (payload) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/musicGenerate`, payload); 
    return response.data;
  } catch (error) {
    console.error('音乐生成失败:', error);
    throw new Error(error.response?.data?.message || '未知错误');
  }
};