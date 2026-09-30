const CRM_WEBHOOK_URL = 'https://wh.upviewcrm.com/api/webhooks/inbound/lead/freire-educacao/lp-imersao-luis';
const ATTRIBUTION_URL = 'https://xtiagbrqakritwkpplyz.supabase.co/functions/v1/capture-lp-attribution-frio';
const PAGE_KEY = '1mes1dia_frio';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  }
});

const clean = (value, max = 500) => String(value ?? '').trim().slice(0, max);

export async function onRequestPost(context) {
  let data;
  try {
    data = await context.request.json();
  } catch {
    return json({ ok: false, error: 'Payload inválido' }, 400);
  }

  const nome = clean(data?.nome, 160);
  const telefone = clean(data?.telefone, 80);
  if (!nome || !telefone) return json({ ok: false, error: 'Nome e WhatsApp são obrigatórios' }, 400);

  const crmPayload = {
    nome,
    telefone,
    utm_source: clean(data?.utm_source, 300),
    utm_medium: clean(data?.utm_medium, 300),
    utm_campaign: clean(data?.utm_campaign, 500)
  };

  const attributionPayload = {
    event_id: crypto.randomUUID(),
    page_key: PAGE_KEY,
    utm_source: crmPayload.utm_source,
    utm_medium: crmPayload.utm_medium,
    utm_campaign: crmPayload.utm_campaign,
    utm_content: clean(data?.utm_content, 500),
    utm_term: clean(data?.utm_term, 500),
    utm_id: clean(data?.utm_id, 200)
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const upstream = await fetch(CRM_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*'
      },
      body: JSON.stringify(crmPayload),
      signal: controller.signal
    });

    if (!upstream.ok) {
      return json({ ok: false, status: upstream.status, error: 'O CRM não confirmou o recebimento do lead' }, 502);
    }

    attributionPayload.crm_status = upstream.status;
    context.waitUntil(
      fetch(ATTRIBUTION_URL, {
        method: 'POST',
        headers: {'Content-Type':'application/json','Accept':'application/json'},
        body: JSON.stringify(attributionPayload)
      }).catch(() => {})
    );

    return json({ ok: true, status: upstream.status });
  } catch (error) {
    return json({
      ok: false,
      error: error?.name === 'AbortError' ? 'Tempo limite ao enviar o lead' : 'Não foi possível enviar o lead ao CRM'
    }, 502);
  } finally {
    clearTimeout(timeout);
  }
}

export function onRequest(context) {
  if (context.request.method !== 'POST') return json({ ok: false, error: 'Método não permitido' }, 405);
  return onRequestPost(context);
}
