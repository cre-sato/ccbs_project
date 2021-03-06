const fallback = require('express-history-api-fallback')
const createError = require('http-errors')
const express = require('express')
const resource = require('express-resource')
const root = __dirname + '/static'
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const bodyParser = require('body-parser')

const indexRouter = require('./routes/index')
const usersRouter = require('./routes/users')
const serverRouter = require('./routes/server')
const imageRouter = require('./routes/image')
const tohyoTorokuRouter = require('./routes/tohyo_toroku')
const senkyoKanriRouter = require('./routes/senkyo_kanri')
const senkyoTorokuRouter = require('./routes/senkyo_toroku')
const commentShokaiRouter = require('./routes/comment_shokai')
const coinShokaiRouter = require('./routes/coin_shokai')
const coinZoyoRouter = require('./routes/coin_zoyo')
const loginRouter = require('./routes/login')
const tohyoShokaiKobetsuRouter = require('./routes/tohyo_shokai_kobetsu')
const tohyoIchiranRouter = require('./routes/tohyo_ichiran')
const tohyo_shokai_shosaiRouter = require('./routes/tohyo_shokai_shosai')
const tohyo_shokai_nendoRouter = require('./routes/tohyo_shokai_nendo')
const shain_kensakuRouter = require('./routes/shain_kensaku')

const app = express()

/**
 \* Cross-Origin Resource Sharingを有効にする記述（HTTPレスポンスヘッダの追加）
 \*/
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', req.headers.origin)
  res.header(
    'Access-Control-Allow-Headers',
    'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept'
  )
  res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Credentials', true)
  res.header('Access-Control-Max-Age', '86400')
  next()
})

/**
 \* OPTIONSメソッドの実装
 \*/
app.options('*', function(req, res) {
  res.sendStatus(200)
})

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

// ▼▼▼404エラー対応 ここから

// 第一案
console.log('★★★★★★★★★★：' + root)
app.use(express.static(path.join(__dirname, 'static')))
app.use(fallback('index.html', { root: root }))

// 第二案（第一案がだめなら、第一案をコメントアウトして、第二案のコメントを解除）
// app.use(
//   fallback({
//     verbose: true
//   })
// )
// app.use(express.static('.'))

// 第三案（第一、二案がだめなら、第一、二案をコメントアウトして、第三案のコメントを解除）
// app.use(fallback({
//   rewrites:[
//       {from: /^\/api\/.*$/, to: function(context){
//           return context.parsedUrl.pathname;
//       }},
//       {from: /\/.*/, to: '/'}
//   ]
// }))
// app.get('/', function(req, res, next){
//   res.render('index');
// })

// ▲▲▲404エラー対応 ここまで

app.use('/', indexRouter)
app.use('/users', usersRouter)
app.use('/server', serverRouter)
app.use('/image', imageRouter)
app.use('/tohyo_toroku', tohyoTorokuRouter)
app.use('/senkyo_kanri', senkyoKanriRouter)
app.use('/senkyo_toroku', senkyoTorokuRouter)
app.use('/comment_shokai', commentShokaiRouter)
app.use('/coin_shokai', coinShokaiRouter)
app.use('/coin_zoyo', coinZoyoRouter)
app.use('/login', loginRouter)
app.use('/tohyo_shokai_kobetsu', tohyoShokaiKobetsuRouter)
app.use('/tohyo_ichiran', tohyoIchiranRouter)
app.use('/tohyo_shokai_shosai', tohyo_shokai_shosaiRouter)
app.use('/tohyo_shokai_nendo', tohyo_shokai_nendoRouter)
app.use('/shain_kensaku', shain_kensakuRouter)

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404))
})

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
