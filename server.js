const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const db = require('./db');
const sharp = require('sharp');
const bcrypt = require('bcryptjs');
const WebSocket = require('ws');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const subscriptionService = require('./services/subscriptionService');
const adminService = require('./services/adminService');
const puppeteer = require('puppeteer');
const app = express();

const upload = multer({ storage: multer.memoryStorage() });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    {
        realtime: {
            transport: WebSocket
        }
    }
);

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

function authenticateAdmin(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: 'No token provided'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.admin_id) {
            return res.status(403).json({
                success: false,
                message: 'Not admin'
            });
        }

        req.admin = decoded;
        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
}

// Admin

app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const result = await db.query(
            `
            SELECT *
            FROM platform_admins
            WHERE username = $1
            `,
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'بيانات الدخول غير صحيحة'
            });
        }

        const admin = result.rows[0];

        const passwordValid = await bcrypt.compare(
            password,
            admin.password_hash
        );

        if (!passwordValid) {
            return res.status(401).json({
                success: false,
                message: 'بيانات الدخول غير صحيحة'
            });
        }

        const token = jwt.sign(
            {
                admin_id: admin.id,
                username: admin.username
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '7d'
            }
        );

        res.json({
            success: true,
            token,
            admin: {
                id: admin.id,
                username: admin.username
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


app.get('/api/admin/dashboard', authenticateAdmin, async (req, res) => {
    try {
        const stats = await adminService.getDashboardStats();

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


app.get('/api/admin/restaurants', authenticateAdmin, async (req, res) => {
    try {
        const restaurants = await adminService.getRestaurants();

        res.json({
            success: true,
            restaurants
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


app.get('/api/admin/plans', authenticateAdmin, async (req, res) => {
    try {
        const plans = await adminService.getPlans();

        res.json({
            success: true,
            plans
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


app.put('/api/admin/subscriptions/:id', authenticateAdmin, async (req, res) => {
    try {
        const subscription = await adminService.updateSubscription(
            req.params.id,
            req.body,
            req.admin.admin_id
        );

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        res.json({
            success: true,
            subscription
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

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

        const subscription = await subscriptionService.getCurrentSubscription(
            user.restaurant_id
        );

        let passwordValid = false;

        if (user.password_hash && user.password_hash.startsWith('$2')) {
            passwordValid = await bcrypt.compare(password, user.password_hash);
        } else {
            passwordValid = user.password_hash === password;
        }

        if (!passwordValid) {
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
                logo_url: user.logo_url,
                plan_name: subscription?.plan_name || 'غير محددة'
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

// Current Subscription
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
            AND s.status = 'active'
        ORDER BY s.created_at DESC
        LIMIT 1
        `,
        [restaurantId]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
}

app.get('/api/subscription', authenticate, async (req, res) => {
    try {
        const summary = await subscriptionService.getSubscriptionSummary(
            req.user.restaurant_id
        );

        if (!summary.ok) {
            return res.status(404).json({
                success: false,
                message: summary.message
            });
        }

        res.json({
            success: true,
            subscription: summary
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Delete Old Image if Changeed
async function deleteImageFromStorage(imageUrl) {
    if (!imageUrl) return;

    try {
        const bucket = process.env.SUPABASE_BUCKET;
        const marker = `/storage/v1/object/public/${bucket}/`;

        const index = imageUrl.indexOf(marker);

        if (index === -1) return;

        const filePath = imageUrl.substring(index + marker.length);

        await supabase.storage
            .from(bucket)
            .remove([filePath]);

        console.log('Deleted old image:', filePath);

    } catch (error) {
        console.error('Delete image error:', error.message);
    }
}

// Add Products
app.post('/api/products', authenticate, async (req, res) => {
    try {
        const {
            name,
            price,
            image_url,
            is_visible
        } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Product name is required'
            });
        }

        const productCheck = await subscriptionService.canAddProduct(
            req.user.restaurant_id
        );

        if (!productCheck.ok) {
            return res.status(403).json({
                success: false,
                message: productCheck.message
            });
        }

        const result = await db.query(
            `
            INSERT INTO products
            (
                restaurant_id,
                name,
                price,
                image_url,
                is_visible
            )
            VALUES
            ($1,$2,$3,$4,$5)
            RETURNING *
            `,
            [
                req.user.restaurant_id,
                name,
                price || 0,
                image_url || null
            ]
        );

        res.json({
            success: true,
            product: result.rows[0]
        });

    } catch (error) {
        console.error('Add product error:', error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get Products
app.get('/api/products', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            `
            SELECT
                p.id,
                p.restaurant_id,
                p.name,
                p.price,
                p.image_url,
                p.created_at,
                p.is_visible,
                ROUND(AVG(r.rating), 2) AS avg_rating,
                ROUND(AVG(r.taste_rating), 2) AS avg_taste,
                ROUND(AVG(r.presentation_rating), 2) AS avg_presentation,
                ROUND(AVG(r.price_rating), 2) AS avg_price,
                COUNT(r.id) AS total_reviews
            FROM products p
            LEFT JOIN reviews r
                ON r.product_id = p.id
            WHERE p.restaurant_id = $1
            GROUP BY p.id
            ORDER BY avg_rating DESC NULLS LAST, total_reviews DESC
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

app.put('/api/products/:id', authenticate, async (req, res) => {
    try {
        const {
            name,
            price,
            image_url
        } = req.body;

        const is_visible =
            req.body.is_visible === true ||
            req.body.is_visible === 'true';

        const oldProduct = await db.query(
            `
            SELECT image_url
            FROM products
            WHERE id = $1
            AND restaurant_id = $2
            `,
            [
                req.params.id,
                req.user.restaurant_id
            ]
        );

        const result = await db.query(
            `
            UPDATE products
            SET
                name = $1,
                price = $2,
                image_url = $3,
                is_visible = $4
            WHERE id = $5
            AND restaurant_id = $6
            RETURNING *
            `,
            [
                name,
                price,
                image_url,
                is_visible,
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

        if (
            oldProduct.rows.length > 0 &&
            oldProduct.rows[0].image_url &&
            image_url &&
            oldProduct.rows[0].image_url !== image_url
        ) {
            await deleteImageFromStorage(oldProduct.rows[0].image_url);
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

        const oldRestaurant = await db.query(
            `
            SELECT logo_url
            FROM restaurants
            WHERE id = $1
            `,
            [req.user.restaurant_id]
        );

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

        if (
            oldRestaurant.rows.length > 0 &&
            oldRestaurant.rows[0].logo_url &&
            logo_url &&
            oldRestaurant.rows[0].logo_url !== logo_url
        ) {
            await deleteImageFromStorage(oldRestaurant.rows[0].logo_url);
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

// add review
app.post('/api/products/:id/reviews', async (req, res) => {
    try {
        const {
            taste_rating,
            presentation_rating,
            price_rating,
            comment,
            customer_name,
            visit_date,
            branch_id
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
                visit_date,
                branch_id
            )
            VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8,$9)
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
                visit_date || null,
                branch_id || null
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
            AND p.is_visible = true
            GROUP BY p.id
            ORDER BY p.created_at DESC
            `,
            [restaurant.id]
        );

        const branchesResult = await db.query(
            `
            SELECT
                id,
                name,
                address,
                google_maps_url
            FROM branches
            WHERE restaurant_id = $1
            AND is_active = true
            ORDER BY created_at ASC
            `,
            [restaurant.id]
        );

        res.json({
            success: true,
            restaurant,
            products: productsResult.rows,
            branches: branchesResult.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// get reviews for restaurant owner
app.get('/api/products/:id/reviews', authenticate, async (req, res) => {
    try {
        const { period = 'all', sort = 'newest' } = req.query;

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

        let dateFilter = '';

        if (period === 'week') {
            dateFilter = "AND created_at >= NOW() - INTERVAL '7 days'";
        } else if (period === 'month') {
            dateFilter = "AND created_at >= NOW() - INTERVAL '30 days'";
        } else if (period === 'three_months') {
            dateFilter = "AND created_at >= NOW() - INTERVAL '90 days'";
        }

        let orderBy = 'created_at DESC';

        if (sort === 'highest') {
            orderBy = 'rating DESC, created_at DESC';
        } else if (sort === 'lowest') {
            orderBy = 'rating ASC, created_at DESC';
        }

        const result = await db.query(
            `
            SELECT
                r.id,
                r.customer_name,
                r.taste_rating,
                r.presentation_rating,
                r.price_rating,
                r.rating,
                r.comment,
                r.visit_date,
                r.created_at,
                b.name AS branch_name
            FROM reviews r
            LEFT JOIN branches b
                ON b.id = r.branch_id
            WHERE r.product_id = $1
            ${dateFilter}
            ORDER BY ${orderBy}
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

// Dashboard
app.get('/api/dashboard/stats', authenticate, async (req, res) => {
    try {
        const restaurantId = req.user.restaurant_id;

        const stats = await db.query(
            `
            SELECT
                COUNT(DISTINCT p.id) AS total_products,
                COUNT(r.id) AS total_reviews,
                ROUND(AVG(r.rating), 2) AS avg_rating,
                ROUND(AVG(r.taste_rating), 2) AS avg_taste,
                ROUND(AVG(r.presentation_rating), 2) AS avg_presentation,
                ROUND(AVG(r.price_rating), 2) AS avg_price
            FROM products p
            LEFT JOIN reviews r
                ON r.product_id = p.id
            WHERE p.restaurant_id = $1
            `,
            [restaurantId]
        );

        const bestProduct = await db.query(
            `
            SELECT
                p.name,
                ROUND(AVG(r.rating),2) AS avg_rating
            FROM products p
            JOIN reviews r
                ON r.product_id = p.id
            WHERE p.restaurant_id = $1
            GROUP BY p.id,p.name
            ORDER BY AVG(r.rating) DESC
            LIMIT 1
            `,
            [restaurantId]
        );

        res.json({
            success: true,
            stats: stats.rows[0],
            bestProduct: bestProduct.rows[0] || null
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/dashboard/branch-stats', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            `
            SELECT
                b.id,
                b.name,
                COUNT(r.id) AS total_reviews,
                ROUND(AVG(r.rating), 2) AS avg_rating,
                ROUND(AVG(r.taste_rating), 2) AS avg_taste,
                ROUND(AVG(r.presentation_rating), 2) AS avg_presentation,
                ROUND(AVG(r.price_rating), 2) AS avg_price
            FROM branches b
            LEFT JOIN reviews r
                ON r.branch_id = b.id
            WHERE b.restaurant_id = $1
            GROUP BY b.id, b.name
            ORDER BY avg_rating DESC NULLS LAST, total_reviews DESC
            `,
            [req.user.restaurant_id]
        );

        res.json({
            success: true,
            branches: result.rows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Upload Image
app.post('/api/upload-image', authenticate, upload.single('image'), async (req, res) => {
    try {
        console.log('Upload request received');
        console.log('Bucket:', process.env.SUPABASE_BUCKET);
        console.log('File:', req.file ? req.file.originalname : 'NO FILE');

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image uploaded'
            });
        }

        const safeFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
        const fileName = `${req.user.restaurant_id}/products/${safeFileName}`;

        const compressedImage = await sharp(req.file.buffer)
            .resize({
                width: 1200,
                withoutEnlargement: true
            })
            .webp({
                quality: 80
            })
            .toBuffer();

        console.log('Uploading to path:', fileName);

        const { data: uploadData, error } = await supabase.storage
            .from(process.env.SUPABASE_BUCKET)
            .upload(fileName, compressedImage, {
                contentType: 'image/webp',
                upsert: false
            });

        console.log('Upload data:', uploadData);
        console.log('Upload error:', error);

        if (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }

        const { data } = supabase.storage
            .from(process.env.SUPABASE_BUCKET)
            .getPublicUrl(fileName);

        res.json({
            success: true,
            url: data.publicUrl
        });

    } catch (error) {
        console.error('Upload image error:', error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Register
app.post('/api/register', async (req, res) => {
    try {
        const {
            restaurant_name,
            phone,
            email,
            password,
            plan_name
        } = req.body;

        if (!restaurant_name || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'Restaurant name, phone and password are required'
            });
        }

        const selectedPlanName = plan_name || 'basic';
        const existingUser = await db.query(
            `
            SELECT id
            FROM users
            WHERE phone = $1
            OR email = $2
            `,
            [
                phone,
                email || null
            ]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Phone or email already exists'
            });
        }

        const slug =
            'restaurant-' + Date.now();

        const restaurantResult = await db.query(
            `
            INSERT INTO restaurants
            (
                name,
                slug,
                phone
            )
            VALUES
            ($1,$2,$3)
            RETURNING *
            `,
            [
                restaurant_name,
                slug,
                phone
            ]
        );

        const restaurant =
            restaurantResult.rows[0];

        const passwordHash =
            await bcrypt.hash(password, 10);

        const userResult = await db.query(
            `
            INSERT INTO users
            (
                restaurant_id,
                email,
                phone,
                password_hash,
                phone_verified
            )
            VALUES
            ($1,$2,$3,$4,$5)
            RETURNING *
            `,
            [
                restaurant.id,
                email || null,
                phone,
                passwordHash,
                false
            ]
        );

        const selectedPlanResult = await db.query(
            `
            SELECT id
            FROM plans
            WHERE name = $1
            AND is_active = true
            LIMIT 1
            `,
            [selectedPlanName]
        );

        if (selectedPlanResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'الباقة المختارة غير صحيحة'
            });
        }

        await db.query(
            `
                INSERT INTO subscriptions
                (
                    restaurant_id,
                    plan_id,
                    status,
                    starts_at,
                    ends_at
                )
                VALUES
                ($1,$2,$3,NOW(),NOW() + INTERVAL '1 year')
                `,
            [
                restaurant.id,
                selectedPlanResult.rows[0].id,
                'active'
            ]
        );

        const user =
            userResult.rows[0];

        const token = jwt.sign(
            {
                user_id: user.id,
                restaurant_id: restaurant.id
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
                restaurant_id: restaurant.id,
                restaurant_name: restaurant.name,
                slug: restaurant.slug,
                logo_url: restaurant.logo_url
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

// Branches
app.get('/api/branches', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            `
            SELECT *
            FROM branches
            WHERE restaurant_id = $1
            ORDER BY created_at DESC
            `,
            [req.user.restaurant_id]
        );

        res.json({
            success: true,
            branches: result.rows
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


app.post('/api/branches', authenticate, async (req, res) => {
    try {
        const {
            name,
            address,
            google_maps_url
        } = req.body;

        const branchCheck = await subscriptionService.canAddBranch(
            req.user.restaurant_id
        );

        if (!branchCheck.ok) {
            return res.status(403).json({
                success: false,
                message: branchCheck.message
            });
        }

        const result = await db.query(
            `
            INSERT INTO branches
            (
                restaurant_id,
                name,
                address,
                google_maps_url
            )
            VALUES
            ($1,$2,$3,$4)
            RETURNING *
            `,
            [
                req.user.restaurant_id,
                name,
                address || null,
                google_maps_url || null
            ]
        );

        res.json({
            success: true,
            branch: result.rows[0]
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


app.delete('/api/branches/:id', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            `
            DELETE FROM branches
            WHERE id = $1
            AND restaurant_id = $2
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
                message: 'Branch not found'
            });
        }

        res.json({
            success: true
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/admin/restaurants/:id/activity', authenticateAdmin, async (req, res) => {
    try {
        const logs = await adminService.getRestaurantActivityLogs(req.params.id);

        res.json({
            success: true,
            logs
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.put('/api/admin/plans/:id', authenticateAdmin, async (req, res) => {
    try {
        const plan = await adminService.updatePlan(
            req.params.id,
            req.body
        );

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        res.json({
            success: true,
            plan
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/admin/subscriptions/:id/invoice', authenticateAdmin, async (req, res) => {
    try {
        const result = await db.query(
            `
      SELECT
        s.id AS subscription_id,
        s.starts_at,
        s.ends_at,
        s.payment_status,
        s.payment_reference,

        r.name AS restaurant_name,
        r.phone AS restaurant_phone,

        u.phone AS user_phone,

        p.name AS plan_name,
        p.price
      FROM subscriptions s
      JOIN restaurants r
        ON r.id = s.restaurant_id
      LEFT JOIN users u
        ON u.restaurant_id = r.id
      JOIN plans p
        ON p.id = s.plan_id
      WHERE s.id = $1
      `,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        const inv = result.rows[0];

        const invoiceNo =
            'INV-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-6);

        const html = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            direction: rtl;
            padding: 40px;
            color: #111827;
          }

          .header {
            text-align: center;
            margin-bottom: 30px;
          }

          .brand {
            color: #f59e0b;
            font-size: 28px;
            font-weight: bold;
          }

          .box {
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            padding: 20px;
            margin-bottom: 20px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }

          th, td {
            border: 1px solid #e5e7eb;
            padding: 12px;
            text-align: right;
          }

          th {
            background: #f9fafb;
          }

          .total {
            font-size: 22px;
            font-weight: bold;
            color: #f59e0b;
            text-align: left;
            margin-top: 20px;
          }

          .footer {
            margin-top: 40px;
            text-align: center;
            color: #6b7280;
            font-size: 13px;
          }
        </style>
      </head>

      <body>
        <div class="header">
          <div class="brand">Rate Me قيمني</div>
          <h2>فاتورة اشتراك</h2>
          <p>رقم الفاتورة: ${invoiceNo}</p>
          <p>تاريخ الإصدار: ${new Date().toLocaleDateString('ar-LY')}</p>
        </div>

        <div class="box">
          <h3>بيانات العميل</h3>
          <p><strong>المطعم:</strong> ${inv.restaurant_name}</p>
          <p><strong>رقم الهاتف:</strong> ${inv.user_phone || inv.restaurant_phone || '-'}</p>
        </div>

        <div class="box">
          <h3>تفاصيل الاشتراك</h3>

          <table>
            <thead>
              <tr>
                <th>الباقة</th>
                <th>بداية الاشتراك</th>
                <th>نهاية الاشتراك</th>
                <th>طريقة الدفع</th>
                <th>المبلغ</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>${inv.plan_name}</td>
                <td>${inv.starts_at ? String(inv.starts_at).slice(0, 10) : '-'}</td>
                <td>${inv.ends_at ? String(inv.ends_at).slice(0, 10) : '-'}</td>
                <td>كاش</td>
                <td>${Number(inv.price).toFixed(2)} د.ل</td>
              </tr>
            </tbody>
          </table>

          <div class="total">
            الإجمالي: ${Number(inv.price).toFixed(2)} د.ل
          </div>
        </div>

        <div class="box">
          <h3>ملاحظات</h3>
          <p>هذه الفاتورة صادرة مقابل اشتراك سنوي في منصة Rate Me.</p>
          <p>حالة الدفع الحالية: ${inv.payment_status === 'paid' ? 'مدفوع' : 'بانتظار الدفع'}</p>
          <p>مرجع الدفع: ${inv.payment_reference || '-'}</p>
        </div>

        <div class="footer">
          Rate Me قيمني - منصة تقييم المطاعم
        </div>
      </body>
      </html>
    `;

        const browser = await puppeteer.launch({
            headless: true,
            executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '15mm',
                bottom: '20mm',
                left: '15mm'
            }
        });

        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="rateme-invoice-${invoiceNo}.pdf"`
        );

        res.send(pdfBuffer);

    } catch (error) {
        console.error(error);
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