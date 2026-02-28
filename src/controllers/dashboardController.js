
const VendaModel = require('../models/VendaModel');
const { ContatoModel } = require('../models/ContatoModel');
const { LoginModel } = require('../models/LoginModel');

function formatarGrafico(aggregateData, tipo) {
  let labels = [];
  let dados = [];
  let perdas = [];

  if (tipo === 'diario') {
    for (let i = 1; i <= 31; i++) {
      const item = aggregateData.find(d => d._id === i);
      labels.push(i.toString());
      dados.push(item ? item.total || 0 : 0);
      perdas.push(item ? item.perdas || 0 : 0);
    }
  }

  else if (tipo === 'mensal') {
    const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

    for (let i = 1; i <= 12; i++) {
      const item = aggregateData.find(d => d._id === i);
      labels.push(meses[i - 1]);
      dados.push(item ? item.total || 0 : 0);
      perdas.push(0);
    }
  }

  else if (tipo === 'anual') {
    aggregateData.forEach(d => {
      labels.push(d._id.toString());
      dados.push(d.total || 0);
      perdas.push(0);
    });
  }

  return { labels, dados, perdas };
}

exports.dashboard = async (req, res) => {
  try {

    const STATUS_VALIDO = ['realizada', 'finalizada'];
    /* ================================
       1️⃣ MÉTRICAS GERAIS
    ================================== */

    const resumoFinanceiro = await VendaModel.aggregate([
      {
        $group: {
          _id: "$status",
          quantidade: { $sum: 1 },
          total: { $sum: "$valor" }
        }
      }
    ]);

    let totalFaturamento = 0;
    let totalCanceladas = 0;
    let totalReagendadas = 0;
    let totalPendentes = 0;
    let qtdRealizadas = 0;

    resumoFinanceiro.forEach(item => {
      if (item._id === 'finalizada' || item._id === 'realizada') {
        totalFaturamento += item.total;
        qtdRealizadas += item.quantidade;
      }

      if (
        item._id === 'cancelada' ||
        item._id === 'improdutiva' ||
        item._id === 'perda'
      ) {
        totalCanceladas += item.total;
      }

      if (item._id === 'reagendada') {
        totalReagendadas = item.quantidade;
      }

      if (item._id === 'pendente') {
        totalPendentes = item.quantidade;
      }
    });

    const mediaVendas = qtdRealizadas
      ? totalFaturamento / qtdRealizadas
      : 0;

    const totalClientes = await ContatoModel.countDocuments();


    /* ================================
       2️⃣ CRESCIMENTO MENSAL
    ================================== */

    const hoje = new Date();

    const inicioMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const inicioMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0);

    const faturamentoMesAtual = await VendaModel.aggregate([
      {
        $match: {
          status: { $in: STATUS_VALIDO },
          createdAt: { $gte: inicioMesAtual }
        }
      },
      { $group: { _id: null, total: { $sum: "$valor" } } }
    ]);

    const faturamentoMesAnterior = await VendaModel.aggregate([
      {
        $match: {
          status: { $in: STATUS_VALIDO },
          createdAt: { $gte: inicioMesAnterior, $lte: fimMesAnterior }
        }
      },
      { $group: { _id: null, total: { $sum: "$valor" } } }
    ]);

    const totalMesAtual = faturamentoMesAtual[0]?.total || 0;
    const totalMesAnterior = faturamentoMesAnterior[0]?.total || 0;

    let crescimentoMensal = 0;
    if (totalMesAnterior > 0) {
      crescimentoMensal =
        ((totalMesAtual - totalMesAnterior) / totalMesAnterior) * 100;
    }


    /* ================================
       3️⃣ CRESCIMENTO ANUAL
    ================================== */

    const inicioAnoAtual = new Date(hoje.getFullYear(), 0, 1);
    const inicioAnoAnterior = new Date(hoje.getFullYear() - 1, 0, 1);
    const fimAnoAnterior = new Date(hoje.getFullYear() - 1, 11, 31);

    const faturamentoAnoAtual = await VendaModel.aggregate([
      {
        $match: {
          status: { $in: STATUS_VALIDO },
          createdAt: { $gte: inicioAnoAtual }
        }
      },
      { $group: { _id: null, total: { $sum: "$valor" } } }
    ]);

    const faturamentoAnoAnterior = await VendaModel.aggregate([
      {
        $match: {
          status: { $in: STATUS_VALIDO },
          createdAt: { $gte: inicioAnoAnterior, $lte: fimAnoAnterior }
        }
      },
      { $group: { _id: null, total: { $sum: "$valor" } } }
    ]);

    const totalAnoAtual = faturamentoAnoAtual[0]?.total || 0;
    const totalAnoAnterior = faturamentoAnoAnterior[0]?.total || 0;

    let crescimentoAnual = 0;
    if (totalAnoAnterior > 0) {
      crescimentoAnual =
        ((totalAnoAtual - totalAnoAnterior) / totalAnoAnterior) * 100;
    }


    /* ================================
       4️⃣ RANKING DE VENDEDORES
    ================================== */

    const vendedoresStats = await VendaModel.aggregate([
  {
    $group: {
      _id: "$vendedor",

      realizadas: {
        $sum: {
          $cond: [{ $eq: ["$status", "realizada"] }, 1, 0]
        }
      },

      canceladas: {
        $sum: {
          $cond: [
            { $in: ["$status", ["cancelada", "improdutiva", "perda"]] },
            1,
            0
          ]
        }
      },

      reagendadas: {
        $sum: {
          $cond: [{ $eq: ["$status", "reagendada"] }, 1, 0]
        }
      },

      totalValor: {
        $sum: {
          $cond: [
            { $eq: ["$status", "realizada"] },
            "$valor",
            0
          ]
        }
      }
    }
  },
  { $sort: { totalValor: -1 } }
]);

   const vendedoresComNome = await LoginModel.populate(vendedoresStats, {
  path: '_id',
  select: 'nome'
});

vendedoresComNome.forEach(v => {
  v.ticketMedio = v.realizadas > 0
    ? v.totalValor / v.realizadas
    : 0;
});


    /* ================================
       5️⃣ GRÁFICOS
    ================================== */

    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const inicioAno = new Date(hoje.getFullYear(), 0, 1);

   const vendasDiarias = await VendaModel.aggregate([
  {
    $match: {
      createdAt: { $gte: inicioMes }
    }
  },
{
  $group: {
    _id: { $dayOfMonth: "$createdAt" },

    total: {
      $sum: {
        $cond: [
          { $in: ["$status", ["realizada", "finalizada"]] },
          "$valor",
          0
        ]
      }
    },

    perdas: {
      $sum: {
        $cond: [
          { $in: ["$status", ["cancelada", "improdutiva", "perda"]] },
          "$valor",
          0
        ]
      }
    }
  }
},
{ $sort: { _id: 1 } }
    ]);

    const vendasAnuais = await VendaModel.aggregate([
      { $match: { status: { $ne: "cancelada" } } },
      {
        $group: {
          _id: { $year: "$createdAt" },
          total: { $sum: "$valor" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log("VENDAS DIARIAS:", vendasDiarias);
    /* ================================
       RENDER
    ================================== */

   res.render('dashboard/dashboard', {
    dashboard: {
    totalFaturamento,
    totalCanceladas,
    totalReagendadas,
    totalPendentes,
    mediaVendas,
    totalClientes,
    crescimentoMensal,
    crescimentoAnual
  },
  vendedoresStats: vendedoresComNome,
  graficoDiario: formatarGrafico(vendasDiarias, 'diario'),
  graficoAnual: formatarGrafico(vendasAnuais, 'anual'),
  user: req.session.user
});

  } catch (err) {
    console.error(err);
    res.render('404');
  }
};


/* =========================================================
   PERFIL INDIVIDUAL DO VENDEDOR
========================================================= */

exports.perfis = async (req, res) => {
  try {
    const vendedores = await LoginModel.find({ role: 'vendedor' });
    res.render('dashboard/perfis', { vendedores, user: req.session.user });
  } catch (err) {
    console.error(err);
    res.render('404');
  } 
};

exports.perfil = async (req, res) => {
  try {
    const vendedor = await LoginModel.findById(req.params.id);
    if (!vendedor) return res.status(404).send('Vendedor não encontrado');

    const vendas = await VendaModel.find({
      vendedor: vendedor._id
    }).populate('cliente');

    const vendasRealizadas = vendas.filter(v => v.status === 'realizada');
    const vendasCanceladas = vendas.filter(v => 
      v.status === 'cancelada' || 
      v.status === 'improdutiva' || 
      v.status === 'perda'
    );

    const totalValor = vendasRealizadas.reduce((acc, v) => acc + (v.valor || 0), 0);

    const stats = {
      realizadas: vendasRealizadas.length,
      canceladas: vendasCanceladas.length,
      totalValor,
      ticketMedio: vendasRealizadas.length
        ? totalValor / vendasRealizadas.length
        : 0
    };

    res.render('dashboard/perfil', { 
      vendedor, 
      vendas,
      stats,
      user: req.session.user 
    });

  } catch (err) {
    console.error(err);
    res.render('404');
  }
};