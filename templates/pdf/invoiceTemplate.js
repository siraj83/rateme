const fs = require('fs');
const path = require('path');

const regularFontBase64 = fs
  .readFileSync(
    path.join(__dirname, '../../assets/fonts/Tajawal-Regular.ttf')
  )
  .toString('base64');

const boldFontBase64 = fs
  .readFileSync(
    path.join(__dirname, '../../assets/fonts/Tajawal-Bold.ttf')
  )
  .toString('base64');

function formatDate(value) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year} / ${month} / ${day}`;
}

function generateInvoiceTemplate({
  inv,
  settings,
  invoiceNo,
  currency
}) {
  const platformName = settings?.platform_name || 'Rate Me';
  const platformNameAr = settings?.platform_name_ar || 'قيمني';
  const platformLogo = settings?.logo_url || '';
  const website = settings?.website || 'www.rateme.ly';
  const phone = settings?.phone || '0912345678';
  const address = settings?.address || 'طرابلس - ليبيا';
  const invoiceFooter =
    settings?.invoice_footer ||
    'هذه الفاتورة صادرة إلكترونياً من منصة Rate Me.';

  const amount = Number(inv.price || 0).toFixed(2);
  const paymentStatus =
    inv.payment_status === 'paid' ? 'مدفوع' : 'بانتظار الدفع';
  console.log('Invoice logo URL:', platformLogo);

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<style>

  @font-face {
  font-family: 'TajawalInvoice';
  src: url('data:font/truetype;base64,${regularFontBase64}') format('truetype');
  font-style: normal;
  font-weight: 400;
  font-display: block;
}

    @font-face {
      font-family: 'TajawalInvoice';
      src: url('data:font/truetype;base64,${boldFontBase64}') format('truetype');
      font-style: normal;
      font-weight: 700;
      font-display: block;
    }

    html,
    body,
    div,
    span,
    p,
    table,
    thead,
    tbody,
    tr,
    th,
    td,
    h1,
    h2,
    h3,
    strong {
      font-family: 'TajawalInvoice', sans-serif !important;
    }
  
  @page {
    size: A4;
    margin: 0;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: 'TajawalInvoice', sans-serif !important;
    direction: rtl;
    color: #111827;
    background: #ffffff;
  }

  .invoice-page {
    width: 210mm;
    height: 297mm;
    padding: 18mm 16mm 0;
    position: relative;
    overflow: hidden;
    background: #fff;
  }

  .top {
    display: grid;
    grid-template-columns: 1fr 1.5fr 1fr;
    align-items: start;
    gap: 20px;
    border-bottom: 2px solid #f97316;
    padding-bottom: 18px;
  }

  .brand {
    text-align: center;
  }

  .brand img {
    width: 120px;
    height: 90px;
    object-fit: contain;
  }

  .brand-name {
    font-size: 28px;
    font-weight: 900;
    color: #0b224d;
  }

  .brand-ar {
    color: #0b224d;
    font-size: 20px;
    font-weight: 800;
    margin-top: 2px;
  }

  .brand-sub {
    color: #0b224d;
    font-size: 15px;
    margin-top: 8px;
  }

  .invoice-title {
    text-align: center;
  }

  .invoice-title h1 {
    margin: 20px 0 8px;
    font-size: 36px;
    color: #0b224d;
  }

  .invoice-title .label {
    color: #444;
    font-size: 15px;
    margin-bottom: 8px;
  }

  .invoice-no {
    color: #f97316;
    font-size: 25px;
    font-weight: 900;
    direction: ltr;
  }

  .badge-wrap {
    text-align: center;
  }

  .badge {
    width: 112px;
    height: 112px;
    margin: 0 auto;
    border: 8px solid #f97316;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .badge img {
    width: 76px;
    height: 76px;
    object-fit: contain;
  }

  .ribbon {
    width: 42px;
    height: 65px;
    background: #0b224d;
    margin: -4px auto 0;
    clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 72%, 0 100%);
  }

  .issue-date {
    text-align: center;
    margin: 18px 0 18px;
    color: #111827;
    font-size: 16px;
  }

  .cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
    margin-bottom: 18px;
  }

  .card {
    border: 1px solid #d1d5db;
    border-radius: 14px;
    min-height: 165px;
    padding: 22px;
  }

  .card h2 {
    margin: 0 0 22px;
    color: #0b224d;
    font-size: 23px;
    text-align: center;
  }

  .row {
    display: grid;
    grid-template-columns: 110px 1fr;
    gap: 10px;
    margin-bottom: 17px;
    font-size: 17px;
  }

  .row .key {
    color: #111;
    font-weight: 700;
  }

  .row .val {
    color: #111;
  }

  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin-top: 10px;
    overflow: hidden;
    border-radius: 12px;
  }

  th {
    background: #071b3a;
    color: white;
    font-size: 17px;
    padding: 15px 10px;
    border-left: 1px solid #d1d5db;
  }

  td {
    border-left: 1px solid #d1d5db;
    border-bottom: 1px solid #d1d5db;
    padding: 24px 10px;
    text-align: center;
    font-size: 17px;
  }

  th:first-child,
  td:first-child {
    border-right: 1px solid #d1d5db;
  }

  .middle {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 22px;
    margin-top: 22px;
  }

  .total-box {
    border: 1px solid #f97316;
    border-radius: 14px;
    background: #fff7ed;
    padding: 20px;
    text-align: center;
  }

  .total-title {
    color: #0b224d;
    font-weight: 900;
    font-size: 22px;
  }

  .total-amount {
    color: #f97316;
    font-size: 32px;
    font-weight: 900;
    margin-top: 8px;
  }

  .amount-text {
    text-align: center;
    margin-top: 16px;
    line-height: 1.8;
    font-size: 15px;
  }

  .notes {
    border: 1px solid #d1d5db;
    border-radius: 14px;
    padding: 22px;
    min-height: 150px;
    font-size: 17px;
    line-height: 1.9;
  }

  .notes h3 {
    margin: 0 0 12px;
    color: #0b224d;
    font-size: 22px;
  }

  .paid {
    color: #16a34a;
    font-weight: 900;
  }

  .bottom {
    display: grid;
    grid-template-columns: 1fr 1fr;
    margin-top: 24px;
    align-items: end;
  }

  .stamp-area {
    display: flex;
    align-items: center;
    gap: 22px;
  }

  .stamp-circle {
    width: 115px;
    height: 115px;
    border: 4px solid #0b224d;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stamp-circle img {
    width: 76px;
    height: 76px;
    object-fit: contain;
  }

  .stamp-text {
    color: #0b224d;
    font-size: 18px;
    font-weight: 800;
    border-right: 1px solid #d1d5db;
    padding-right: 22px;
  }

  .signature {
    text-align: center;
    color: #0b224d;
    font-weight: 800;
    font-size: 17px;
  }

  .signature-line {
    width: 180px;
    height: 1px;
    background: #f97316;
    margin: 45px auto 0;
  }

  .footer {
    position: absolute;
    bottom: 0;
    right: 0;
    left: 0;
    background: #071b3a;
    color: white;
    height: 25mm;
    display: grid;
    grid-template-columns: 1.2fr 1fr 1fr 1fr;
    align-items: center;
    padding: 0 18mm;
    font-size: 14px;
  }

  .footer-item {
    text-align: center;
  }

  .footer strong {
    color: #fff;
  }

  .orange-corner {
    position: absolute;
    bottom: 25mm;
    right: 0;
    width: 70px;
    height: 70px;
    background: #f97316;
    border-top-left-radius: 100%;
  }
</style>
</head>

<body>
  <div class="invoice-page">

    <div class="top">
      <div class="brand">
        ${platformLogo ? `<img
        src="${platformLogo}"
        crossorigin="anonymous"
        alt="${platformName}"
      />` : ''}
        <div class="brand-name">${platformName}</div>
        <div class="brand-ar">${platformNameAr}</div>
        <div class="brand-sub">منصة تقييم المطاعم</div>
      </div>

      <div class="invoice-title">
        <h1>فاتورة اشتراك</h1>
        <div class="label">رقم الفاتورة</div>
        <div class="invoice-no">${invoiceNo}</div>
      </div>

      <div class="badge-wrap">
        <div class="badge">
          ${platformLogo ? `<img
          src="${platformLogo}"
          crossorigin="anonymous"
          alt="${platformName}"
        />` :
      `<span>${platformName}</span>`}
        </div>
        <div class="ribbon"></div>
      </div>
    </div>

    <div class="issue-date">
      تاريخ الإصدار: ${new Date().toLocaleDateString('ar-LY')}
    </div>

    <div class="cards">
      <div class="card">
        <h2>بيانات العميل</h2>
        <div class="row">
          <div class="key">اسم المطعم:</div>
          <div class="val">${inv.restaurant_name || '-'}</div>
        </div>
        <div class="row">
          <div class="key">رقم الهاتف:</div>
          <div class="val">${inv.user_phone || inv.restaurant_phone || '-'}</div>
        </div>
      </div>

      <div class="card">
        <h2>تفاصيل الاشتراك</h2>
        <div class="row">
          <div class="key">الباقة:</div>
          <div class="val">${inv.plan_name || '-'}</div>
        </div>
        <div class="row">
          <div class="key">بداية الاشتراك:</div>
          <div class="val">${formatDate(inv.starts_at)}</div>
        </div>
        <div class="row">
          <div class="key">نهاية الاشتراك:</div>
          <div class="val">${formatDate(inv.ends_at)}</div>
        </div>
        <div class="row">
          <div class="key">طريقة الدفع:</div>
          <div class="val">كاش</div>
        </div>
        <div class="row">
          <div class="key">مرجع الدفع:</div>
          <div class="val">${inv.payment_reference || '-'}</div>
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>البيان</th>
          <th>المدة</th>
          <th>السعر</th>
          <th>الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>اشتراك سنوي في باقة ${inv.plan_name || '-'}</td>
          <td>سنة واحدة</td>
          <td>${amount} ${currency}</td>
          <td>${amount} ${currency}</td>
        </tr>
      </tbody>
    </table>

    <div class="middle">
      <div>
        <div class="total-box">
          <div class="total-title">الإجمالي الكلي</div>
          <div class="total-amount">${amount} ${currency}</div>
        </div>
      </div>

      <div class="notes">
        <h3>ملاحظات</h3>
        <div>${invoiceFooter}</div>
        <div style="margin-top:12px;">
          حالة الدفع الحالية:
          <span class="paid">${paymentStatus}</span>
        </div>
      </div>
    </div>

    <div class="bottom">
      <div class="stamp-area">
        <div class="stamp-circle">
          ${platformLogo ? `<img
          src="${platformLogo}"
          crossorigin="anonymous"
          alt="${platformName}"
        />` : platformName}
        </div>
        <div class="stamp-text">ختم المنصة</div>
      </div>
      
      <div class="signature">
        توقيع الإدارة
        <div class="signature-line"></div>
      </div>
    </div>

    <div class="orange-corner"></div>

    <div class="footer">
      <div class="footer-item">
        <strong>هذه الفاتورة معتمدة</strong><br>
        وصادرة إلكترونياً من منصة ${platformName}
      </div>
      <div class="footer-item">${website}</div>
      <div class="footer-item">${phone}</div>
      <div class="footer-item">${address}</div>
    </div>

  </div>
</body>
</html>
`;
}

module.exports = generateInvoiceTemplate;