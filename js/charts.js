/**
 * MVJ INTERDEPARTMENT SPORTS - CHART.JS ANALYTICS ENGINE
 * Handles Circular Donut Chart, Points Bar Chart, and Match Status Analytics
 * MVJ College of Engineering
 */

(function () {
  'use strict';

  let donutChartInstance = null;
  let barChartInstance = null;
  let statusChartInstance = null;

  // Chart.js Center Text Plugin for Donut Chart
  const centerTextPlugin = {
    id: 'centerTextPlugin',
    afterDraw(chart) {
      if (chart.config.type !== 'doughnut') return;
      const { ctx, chartArea: { width, height, top, left } } = chart;
      const total = chart.data.datasets[0].data.reduce((a, b) => a + (Number(b) || 0), 0);

      ctx.save();
      const centerX = left + width / 2;
      const centerY = top + height / 2;

      // Draw Total Value
      ctx.font = '800 2.2rem "Outfit", sans-serif';
      ctx.fillStyle = '#174EA6';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(total.toString(), centerX, centerY - 10);

      // Draw Label
      ctx.font = '700 0.75rem "Inter", sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText('TOTAL POINTS', centerX, centerY + 22);

      ctx.restore();
    }
  };

  if (window.Chart) {
    window.Chart.register(centerTextPlugin);
  }

  // 1. Mandatory Department Performance Circular Donut Chart
  function initDonutChart(canvasId, departments) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return;

    if (donutChartInstance) {
      donutChartInstance.destroy();
    }

    const labels = departments.map((d) => d.code || d.name);
    const data = departments.map((d) => d.points);
    const backgroundColors = departments.map((d) => d.color || '#174EA6');

    donutChartInstance = new window.Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColors,
          borderWidth: 2,
          borderColor: '#FFFFFF',
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 1000
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 14,
              font: {
                family: 'Inter',
                size: 12,
                weight: '600'
              },
              color: '#172B4D'
            }
          },
          tooltip: {
            backgroundColor: '#0F172A',
            padding: 12,
            cornerRadius: 8,
            titleFont: { family: 'Outfit', size: 14, weight: '700' },
            bodyFont: { family: 'Inter', size: 13 },
            callbacks: {
              label: function (context) {
                const total = context.dataset.data.reduce((a, b) => a + Number(b), 0);
                const value = context.parsed;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return ` ${context.label}: ${value} Points (${percentage}%)`;
              }
            }
          }
        }
      }
    });

    return donutChartInstance;
  }

  // 2. Department Points Bar Chart
  function initBarChart(canvasId, departments) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return;

    if (barChartInstance) {
      barChartInstance.destroy();
    }

    const labels = departments.map((d) => d.code);
    const pointsData = departments.map((d) => d.points);
    const backgroundColors = departments.map((d) => d.color || '#174EA6');

    barChartInstance = new window.Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Total Department Points',
          data: pointsData,
          backgroundColor: backgroundColors,
          borderRadius: 6,
          maxBarThickness: 36
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#E2E8F0' },
            ticks: {
              font: { family: 'Inter', weight: '600' },
              color: '#64748B'
            }
          },
          x: {
            grid: { display: false },
            ticks: {
              font: { family: 'Outfit', weight: '700' },
              color: '#172B4D'
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0F172A',
            padding: 10,
            cornerRadius: 8
          }
        }
      }
    });

    return barChartInstance;
  }

  // 3. Match Status Doughnut Chart
  function initMatchStatusChart(canvasId, stats) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return;

    if (statusChartInstance) {
      statusChartInstance.destroy();
    }

    statusChartInstance = new window.Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Upcoming', 'Live'],
        datasets: [{
          data: [stats.completedMatches, stats.upcomingMatches, stats.liveMatches],
          backgroundColor: ['#16A36A', '#2878D0', '#DC2626'],
          borderWidth: 2,
          borderColor: '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 12,
              font: { family: 'Inter', weight: '600', size: 11 }
            }
          }
        }
      }
    });

    return statusChartInstance;
  }

  window.MVJ_CHARTS = {
    initDonutChart,
    initBarChart,
    initMatchStatusChart
  };
})();
