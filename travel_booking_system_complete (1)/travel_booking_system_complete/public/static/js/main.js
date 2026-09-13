// ============================================
// Wayfare — Home page behavior
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  setupTripTypeToggle();
  loadPopularRoutes();
});

/**
 * Lets the user switch between Flights / Hotels / Buses.
 * Updates the hidden "type" field used by the search form,
 * and swaps the From/To labels for hotels (no "From" for a hotel stay).
 */
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

      // Hotels don't need a "From" city
      if (sourceField) {
        sourceField.style.display = type === 'hotel' ? 'none' : 'flex';
      }
    });
  });
}

/**
 * Pulls live listings from the backend search API and renders
 * them as a departures-board style list on the home page.
 */
async function loadPopularRoutes() {
  const container = document.getElementById('popular-routes');
  if (!container) return;

  try {
    const response = await fetch('/api/search');
    if (!response.ok) throw new Error('Request failed');

    const trips = await response.json();

    if (!trips.length) {
      container.innerHTML = '<div class="routes-empty">No routes available right now. Check back soon.</div>';
      return;
    }

    container.innerHTML = trips
      .slice(0, 6)
      .map((trip) => renderRouteRow(trip))
      .join('');
  } catch (err) {
    container.innerHTML = '<div class="routes-empty">Couldn\'t load routes. Refresh to try again.</div>';
  }
}

function renderRouteRow(trip) {
  const priceUnit = trip.type === 'hotel' ? '<span>/ night</span>' : '<span>/ person</span>';
  const originLabel = trip.type === 'hotel' ? trip.provider : trip.source;

  return `
    <a class="route-row" href="/booking/${trip.id}" style="text-decoration:none; color:inherit;">
      <span class="route-type-badge">${trip.type}</span>
      <span class="route-endpoints">
        <span>${originLabel}</span>
        <span class="path"></span>
        <span>${trip.destination}</span>
      </span>
      <span class="route-meta">${trip.departure_time}</span>
      <span class="route-price">$${trip.price.toFixed(0)} ${priceUnit}</span>
    </a>
  `;
}
