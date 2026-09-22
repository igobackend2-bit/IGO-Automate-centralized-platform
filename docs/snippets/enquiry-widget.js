/**
 * IGO Automate — enquiry form greeting trigger.
 *
 * Drop this on any of the 28 brand websites. It runs ALONGSIDE whatever the
 * site's form already does (its own backend save, redirect, etc.) — it
 * does not call preventDefault() or interfere with existing behavior. It
 * just also reports the enquiry to IGO Automate so the instant WhatsApp +
 * email + SMS greeting fires.
 *
 * Usage — put this on the enquiry form's page:
 *
 *   <script
 *     src="https://automate.igogroups.com/widget/enquiry-widget.js"
 *     data-api-base="https://automate.igogroups.com"
 *     data-brand-slug="igo-mushroom"
 *     data-public-api-key="REPLACE_WITH_THIS_BRANDS_KEY"
 *     data-form-selector="#enquiry-form"
 *     data-field-name="name"
 *     data-field-phone="phone"
 *     data-field-email="email"
 *   ></script>
 *
 * Only data-form-selector, data-brand-slug, and data-public-api-key are
 * required. Field name/phone/email attributes default to "name", "phone",
 * "email" — set them only if the site's form uses different field names.
 * The public_api_key is low-privilege by design (see
 * supabase/migrations/0013_brands.sql) — it can only create enquiries
 * tagged to this one brand, safe to ship in public page source.
 */
(function () {
  var script = document.currentScript;
  if (!script) return;

  var config = {
    apiBase: script.getAttribute('data-api-base') || '',
    brandSlug: script.getAttribute('data-brand-slug') || '',
    publicApiKey: script.getAttribute('data-public-api-key') || '',
    formSelector: script.getAttribute('data-form-selector') || 'form',
    fieldName: script.getAttribute('data-field-name') || 'name',
    fieldPhone: script.getAttribute('data-field-phone') || 'phone',
    fieldEmail: script.getAttribute('data-field-email') || 'email',
  };

  if (!config.apiBase || !config.brandSlug || !config.publicApiKey) {
    console.warn('[igo-automate] enquiry widget missing required data-* attributes; not attaching.');
    return;
  }

  function fieldValue(form, name) {
    var el = form.querySelector('[name="' + name + '"]');
    return el ? el.value : '';
  }

  function reportEnquiry(form) {
    var payload = {
      brand_slug: config.brandSlug,
      public_api_key: config.publicApiKey,
      name: fieldValue(form, config.fieldName),
      phone: fieldValue(form, config.fieldPhone),
      email: fieldValue(form, config.fieldEmail),
    };

    if (!payload.phone) return; // phone is required server-side; nothing to report without it

    // keepalive lets the request survive the page navigation a form submit
    // usually triggers — without it, the browser can cancel the request
    // before it ever reaches the server.
    fetch(config.apiBase + '/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(function (err) {
      console.warn('[igo-automate] enquiry report failed (site behavior unaffected):', err);
    });
  }

  function attach() {
    var form = document.querySelector(config.formSelector);
    if (!form) {
      console.warn('[igo-automate] form not found for selector: ' + config.formSelector);
      return;
    }
    // Deliberately not preventDefault — this fires alongside whatever the
    // form already does.
    form.addEventListener('submit', function () {
      reportEnquiry(form);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }
})();
