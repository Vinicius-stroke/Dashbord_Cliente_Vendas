document.addEventListener("DOMContentLoaded", function () {

  if (window.graficoDiario) {
    new Chart(document.getElementById("graficoDiario"), {
      type: 'line',
      data: window.graficoDiario,
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  if (window.graficoMensal) {
    new Chart(document.getElementById("graficoMensal"), {
      type: 'bar',
      data: window.graficoMensal,
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  if (window.graficoAnual) {
    new Chart(document.getElementById("graficoAnual"), {
      type: 'line',
      data: window.graficoAnual,
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

});