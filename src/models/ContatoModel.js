const mongoose = require('mongoose')
const validator = require('validator')
const VendaModel = require('./VendaModel')

const ContatoSchema = new mongoose.Schema({
    nome: {type: String, required: true},
    sobrenome: {type: String, required: false, default: ''},
    email: {type: String, required: false, default: ''},
    telefone: {type: String, required: false, default: ''},
    cpf: {type: String, default: ''},
    bairro: {type: String, default: ''},
    numeroCasa: {type: String, default: ''},
    numeroRua: {type: String, default: ''},
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Login', required: true},
 statusAtualizadoPor: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Login',
  default: null
},

  dataStatus: {
  type: Date,
  default: null
  },

historico: [
  {
    alteradoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Login' },
    nomeAlterador: String,
    data: Date,
    alteracoes: [
      {
        campo: String,
        antes: String,
        depois: String
      }
    ]
  }
],
    criadoEm: {type: Date, default: Date.now}
})

// moogoose da venda: 


const ContatoModel = mongoose.model('Contato', ContatoSchema)

// Altere sua função construtora para aceitar o segundo parâmetro
function Contato(body, userId) { // <-- Adicione userId aqui
    this.body = body;
    this.errors = [];
    this.userId = userId; // <-- Salve o ID na instância da classe
    this.contato = null;
}


Contato.prototype.register = async function() {

  // 📌 Salva dados da venda antes do cleanUp apagar
  const plano = this.body.plano;
  const valor = Number(this.body.valor);
  const tecnicoResponsavel = this.body.tecnicoResponsavel;
  const status = this.body.status || 'pendente';

  this.valida();
  if (this.errors.length > 0) return;

  this.contato = await ContatoModel.create({
  ...this.body,
  user: this.userId   // 👈 ISSO É ESSENCIAL
});

  this.venda = await VendaModel.create({
    cliente: this.contato._id,
    vendedor: this.userId,
    plano,
    valor,
    tecnicoResponsavel,
    status
  });

  await this.simularPagamento(valor);
};

Contato.prototype.valida = function() {
        this.cleanUp()
        if(this.body.email && !validator.isEmail(this.body.email)) this.errors.push('E-mail inválido')
        if(!this.body.nome) this.errors.push('O campo nome é obrigatório.')
        if(!this.body.email && !this.body.telefone){
            this.errors.push('Pelo menos um contato precisa ser enviado: email ou telefone.')
        }

    }


Contato.prototype.cleanUp = function() {

  for (const key in this.body) {
    if (
      typeof this.body[key] !== 'string' &&
      typeof this.body[key] !== 'number'
    ) {
      this.body[key] = '';
    }
  }

  this.body = {
    nome: this.body.nome,
    sobrenome: this.body.sobrenome,
    email: this.body.email,
    telefone: this.body.telefone,
    cpf: this.body.cpf,
    bairro: this.body.bairro,
    numeroCasa: this.body.numeroCasa,
    numeroRua: this.body.numeroRua,
    user: this.userId,
    plano: this.body.plano,
    valor: this.body.valor,
    tecnicoResponsavel: this.body.tecnicoResponsavel,
    status: this.body.status
  };
};


Contato.prototype.edit = async function(id){
  if (typeof id !== 'string') return

  this.cleanUp()
  this.valida()

  if (this.errors.length > 0) return

  const updateData = {}

  for (const key in this.body) {
    if (
      this.body[key] !== '' &&
      this.body[key] !== undefined &&
      this.body[key] !== null
    ) {
      updateData[key] = this.body[key]
    }
  }

  this.contato = await ContatoModel.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  )
}

Contato.prototype.simularPagamento = async function(valor) {
  console.log('🔄 Enviando para API de pagamento...');
  console.log(`Cliente: ${this.body.nome}`);
  console.log(`Valor mensal: R$ ${valor}`);

  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('✅ Pagamento registrado com sucesso (simulado)');
};
// obejeto estatico:

Contato.buscarPorId = async function(id, userId, role){
  if(role === 'gerente' || role === 'intermediario') {
    return await ContatoModel.findById(id)
  }

  return await ContatoModel.findOne({ _id: id, user: userId })
}


Contato.buscaContatos = async function(user){
  // GERENTE vê tudo
  if (user.role === 'gerente') {
    return await ContatoModel.find().sort({ criadoEm: -1 })
  }

  // VENDEDOR vê só os próprios
  return await ContatoModel.find({ user: user._id }).sort({ criadoEm: -1 })
}

Contato.buscaContatosComFiltro = async function(filtro) {
  return await ContatoModel
    .find(filtro)
    .populate('user', 'nome email role')
    .sort({ criadoEm: -1 })
}

Contato.delete = async function(id){ 
    if(typeof id !== 'string') return 
    const contato = await ContatoModel.findOneAndDelete({_id: id}) 
    return contato
 }

module.exports = {
  Contato,
  ContatoModel
}