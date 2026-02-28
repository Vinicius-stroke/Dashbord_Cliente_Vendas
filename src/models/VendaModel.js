const mongoose = require('mongoose')

const VendaSchema = new mongoose.Schema({

  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contato',
    required: true
  },

  vendedor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Login',
    required: true
  },

  plano: {
    type: String,
    required: true
  },

  valor: {
    type: Number,
    required: true
  },

  tecnicoResponsavel: {
    type: String,
    default: ''
  },

  status: {
    type: String,
    enum: ['pendente', 'realizada', 'cancelada', 'reagendada'],
    default: 'pendente'
  },

  dataVenda: {
    type: Date,
    default: Date.now
  }

}, { timestamps: true })

module.exports = mongoose.model('Venda', VendaSchema)