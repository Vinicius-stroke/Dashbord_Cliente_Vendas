const Login = require('../models/LoginModel')
const Contato = require('../models/ContatoModel')
// página de login
exports.index = (req, res) => {
  if (req.session.user) return res.redirect('/clientes/index')
  return res.render('login')
}

// página de cadastro
exports.registerView = (req, res) => {
  return res.render('user-novo')
}

// criar usuário
// This should be in your contatoController.js
// No seu Controller de Login
exports.register = async (req, res) => {
  try {
    const login = new Login(req.body);
    await login.register();

    if (login.errors.length > 0) {
      req.flash('errors', login.errors);
      return req.session.save(() => res.redirect('/login/index'));
    }

    // REMOVA as linhas que criam a req.session.user aqui
    
    req.flash('success', 'Usuário criado com sucesso. Por favor, faça login.');
    // Mude o redirecionamento para a página de login
    return req.session.save(() => res.redirect('/login/index'));

  } catch (e) {
    console.log(e);
    return res.render('404');
  }
}
// login
exports.login = async (req, res) => {
  try {
    const login = new Login(req.body)
    await login.login()

    if (login.errors.length > 0) {
      req.flash('errors', login.errors)
      req.session.save(() => res.redirect('/login/index'))
      return
    }

   req.session.user = {
  _id: login.user._id,
  nome: login.user.nome,
  email: login.user.email,
  role: login.user.role
}
    req.flash('success', 'Bem vindo ao sistema NetManiaCliente!')
    req.session.save(() => res.redirect('/clientes/index'))

  } catch (e) {
    return res.render('404')
  }
}

// logout
exports.logout = (req, res) => {
  req.session.destroy()
  res.redirect('/login/index')
}