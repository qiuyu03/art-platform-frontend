// src/utils/ruleLoader.js  
const fs = require('fs');
const path = require('path');
 
let rules = [];
 
const loadRules = () => {
  try {
    const data = fs.readFileSync( 
      path.join(__dirname,  '../../rules.json'),  
      'utf8'
    );
    rules = JSON.parse(data); 
    console.log(` 成功加载 ${rules.length}  条规则`);
  } catch (err) {
    console.error(' 规则加载失败:', err);
  }
};
 
const getRuleByEmotion = (emotion) => {
  return rules.find(rule  => rule.emotion  === emotion) || {};
};
 
module.exports  = { loadRules, getRuleByEmotion };