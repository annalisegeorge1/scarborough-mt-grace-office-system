// Cloudflare preview only: public front-end on Workers, existing authenticated
// Render API/staff application forwarded unchanged until a separate backend migration is validated.
const pages = {
  '/': ['Scarborough / Mt. Grace District Office', 'Public information, resident services, community updates, enquiries and contact details.'],
  '/office/': ['Your District Office — Scarborough / Mt. Grace', 'Meet the District Office team, review office information and hours.'],
  '/services/': ['Resident Services — Scarborough / Mt. Grace District Office', 'Find resident services, assistance pathways and guidance.'],
  '/community/': ['Community — Scarborough / Mt. Grace District Office', 'Explore community projects, participation and district information.'],
  '/forms/': ['Forms & Portals — Scarborough / Mt. Grace District Office', 'Find public forms, submit an enquiry and access tracking tools.'],
  '/updates/': ['Updates & Information — Scarborough / Mt. Grace District Office', 'Read published District Office updates, notices and community information.'],
  '/contact/': ['Contact & Enquiries — Scarborough / Mt. Grace District Office', 'Find office hours, reach the office and submit an enquiry.']
};
const noCache = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const esc = text => String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const pathName = raw => {
  if (raw === '/' || raw === '/index.html' || raw === '/index-self-contained.html') return '/';
  const p = '/' + raw.replace(/^\/+|\/+$/g, '') + '/';
  return Object.hasOwn(pages, p) ? p : null;
};
function isBackendPath(path) {
  return path === '/api' || path.startsWith('/api/') || path === '/staff' || path.startsWith('/staff/');
}
async function proxy(request, env) {
  const value = String(env.BACKEND_ORIGIN || '').replace(/\/+$/,'');
  let backend;
  try {
    backend = new URL(value);
    if (backend.protocol !== 'https:' || backend.username || backend.password || backend.search || backend.hash || backend.pathname !== '/') throw Error();
  } catch {
    return new Response('Backend is not configured for this preview.', {status: 503, headers: noCache});
  }
  const requested = new URL(request.url);
  const dest = new URL(requested.pathname + requested.search, backend);
  const forwarded = new Request(dest.toString(), request);
  try {
    const upstream = await fetch(forwarded, {redirect:'manual'});
    const headers = new Headers(upstream.headers);
    const location = headers.get('Location');
    if (location) {
      try {
        const absolute = new URL(location, backend);
        if (absolute.origin === backend.origin) {
          headers.set('Location', requested.origin + absolute.pathname + absolute.search + absolute.hash);
        }
      } catch {}
    }
    headers.set('Cache-Control', 'no-store');
    headers.set('X-Content-Type-Options', 'nosniff');
    if (requested.pathname.startsWith('/staff')) {
      headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    }
    return new Response(upstream.body, {status:upstream.status, statusText:upstream.statusText, headers});
  } catch {
    return new Response('The office backend is temporarily unavailable.', {status:502, headers:noCache});
  }
}
const routeMeta = (path, requestURL, env) => {
  const [title, description] = pages[path];
  const base = String(env.PUBLIC_ORIGIN || requestURL.origin).replace(/\/+$/,'');
  const canonical = base + path;
  const indexable = !requestURL.hostname.endsWith('.workers.dev');
  const tags = [
    '<title>' + esc(title) + '</title>',
    '<meta name="description" content="' + esc(description) + '">',
    '<meta name="robots" content="' + (indexable ? 'index, follow' : 'noindex, nofollow') + '">',
    '<link rel="canonical" href="' + esc(canonical) + '">',
    '<link rel="alternate" hreflang="en-TT" href="' + esc(canonical) + '">',
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="Scarborough / Mt. Grace District Office">',
    '<meta property="og:locale" content="en_TT">',
    '<meta property="og:title" content="' + esc(title) + '">',
    '<meta property="og:description" content="' + esc(description) + '">',
    '<meta property="og:url" content="' + esc(canonical) + '">',
    '<meta name="twitter:card" content="summary">',
    '<meta name="twitter:title" content="' + esc(title) + '">',
    '<meta name="twitter:description" content="' + esc(description) + '">'
  ].join('');
  return tags;
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (isBackendPath(path)) return proxy(request, env);
    if (path === '/server' || path.startsWith('/server/') || path.startsWith('/.git/') ||
        path === '/.env' || path === '/.cloudflare-dist') {
      return new Response('Not found', {status:404, headers:noCache});
    }
    if (path === '/robots.txt') {
      const content = 'User-agent: *\nDisallow: /staff/\nDisallow: /api/\nDisallow: /server/\nSitemap: ' + url.origin + '/sitemap.xml\n';
      return new Response(content, {headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=3600'}});
    }
    if (path === '/sitemap.xml') {
      const urls = [...Object.keys(pages), '/track/', '/resident-guide/'];
      const entries = urls.map(p => '<url><loc>' + esc(url.origin + p) + '</loc></url>').join('');
      return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + entries + '</urlset>', {
        headers:{'Content-Type':'application/xml; charset=utf-8', 'Cache-Control':'public, max-age=3600'}
      });
    }
    const publicPage = pathName(path);
    if (publicPage) {
      if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', {status:405});
      const asset = await env.ASSETS.fetch(new URL('/index.html', url));
      if (!asset.ok) return asset;
      const headers = new Headers(asset.headers);
      headers.set('Cache-Control', 'no-cache');
      headers.set('X-Content-Type-Options','nosniff');
      headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=(), payment=(), usb=()');
      const response = new Response(asset.body, {status:asset.status, headers});
      return new HTMLRewriter().on('head', {element(element){element.append(routeMeta(publicPage,url,env), {html:true});}}).transform(response);
    }
    if (path === '/sw.js') {
      const asset = await env.ASSETS.fetch(request);
      const headers = new Headers(asset.headers);
      headers.set('Cache-Control','no-cache, no-store, must-revalidate');
      headers.set('Service-Worker-Allowed','/');
      return new Response(asset.body,{status:asset.status,headers});
    }
    const asset = await env.ASSETS.fetch(request);
    return asset;
  }
};
