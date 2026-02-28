console.log("Bundle carregado");
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import './assets/css/style.css';

import Chart from 'chart.js/auto';

document.addEventListener('DOMContentLoaded', () => {
  const ctx = document.getElementById('graficoDiario');
  if (!ctx || !window.graficoDiario) return;

  const graficoData = window.graficoDiario;

  const dados = graficoData.dados || [];

  const context = ctx.getContext('2d');

  // Gradiente automático (verde se positivo predominante)
  const gradient = context.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(37, 99, 235, 0.35)');
  gradient.addColorStop(1, 'rgba(37, 99, 235, 0.02)');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: graficoData.labels,
      datasets: [{
        label: 'Resultado Diário',
        data: dados,
        borderWidth: 3,
        borderColor: '#2563eb',
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return `R$ ${context.raw.toLocaleString('pt-BR')}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return 'R$ ' + value.toLocaleString('pt-BR');
            }
          }
        }
      }
    }
  });
});

const ctxPerdas = document.getElementById('graficoPerdas');

if (ctxPerdas && window.graficoDiario) {

  const context = ctxPerdas.getContext('2d');

  const gradientRed = context.createLinearGradient(0, 0, 0, 400);
  gradientRed.addColorStop(0, 'rgba(220, 38, 38, 0.35)');
  gradientRed.addColorStop(1, 'rgba(220, 38, 38, 0.02)');

  new Chart(ctxPerdas, {
    type: 'line',
    data: {
      labels: window.graficoDiario.labels,
      datasets: [{
        label: 'Perdas Diárias',
        data: window.graficoDiario.perdas,
        borderWidth: 3,
        borderColor: '#dc2626',
        backgroundColor: gradientRed,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      interaction: {
        mode: 'index',
        intersect: false
      },

      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return `R$ ${context.raw.toLocaleString('pt-BR')}`;
            }
          }
        }
      },

      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return 'R$ ' + value.toLocaleString('pt-BR');
            }
          }
        }
      }
    }
  });
}