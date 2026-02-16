// Marin FC - Authentication (invite code + name)

const Auth = {
  async hashCode(input) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input.trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  },

  async verify(code) {
    const hash = await this.hashCode(code);
    return hash === CONFIG.INVITE_CODE_HASH;
  },

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

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.hidden = true;

      const code = document.getElementById('invite-code').value;
      const name = document.getElementById('user-name').value.trim();

      if (!name) {
        errorEl.textContent = 'Please enter your name.';
        errorEl.hidden = false;
        return;
      }

      const valid = await this.verify(code);
      if (!valid) {
        errorEl.textContent = 'Invalid invite code. Please check with your team manager.';
        errorEl.hidden = false;
        return;
      }

      this.login(name);
      App.showApp();
    });
  }
};
