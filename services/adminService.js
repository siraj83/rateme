const db = require('../db');

async function getDashboardStats() {
    const restaurants = await db.query(`SELECT COUNT(*) FROM restaurants`);

    const activeSubscriptions = await db.query(`
    SELECT COUNT(*)
    FROM subscriptions
    WHERE status = 'active'
  `);

    const expiredSubscriptions = await db.query(`
    SELECT COUNT(*)
    FROM subscriptions
    WHERE status = 'expired'
  `);

    const pendingPayments = await db.query(`
    SELECT COUNT(*)
    FROM subscriptions
    WHERE payment_status = 'pending'
  `);

    const users = await db.query(`
    SELECT COUNT(*)
    FROM users
  `);

    return {
        restaurants: Number(restaurants.rows[0].count),
        users: Number(users.rows[0].count),
        active_subscriptions: Number(activeSubscriptions.rows[0].count),
        expired_subscriptions: Number(expiredSubscriptions.rows[0].count),
        pending_payments: Number(pendingPayments.rows[0].count)
    };
}

async function getRestaurants() {
    const result = await db.query(`
  SELECT
    r.id AS restaurant_id,
    r.name AS restaurant_name,
    r.phone AS restaurant_phone,
    r.slug,
    r.logo_url,

    u.phone AS user_phone,

    s.id AS subscription_id,
    s.status AS subscription_status,
    s.payment_status,
    s.payment_reference,
    s.starts_at,
    s.ends_at,

    p.id AS plan_id,
    p.name AS plan_name,
    p.price,

    COUNT(DISTINCT pr.id) AS products_count,
    COUNT(DISTINCT b.id) AS branches_count,
    COUNT(DISTINCT rv.id) AS reviews_count

  FROM restaurants r

  LEFT JOIN users u
    ON u.restaurant_id = r.id

  LEFT JOIN subscriptions s
    ON s.restaurant_id = r.id

  LEFT JOIN plans p
    ON p.id = s.plan_id

  LEFT JOIN products pr
    ON pr.restaurant_id = r.id

  LEFT JOIN branches b
    ON b.restaurant_id = r.id

  LEFT JOIN reviews rv
    ON rv.product_id = pr.id

  GROUP BY
    r.id,
    u.phone,
    s.id,
    p.id

  ORDER BY r.created_at DESC
`);
    return result.rows;
}

async function getPlans() {
    const plansResult = await db.query(`
    SELECT *
    FROM plans
    ORDER BY price ASC
  `);

    const featuresResult = await db.query(`
    SELECT
      plan_id,
      feature_key,
      feature_value
    FROM plan_features
  `);

    const plans = plansResult.rows.map(plan => {
        const features = featuresResult.rows
            .filter(f => f.plan_id === plan.id)
            .reduce((acc, f) => {
                acc[f.feature_key] = f.feature_value;
                return acc;
            }, {});

        return {
            ...plan,
            features
        };
    });

    return plans;
}

async function updatePlan(planId, data) {
    const {
        name,
        price,
        max_products,
        max_branches,
        max_reviews,
        is_active,
        features
    } = data;

    const result = await db.query(
        `
    UPDATE plans
    SET
      name = $1,
      price = $2,
      max_products = $3,
      max_branches = $4,
      max_reviews = $5,
      is_active = $6
    WHERE id = $7
    RETURNING *
    `,
        [
            name,
            price,
            max_products,
            max_branches,
            max_reviews,
            is_active,
            planId
        ]
    );

    const plan = result.rows[0];

    if (!plan) return null;

    if (features) {
        for (const [key, value] of Object.entries(features)) {
            await db.query(
                `
        INSERT INTO plan_features
        (
          plan_id,
          feature_key,
          feature_value
        )
        VALUES
        ($1,$2,$3)
        ON CONFLICT (plan_id, feature_key)
        DO UPDATE SET feature_value = EXCLUDED.feature_value
        `,
                [
                    planId,
                    key,
                    String(value)
                ]
            );
        }
    }

    return plan;
}

async function updateSubscription(subscriptionId, data, adminId) {
    const oldResult = await db.query(
        `
    SELECT *
    FROM subscriptions
    WHERE id = $1
    `,
        [subscriptionId]
    );

    if (oldResult.rows.length === 0) {
        return null;
    }

    const oldSubscription = oldResult.rows[0];

    const {
        status,
        payment_status,
        payment_reference,
        plan_id,
        ends_at
    } = data;

    const result = await db.query(
        `
    UPDATE subscriptions
    SET
      status = COALESCE($1, status),
      payment_status = COALESCE($2, payment_status),
      payment_reference = COALESCE($3, payment_reference),
      plan_id = COALESCE($4, plan_id),
      ends_at = COALESCE($5::date, ends_at)
    WHERE id = $6
    RETURNING *
    `,
        [
            status || null,
            payment_status || null,
            payment_reference || null,
            plan_id || null,
            ends_at || null,
            subscriptionId
        ]
    );

    const newSubscription = result.rows[0];

    const changes = buildSubscriptionChanges(
        oldSubscription,
        newSubscription
    );

    await logActivity({

        adminId,
        restaurantId: newSubscription.restaurant_id,
        action: 'subscription_updated',
        oldValue: oldSubscription,
        newValue: {
            subscription: newSubscription,
            changes
        }

    });

    return newSubscription;
}

async function getRestaurantActivityLogs(restaurantId) {
    const result = await db.query(
        `
    SELECT
      l.*,
      a.username AS admin_username
    FROM platform_activity_logs l
    LEFT JOIN platform_admins a
      ON a.id = l.admin_id
    WHERE l.restaurant_id = $1
    ORDER BY l.created_at DESC
    LIMIT 50
    `,
        [restaurantId]
    );

    return result.rows;
}

async function logActivity({
    adminId,
    restaurantId,
    action,
    oldValue = null,
    newValue = null
}) {
    await db.query(
        `
    INSERT INTO platform_activity_logs
    (
      admin_id,
      restaurant_id,
      action,
      old_value,
      new_value
    )
    VALUES
    ($1,$2,$3,$4,$5)
    `,
        [
            adminId,
            restaurantId,
            action,
            oldValue,
            newValue
        ]
    );
}

function buildSubscriptionChanges(oldSub, newSub) {

    const changes = [];

    if (oldSub.plan_id !== newSub.plan_id) {

        changes.push({
            field: 'plan',
            old: oldSub.plan_id,
            new: newSub.plan_id
        });

    }

    if (oldSub.payment_status !== newSub.payment_status) {

        changes.push({
            field: 'payment_status',
            old: oldSub.payment_status,
            new: newSub.payment_status
        });

    }

    if (oldSub.status !== newSub.status) {

        changes.push({
            field: 'subscription_status',
            old: oldSub.status,
            new: newSub.status
        });

    }

    const oldEndDate = oldSub.ends_at
        ? new Date(oldSub.ends_at).toISOString().slice(0, 10)
        : null;

    const newEndDate = newSub.ends_at
        ? new Date(newSub.ends_at).toISOString().slice(0, 10)
        : null;

    if (oldEndDate !== newEndDate) {
        changes.push({
            field: 'ends_at',
            old: oldEndDate,
            new: newEndDate
        });
    }

    if (
        (oldSub.payment_reference || '') !==
        (newSub.payment_reference || '')
    ) {

        changes.push({
            field: 'payment_reference',
            old: oldSub.payment_reference,
            new: newSub.payment_reference
        });

    }

    return changes;

}

module.exports = {
    getDashboardStats,
    getRestaurants,
    getPlans,
    updateSubscription,
    logActivity,
    getRestaurantActivityLogs,
    updatePlan
};