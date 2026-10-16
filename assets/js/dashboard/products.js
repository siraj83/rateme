(function initializeProductsModule() {

    let allProducts = [];
    let editingProductId = null;

    const productModal =
        document.getElementById('productModal');

    const confirmModal =
        document.getElementById('confirmModal');


    async function loadProducts() {
        try {
            const token =
                localStorage.getItem('token');

            const res = await fetch(
                '/api/products',
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            const data =
                await res.json();

            if (!res.ok || !data.success) {
                showToast(
                    data.message ||
                    data.error ||
                    getMessage(
                        'PRODUCTS.LOAD_ERROR',
                        'تعذر تحميل المنتجات.'
                    ),
                    'error'
                );

                return;
            }

            allProducts =
                (data.products || []).map(
                    product => ({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.image_url,
                        avg_rating:
                            product.avg_rating,
                        avg_taste:
                            product.avg_taste,
                        avg_presentation:
                            product.avg_presentation,
                        avg_price:
                            product.avg_price,
                        total_reviews:
                            product.total_reviews,
                        is_visible:
                            product.is_visible
                    })
                );

            if (window.RateMeApp?.state) {
                window.RateMeApp.state.allProducts =
                    allProducts;
            }

            renderProductsTable();

        } catch (error) {
            console.error(
                'Load products error:',
                error
            );

            showToast(
                getMessage(
                    'PRODUCTS.LOAD_ERROR',
                    'تعذر تحميل المنتجات.'
                ),
                'error'
            );
        }
    }


    function getPerformanceBadge(product) {
        if (
            Number(product.total_reviews || 0) === 0
        ) {
            return `
                <span class="badge neutral">
                    لا توجد تقييمات
                </span>
            `;
        }

        if (
            Number(product.avg_rating) >= 4.5
        ) {
            return `
                <span class="badge good">
                    🏆 ممتاز
                </span>
            `;
        }

        if (
            Number(product.avg_rating) >= 3.5
        ) {
            return `
                <span class="badge ok">
                    جيد
                </span>
            `;
        }

        return `
            <span class="badge bad">
                ⚠ يحتاج تحسين
            </span>
        `;
    }


    function renderProductsTable() {
        const tbody =
            document.getElementById(
                'productsTableBody'
            );

        if (!tbody) {
            return;
        }

        tbody.innerHTML = '';

        allProducts.forEach(product => {
            const row =
                document.createElement('tr');

            const performanceBadge =
                getPerformanceBadge(product);

            row.innerHTML = `
                <td>
                    <img
                        src="${product.image ||
                'https://via.placeholder.com/50'
                }"
                        alt="طبق"
                    >
                </td>

                <td>
                    ${product.name}
                    <br>
                    ${performanceBadge}
                </td>

                <td>
                    ${product.price || 0} د.ل
                </td>

                <td>
                    ⭐ ${product.avg_rating || '0.0'}
                    <br>

                    <small>
                        ${product.total_reviews || 0}
                        تقييم
                    </small>
                </td>

                <td>
                    🍽 ${product.avg_taste || '-'} |
                    🎨 ${product.avg_presentation || '-'} |
                    💰 ${product.avg_price || '-'}
                </td>

                <td>
                    ${product.is_visible
                    ? `
                                <span class="status-badge visible">
                                    🟢 ظاهر
                                </span>
                            `
                    : `
                                <span class="status-badge hidden">
                                    ⚫ مخفي
                                </span>
                            `
                }
                </td>

                <td class="actions">
                    <button
                        class="edit-btn"
                        onclick="openEditModal('${product.id}')"
                    >
                        تعديل
                    </button>

                    <button
                        class="delete-btn"
                        onclick="deleteProduct('${product.id}')"
                    >
                        حذف
                    </button>

                    <button
                        class="btn"
                        onclick="showReviews('${product.id}')"
                        style="margin-top:5px;"
                    >
                        التقييمات
                    </button>
                </td>
            `;

            tbody.appendChild(row);
        });

        renderProductsMobile();
    }


    function renderProductsMobile() {
        const container =
            document.getElementById(
                'productsMobileList'
            );

        if (!container) {
            return;
        }

        container.innerHTML = '';

        if (!allProducts.length) {
            container.innerHTML = `
                <div class="mobile-product-card">
                    لا توجد منتجات حالياً
                </div>
            `;

            return;
        }

        allProducts.forEach(product => {
            const performanceBadge =
                getPerformanceBadge(product);

            const card =
                document.createElement('div');

            card.className =
                'mobile-product-card';

            card.innerHTML = `
                <div class="mobile-product-top">

                    <img
                        src="${product.image ||
                'https://via.placeholder.com/80'
                }"
                        alt="${product.name}"
                    >

                    <div class="mobile-product-info">

                        <h3>
                            ${product.name}
                        </h3>

                        ${product.is_visible
                    ? `
                                    <span class="status-badge visible">
                                        ظاهر
                                    </span>
                                `
                    : `
                                    <span class="status-badge hidden">
                                        مخفي
                                    </span>
                                `
                }

                        <p>
                            ${product.price || 0}
                            د.ل
                        </p>

                        ${performanceBadge}

                    </div>
                </div>

                <div class="mobile-product-rating">

                    <div>
                        ⭐ ${product.avg_rating || '0.0'}
                    </div>

                    <div>
                        ${product.total_reviews || 0}
                        تقييم
                    </div>

                    <small>
                        🍽 ${product.avg_taste || '-'} |
                        🎨 ${product.avg_presentation || '-'} |
                        💰 ${product.avg_price || '-'}
                    </small>

                </div>

                <div class="mobile-product-actions">

                    <button
                        class="edit-btn"
                        onclick="openEditModal('${product.id}')"
                    >
                        تعديل
                    </button>

                    <button
                        class="delete-btn"
                        onclick="deleteProduct('${product.id}')"
                    >
                        حذف
                    </button>

                    <button
                        class="btn"
                        onclick="showReviews('${product.id}')"
                    >
                        التقييمات
                    </button>

                </div>
            `;

            container.appendChild(card);
        });
    }


    function openProductModal() {
        if (!productModal) {
            return;
        }

        productModal.style.display =
            'flex';

        setTimeout(() => {
            productModal.classList.add(
                'show'
            );
        }, 10);
    }


    function closeProductModal() {
        if (!productModal) {
            return;
        }

        productModal.classList.remove(
            'show'
        );

        setTimeout(() => {
            productModal.style.display =
                'none';
        }, 300);
    }


    function startAddProduct() {
        const form =
            document.getElementById(
                'productForm'
            );

        form?.reset();

        editingProductId = null;

        if (window.RateMeApp?.state) {
            window.RateMeApp.state.editingProductId =
                null;
        }

        const title =
            document.getElementById(
                'modalTitle'
            );

        if (title) {
            title.innerText =
                'إضافة منتج جديد';
        }

        openProductModal();
    }


    function openEditModal(id) {
        const product =
            allProducts.find(
                item => item.id === id
            );

        if (!product) {
            return;
        }

        const name =
            document.getElementById(
                'prodName'
            );

        const price =
            document.getElementById(
                'prodPrice'
            );

        const image =
            document.getElementById(
                'prodImage'
            );

        const visible =
            document.getElementById(
                'productVisible'
            );

        if (name) {
            name.value =
                product.name || '';
        }

        if (price) {
            price.value =
                product.price || '';
        }

        if (image) {
            image.value =
                product.image || '';
        }

        if (visible) {
            visible.checked =
                product.is_visible !== false;
        }

        editingProductId = id;

        if (window.RateMeApp?.state) {
            window.RateMeApp.state.editingProductId =
                id;
        }

        const title =
            document.getElementById(
                'modalTitle'
            );

        if (title) {
            title.innerText =
                'تعديل المنتج';
        }

        openProductModal();
    }


    async function saveProduct(event) {
        event.preventDefault();

        const form =
            event.currentTarget;

        const button =
            form.querySelector(
                'button[type="submit"]'
            );

        const originalButtonContent =
            button?.innerHTML;

        const isEditing =
            Boolean(editingProductId);

        try {
            if (button) {
                button.disabled = true;

                button.innerHTML = `
                    <i class="fas fa-spinner fa-spin"></i>
                    جاري الحفظ...
                `;
            }

            const token =
                localStorage.getItem('token');

            const uploadedImageUrl =
                await uploadImage(
                    'prodImageFile'
                );

            const payload = {
                name:
                    document
                        .getElementById(
                            'prodName'
                        )
                        ?.value
                        .trim() || '',

                price:
                    document
                        .getElementById(
                            'prodPrice'
                        )
                        ?.value || 0,

                image_url:
                    uploadedImageUrl ||
                    document
                        .getElementById(
                            'prodImage'
                        )
                        ?.value ||
                    null,

                is_visible:
                    document
                        .getElementById(
                            'productVisible'
                        )
                        ?.checked !== false
            };

            const url =
                isEditing
                    ? `/api/products/${editingProductId}`
                    : '/api/products';

            const method =
                isEditing
                    ? 'PUT'
                    : 'POST';

            const response =
                await fetch(
                    url,
                    {
                        method,

                        headers: {
                            'Content-Type':
                                'application/json',

                            Authorization:
                                `Bearer ${token}`
                        },

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                showToast(
                    data.message ||
                    data.error ||
                    getMessage(
                        'PRODUCTS.SAVE_ERROR',
                        'تعذر حفظ المنتج.'
                    ),
                    'error'
                );

                return;
            }

            showToast(
                isEditing
                    ? getMessage(
                        'SUCCESS.UPDATED',
                        'تم التعديل بنجاح.'
                    )
                    : getMessage(
                        'SUCCESS.SAVED',
                        'تم الحفظ بنجاح.'
                    ),
                'success'
            );

            editingProductId = null;

            if (window.RateMeApp?.state) {
                window.RateMeApp.state.editingProductId =
                    null;
            }

            await loadProducts();

            closeProductModal();

        } catch (error) {
            console.error(
                'Save product error:',
                error
            );

            showToast(
                getMessage(
                    'PRODUCTS.SAVE_ERROR',
                    'تعذر حفظ المنتج.'
                ),
                'error'
            );

        } finally {
            if (button) {
                button.disabled = false;
                button.innerHTML =
                    originalButtonContent;
            }
        }
    }


    function deleteProduct(id) {
        if (!confirmModal) {
            return;
        }

        confirmModal.style.display =
            'flex';

        setTimeout(() => {
            confirmModal.classList.add(
                'show'
            );
        }, 10);

        const confirmButton =
            document.getElementById(
                'confirmDeleteBtn'
            );

        if (!confirmButton) {
            return;
        }

        confirmButton.onclick =
            async function () {

                const originalContent =
                    confirmButton.innerHTML;

                confirmButton.disabled =
                    true;

                try {
                    const token =
                        localStorage.getItem(
                            'token'
                        );

                    const response =
                        await fetch(
                            `/api/products/${id}`,
                            {
                                method:
                                    'DELETE',

                                headers: {
                                    Authorization:
                                        `Bearer ${token}`
                                }
                            }
                        );

                    const data =
                        await response.json();

                    if (
                        !response.ok ||
                        !data.success
                    ) {
                        showToast(
                            data.message ||
                            data.error ||
                            getMessage(
                                'PRODUCTS.DELETE_ERROR',
                                'تعذر حذف المنتج.'
                            ),
                            'error'
                        );

                        return;
                    }

                    await loadProducts();

                    showToast(
                        getMessage(
                            'SUCCESS.DELETED',
                            'تم الحذف بنجاح.'
                        ),
                        'success'
                    );

                    closeDeleteModal();

                } catch (error) {
                    console.error(
                        'Delete product error:',
                        error
                    );

                    showToast(
                        getMessage(
                            'PRODUCTS.DELETE_ERROR',
                            'تعذر حذف المنتج.'
                        ),
                        'error'
                    );

                } finally {
                    confirmButton.disabled =
                        false;

                    confirmButton.innerHTML =
                        originalContent;
                }
            };
    }


    function closeDeleteModal() {
        if (!confirmModal) {
            return;
        }

        confirmModal.classList.remove(
            'show'
        );

        setTimeout(() => {
            confirmModal.style.display =
                'none';
        }, 300);
    }


    document
        .getElementById('addProductBtn')
        ?.addEventListener(
            'click',
            startAddProduct
        );

    document
        .getElementById('closeModal')
        ?.addEventListener(
            'click',
            closeProductModal
        );

    document
        .getElementById('cancelDelete')
        ?.addEventListener(
            'click',
            closeDeleteModal
        );

    document
        .getElementById('productForm')
        ?.addEventListener(
            'submit',
            saveProduct
        );


    // مطلوبة لأن الأزرار الحالية تستخدم onclick داخل HTML
    window.loadProducts =
        loadProducts;

    window.openEditModal =
        openEditModal;

    window.deleteProduct =
        deleteProduct;

    window.closeModal =
        closeProductModal;


    window.RateMeApp =
        window.RateMeApp || {};

    window.RateMeApp.products = {
        load: loadProducts,
        render: renderProductsTable,
        renderMobile: renderProductsMobile,
        openAdd: startAddProduct,
        openEdit: openEditModal,
        close: closeProductModal,
        remove: deleteProduct
    };

})();