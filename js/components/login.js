// js/components/login.js
import db from '../db.js';

export default {
  render(container, onLoginSuccess) {
    const data = db.getData();
    
    container.innerHTML = `
      <div class="login-wrapper">
        <div class="login-card">
          <div class="login-logo">
            <div class="logo-icon">Z</div>
            <div class="brand-name" style="font-size: 24px;">ZestOps Portal</div>
          </div>
          
          <div class="login-headline">
            <h2>Select Staff Profile</h2>
            <p>Choose your profile to log in to the operations system</p>
          </div>
          
          <div class="quick-roles-grid" id="login-users-grid">
            ${data.users.map(u => `
              <button class="quick-role-btn" data-username="${u.username}">
                <div class="user-avatar" style="background: var(--bg-primary); border: 1px solid var(--accent-color); font-size: 16px;">
                  ${u.name.substring(0, 2)}
                </div>
                <strong>${u.name.split(' ')[0]}</strong>
                <span>${u.role}</span>
              </button>
            `).join('')}
          </div>
          
          <div style="border-top: 1px solid var(--bg-tertiary); padding-top: 15px; margin-top: 10px;">
            <p style="font-size: 11px; color: var(--text-muted);">
              ZestOps v1.0.0 • Dedicated Internal Single-Restaurant Software
            </p>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    const buttons = container.querySelectorAll('.quick-role-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const username = btn.getAttribute('data-username');
        const user = data.users.find(u => u.username === username);
        if (user) {
          db.addLog(user.name, `Logged in successfully.`);
          onLoginSuccess(user);
        }
      });
    });
  }
};
