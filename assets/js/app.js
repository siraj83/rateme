// --- DASHBOARD INITIALIZATION ---

window.addEventListener(
  'DOMContentLoaded',
  async () => {

    const userData =
      localStorage.getItem('user');

    const token =
      localStorage.getItem('token');

    if (!userData || !token) {

      localStorage.removeItem('user');
      localStorage.removeItem('token');

      window.location.href =
        '/login';

      return;
    }

    let user;

    try {

      user =
        JSON.parse(userData);

    } catch (error) {

      console.error(
        'Invalid stored user data:',
        error
      );

      localStorage.removeItem('user');
      localStorage.removeItem('token');

      window.location.href =
        '/login';

      return;
    }

    const welcomeMsg =
      document.getElementById(
        'welcomeMsg'
      );

    if (welcomeMsg) {

      welcomeMsg.innerText =
        `مرحبًا بك، ${user.restaurant_name || ''
        } 👋`;
    }

    try {

      await loadRestaurant();
      await loadSubscriptionInfo();
      await loadProducts();
      await loadDashboardStats();
      await loadBranchStats();
      await loadBranches();

    } catch (error) {

      console.error(
        'Dashboard initialization error:',
        error
      );
    }
  }
);