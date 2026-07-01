const db = require('../db');

async function getCurrentSubscription(restaurantId) {
    const result = await db.query(
        `
    SELECT
      s.*,
      p.name AS plan_name,
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

async function canAddBranch(restaurantId) {
    const subscription = await getCurrentSubscription(restaurantId);

    if (!subscription) {
        return {
            ok: false,
            message: 'لا يوجد اشتراك فعال'
        };
    }

    if (subscription.max_branches === null || subscription.max_branches === undefined) {
        return {
            ok: true,
            subscription
        };
    }

    const countResult = await db.query(
        `
    SELECT COUNT(*)
    FROM branches
    WHERE restaurant_id = $1
    `,
        [restaurantId]
    );

    const branchesCount = Number(countResult.rows[0].count);

    if (branchesCount >= subscription.max_branches) {
        return {
            ok: false,
            message: 'لقد وصلت إلى الحد الأقصى للفروع في باقتك'
        };
    }

    return {
        ok: true,
        subscription
    };
}

async function getSubscriptionSummary(restaurantId) {
    const subscription = await getCurrentSubscription(restaurantId);

    if (!subscription) {
        return {
            ok: false,
            message: 'لا يوجد اشتراك فعال'
        };
    }

    const productsCountResult = await db.query(
        `
    SELECT COUNT(*)
    FROM products
    WHERE restaurant_id = $1
    `,
        [restaurantId]
    );

    const branchesCountResult = await db.query(
        `
    SELECT COUNT(*)
    FROM branches
    WHERE restaurant_id = $1
    `,
        [restaurantId]
    );

    const productsCount = Number(productsCountResult.rows[0].count);
    const branchesCount = Number(branchesCountResult.rows[0].count);

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
        branches_count: branchesCount
    };
}

module.exports = {
    getCurrentSubscription,
    canAddProduct,
    canAddBranch,
    getSubscriptionSummary
};