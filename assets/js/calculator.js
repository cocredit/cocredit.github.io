/**
 * Borrowing Power Calculator
 * Calculates how much a broker can access based on their trail book value
 *
 * Formula:
 * - Book Value = Monthly Trail × 12 × Multiple
 * - Working Capital = Book Value × 50%
 * - Acquisition Finance = Book Value × 70%
 */

(function () {
  let comparisonChart = null;
  let debounceTimer = null;
  const DEBOUNCE_DELAY = 300;

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  function formatNumberWithCommas(value) {
    // Remove non-numeric characters except decimal
    const num = value.replace(/[^0-9]/g, '');
    if (!num) return '';
    return parseInt(num, 10).toLocaleString('en-AU');
  }

  function parseFormattedNumber(value) {
    // Remove commas and other non-numeric characters
    const cleaned = value.replace(/[^0-9]/g, '');
    return parseInt(cleaned, 10) || 0;
  }

  function debounce(func, delay) {
    return function (...args) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(this, args), delay);
    };
  }

  function getSelectedPurpose() {
    const selected = document.querySelector('input[name="loanPurpose"]:checked');
    return selected ? selected.value : 'acquisition';
  }

  function calculate() {
    const monthlyTrailInput = document.getElementById('monthlyTrail');
    const monthlyTrail = parseFormattedNumber(monthlyTrailInput.value);
    const multiple = parseFloat(document.getElementById('bookMultiple').value) || 3;
    const purpose = getSelectedPurpose();

    // Calculate values
    const annualTrail = monthlyTrail * 12;
    const bookValue = annualTrail * multiple;
    const workingCapital = bookValue * 0.5;
    const acquisitionFinance = bookValue * 0.7;

    // Determine which amount to show based on purpose
    const isAcquisition = purpose === 'acquisition';
    const accessAmount = isAcquisition ? acquisitionFinance : workingCapital;
    const accessPercent = isAcquisition ? '70%' : '50%';
    const accessLabel = isAcquisition ? 'Acquisition Finance' : 'Working Capital';

    // Update display
    document.getElementById('multipleDisplay').textContent = multiple.toFixed(1) + 'x';
    document.getElementById('displayMonthlyTrail').textContent = formatCurrency(monthlyTrail);
    document.getElementById('annualTrail').textContent = formatCurrency(annualTrail);
    document.getElementById('displayMultiple').textContent = multiple.toFixed(1) + 'x';
    document.getElementById('bookValue').textContent = formatCurrency(bookValue);

    // Update access section
    document.getElementById('accessLabel').textContent = accessLabel;
    document.getElementById('accessAmount').textContent = formatCurrency(accessAmount);
    document.getElementById('accessPercent').textContent = accessPercent + ' of book value';

    // Update chart
    updateComparisonChart(bookValue, accessAmount, isAcquisition);
  }

  const debouncedCalculate = debounce(calculate, DEBOUNCE_DELAY);

  function updateComparisonChart(bookValue, accessAmount, isAcquisition) {
    const ctx = document.getElementById('comparisonChart');
    if (!ctx) return;

    if (comparisonChart) {
      comparisonChart.destroy();
    }

    const accessLabel = isAcquisition ? 'Acquisition (70%)' : 'Working Capital (50%)';
    const accessColor = isAcquisition ? '#2e7d32' : '#1976d2';

    comparisonChart = new Chart(ctx.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Book Value', accessLabel],
        datasets: [{
          data: [bookValue, accessAmount],
          backgroundColor: ['#f26739', accessColor],
          borderRadius: 6,
          barThickness: 80
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return formatCurrency(context.raw);
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return formatCurrency(value);
              }
            },
            grid: {
              color: '#e0e0e0'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  function handleCurrencyInput(e) {
    const input = e.target;
    const cursorPosition = input.selectionStart;
    const oldValue = input.value;
    const oldLength = oldValue.length;

    // Format the value
    const formatted = formatNumberWithCommas(input.value);
    input.value = formatted;

    // Adjust cursor position
    const newLength = formatted.length;
    const diff = newLength - oldLength;
    const newPosition = Math.max(0, cursorPosition + diff);
    input.setSelectionRange(newPosition, newPosition);

    // Trigger debounced calculation
    debouncedCalculate();
  }

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function () {
    const monthlyTrailInput = document.getElementById('monthlyTrail');
    const bookMultipleInput = document.getElementById('bookMultiple');
    const purposeInputs = document.querySelectorAll('input[name="loanPurpose"]');

    if (monthlyTrailInput) {
      // Handle input with currency formatting
      monthlyTrailInput.addEventListener('input', handleCurrencyInput);

      // Prevent non-numeric input
      monthlyTrailInput.addEventListener('keypress', function (e) {
        if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
          e.preventDefault();
        }
      });
    }

    if (bookMultipleInput) {
      bookMultipleInput.addEventListener('input', debouncedCalculate);
      bookMultipleInput.addEventListener('change', calculate); // Immediate on release
    }

    // Purpose selector - immediate update (no debounce needed)
    purposeInputs.forEach(function (input) {
      input.addEventListener('change', calculate);
    });

    // Calculate with default values on load
    calculate();
  });
})();
