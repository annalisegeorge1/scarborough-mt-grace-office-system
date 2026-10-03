'use strict';
const path=require('path');
const fs=require('fs/promises');
const crypto=require('crypto');
const express=require('express');
const helmet=require('helmet');
const cookieParser=require('cookie-parser');
const config=require('./config');
const {authMiddleware,requireCsrf}=require('./auth');
const authRoutes=require('./routes/auth');
const operationRoutes=require('./routes/operations');
const automationRoutes=require('./routes/automation');
const qualityRoutes=require('./routes/quality');
const workspaceRoutes=require('./routes/workspace');
const reportRoutes=require('./routes/reports');
const todayRoutes=require('./routes/today');
const auditRoutes=require('./routes/audit');
const searchRoutes=require('./routes/search');
const contentRoutes=require('./routes/content');
const caseRoutes=require('./routes/cases');
const applicationRoutes=require('./routes/applications');
const recordRoutes=require('./routes/records');
const feedbackRoutes=require('./routes/feedback');
const residentRoutes=require('./routes/residents');
const publicRoutes=require('./routes/public');
const healthRoutes=require('./routes/health');
const uploadRoutes=require('./routes/uploads');
const userRoutes=require('./routes/users');

const app=express();
app.disable('x-powered-by');
if(config.trustProxy)app.set('trust proxy',config.trustProxy);

app.use((req,res,next)=>{
  const id=req.get('X-Request-Id')||crypto.randomUUID();
  req.requestId=id;
  res.setHeader('X-Request-Id',id);
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  next();
});
app.use(helmet({contentSecurityPolicy:{directives:{
  defaultSrc:["'self'"],baseUri:["'self'"],objectSrc:["'none'"],frameAncestors:["'self'"],formAction:["'self'"],
  imgSrc:["'self'",'data:','blob:','https:'],fontSrc:["'self'",'data:'],styleSrc:["'self'","'unsafe-inline'"],
  scriptSrc:["'self'","'unsafe-inline'"],connectSrc:["'self'"],frameSrc:["'self'",'blob:','data:']
}}}));
app.use(express.json({limit:'1mb'}));
app.use(express.urlencoded({extended:false,limit:'1mb'}));
app.use(cookieParser());
app.use('/api',(req,res,next)=>{res.setHeader('Cache-Control','no-store');res.setHeader('Pragma','no-cache');next();});
app.use('/staff',(req,res,next)=>{res.setHeader('Cache-Control','no-store, private');res.setHeader('Pragma','no-cache');res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');next();});
app.use(authMiddleware);

app.use('/api/health',healthRoutes);
app.use('/api/public',publicRoutes);
app.use('/api/auth',authRoutes);
app.use('/api/cases',requireCsrf,caseRoutes);
app.use('/api/applications',requireCsrf,applicationRoutes);
app.use('/api/records',requireCsrf,recordRoutes);
app.use('/api/feedback',requireCsrf,feedbackRoutes);
app.use('/api/residents',requireCsrf,residentRoutes);
app.use('/api/uploads',requireCsrf,uploadRoutes);
app.use('/api/users',requireCsrf,userRoutes);
app.use('/api/audit',requireCsrf,auditRoutes);
app.use('/api/search',requireCsrf,searchRoutes);
app.use('/api/content',requireCsrf,contentRoutes);
app.use('/api/ops',requireCsrf,operationRoutes);
app.use('/api/automation',requireCsrf,automationRoutes);
app.use('/api/quality',requireCsrf,qualityRoutes);
app.use('/api/workspaces',requireCsrf,workspaceRoutes);
app.use('/api/reports',requireCsrf,reportRoutes);
app.use('/api/today',requireCsrf,todayRoutes);

const staticOpts={dotfiles:'deny',etag:true,maxAge:config.production?'1h':0,index:false};
app.use('/assets',express.static(path.join(config.staticRoot,'assets'),staticOpts));

app.get('/manifest.webmanifest',(req,res)=>{
  res.setHeader('Cache-Control','public, max-age=3600');
  res.type('application/manifest+json').sendFile(path.join(config.staticRoot,'manifest.webmanifest'));
});
app.get('/sw.js',(req,res)=>{
  res.setHeader('Cache-Control','no-cache, no-store, must-revalidate');
  res.setHeader('Service-Worker-Allowed','/');
  res.type('application/javascript').sendFile(path.join(config.staticRoot,'sw.js'));
});
app.get('/offline.html',(req,res)=>{
  res.setHeader('Cache-Control','public, max-age=3600');
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
  res.type('html').sendFile(path.join(config.staticRoot,'offline.html'));
});

const PUBLIC_ROUTE_META={
  '/':{
    title:'Scarborough / Mt. Grace District Office',
    description:'Public information, resident services, forms, community updates, enquiries and contact details for the Scarborough / Mt. Grace District Office.'
  },
  '/office/':{
    title:'Your District Office — Scarborough / Mt. Grace',
    description:'Meet the District Office team, review office information and hours, and learn about the Scarborough / Mt. Grace District Office.'
  },
  '/services/':{
    title:'Resident Services — Scarborough / Mt. Grace District Office',
    description:'Find resident services, assistance pathways, programme information, guidance and resources from the Scarborough / Mt. Grace District Office.'
  },
  '/community/':{
    title:'Community — Scarborough / Mt. Grace District Office',
    description:'Explore community projects, participation opportunities, public matters, activities and district information for Scarborough / Mt. Grace.'
  },
  '/forms/':{
    title:'Forms & Portals — Scarborough / Mt. Grace District Office',
    description:'Find public forms and service portals, submit an enquiry and access tracking tools from the Scarborough / Mt. Grace District Office.'
  },
  '/updates/':{
    title:'Updates & Information — Scarborough / Mt. Grace District Office',
    description:'Follow published District Office updates, notices, projects, public progress and community information for Scarborough / Mt. Grace.'
  },
  '/contact/':{
    title:'Contact & Enquiries — Scarborough / Mt. Grace District Office',
    description:'Find office hours and contact details, reach the office by phone or WhatsApp, submit an enquiry or track an existing matter.'
  }
};

function publicOrigin(){
  return String(config.publicOrigin||'').replace(/\/+$/,'');
}
function normalizePublicPath(value){
  const raw=String(value||'/').split('?')[0];
  if(raw==='/'||raw==='/index.html'||raw==='/index-self-contained.html')return '/';
  const clean='/'+raw.replace(/^\/+|\/+$/g,'');
  return PUBLIC_ROUTE_META[clean+'/']?clean+'/':clean;
}
function escapeHtml(value){
  return String(value??'')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function safeJson(value){
  return JSON.stringify(value).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
}
function applyPublicMetadata(html,req){
  const route=normalizePublicPath(req.path);
  const meta=PUBLIC_ROUTE_META[route]||PUBLIC_ROUTE_META['/'];
  const origin=publicOrigin();
  const canonical=origin+(route==='/'?'/':route);
  const siteName='Scarborough / Mt. Grace District Office';
  const cleaned=html
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi,'')
    .replace(/<meta\b[^>]*(?:name|property)=["'](?:description|robots|og:title|og:description|og:type|og:url|og:site_name|og:locale|twitter:card|twitter:title|twitter:description)["'][^>]*>/gi,'')
    .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi,'')
    .replace(/<link\b[^>]*rel=["']alternate["'][^>]*hreflang=["']en-TT["'][^>]*>/gi,'')
    .replace(/<script\b[^>]*data-v223-structured[^>]*>[\s\S]*?<\/script>/gi,'');

  const structured=[
    {
      '@context':'https://schema.org',
      '@type':'WebSite',
      name:siteName,
      url:origin+'/',
      inLanguage:'en-TT'
    },
    {
      '@context':'https://schema.org',
      '@type':'GovernmentOffice',
      name:siteName,
      url:origin+'/',
      telephone:'+1-868-610-6314',
      email:'smgofficestaff@yahoo.com',
      address:{
        '@type':'PostalAddress',
        streetAddress:'Harmony Hall, Mt. Grace Plaza',
        addressLocality:'Scarborough',
        addressRegion:'Tobago',
        addressCountry:'TT'
      }
    },
    {
      '@context':'https://schema.org',
      '@type':'WebPage',
      name:meta.title,
      description:meta.description,
      url:canonical,
      isPartOf:{'@type':'WebSite',name:siteName,url:origin+'/'},
      inLanguage:'en-TT'
    }
  ];

  const tags=[
    '<title>'+escapeHtml(meta.title)+'</title>',
    '<meta name="description" content="'+escapeHtml(meta.description)+'">',
    '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">',
    '<link rel="canonical" href="'+escapeHtml(canonical)+'">',
    '<link rel="alternate" hreflang="en-TT" href="'+escapeHtml(canonical)+'">',
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="'+escapeHtml(siteName)+'">',
    '<meta property="og:locale" content="en_TT">',
    '<meta property="og:title" content="'+escapeHtml(meta.title)+'">',
    '<meta property="og:description" content="'+escapeHtml(meta.description)+'">',
    '<meta property="og:url" content="'+escapeHtml(canonical)+'">',
    '<meta name="twitter:card" content="summary">',
    '<meta name="twitter:title" content="'+escapeHtml(meta.title)+'">',
    '<meta name="twitter:description" content="'+escapeHtml(meta.description)+'">',
    '<script type="application/ld+json" data-v223-structured>'+safeJson(structured)+'</script>'
  ].join('');
  return /<\/head>/i.test(cleaned)?cleaned.replace(/<\/head>/i,tags+'</head>'):tags+cleaned;
}

app.get('/robots.txt',(req,res)=>{
  const lines=[
    'User-agent: *',
    'Disallow: /staff/',
    'Disallow: /api/',
    'Disallow: /server/',
    'Sitemap: '+publicOrigin()+'/sitemap.xml',
    ''
  ];
  res.type('text/plain').send(lines.join('\n'));
});

app.get('/sitemap.xml',(req,res)=>{
  const origin=publicOrigin();
  const paths=[
    '/',
    '/office/',
    '/services/',
    '/community/',
    '/forms/',
    '/updates/',
    '/contact/',
    '/track/',
    '/resident-guide/'
  ];
  const urls=paths.map(p=>'<url><loc>'+escapeHtml(origin+p)+'</loc></url>').join('');
  res.setHeader('Cache-Control','public, max-age=3600');
  res.type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls+'</urlset>');
});

let cachedPublicIndex=null;
function currentCalderHallNames(html){
  return html
    .replaceAll('Calder Hall Main Phases 1, 2 and 3','Calder Hall Main Road, Virgil Alley, Phases 2 and 3')
    .replaceAll('Phases 1, 2 and 3','Virgil Alley, Phases 2 and 3')
    .replaceAll('Phases 1, 2 &amp; 3','Virgil Alley, Phases 2 &amp; 3')
    .replace('calder hall main road phases darrel spring','calder hall main road virgil alley phases 2 3 darrel spring');
}
async function sendPublicIndex(req,res,next){
  try{
    if(!cachedPublicIndex||!config.production){
      const file=path.join(config.staticRoot,'index-self-contained.html');
      let html=currentCalderHallNames(await fs.readFile(file,'utf8'));
      const styleAssets=[
        'district-sidebar-v202.css',
        'district-focused-pages-v203.css',
        'district-focused-layout-v204.css',
        'public-route-integration-v205.css',
        'district-visual-qa-v206.css',
        'district-page-identity-v207.css',
        'district-content-hierarchy-v208.css',
        'district-light-hierarchy-v209.css',
        'district-aesthetic-restoration-v210.css',
        'district-homepage-aesthetic-v211.css',
        'district-global-polish-v212.css',
        'district-digital-feed-v213.css',
        'district-feed-publishing-v214.css',
        'district-progress-threads-v215.css',
        'district-mobile-corrections-v216.css',
        'district-mobile-polish-v217.css',
        'district-mobile-navigation-v218.css',
        'district-contrast-accessibility-v219.css',
        'district-performance-interaction-v220.css',
        'district-dark-desktop-v221.css',
        'district-component-cohesion-v222.css',
        'district-public-discovery-v223.css',
        'district-command-center-v224.css',
        'district-resident-journey-v225.css',
        'district-smart-next-step-v226.css',
        'district-living-pulse-v227.css',
        'district-resident-readiness-v228.css',
        'district-pwa-v229.css',
        'district-landscape-corrections-v230.css',
        'district-service-intelligence-v231.css',
        'district-form-landscape-v232.css',
        'district-screenshot-polish-v233.css',
        'district-dark-form-gallery-v234.css',
        'district-resident-service-workspace-v235.css',
        'district-focused-route-coherence-v236.css',
        'district-civic-flow-v237.css',
        'district-dark-form-stabilization-v238.css',
        'district-civic-shell-v239.css',
        'district-responsive-hardening-v240.css',
        'district-explore-drawer-v241.css'
      ];
      const scriptAssets=[
        'public-content-runtime.js',
        'district-sidebar-v202.js',
        'district-focused-pages-v203.js',
        'district-focused-layout-v204.js',
        'public-route-integration-v205.js',
        'district-page-identity-v207.js',
        'district-content-hierarchy-v208.js',
        'district-light-hierarchy-v209.js',
        'district-aesthetic-restoration-v210.js',
        'district-homepage-aesthetic-v211.js',
        'district-global-polish-v212.js',
        'district-digital-feed-v213.js',
        'district-feed-publishing-v214.js',
        'district-progress-threads-v215.js',
        'district-mobile-navigation-v218.js',
        'district-contrast-accessibility-v219.js',
        'district-performance-interaction-v220.js',
        'district-dark-desktop-v221.js',
        'district-component-cohesion-v222.js',
        'district-command-center-v224.js',
        'district-resident-journey-v225.js',
        'district-smart-next-step-v226.js',
        'district-living-pulse-v227.js',
        'district-resident-readiness-v228.js',
        'district-pwa-v229.js',
        'district-service-intelligence-v231.js',
        'district-resident-service-workspace-v235.js',
        'district-civic-flow-v237.js',
        'district-dark-form-stabilization-v238.js',
        'district-civic-shell-v239.js',
        'district-responsive-hardening-v240.js'
      ];
      const assetNames=[...styleAssets,...scriptAssets];
      const assetBuffers=await Promise.all(
        assetNames.map(name=>fs.readFile(path.join(config.staticRoot,'assets',name)))
      );
      const versionFor=buffer=>crypto.createHash('sha256').update(buffer).digest('hex').slice(0,12);
      const assetVersion=new Map(assetNames.map((name,index)=>[name,versionFor(assetBuffers[index])]));
      const styleTag=name=>`<link rel="stylesheet" href="/assets/${name}?v=${assetVersion.get(name)}">`;
      const scriptTag=name=>`<script src="/assets/${name}?v=${assetVersion.get(name)}" defer></script>`;
      const pwaHead='<link rel="manifest" href="/manifest.webmanifest"><link rel="icon" type="image/svg+xml" href="/assets/district-app-icon-v229.svg"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="SMG Office">';
      const rssLink='<link rel="alternate" type="application/rss+xml" title="Scarborough / Mt. Grace District Office Updates" href="/api/public/feed.xml">';
      for(const name of styleAssets){
        const marker='/assets/'+name;
        if(html.includes(marker))continue;
        const tag=styleTag(name);
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,tag+'</head>'):tag+html;
      }
      if(!html.includes('/manifest.webmanifest')){
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,pwaHead+'</head>'):pwaHead+html;
      }
      if(!html.includes('/api/public/feed.xml')){
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,rssLink+'</head>'):rssLink+html;
      }
      for(const name of scriptAssets){
        const marker='/assets/'+name;
        if(html.includes(marker))continue;
        const tag=scriptTag(name);
        html=/<\/body>/i.test(html)?html.replace(/<\/body>/i,tag+'</body>'):html+tag;
      }
      cachedPublicIndex=html;
    }
    const responseHtml=applyPublicMetadata(cachedPublicIndex,req);
    res.setHeader('Cache-Control','no-cache');
    res.type('html').send(responseHtml);
  }catch(e){next(e)}
}
app.get([
  '/',
  '/index.html',
  '/index-self-contained.html',
  '/office',
  '/office/',
  '/services',
  '/services/',
  '/community',
  '/community/',
  '/forms',
  '/forms/',
  '/updates',
  '/updates/',
  '/contact',
  '/contact/'
],sendPublicIndex);

app.get('/staff/login.html',(req,res)=>res.sendFile(path.join(config.staticRoot,'staff','login.html')));
app.get('/staff/production-ui.css',(req,res)=>res.sendFile(path.join(config.staticRoot,'staff','production-ui.css')));
app.get('/staff/production-client.js',(req,res)=>res.sendFile(path.join(config.staticRoot,'staff','production-client.js')));
const requireStaffPage=(req,res,next)=>{
  if(req.user)return next();
  const nextPath=encodeURIComponent(req.originalUrl);
  return res.redirect('/staff/login.html?next='+nextPath);
};
app.use('/staff',requireStaffPage,express.static(path.join(config.staticRoot,'staff'),staticOpts));
app.use('/track',express.static(path.join(config.staticRoot,'track'),{...staticOpts,index:'index.html'}));
app.use('/es',express.static(path.join(config.staticRoot,'es'),{...staticOpts,index:'index.html'}));
app.use('/portals',express.static(path.join(config.staticRoot,'portals'),{...staticOpts,index:'index.html'}));
app.use('/resident-guide',express.static(path.join(config.staticRoot,'resident-guide'),{...staticOpts,index:'index.html'}));

app.get('/staff',(req,res)=>res.redirect(req.user?'/staff/home.html':'/staff/login.html'));
app.get('/track',(req,res)=>res.redirect('/track/'));
app.get('/es',(req,res)=>res.redirect('/es/'));
app.use('/server',(req,res)=>res.status(404).end());

app.use((req,res)=>{
  if(req.path.startsWith('/api/'))return res.status(404).json({detail:'API endpoint not found.'});
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
  res.status(404).sendFile(path.join(config.staticRoot,'404.html'));
});
app.use((err,req,res,next)=>{
  console.error('[SERVER ERROR]',req.requestId||'-',err.message);
  if(res.headersSent)return next(err);
  res.status(err.code==='LIMIT_FILE_SIZE'?413:500).json({detail:config.production?'The request could not be completed.':err.message});
});
if(require.main===module){
  app.listen(config.port,()=>console.log(`Scarborough / Mt. Grace server listening on ${config.port}`));
}
module.exports=app;
