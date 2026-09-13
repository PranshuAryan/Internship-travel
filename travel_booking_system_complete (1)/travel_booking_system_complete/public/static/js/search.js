// ============================================
// Wayfare — Search results page behavior
// ============================================

let currentTrips = [];
let currentSort = 'price';

document.addEventListener('DOMContentLoaded', () => {
  prefillFromUrl();
  setupTypeToggle();
  setupSortButtons();
  setupSearchForm();
  runSearch();
});

/** Reads ?source=&destination=&type=&date= from the URL (set by the home page search bar) */
function prefillFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const source = params.get('source') || '';
  const destination = params.get('destination') || '';
  const type = params.get('type') || '';
  const date = params.get('date') || '';

  document.getElementById('page-source').value = source;
  document.getElementById('page-destination').value = destination;
  document.getElementById('page-date').value = date;
  document.getElementById('page-trip-type-input').value = type;

  document.querySelectorAll('#search-type-toggle button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
}

function setupTypeToggle() {
  const buttons = document.querySelectorAll('#search-type-toggle button');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('page-trip-type-input').value = btn.dataset.type;
      runSearch();
    });
  });
}

function setupSortButtons() {
  document.querySelectorAll('.sort-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentSort = btn.dataset.sort;
      renderResults();
    });
  });
}

function setupSearchForm() {
  const form = document.getElementById('search-form-page');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    runSearch();
  });
}

async function runSearch() {
  const container = document.getElementById('search-results');
  container.innerHTML = '<div class="routes-loading">Loading routes…</div>';

  const source = document.getElementById('page-source').value.trim();
  const destination = document.getElementById('page-destination').value.trim();
  const type = document.getElementById('page-trip-type-input').value;

  const query = new URLSearchParams();
  if (source) query.set('source', source);
  if (destination) query.set('destination', destination);
  if (type) query.set('type', type);

  try {
    const response = await fetch(`/api/search?${query.toString()}`);
    if (!response.ok) throw new Error('Search failed');
    currentTrips = await response.json();
    updateHeading(source, destination);
    renderResults();
  } catch (err) {
    container.innerHTML = '<div class="routes-empty">Something went wrong loading results. Try again.</div>';
  }
}

function updateHeading(source, destination) {
  const heading = document.getElementById('results-heading');
  const sub = document.getElementById('results-subheading');

  if (source && destination) {
    heading.textContent = `${source} to ${destination}`;
    sub.textContent = `Comparing every option we found for this route.`;
  } else if (destination) {
    heading.textContent = `Trips to ${destination}`;
    sub.textContent = `Comparing every option we found heading there.`;
  } else {
    heading.textContent = 'All routes';
    sub.textContent = "Showing everything we've got — narrow it down above.";
  }
}

function renderResults() {
  const container = document.getElementById('search-results');

  if (!currentTrips.length) {
    container.innerHTML = '<div class="routes-empty">No matches. Try a different destination or trip type.</div>';
    return;
  }

  const sorted = [...currentTrips].sort((a, b) => {
    if (currentSort === 'price') return a.price - b.price;
    return a.departure_time.localeCompare(b.departure_time);
  });

  container.innerHTML = sorted.map(renderRouteRow).join('');
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
      <span class="route-meta">${trip.departure_time} &middot; ${trip.seats_available} seats left</span>
      <span class="route-price">$${trip.price.toFixed(0)} ${priceUnit}</span>
    </a>
  `;
}
