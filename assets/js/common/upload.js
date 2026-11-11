
(function initializeUploadModule() {

    const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

    const ALLOWED_IMAGE_TYPES = [
        'image/jpeg',
        'image/png',
        'image/webp'
    ];

    function createUploadError(message) {
        const error = new Error(message);
        error.isImageUploadError = true;
        return error;
    }

    async function uploadImage(fileInputId) {

        const fileInput =
            document.getElementById(fileInputId);

        if (
            !fileInput ||
            !fileInput.files ||
            fileInput.files.length === 0
        ) {
            return null;
        }

        const file = fileInput.files[0];

        // التحقق من صيغة الصورة
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            throw createUploadError(
                'صيغة الملف غير مدعومة. يرجى اختيار صورة JPG أو PNG أو WEBP.'
            );
        }

        // التحقق من حجم الصورة
        if (file.size > MAX_IMAGE_SIZE) {
            throw createUploadError(
                'حجم الصورة يتجاوز الحد المسموح (5 ميجابايت). يرجى تصغير الصورة والمحاولة مجددًا.'
            );
        }

        if (file.size === 0) {
            throw createUploadError(
                'الملف المحدد فارغ. يرجى اختيار صورة صحيحة.'
            );
        }

        const formData = new FormData();

        formData.append('image', file);

        try {

            const data = await apiRequest(
                '/api/upload-image',
                {
                    method: 'POST',
                    body: formData
                }
            );

            if (!data?.url) {
                throw createUploadError(
                    'تم استقبال الصورة، ولكن لم يتم إرجاع رابطها. يرجى المحاولة مجددًا.'
                );
            }

            return data.url;

        } catch (error) {

            // apiRequest يعالج انتهاء الجلسة تلقائيًا
            if (error?.status === 401) {
                throw error;
            }

            console.error(
                'Upload image error:',
                error
            );

            if (error?.isImageUploadError) {
                throw error;
            }

            let message =
                'تعذر رفع الصورة. يرجى المحاولة مجددًا.';

            switch (error?.status) {

                case 0:
                    message =
                        'تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت ثم أعد المحاولة.';
                    break;

                case 413:
                    message =
                        'حجم الصورة يتجاوز الحد المسموح (5 ميجابايت). يرجى تصغيرها.';
                    break;

                case 415:
                    message =
                        'صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WEBP.';
                    break;

                case 400:
                case 422:
                    message =
                        error.message || message;
                    break;

                default:
                    if (error?.status >= 500) {
                        message =
                            'حدث خطأ في خادم الصور. يرجى المحاولة لاحقًا.';
                    }
                    break;
            }

            throw createUploadError(message);
        }
    }

    /*
     * للتوافق مع restaurant.js
     * و products.js الحاليين.
     */
    window.uploadImage = uploadImage;

    window.RateMeApp =
        window.RateMeApp || {};

    window.RateMeApp.upload = {
        image: uploadImage
    };

})();
