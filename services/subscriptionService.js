const db = require('../db');

async function getCurrentSubscription(restaurantId) {
    const result = await db.query(
        `
    SELECT
      s.*,
      COALESCE(p.display_name, p.name) AS plan_name,
      p.price,
      p.max_products,
      p.max_reviews,
      p.max_branches
    FROM subscriptions s
    JOIN plans p
      ON p.id = s.plan_id
    WHERE
      s.restaurant_id = $1
      AND s.status IN ('active', 'trial')
    ORDER BY s.created_at DESC
    LIMIT 1
    `,
        [restaurantId]
    );

    return result.rows[0] || null;
}

async function canAddProduct(restaurantId) {
    const subscription = await getCurrentSubscription(restaurantId);

    if (!subscription) {
        return {
            ok: false,
            message: 'لا يوجد اشتراك فعال'
        };
    }

    if (subscription.max_products === null) {
        return {
            ok: true,
            subscription
        };
    }

    const countResult = await db.query(
        `
    SELECT COUNT(*)
    FROM products
    WHERE restaurant_id = $1
    `,
        [restaurantId]
    );

    const productsCount = Number(countResult.rows[0].count);

    if (productsCount >= subscription.max_products) {
        return {
            ok: false,
            message: 'لقد وصلت إلى الحد الأقصى للمنتجات في باقتك'
        };
    }

    return {
        ok: true,
        subscription
    };
}

async function getBranchCounts(restaurantId) {
    const result = await db.query(
        `
        SELECT
            COUNT(*) FILTER (
                WHERE is_active IS TRUE
            )::int AS active_count,

            COUNT(*) FILTER (
                WHERE is_active IS FALSE
            )::int AS archived_count
        FROM branches
        WHERE restaurant_id = $1
        `,
        [restaurantId]
    );

    return {
        active: result.rows[0]?.active_count || 0,
        archived: result.rows[0]?.archived_count || 0
    };
}

async function canAddBranch(restaurantId) {
    const subscription =
        await getCurrentSubscription(restaurantId);

    if (!subscription) {
        return {
            ok: false,
            message: 'لا يوجد اشتراك نشط'
        };
    }

    const maxBranches =
        subscription.max_branches === null
            ? null
            : Number(subscription.max_branches);

    const branchCounts =
        await getBranchCounts(restaurantId);

    if (
        maxBranches !== null &&
        branchCounts.active >= maxBranches
    ) {
        return {
            ok: false,
            message:
                'لقد وصلت إلى الحد الأقصى للفروع في باقتك'
        };
    }

    return {
        ok: true,
        active_branches_count: branchCounts.active,
        archived_branches_count: branchCounts.archived,
        max_branches: maxBranches
    };
}

async function getSubscriptionSummary(restaurantId) {
    const subscription =
        await getCurrentSubscription(restaurantId);

    if (!subscription) {
        return {
            ok: false,
            message: 'لا يوجد اشتراك فعال'
        };
    }

    const productsCountResult = await db.query(
        `
        SELECT COUNT(*)::int AS count
        FROM products
        WHERE restaurant_id = $1
        `,
        [restaurantId]
    );

    const productsCount =
        Number(productsCountResult.rows[0]?.count || 0);

    const branchCounts =
        await getBranchCounts(restaurantId);

    return {
        ok: true,

        plan_name: subscription.plan_name,
        price: subscription.price,
        status: subscription.status,
        starts_at: subscription.starts_at,
        ends_at: subscription.ends_at,

        max_products: subscription.max_products,
        max_branches: subscription.max_branches,

        products_count: productsCount,

        // للتوافق مع الواجهة القديمة: يمثل النشط فقط
        branches_count: Number(branchCounts.active || 0),

        active_branches_count:
            Number(branchCounts.active || 0),

        archived_branches_count:
            Number(branchCounts.archived || 0)
    };
}

module.exports = {
    getCurrentSubscription,
    getSubscriptionSummary,
    canAddProduct,
    canAddBranch
};