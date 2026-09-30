# LP 1 Mês em 1 Dia — Público Frio

Template técnico da segunda landing page da Imersão 1 Mês em 1 Dia.

## Escopo atual
- sem copy comercial definitiva;
- mobile first;
- Meta Pixel `1248784553899062` com `PageView` na entrada e `Lead` somente após confirmação HTTP 2xx do CRM;
- formulário Nome + WhatsApp, sem máscara JavaScript;
- captura de `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `utm_id`;
- CRM: webhook atual da Freire Educação;
- atribuição: Supabase `page_key = 1mes1dia_frio` via `capture-lp-attribution-frio`;
- WhatsApp após confirmação do CRM;
- Clarity preparado, porém sem Project ID até criação do projeto separado.

## Cloudflare Pages
Build command: `npm run build`
Build output directory: `dist`
Functions directory: `functions`

## Clarity
Quando o projeto separado for criado, inserir o Project ID em:

```html
<meta name="clarity-project-id" content="SEU_PROJECT_ID">
```

Eventos preparados: `cta_click`, `form_open`, `lead_submit_success`, `testimonial_video_play`.

## Segurança
Nenhum secret deve ser commitado. Use Cloudflare Pages > Settings > Variables and Secrets para qualquer segredo futuro.
