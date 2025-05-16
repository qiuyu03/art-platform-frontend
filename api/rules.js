const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');

const clientPromise = require('../api/utils/db'); // 引入 MongoDB 客户端

// 保存规则的接口
router.post('/save', async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db('ArtPlatform');
    const collection = db.collection('StyleRules');

    const rule = req.body;
    const result = await collection.insertOne(rule);

    res.json({ success: true, message: '规则保存成功', ruleId: result.insertedId });
  } catch (error) {
    console.error('保存规则失败:', error);
    res.status(500).json({ success: false, error: '保存规则失败' });
  }
});

module.exports = router;