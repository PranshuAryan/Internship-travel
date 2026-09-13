// ============================================
// Wayfare — Static homepage behavior (mock data, no backend)
// ============================================

const MOCK_TRIPS = [
  { id: 1, type: 'flight', provider: 'AirBlue', source: 'New York', destination: 'London', departure_time: '2026-09-15 09:30', price: 450 },
  { id: 2, type: 'flight', provider: 'SkyWings', source: 'New York', destination: 'Paris', departure_time: '2026-09-18 14:10', price: 520 },
  { id: 3, type: 'hotel', provider: 'Grand Plaza', source: 'N/A', destination: 'London', departure_time: '2026-09-15 15:00', price: 120 },
  { id: 4, type: 'bus', provider: 'CityTransit', source: 'Boston', destination: 'New York', departure_time: '2026-09-14 07:00', price: 35 },
];

document.addEventListener('DOMContentLoaded', () => {
  setupTripTypeToggle();
  loadPopularRoutes();
});

function setupTripTypeToggle() {
  const buttons = document.querySelectorAll('.trip-type-toggle button');
  const typeInput = document.getElementById('trip-type-input');
  const sourceField = document.getElementById('field-source');

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const type = btn.dataset.type;
      typeInput.value = type;

      if (sourceField) {
        sourceField.style.display = type === 'hotel' ? 'none' : 'flex';
      }
    });
  });
}

function loadPopularRoutes() {
  const container = document.getElementById('popular-routes');
  if (!container) return;

  // Simulate a brief load, then render mock trips (swap this for a real
  // fetch() call once you have a backend/API to hit).
  setTimeout(() => {
    container.innerHTML = MOCK_TRIPS.map(renderRouteRow).join('');
  }, 300);
}

function renderRouteRow(trip) {
  const priceUnit = trip.type === 'hotel' ? '<span>/ night</span>' : '<span>/ person</span>';
  const originLabel = trip.type === 'hotel' ? trip.provider : trip.source;

  return `
    <div class="route-row" style="color:inherit;">
      <span class="route-type-badge">${trip.type}</span>
      <span class="route-endpoints">
        <span>${originLabel}</span>
        <span class="path"></span>
        <span>${trip.destination}</span>
      </span>
      <span class="route-meta">${trip.departure_time}</span>
      <span class="route-price">$${trip.price.toFixed(0)} ${priceUnit}</span>
    </div>
  `;
}
