import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://qiuyu0931:w70PERI6qtwBQTCf@cluster0.27ctd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
let cachedClient = null;

// 复用数据库连接，避免重复创建
async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

module.exports = { connectToDatabase };