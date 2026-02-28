const mongoose = require('mongoose')
const validator = require('validator')
const bcryptjs = require('bcryptjs')

const LoginSchema = new mongoose.Schema({
  nome: { type: String, required: true }, // 👈 NOVO CAMPO
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['gerente', 'vendedor', 'intermediario'], default: 'vendedor' },

  // Novos campos para agência
  telefone: { type: String, default: '' },
  cpf: { type: String, default: '' },
  bairro: { type: String, default: '' },
  numeroCasa: { type: String, default: '' },
  numeroRua: { type: String, default: '' },
  planoInternet: { type: String, default: '' },
  valorPlano: { type: Number, default: 0 },
  tecnicoResponsavel: { type: String, default: '' },

  criadoEm: { type: Date, default: Date.now }
})

const LoginModel = mongoose.model('Login', LoginSchema)

class Login {
    constructor(body){
        this.body = body
        this.errors = []
        this.user = null
    }

    async login(){
        this.validaLogin()
        if(this.errors.length > 0) return

        this.user = await LoginModel.findOne({ email: this.body.email })

        if(!this.user){
            this.errors.push('Usuário não existe.')
            return
        }

        if(!bcryptjs.compareSync(this.body.password, this.user.password)){
            this.errors.push('Usuário ou senha inválidos.')
            this.user = null
            return
        }
    }

   async register() {
    this.validaRegistro();
    if (this.errors.length > 0) return;

    await this.userExists();
    if (this.errors.length > 0) return;

    const salt = bcryptjs.genSaltSync();
    this.body.password = bcryptjs.hashSync(this.body.password, salt);

    // SALVE O RESULTADO NA INSTÂNCIA (this.user)
    this.user = await LoginModel.create({
        nome: this.body.nome,
        email: this.body.email,
        password: this.body.password,
        role: this.body.role
    });
    }

    async userExists(){
        const user = await LoginModel.findOne({ email: this.body.email })
        if(user) this.errors.push('Usuário já existe.')
    }

    validaLogin(){
        this.cleanUp()

        if(!validator.isEmail(this.body.email))
            this.errors.push('E-mail inválido.')

        if(this.body.password.length < 3 || this.body.password.length > 50)
            this.errors.push('Senha inválida.')
    }

    validaRegistro(){
        this.cleanUp()

        if(!validator.isEmail(this.body.email))
            this.errors.push('E-mail inválido.')

        if(this.body.password.length < 3 || this.body.password.length > 50)
            this.errors.push('A senha precisa ter entre 3 e 50 caracteres.')

        // ✅ CONFIRMAÇÃO DE SENHA
        if(this.body.password !== this.body.confirmPassword){
            this.errors.push('As senhas não coincidem.')
        }
    }

    cleanUp(){
        for(const key in this.body){
            if(typeof this.body[key] !== 'string'){
                this.body[key] = ''
            }
        }

        this.body = {
            nome: this.body.nome,
            email: this.body.email,
            password: this.body.password,
            confirmPassword: this.body.confirmPassword,
            role: this.body.role || 'vendedor'
        }
    }
}
module.exports = Login
module.exports.LoginModel = LoginModel