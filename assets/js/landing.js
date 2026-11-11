(async function loadPlatformBranding() {

    try {

        const res = await fetch(
            '/api/platform-branding',
            {
                cache: 'no-store'
            }
        );

        const data = await res.json();

        if (
            !res.ok ||
            !data.success ||
            !data.branding
        ) {
            console.error(
                'Invalid branding response:',
                data
            );

            return;
        }

        const branding =
            data.branding;

        const logo =
            document.getElementById(
                'platformLandingLogo'
            );

        const name =
            document.getElementById(
                'platformLandingName'
            );

        if (logo && branding.logo_url) {

            logo.src =
                branding.logo_url;

            logo.style.display =
                'block';

        }

        if (name) {

            const englishName =
                branding.platform_name ||
                'Rate Me';

            const arabicName =
                branding.platform_name_ar ||
                'قيمني';

            name.textContent =
                `${englishName} ${arabicName}`;
        }

    } catch (error) {

        console.error(
            'Load platform branding error:',
            error
        );
    }

})();