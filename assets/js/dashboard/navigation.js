(function initializeNavigationModule() {

    const sidebar =
        document.getElementById(
            'sidebar'
        );

    const overlay =
        document.getElementById(
            'sidebarOverlay'
        );

    const menuToggle =
        document.getElementById(
            'menuToggle'
        );


    function toggleSidebar() {

        sidebar?.classList.toggle(
            'active'
        );

        overlay?.classList.toggle(
            'active'
        );
    }


    function closeSidebar() {

        sidebar?.classList.remove(
            'active'
        );

        overlay?.classList.remove(
            'active'
        );
    }


    function showSection(sectionId) {

        document
            .querySelectorAll(
                '.page-section'
            )
            .forEach(section => {

                section.classList.remove(
                    'active-section'
                );

            });

        document
            .querySelectorAll(
                '.nav-link'
            )
            .forEach(link => {

                link.classList.remove(
                    'active'
                );

            });


        const selectedSection =
            document.getElementById(
                sectionId
            );

        if (selectedSection) {

            selectedSection.classList.add(
                'active-section'
            );
        }


        const activeLink =
            document.querySelector(
                `.nav-link[data-section="${sectionId}"]`
            );

        if (activeLink) {

            activeLink.classList.add(
                'active'
            );
        }
    }


    function logout() {

        localStorage.removeItem(
            'user'
        );

        localStorage.removeItem(
            'token'
        );

        window.location.href =
            '/login';
    }


    function initializeNavigationEvents() {

        menuToggle
            ?.addEventListener(
                'click',
                toggleSidebar
            );

        overlay
            ?.addEventListener(
                'click',
                closeSidebar
            );


        document
            .getElementById(
                'logoutBtn'
            )
            ?.addEventListener(
                'click',
                logout
            );


        document
            .querySelectorAll(
                '.nav-link[data-section]'
            )
            .forEach(link => {

                link.addEventListener(
                    'click',
                    event => {

                        event.preventDefault();

                        const sectionId =
                            link.dataset.section;

                        if (!sectionId) {
                            return;
                        }

                        showSection(
                            sectionId
                        );

                        closeSidebar();
                    }
                );

            });
    }


    if (
        document.readyState ===
        'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            initializeNavigationEvents
        );

    } else {

        initializeNavigationEvents();
    }


    /*
     * Compatibility globals
     */
    window.toggleSidebar =
        toggleSidebar;

    window.showSection =
        showSection;


    window.RateMeApp =
        window.RateMeApp || {};

    window.RateMeApp.navigation = {
        showSection,
        toggleSidebar,
        closeSidebar,
        logout
    };

})();