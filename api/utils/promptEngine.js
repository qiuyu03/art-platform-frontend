const buildPrompt = (keywords, rules) => {
  const baseTemplate = `根据以下要求创作内容：
主题关键词：${keywords.join(' 、')}
情感基调：${rules.emotion || '默认'}
必要元素：${rules.keywords?.join(' 、') || '无'}
叙事节奏：${rules.叙事节奏 || '适中'}

创作要求：`;

  // 添加风格约束
  if (rules.style) {
    baseTemplate += `\n采用${rules.style} 风格，`;
  }

  return baseTemplate + '分章节呈现，每章包含情节概要';
};

// 导出函数
module.exports = { buildPrompt };