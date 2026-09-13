// ============================================
// Wayfare — Booking / checkout page behavior
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  const section = document.querySelector('.booking-section');
  const tripId = section.dataset.tripId;
  const pricePerUnit = parseFloat(section.dataset.price);

  const passengersInput = document.getElementById('passengers-input');
  const totalDisplay = document.getElementById('booking-total');
  const confirmBtn = document.getElementById('confirm-booking-btn');
  const errorBox = document.getElementById('booking-error');

  passengersInput.addEventListener('change', () => {
    const total = pricePerUnit * parseInt(passengersInput.value, 10);
    totalDisplay.textContent = `$${total.toFixed(2)}`;
  });

  confirmBtn.addEventListener('click', async () => {
    errorBox.hidden = true;
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Confirming…';

    const payload = {
      trip_id: parseInt(tripId, 10),
      passengers: parseInt(passengersInput.value, 10),
      payment_method: document.getElementById('payment-method').value,
    };

    try {
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Booking failed. Please try again.');
      }

      document.getElementById('confirmation-booking-id').textContent = `#${data.booking_id}`;
      document.getElementById('confirmation-txn-id').textContent = data.transaction_id;
      document.getElementById('booking-form-wrapper').hidden = true;
      document.getElementById('booking-confirmation').hidden = false;
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.hidden = false;
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirm booking';
    }
  });
});
