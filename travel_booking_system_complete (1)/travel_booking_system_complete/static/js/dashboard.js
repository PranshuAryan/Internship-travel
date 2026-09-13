// ============================================
// Wayfare — Dashboard behavior (cancel booking)
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.cancel-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const bookingId = btn.dataset.bookingId;
      if (!confirm('Cancel this booking? This cannot be undone.')) return;

      btn.disabled = true;
      btn.textContent = 'Cancelling…';

      try {
        const response = await fetch(`/api/bookings/${bookingId}/cancel`, { method: 'POST' });
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Could not cancel booking');

        // Reflect the new status without a full page reload
        const card = btn.closest('.booking-card');
        const badge = card.querySelector('.status-badge');
        badge.textContent = 'cancelled';
        badge.className = 'status-badge status-cancelled';
        btn.remove();
      } catch (err) {
        alert(err.message);
        btn.disabled = false;
        btn.textContent = 'Cancel booking';
      }
    });
  });
});
