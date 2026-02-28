const { Contato, ContatoModel } = require('../models/ContatoModel');
const LoginModel = require('../models/LoginModel').LoginModel;
const VendaModel = require('../models/VendaModel');

//
// ==========================
// 📌 CADASTRAR (TELA)
// ==========================
//
exports.cadastrar = (req, res) => {
  res.render('cadastrarCliente', {
    contato: {},
    venda: null,   // 👈 ADICIONE ISSO
    errors: [],
    success: []
  });
};
//
// ==========================
// 📌 SALVAR CLIENTE
// ==========================
//
exports.clientes = async (req, res) => {
  try {
    const userId = req.session?.user?._id || null;

    if (!userId) {
      req.flash('errors', 'Sessão inválida. Por favor, faça login novamente.');
      return req.session.save(() => res.redirect('/login/index'));
    }

    const contato = new Contato(req.body, userId);
    await contato.register();

    // ✅ mensagem de sucesso
    req.flash('success', 'Cliente e venda criados com sucesso!');

    // ✅ REDIRECIONA para listagem
    req.session.save(() => res.redirect('/clientes/index'));

  } catch (e) {
    console.log("ERRO DETALHADO:", e);
    res.render('404');
  }
};
//
// ==========================
// 📌 EDITAR CLIENTE
// ==========================
//
exports.edit = async (req, res) => {
  try {
    if (!req.session.user) return res.redirect('/login/index');

    if (!req.params.id)
      return res.status(404).send('ID não enviado');

    // 🔍 Busca a venda
    const venda = await VendaModel.findById(req.params.id);

    if (!venda)
      return res.status(404).send('Venda não encontrada');

    // 🔍 Busca o cliente vinculado
    const contatoAtual = await ContatoModel.findById(venda.cliente);

    if (!contatoAtual)
      return res.status(404).send('Contato não encontrado');

    const dados = { ...req.body };

    // 🔒 Controle de permissão
    if (req.session.user.role !== 'gerente' &&
        req.session.user.role !== 'intermediario') {
      delete dados.status;
    } else {
      dados.statusAtualizadoPor = req.session.user._id;
      dados.dataStatus = new Date();
    }

    // 🔥 Atualiza o cliente
    await ContatoModel.findByIdAndUpdate(venda.cliente, dados);

    req.flash('success', 'Cliente atualizado com sucesso.');
    req.session.save(() => res.redirect('/clientes/index'));

  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
};


exports.update = async (req, res) => {
  try {
    if (!req.params.id)
      return res.status(404).send('ID não enviado');

    const venda = await VendaModel.findById(req.params.id)
      .populate('cliente');

    if (!venda)
      return res.status(404).send('Venda não encontrada');

    const contato = await ContatoModel.findById(venda.cliente._id);

    if (!contato)
      return res.status(404).send('Contato não encontrado');

    // ===============================
    // 🔎 HISTÓRICO DO CLIENTE
    // ===============================

    const alteracoes = [];
    const camposCliente = [
      'nome',
      'email',
      'telefone',
      'cpf',
      'bairro',
      'numeroCasa',
      'numeroRua'
    ];

    camposCliente.forEach(campo => {
      if (contato[campo] != req.body[campo]) {
        alteracoes.push({
          campo,
          antes: contato[campo] || '',
          depois: req.body[campo] || ''
        });
      }
    });

    Object.assign(contato, req.body);

    if (alteracoes.length > 0) {
      contato.historico.push({
        alteradoPor: req.session.user._id,
        nomeAlterador: req.session.user.nome,
        data: new Date(),
        alteracoes
      });
    }

    await contato.save();

    // ===============================
    // 🔥 ATUALIZA VENDA
    // ===============================

    venda.plano = req.body.plano;
    venda.status = req.body.status;
    venda.tecnicoResponsavel = req.body.tecnicoResponsavel || '';
    venda.valor = req.body.valor;

    await venda.save();

    req.flash('success', 'Cliente e venda atualizados com sucesso!');
    req.session.save(() => res.redirect('/clientes/index'));

  } catch (e) {
    console.log(e);
    res.render('404');
  }
};



exports.index = async (req, res) => {
  try {
    const filtros = {};
    const query = req.query || {};
    const userLogado = req.session.user;

    if (!userLogado) {
      return res.redirect('/login/index');
    }

    // 🔒 Permissão
    if (userLogado.role === 'vendedor') {
      filtros.vendedor = userLogado._id;
    }

    if (
      userLogado.role === 'gerente' ||
      userLogado.role === 'intermediario'
    ) {
      if (query.user) {
        filtros.vendedor = query.user;
      }
    }

    if (query.status) {
      filtros.status = query.status;
    }

    // 🔥 BUSCA VENDAS COM POPULATE
    const vendas = await VendaModel.find(filtros)
      .populate('cliente')
      .populate('vendedor', 'nome')
      .sort({ createdAt: -1 });

    let vendedores = [];

    if (userLogado.role === 'gerente') {
      vendedores = await LoginModel.find(
        { role: 'vendedor' },
        'nome'
      );
    }

    res.render('clientes', {
      vendas,
      filtros: query,
      vendedores,
      user: userLogado,
      messages: req.flash()
    });

  } catch (e) {
    console.log(e);
    res.render('404');
  }
};

//
// ==========================
// 📌 TELA DE EDIÇÃO
// ==========================
//
exports.editIndex = async (req, res) => {
  try {
    if (!req.params.id)
      return res.status(404).send('ID não enviado');

    const venda = await VendaModel.findById(req.params.id)
      .populate('cliente')
      .populate('vendedor', 'nome');

    if (!venda)
      return res.status(404).send('Venda não encontrada');

    res.render('cadastrarCliente', {
      contato: venda.cliente,
      venda: venda
    });

  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
};

//
// ==========================
// 📌 EXCLUIR
// ==========================
//
exports.delete = async (req, res) => {
  try {
    if (!req.params.id)
      return res.status(404).send('ID não enviado');

    // 🔍 Busca a venda
    const venda = await VendaModel.findById(req.params.id);

    if (!venda)
      return res.status(404).send('Venda não encontrada');

    // 🔥 Deleta a venda
    await VendaModel.findByIdAndDelete(req.params.id);

    // 🔥 Deleta o cliente vinculado
    await ContatoModel.findByIdAndDelete(venda.cliente);

    req.flash('success', 'Cliente e venda excluídos com sucesso!');
    req.session.save(() => res.redirect('/clientes/index'));

  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
};
//
// ==========================
// 📌 ATUALIZAR STATUS
// ==========================
//
exports.atualizarStatus = async (req, res) => {
  try {
    if (!req.params.id)
      return res.status(404).send('ID não enviado');

    const { status, tecnicoResponsavel } = req.body;

    if (!status) {
      req.flash('errors', 'Status não enviado.');
      return req.session.save(() =>
        res.redirect('/clientes/index')
      );
    }

    const venda = await VendaModel.findById(req.params.id);

    if (!venda)
      return res.status(404).send('Venda não encontrada');

    // 🔥 Atualiza status e técnico
    venda.status = status;
    venda.tecnicoResponsavel = tecnicoResponsavel || '';

    await venda.save();

    req.flash('success', 'Status e técnico atualizados com sucesso.');
    req.session.save(() => res.redirect('/clientes/index'));

  } catch (e) {
    console.log(e);
    res.render('404');
  }
};

//
// ==========================
// 📌 HISTÓRICO
// ==========================
//
exports.historico = async (req, res) => {
  try {
    if (!req.params.id)
      return res.status(404).send('ID não enviado');

    const contato = await ContatoModel
      .findById(req.params.id)
      .populate('historico.alteradoPor', 'nome')
      .lean();

    if (!contato)
      return res.status(404).send('Contato não encontrado');

    // Garante que historico sempre seja array
    if (!contato.historico)
      contato.historico = [];

    res.render('historicoCliente', { contato });

  } catch (e) {
    console.log(e);
    res.render('404');
  }
};