const express = require('express')
const app = express()

app.set('view engine', 'ejs')

app.get('/', (req, res) => {
  console.log("Hello World")
  res.render('index')
})

const router = require('./routes/routes')

app.use('/main', router)

app.listen(3000)

