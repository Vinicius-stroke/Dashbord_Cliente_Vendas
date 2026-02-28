const express = require('express')
const route = express.Router()

const loginController = require('./src/controllers/loginController')
const clienteController = require('./src/controllers/clienteController')
const dashboardController = require('./src/controllers/dashboardController')

const {
  loginRequired,
  gerenteRequired,
  cadastroClienteRequired,
  edicaoRequired,
  statusRequired
} = require('./src/middlewares/middlewares')

// LOGIN
route.get('/login/index', loginController.index)
route.get('/login/register', loginController.registerView)
route.post('/login/register', loginController.register)
route.post('/login/login', loginController.login)
route.get('/login/logout', loginController.logout)

// CLIENTES
route.get('/clientes/cadastrar', loginRequired, cadastroClienteRequired, clienteController.cadastrar)
route.post('/clientes/cadastrar', loginRequired, cadastroClienteRequired, clienteController.clientes)

route.get('/clientes/index', loginRequired, clienteController.index)
route.get('/clientes/index/:id', loginRequired, clienteController.editIndex)

route.post('/clientes/edit/:id', loginRequired, edicaoRequired, clienteController.update)

route.get('/clientes/delete/:id', loginRequired, gerenteRequired, clienteController.delete)

route.post('/clientes/status/:id', loginRequired, statusRequired, clienteController.atualizarStatus)

route.get('/clientes/historico/:id', loginRequired, clienteController.historico)

// rotas da dashboard
route.get('/login/dashboard', loginRequired, gerenteRequired, dashboardController.dashboard)

route.get('/dashboard/perfis', loginRequired, gerenteRequired, dashboardController.perfis)
route.get('/dashboard/perfis/:id', loginRequired, gerenteRequired, dashboardController.perfil)





module.exports = route