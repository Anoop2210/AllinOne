const GRAPH_API_VERSION = 'v19.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Fetches the full submitted field data for a lead, given the leadgen_id Meta
 * sends in the webhook payload. The webhook itself only tells us "a lead exists",
 * not what the person typed - this call retrieves the actual name/email/phone/etc.
 */
async function fetchLeadDetails(leadgenId, pageAccessToken) {
  const url = `${GRAPH_BASE}/${leadgenId}?access_token=${encodeURIComponent(pageAccessToken)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) {
    throw new Error(`Meta Graph API error: ${data.error.message}`);
  }
  return data; // { id, created_time, field_data: [{name, values}], ad_id, form_id, ... }
}

/**
 * Fetches campaign/ad set/ad names for attribution, given an ad_id from the lead payload.
 * Requires ads_read permission on the token, in addition to leads_retrieval.
 */
async function fetchAdAttribution(adId, accessToken) {
  if (!adId) return {};
  const url = `${GRAPH_BASE}/${adId}?fields=name,adset{name,campaign{name}}&access_token=${encodeURIComponent(accessToken)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.error) return {};
    return {
      adName: data.name,
      adSetName: data.adset?.name,
      campaignName: data.adset?.campaign?.name,
    };
  } catch {
    return {};
  }
}

/**
 * Converts Meta's field_data array into a flat object, e.g.
 * [{name:'full_name', values:['John Doe']}] -> { full_name: 'John Doe' }
 */
function flattenFieldData(fieldData = []) {
  const flat = {};
  for (const field of fieldData) {
    flat[field.name] = field.values?.[0] || '';
  }
  return flat;
}

module.exports = { fetchLeadDetails, fetchAdAttribution, flattenFieldData };