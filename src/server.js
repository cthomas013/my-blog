import express from 'express'
import bodyParser from 'body-parser'
import path from 'path'
import { MongoClient } from 'mongodb'

const withDb = async (operations, res) => {
  try {
    const client = await MongoClient.connect(
      'mongodb://localhost:27017',
      { useNewUrlParser: true }
    )
    const db = client.db('my-blog')

    await operations(db)

    client.close()
  } catch (err) {
    res.status(500).json(
      { message: 'Error connecting to database', err }
    )
  }
}

const app = express();

app.use(express.static(path.join(__dirname, '/build')))
app.use(bodyParser.json())

app.get('/api/articles/:name', async (req, res) => {
  const articleName = req.params.name
  withDb(async (db) => {
    const articleInfo = await db.collection('articles').findOne(
      { name: articleName }
    )
    res.status(200).json(articleInfo)
  }, res)
})

app.post('/api/articles/:name/upvote', async (req, res) => {
  const articleName = req.params.name
  withDb(async (db) => {
    const articleInfo = await db.collection('articles').findOne(
      { name: articleName }
    )
    await db.collection('articles').updateOne(
      { name: articleName },
      { '$set': {
        upvotes: articleInfo.upvotes + 1,
      }}
    )
    const updatedArticleInfo = await db.collection('articles').findOne(
      { name: articleName }
    )
    res.status(200).json(updatedArticleInfo)
  }, res)
})

app.post('/api/articles/:name/add-comment', async (req, res) => {
  const { username, text } = req.body
  const articleName = req.params.name
  withDb(async (db) => {
    const articleInfo = await db.collection('articles').findOne(
      { name: articleName }
    )
    await db.collection('articles').updateOne(
      { name: articleName },
      { '$push': {
        comments: { username, text },
      }}
    )
    const updatedArticleInfo = await db.collection('articles').findOne(
      { name: articleName }
    )
    res.status(200).json(updatedArticleInfo)
  }, res)
})

app.get('*', (req, res) => {
  res.sendfile(path.join(__dirname + '/build/index.html'))
})

app.listen(8000, () => {
  console.log('Listening on port 8000')
})