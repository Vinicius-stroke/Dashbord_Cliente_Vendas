exports.middlewareGlobal = (req, res, next) => {
  res.locals.errors = req.flash('errors') || []
  res.locals.success = req.flash('success') || []
  res.locals.user = req.session.user || null
  next()
}


exports.checkCsrfError = (err, req, res, next) => {
  if (err) {
    return res.status(403).send('Erro de CSRF')
  }
  next()
}


exports.csrfMiddleware = (req, res, next) => {
    res.locals.csrfToken = req.csrfToken()
    next()
}

exports.loginRequired = (req, res, next) => {
    if(!req.session.user) {
        req.flash('errors', 'Você precisa fazer login para acessar essa página.')
        req.session.save(() => res.redirect('/login/index'))
        return
    }

    next()
}


exports.gerenteRequired = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'gerente') {
    req.flash('errors', 'Apenas gerentes podem acessar essa área.')
    req.session.save(() => res.redirect('/clientes/index'))
    return
  }
  next()
}

exports.statusRequired = (req, res, next) => {
  if (!req.session.user) {
    req.flash('errors', 'Faça login.')
    return req.session.save(() => res.redirect('/login/index'))
  }

  if (req.session.user.role !== 'gerente') {
    req.flash('errors', 'Apenas gerente pode alterar status.')
    return req.session.save(() => res.redirect('/clientes/index'))
  }

  next()
}

exports.edicaoRequired = (req, res, next) => {
  if (!req.session.user) {
    req.flash('errors', 'Faça login.')
    return req.session.save(() => res.redirect('/login/index'))
  }

  if (
    req.session.user.role === 'gerente' ||
    req.session.user.role === 'intermediario'
  ) {
    return next()
  }

  req.flash('errors', 'Sem permissão para editar.')
  return req.session.save(() => res.redirect('/clientes/index'))
}


exports.cadastroClienteRequired = (req, res, next) => {
  if (!req.session.user) {
    req.flash('errors', 'Faça login.')
    return req.session.save(() => res.redirect('/login/index'))
  }

  if (
    req.session.user.role === 'vendedor' ||
    req.session.user.role === 'intermediario'
  ) {
    return next()
  }

  req.flash('errors', 'Sem permissão.')
  return req.session.save(() => res.redirect('/clientes/index'))
}

