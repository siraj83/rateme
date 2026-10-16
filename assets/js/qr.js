(function () {
    'use strict';

    let qrInstance = null;
    let currentQRData = null;

    const DEFAULT_OPTIONS = {
        width: 320,
        height: 320,
        type: 'canvas',
        margin: 10,

        qrOptions: {
            errorCorrectionLevel: 'H'
        },

        dotsOptions: {
            type: 'rounded',
            color: '#1f2937'
        },

        cornersSquareOptions: {
            type: 'extra-rounded',
            color: '#ff8c00'
        },

        cornersDotOptions: {
            type: 'dot',
            color: '#ff8c00'
        },

        backgroundOptions: {
            color: '#ffffff'
        },

        imageOptions: {
            crossOrigin: 'anonymous',
            margin: 8,
            imageSize: 0.28,
            hideBackgroundDots: true
        }
    };

    function getElement(elementOrId) {
        if (elementOrId instanceof HTMLElement) {
            return elementOrId;
        }

        if (typeof elementOrId === 'string') {
            return document.getElementById(elementOrId);
        }

        return null;
    }

    function createQR({
        container,
        url,
        image = null,
        width = DEFAULT_OPTIONS.width,
        height = DEFAULT_OPTIONS.height
    }) {
        const target = getElement(container);

        if (!target) {
            throw new Error('حاوية QR غير موجودة');
        }

        if (!url) {
            throw new Error('رابط QR غير موجود');
        }

        if (typeof QRCodeStyling === 'undefined') {
            throw new Error('مكتبة QRCodeStyling غير محملة');
        }

        target.innerHTML = '';

        qrInstance = new QRCodeStyling({
            ...DEFAULT_OPTIONS,
            width,
            height,
            data: url,
            image: image || undefined
        });

        qrInstance.append(target);

        currentQRData = {
            url,
            image,
            width,
            height
        };

        return qrInstance;
    }

    function updateQR({
        url,
        image
    } = {}) {
        if (!qrInstance || !currentQRData) {
            throw new Error('لم يتم إنشاء QR بعد');
        }

        currentQRData = {
            ...currentQRData,
            ...(url !== undefined ? { url } : {}),
            ...(image !== undefined ? { image } : {})
        };

        qrInstance.update({
            data: currentQRData.url,
            image: currentQRData.image || undefined
        });
    }

    function downloadQR({
        filename = 'rateme-qr',
        extension = 'png'
    } = {}) {
        if (!qrInstance) {
            throw new Error('لا يوجد QR جاهز للتحميل');
        }

        qrInstance.download({
            name: filename,
            extension
        });
    }

    async function copyCurrentLink() {
        if (!currentQRData?.url) {
            throw new Error('رابط QR غير متاح');
        }

        await navigator.clipboard.writeText(
            currentQRData.url
        );
    }

    function clearQR(container) {
        const target = getElement(container);

        if (target) {
            target.innerHTML = '';
        }

        qrInstance = null;
        currentQRData = null;
    }

    function getCurrentQR() {
        return currentQRData
            ? { ...currentQRData }
            : null;
    }

    window.RateMeQR = {
        create: createQR,
        update: updateQR,
        download: downloadQR,
        copyLink: copyCurrentLink,
        clear: clearQR,
        getCurrent: getCurrentQR
    };
})();