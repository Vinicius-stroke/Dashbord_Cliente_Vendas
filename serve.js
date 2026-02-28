require('dotenv').config()

const express = require('express')
const app = express()
const mongoose = require('mongoose')

mongoose.connect(process.env.CONNECTIONSTRING)
  .then(() => app.emit('pronto'))
  .catch(e => console.log(e))

require('./src/models/ContatoModel')
require('./src/models/LoginModel')

const session = require('express-session')
const MongoStore = require('connect-mongo').default
const flash = require('connect-flash')

const routes = require('./routes')
const path = require('path')
const helmet = require('helmet')
const csrf = require('csurf')

const {
  middlewareGlobal,
  checkCsrfError,
  csrfMiddleware
} = require('./src/middlewares/middlewares')

app.use(express.urlencoded({ extended: true }))
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://code.jquery.com",
          "https://cdn.jsdelivr.net"
        ],
        styleSrc: [
          "'self'",
          "https://cdn.jsdelivr.net",
          "'unsafe-inline'"
        ],
        imgSrc: ["'self'", "data:"],
        fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
        connectSrc: [
          "'self'",
          "http://localhost:3000"
        ]
      }
    }
  })
)
app.use(express.static(path.resolve(__dirname, 'public')));
app.use('/libs', express.static(path.resolve(__dirname, 'node_modules')));

const sessionOptions = session({
  secret: 'asdasdasdasdasdasdasdasdasd',
  store: MongoStore.create({
    mongoUrl: process.env.CONNECTIONSTRING,
    collectionName: 'sessions'
  }),
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true
  }
})

app.use(sessionOptions)
app.use(flash())

app.set('views', path.resolve(__dirname, 'src', 'views'))
app.set('view engine', 'ejs')

app.use(csrf())
app.use(middlewareGlobal)
app.use(checkCsrfError)
app.use(csrfMiddleware)
app.use(routes)

app.on('pronto', () => {
  app.listen(3000, () => {
    console.log('http://localhost:3000/login/index')
    console.log('Servidor executando na porta 3000')
  })
})