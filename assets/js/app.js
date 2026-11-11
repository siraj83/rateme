// --- DASHBOARD INITIALIZATION ---
async function loadPlatformBranding() {

  try {

    const data =
      await apiRequest(
        '/api/platform-branding'
      );

    const branding =
      data.branding || {};

    const logo =
      document.getElementById(
        'platformDashboardLogo'
      );

    const name =
      document.getElementById(
        'platformDashboardName'
      );

    if (logo && branding.logo_url) {
      logo.src =
        branding.logo_url;

      logo.style.display =
        'block';
    }

    if (name) {
      name.textContent =
        `${branding.platform_name || 'Rate Me'} ${branding.platform_name_ar || 'قيمني'}`;
    }

  } catch (error) {

    if (error?.status === 401) {
      throw error;
    }

    console.error(
      'Load platform branding error:',
      error
    );
  }
}

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

      await loadPlatformBranding();
      await loadRestaurant();
      await loadSubscriptionInfo();
      await loadProducts();
      await loadDashboardStats();
      await loadBranchStats();
      await loadBranches();

    } catch (error) {

      if (error?.status === 401) {
        return;
      }

      console.error(
        'Dashboard initialization error:',
        error
      );
    }
  }
);