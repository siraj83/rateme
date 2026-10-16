(function initializeDashboardState() {
    window.RateMeApp =
        window.RateMeApp || {};

    window.RateMeApp.state = {
        currentRestaurantSlug: '',

        currentReviewLink: '',

        currentQR: {
            type: '',
            restaurantSlug: '',
            branchSlug: '',
            branchName: '',
            source: '',
            url: ''
        },

        allProducts: [],
        loadedBranches: [],
        archivedBranches: [],

        editingProductId: null,
        currentReviewsProductId: null,

        editingBranchId: null,
        pendingBranchDeleteId: null,

        ratingsChart: null
    };
})();