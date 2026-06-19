const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: 'No token provided'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
}

app.get('/api/test-db', async (req, res) => {
    try {

        const result = await db.query(
            'SELECT NOW()'
        );

        res.json({
            success: true,
            serverTime: result.rows[0].now
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/restaurants', async (req, res) => {

    try {

        const {
            name,
            slug,
            logo_url
        } = req.body;

        const result = await db.query(
            `
            INSERT INTO restaurants
            (
                name,
                slug,
                logo_url
            )
            VALUES
            ($1,$2,$3)
            RETURNING *
            `,
            [
                name,
                slug,
                logo_url
            ]
        );

        res.json(result.rows[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });
    }
});

app.get('/api/restaurants', async (req, res) => {

    try {

        const result = await db.query(
            `
            SELECT *
            FROM restaurants
            ORDER BY created_at DESC
            `
        );

        res.json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });
    }
});

app.post('/api/login', async (req, res) => {

    try {

        const { phone, password } = req.body;

        const result = await db.query(
            `
            SELECT
                u.*,
                r.name AS restaurant_name,
                r.slug,
                r.logo_url
            FROM users u
            JOIN restaurants r
                ON r.id = u.restaurant_id
            WHERE u.phone = $1
            `,
            [phone]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = result.rows[0];

        if (user.password_hash !== password) {
            return res.status(401).json({
                success: false,
                message: 'Invalid password'
            });
        }

        const token = jwt.sign(
            {
                user_id: user.id,
                restaurant_id: user.restaurant_id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '7d'
            }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                phone: user.phone,
                email: user.email,
                restaurant_id: user.restaurant_id,
                restaurant_name: user.restaurant_name,
                slug: user.slug,
                logo_url: user.logo_url
            }
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


app.get('/api/test-login', async (req, res) => {

    const result = await db.query(
        'SELECT phone,password_hash FROM users'
    );

    res.json(result.rows);

});

// Products
app.get('/api/products', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            `
            SELECT *
            FROM products
            WHERE restaurant_id = $1
            ORDER BY created_at DESC
            `,
            [req.user.restaurant_id]
        );

        res.json({
            success: true,
            products: result.rows
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


app.post('/api/products', authenticate, async (req, res) => {
    try {
        const {
            restaurant_id,
            name,
            price,
            ingredients,
            image_url
        } = req.body;

        const result = await db.query(
            `
            INSERT INTO products
            (
                restaurant_id,
                name,
                price,
                ingredients,
                image_url
            )
            VALUES
            ($1,$2,$3,$4,$5)
            RETURNING *
            `,
            [
                req.user.restaurant_id,
                name,
                price,
                ingredients,
                image_url
            ]
        );

        res.json({
            success: true,
            product: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


app.put('/api/products/:id', authenticate, async (req, res) => {
    try {
        const {
            name,
            price,
            ingredients,
            image_url
        } = req.body;

        const result = await db.query(
            `
            UPDATE products
            SET
                name = $1,
                price = $2,
                ingredients = $3,
                image_url = $4
            WHERE id = $5 AND restaurant_id = $6
            RETURNING *
            `,
            [
                name,
                price,
                ingredients,
                image_url,
                req.params.id,
                req.user.restaurant_id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found or not allowed'
            });
        }

        res.json({
            success: true,
            product: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


app.delete('/api/products/:id', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            `
            DELETE FROM products
            WHERE id = $1 AND restaurant_id = $2
            RETURNING *
            `,
            [
                req.params.id,
                req.user.restaurant_id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found or not allowed'
            });
        }

        res.json({
            success: true
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Restaurants show
app.get('/api/restaurant/me', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            `
            SELECT
                id,
                name,
                slug,
                logo_url,
                description,
                address,
                google_maps_url,
                phone,
                created_at
            FROM restaurants
            WHERE id = $1
            `,
            [req.user.restaurant_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        res.json({
            success: true,
            restaurant: result.rows[0]
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// UPDATE restaurants
app.put('/api/restaurant/me', authenticate, async (req, res) => {
    try {
        const {
            name,
            slug,
            logo_url,
            description,
            address,
            phone,
            google_maps_url
        } = req.body;

        const result = await db.query(
            `
            UPDATE restaurants
            SET
                name = $1,
                slug = $2,
                logo_url = $3,
                description = $4,
                address = $5,
                phone = $6,
                google_maps_url = $7
            WHERE id = $8
            RETURNING *
            `,
            [
                name,
                slug,
                logo_url,
                description,
                address,
                phone,
                google_maps_url,
                req.user.restaurant_id
            ]
        );

        res.json({
            success: true,
            restaurant: result.rows[0]
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// rewiews
app.get('/api/products/:id/reviews', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            `
            SELECT *
            FROM reviews
            WHERE product_id = $1
            ORDER BY created_at DESC
            `,
            [req.params.id]
        );

        res.json({
            success: true,
            reviews: result.rows
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// add review
app.post('/api/products/:id/reviews', async (req, res) => {
    try {
        const {
            taste_rating,
            presentation_rating,
            price_rating,
            comment,
            customer_name,
            visit_date
        } = req.body;

        const avgRating =
            (Number(taste_rating) + Number(presentation_rating) + Number(price_rating)) / 3;

        const result = await db.query(
            `
            INSERT INTO reviews
            (
                product_id,
                rating,
                taste_rating,
                presentation_rating,
                price_rating,
                comment,
                customer_name,
                visit_date
            )
            VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8)
            RETURNING *
            `,
            [
                req.params.id,
                Math.round(avgRating),
                taste_rating,
                presentation_rating,
                price_rating,
                comment,
                customer_name,
                visit_date || null
            ]
        );

        res.json({
            success: true,
            review: result.rows[0]
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// averge review
app.get('/api/products/:id/rating-summary', async (req, res) => {
    try {
        const result = await db.query(
            `
            SELECT
                ROUND(AVG(rating), 2) AS avg_rating,
                ROUND(AVG(taste_rating), 2) AS avg_taste,
                ROUND(AVG(presentation_rating), 2) AS avg_presentation,
                ROUND(AVG(price_rating), 2) AS avg_price,
                COUNT(*) AS total_reviews
            FROM reviews
            WHERE product_id = $1
            `,
            [req.params.id]
        );

        res.json({
            success: true,
            summary: result.rows[0]
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// public restaurant
app.get('/api/public/restaurant/:slug', async (req, res) => {
    try {
        const restaurantResult = await db.query(
            `
            SELECT
                id,
                name,
                slug,
                logo_url,
                description,
                address,
                google_maps_url
            FROM restaurants
            WHERE slug = $1
            `,
            [req.params.slug]
        );

        if (restaurantResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        const restaurant = restaurantResult.rows[0];

        const productsResult = await db.query(
            `
            SELECT
                p.*,
                ROUND(AVG(r.rating), 2) AS avg_rating,
                COUNT(r.id) AS total_reviews
            FROM products p
            LEFT JOIN reviews r
                ON r.product_id = p.id
            WHERE p.restaurant_id = $1
            GROUP BY p.id
            ORDER BY p.created_at DESC
            `,
            [restaurant.id]
        );

        res.json({
            success: true,
            restaurant,
            products: productsResult.rows
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// get reviews for restaurant owner
app.get('/api/products/:id/reviews', authenticate, async (req, res) => {
    try {

        const check = await db.query(
            `
            SELECT id
            FROM products
            WHERE id = $1
            AND restaurant_id = $2
            `,
            [
                req.params.id,
                req.user.restaurant_id
            ]
        );

        if (check.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Not allowed'
            });
        }

        const result = await db.query(
            `
            SELECT
                id,
                customer_name,
                taste_rating,
                presentation_rating,
                price_rating,
                comment,
                visit_date,
                created_at
            FROM reviews
            WHERE product_id = $1
            ORDER BY created_at DESC
            `,
            [req.params.id]
        );

        res.json({
            success: true,
            reviews: result.rows
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });

    }
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`✅ Rate Me Server running at http://localhost:${PORT}`);
});