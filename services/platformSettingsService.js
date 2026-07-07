const db = require('../db');

async function getSettings() {
  const result = await db.query(`
    SELECT *
    FROM platform_settings
    ORDER BY created_at ASC
    LIMIT 1
  `);

  return result.rows[0] || null;
}

async function updateSettings(data) {
  const current = await getSettings();

  if (!current) {
    const result = await db.query(
      `
      INSERT INTO platform_settings
      (
        platform_name,
        platform_name_ar,
        logo_url,
        website,
        email,
        phone,
        whatsapp,
        address,
        currency,
        currency_code,
        invoice_prefix,
        invoice_footer,
        trial_days
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
      `,
      [
        data.platform_name || 'Rate Me',
        data.platform_name_ar || 'قيمني',
        data.logo_url || null,
        data.website || null,
        data.email || null,
        data.phone || null,
        data.whatsapp || null,
        data.address || null,
        data.currency || 'د.ل',
        data.currency_code || 'LYD',
        data.invoice_prefix || 'INV',
        data.invoice_footer || null,
        data.trial_days || 7
      ]
    );

    return result.rows[0];
  }

  const result = await db.query(
    `
    UPDATE platform_settings
    SET
      platform_name = $1,
      platform_name_ar = $2,
      logo_url = $3,
      website = $4,
      email = $5,
      phone = $6,
      whatsapp = $7,
      address = $8,
      currency = $9,
      currency_code = $10,
      invoice_prefix = $11,
      invoice_footer = $12,
      trial_days = $13,
      updated_at = NOW()
    WHERE id = $14
    RETURNING *
    `,
    [
      data.platform_name,
      data.platform_name_ar,
      data.logo_url,
      data.website,
      data.email,
      data.phone,
      data.whatsapp,
      data.address,
      data.currency,
      data.currency_code,
      data.invoice_prefix,
      data.invoice_footer,
      data.trial_days,
      current.id
    ]
  );

  return result.rows[0];
}

module.exports = {
  getSettings,
  updateSettings
};