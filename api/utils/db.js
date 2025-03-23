require('dotenv').config();
const { MongoClient } = require('mongodb'); // 使用 require 而不是 import

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

if (!global._mongoClientPromise) {
  client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

module.exports = clientPromise; // 使用 module.exports 导出