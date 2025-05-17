const clientPromise = require('./db');

async function saveWorkToDB(work) {
    try {
        const client = await clientPromise;
        const db = client.db('ArtPlatform');
        const worksCollection = db.collection('Works');

        const result = await worksCollection.insertOne(work);
        console.log(`作品保存成功，文档 ID: ${result.insertedId}`);
        return result.insertedId;
    } catch (error) {
        console.error('保存作品到数据库失败:', error);
        throw error;
    }
}

module.exports = { saveWorkToDB };