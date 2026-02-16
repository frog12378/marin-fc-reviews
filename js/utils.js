// Marin FC - Utility functions

const Utils = {
  formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  formatDateRange(start, end) {
    if (!start) return '';
    const s = this.formatDate(start);
    if (!end || start === end) return s;
    const e = this.formatDate(end);
    return `${s} - ${e}`;
  },

  renderStars(rating, maxStars = 5) {
    const filled = Math.round(Number(rating) || 0);
    let html = '<span class="stars-display">';
    for (let i = 1; i <= maxStars; i++) {
      html += i <= filled ? '\u2605' : '<span class="empty">\u2605</span>';
    }
    html += '</span>';
    return html;
  },

  avgRating(reviews, field) {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + (Number(r[field]) || 0), 0);
    return (sum / reviews.length).toFixed(1);
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  },

  showToast(message, type = 'success') {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `toast ${type}`;
    // Force reflow
    void toast.offsetWidth;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  },

  debounce(fn, ms = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  },

  timeAgo(dateStr) {
    const now = new Date();
    const then = new Date(dateStr);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return Utils.formatDate(dateStr.split('T')[0]);
  }
};
