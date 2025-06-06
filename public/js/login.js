document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = document.getElementById('password').value;
  const messageArea = document.getElementById('login-message');
  messageArea.textContent = 'Verifying...';
  
  try {
    const response = await fetch('/.netlify/functions/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password }),
    });

    if (response.ok) {
      // If login is successful, save a temporary "key" in the browser
      sessionStorage.setItem('isAdminAuthenticated', 'true');
      // Redirect to the admin dashboard
      window.location.href = '/admin/';
    } else {
      messageArea.textContent = 'Incorrect Password.';
    }
  } catch (error) {
    messageArea.textContent = 'An error occurred. Please try again.';
  }
});