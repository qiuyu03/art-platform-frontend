const { loadRules, getRuleByEmotion } = require("./ruleLoader");
loadRules();
console.log(getRuleByEmotion(" 热血"));