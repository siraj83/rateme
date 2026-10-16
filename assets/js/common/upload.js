(function initializeUploadModule() {

    async function uploadImage(fileInputId) {

        const fileInput =
            document.getElementById(
                fileInputId
            );

        if (
            !fileInput ||
            !fileInput.files ||
            fileInput.files.length === 0
        ) {
            return null;
        }

        const token =
            localStorage.getItem('token');

        if (!token) {
            throw new Error(
                'Authentication token is missing'
            );
        }

        const file =
            fileInput.files[0];

        const formData =
            new FormData();

        formData.append(
            'image',
            file
        );

        try {

            const res = await fetch(
                '/api/upload-image',
                {
                    method: 'POST',

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    },

                    body:
                        formData
                }
            );

            let data = null;

            try {
                data =
                    await res.json();
            } catch {
                data = null;
            }

            if (
                !res.ok ||
                !data?.success
            ) {
                throw new Error(
                    data?.message ||
                    data?.error ||
                    'فشل رفع الصورة'
                );
            }

            if (!data.url) {
                throw new Error(
                    'لم يتم إرجاع رابط الصورة'
                );
            }

            return data.url;

        } catch (error) {

            console.error(
                'Upload image error:',
                error
            );

            throw error;
        }
    }


    /*
     * للتوافق مع restaurant.js
     * و products.js الحاليين.
     */
    window.uploadImage =
        uploadImage;


    window.RateMeApp =
        window.RateMeApp || {};

    window.RateMeApp.upload = {
        image:
            uploadImage
    };

})();