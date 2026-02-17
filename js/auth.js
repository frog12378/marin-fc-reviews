// Marin FC - Authentication (name only, no invite code)

const Auth = {
  login(name) {
    localStorage.setItem('mfc_user', name.trim());
    localStorage.setItem('mfc_auth', '1');
  },

  logout() {
    localStorage.removeItem('mfc_user');
    localStorage.removeItem('mfc_auth');
  },

  isLoggedIn() {
    return localStorage.getItem('mfc_auth') === '1' && !!this.getUser();
  },

  getUser() {
    return localStorage.getItem('mfc_user') || '';
  },

  init() {
    const form = document.getElementById('login-form');
    const errorEl = document.getElementById('login-error');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      errorEl.hidden = true;

      const name = document.getElementById('user-name').value.trim();

      if (!name) {
        errorEl.textContent = 'Please enter your name.';
        errorEl.hidden = false;
        return;
      }

      this.login(name);
      App.showApp();
    });
  }
};
