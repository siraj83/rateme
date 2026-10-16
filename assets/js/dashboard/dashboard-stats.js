(function initializeDashboardStatsModule() {

    let ratingsChart = null;


    async function loadDashboardStats() {

        try {

            const token =
                localStorage.getItem('token');

            const res = await fetch(
                '/api/dashboard/stats',
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            const data =
                await res.json();

            if (
                !res.ok ||
                !data.success
            ) {
                return;
            }

            const stats =
                data.stats || {};

            const totalProducts =
                document.getElementById(
                    'totalProducts'
                );

            const totalReviews =
                document.getElementById(
                    'totalReviews'
                );

            const avgRating =
                document.getElementById(
                    'avgRating'
                );

            const bestProduct =
                document.getElementById(
                    'bestProduct'
                );

            if (totalProducts) {
                totalProducts.innerText =
                    stats.total_products || 0;
            }

            if (totalReviews) {
                totalReviews.innerText =
                    stats.total_reviews || 0;
            }

            if (avgRating) {
                avgRating.innerText =
                    stats.avg_rating
                        ? `${stats.avg_rating} ⭐`
                        : '0';
            }

            if (bestProduct) {
                bestProduct.innerText =
                    data.bestProduct
                        ? data.bestProduct.name
                        : '-';
            }

            renderRatingsChart({
                taste:
                    Number(
                        stats.avg_taste || 0
                    ),

                presentation:
                    Number(
                        stats.avg_presentation || 0
                    ),

                price:
                    Number(
                        stats.avg_price || 0
                    ),

                overall:
                    Number(
                        stats.avg_rating || 0
                    )
            });

        } catch (error) {

            console.error(
                'Load dashboard stats error:',
                error
            );
        }
    }


    function renderRatingsChart(values) {

        const canvas =
            document.getElementById(
                'ratingsChart'
            );

        if (!canvas) {
            return;
        }

        if (
            typeof Chart === 'undefined'
        ) {
            console.error(
                'Chart.js is not loaded'
            );

            return;
        }

        if (ratingsChart) {
            ratingsChart.destroy();
        }

        ratingsChart =
            new Chart(canvas, {

                type: 'bar',

                data: {

                    labels: [
                        'الطعم',
                        'الشكل',
                        'السعر',
                        'المتوسط العام'
                    ],

                    datasets: [{
                        label:
                            'متوسط التقييم',

                        data: [
                            values.taste,
                            values.presentation,
                            values.price,
                            values.overall
                        ],

                        borderRadius: 8
                    }]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    scales: {
                        y: {
                            beginAtZero:
                                true,

                            max: 5
                        }
                    },

                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });

        if (window.RateMeApp?.state) {
            window.RateMeApp.state.ratingsChart =
                ratingsChart;
        }
    }


    window.loadDashboardStats =
        loadDashboardStats;


    window.RateMeApp =
        window.RateMeApp || {};

    window.RateMeApp.dashboardStats = {
        load:
            loadDashboardStats,

        renderChart:
            renderRatingsChart
    };

})();