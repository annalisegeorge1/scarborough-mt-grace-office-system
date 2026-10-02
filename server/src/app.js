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
const auditRoutes=require('./routes/audit');
const searchRoutes=require('./routes/search');
const contentRoutes=require('./routes/content');
const caseRoutes=require('./routes/cases');
const applicationRoutes=require('./routes/applications');
const recordRoutes=require('./routes/records');
const feedbackRoutes=require('./routes/feedback');
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

const staticOpts={dotfiles:'deny',etag:true,maxAge:config.production?'1h':0,index:false};
app.use('/assets',express.static(path.join(config.staticRoot,'assets'),staticOpts));

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
      const runtimeFile=path.join(config.staticRoot,'assets','public-content-runtime.js');
      const sidebarCssFile=path.join(config.staticRoot,'assets','district-sidebar-v202.css');
      const sidebarJsFile=path.join(config.staticRoot,'assets','district-sidebar-v202.js');
      const focusedCssFile=path.join(config.staticRoot,'assets','district-focused-pages-v203.css');
      const focusedJsFile=path.join(config.staticRoot,'assets','district-focused-pages-v203.js');
      const focusedLayoutCssFile=path.join(config.staticRoot,'assets','district-focused-layout-v204.css');
      const focusedLayoutJsFile=path.join(config.staticRoot,'assets','district-focused-layout-v204.js');
      const routeCssFile=path.join(config.staticRoot,'assets','public-route-integration-v205.css');
      const routeJsFile=path.join(config.staticRoot,'assets','public-route-integration-v205.js');
      const visualQaCssFile=path.join(config.staticRoot,'assets','district-visual-qa-v206.css');
      const pageIdentityCssFile=path.join(config.staticRoot,'assets','district-page-identity-v207.css');
      const pageIdentityJsFile=path.join(config.staticRoot,'assets','district-page-identity-v207.js');
      const hierarchyCssFile=path.join(config.staticRoot,'assets','district-content-hierarchy-v208.css');
      const hierarchyJsFile=path.join(config.staticRoot,'assets','district-content-hierarchy-v208.js');
      const lightHierarchyCssFile=path.join(config.staticRoot,'assets','district-light-hierarchy-v209.css');
      const lightHierarchyJsFile=path.join(config.staticRoot,'assets','district-light-hierarchy-v209.js');
      const aestheticCssFile=path.join(config.staticRoot,'assets','district-aesthetic-restoration-v210.css');
      const aestheticJsFile=path.join(config.staticRoot,'assets','district-aesthetic-restoration-v210.js');
      const homeAestheticCssFile=path.join(config.staticRoot,'assets','district-homepage-aesthetic-v211.css');
      const homeAestheticJsFile=path.join(config.staticRoot,'assets','district-homepage-aesthetic-v211.js');
      const globalPolishCssFile=path.join(config.staticRoot,'assets','district-global-polish-v212.css');
      const globalPolishJsFile=path.join(config.staticRoot,'assets','district-global-polish-v212.js');
      const digitalFeedCssFile=path.join(config.staticRoot,'assets','district-digital-feed-v213.css');
      const digitalFeedJsFile=path.join(config.staticRoot,'assets','district-digital-feed-v213.js');
      const feedPublishingCssFile=path.join(config.staticRoot,'assets','district-feed-publishing-v214.css');
      const feedPublishingJsFile=path.join(config.staticRoot,'assets','district-feed-publishing-v214.js');
      const progressThreadsCssFile=path.join(config.staticRoot,'assets','district-progress-threads-v215.css');
      const progressThreadsJsFile=path.join(config.staticRoot,'assets','district-progress-threads-v215.js');
      const mobileCorrectionsCssFile=path.join(config.staticRoot,'assets','district-mobile-corrections-v216.css');
      const mobilePolishCssFile=path.join(config.staticRoot,'assets','district-mobile-polish-v217.css');
      const mobileNavigationCssFile=path.join(config.staticRoot,'assets','district-mobile-navigation-v218.css');
      const mobileNavigationJsFile=path.join(config.staticRoot,'assets','district-mobile-navigation-v218.js');
      const contrastAccessibilityCssFile=path.join(config.staticRoot,'assets','district-contrast-accessibility-v219.css');
      const contrastAccessibilityJsFile=path.join(config.staticRoot,'assets','district-contrast-accessibility-v219.js');
      const performanceInteractionCssFile=path.join(config.staticRoot,'assets','district-performance-interaction-v220.css');
      const performanceInteractionJsFile=path.join(config.staticRoot,'assets','district-performance-interaction-v220.js');
      const darkDesktopCssFile=path.join(config.staticRoot,'assets','district-dark-desktop-v221.css');
      const darkDesktopJsFile=path.join(config.staticRoot,'assets','district-dark-desktop-v221.js');
      const componentCohesionCssFile=path.join(config.staticRoot,'assets','district-component-cohesion-v222.css');
      const componentCohesionJsFile=path.join(config.staticRoot,'assets','district-component-cohesion-v222.js');
      const publicDiscoveryCssFile=path.join(config.staticRoot,'assets','district-public-discovery-v223.css');
      const commandCenterCssFile=path.join(config.staticRoot,'assets','district-command-center-v224.css');
      const commandCenterJsFile=path.join(config.staticRoot,'assets','district-command-center-v224.js');
      const residentJourneyCssFile=path.join(config.staticRoot,'assets','district-resident-journey-v225.css');
      const residentJourneyJsFile=path.join(config.staticRoot,'assets','district-resident-journey-v225.js');
      const smartNextStepCssFile=path.join(config.staticRoot,'assets','district-smart-next-step-v226.css');
      const smartNextStepJsFile=path.join(config.staticRoot,'assets','district-smart-next-step-v226.js');
      const [runtimeBuffer,sidebarCssBuffer,sidebarJsBuffer,focusedCssBuffer,focusedJsBuffer,focusedLayoutCssBuffer,focusedLayoutJsBuffer,routeCssBuffer,routeJsBuffer,visualQaCssBuffer,pageIdentityCssBuffer,pageIdentityJsBuffer,hierarchyCssBuffer,hierarchyJsBuffer,lightHierarchyCssBuffer,lightHierarchyJsBuffer,aestheticCssBuffer,aestheticJsBuffer,homeAestheticCssBuffer,homeAestheticJsBuffer,globalPolishCssBuffer,globalPolishJsBuffer,digitalFeedCssBuffer,digitalFeedJsBuffer,feedPublishingCssBuffer,feedPublishingJsBuffer,progressThreadsCssBuffer,progressThreadsJsBuffer,mobileCorrectionsCssBuffer,mobilePolishCssBuffer,mobileNavigationCssBuffer,mobileNavigationJsBuffer,contrastAccessibilityCssBuffer,contrastAccessibilityJsBuffer,performanceInteractionCssBuffer,performanceInteractionJsBuffer,darkDesktopCssBuffer,darkDesktopJsBuffer,componentCohesionCssBuffer,componentCohesionJsBuffer,publicDiscoveryCssBuffer,commandCenterCssBuffer,commandCenterJsBuffer,residentJourneyCssBuffer,residentJourneyJsBuffer,smartNextStepCssBuffer,smartNextStepJsBuffer]=await Promise.all([
        fs.readFile(runtimeFile),
        fs.readFile(sidebarCssFile),
        fs.readFile(sidebarJsFile),
        fs.readFile(focusedCssFile),
        fs.readFile(focusedJsFile),
        fs.readFile(focusedLayoutCssFile),
        fs.readFile(focusedLayoutJsFile),
        fs.readFile(routeCssFile),
        fs.readFile(routeJsFile),
        fs.readFile(visualQaCssFile),
        fs.readFile(pageIdentityCssFile),
        fs.readFile(pageIdentityJsFile),
        fs.readFile(hierarchyCssFile),
        fs.readFile(hierarchyJsFile),
        fs.readFile(lightHierarchyCssFile),
        fs.readFile(lightHierarchyJsFile),
        fs.readFile(aestheticCssFile),
        fs.readFile(aestheticJsFile),
        fs.readFile(homeAestheticCssFile),
        fs.readFile(homeAestheticJsFile),
        fs.readFile(globalPolishCssFile),
        fs.readFile(globalPolishJsFile),
        fs.readFile(digitalFeedCssFile),
        fs.readFile(digitalFeedJsFile),
        fs.readFile(feedPublishingCssFile),
        fs.readFile(feedPublishingJsFile),
        fs.readFile(progressThreadsCssFile),
        fs.readFile(progressThreadsJsFile),
        fs.readFile(mobileCorrectionsCssFile),
        fs.readFile(mobilePolishCssFile),
        fs.readFile(mobileNavigationCssFile),
        fs.readFile(mobileNavigationJsFile),
        fs.readFile(contrastAccessibilityCssFile),
        fs.readFile(contrastAccessibilityJsFile),
        fs.readFile(performanceInteractionCssFile),
        fs.readFile(performanceInteractionJsFile),
        fs.readFile(darkDesktopCssFile),
        fs.readFile(darkDesktopJsFile),
        fs.readFile(componentCohesionCssFile),
        fs.readFile(componentCohesionJsFile),
        fs.readFile(publicDiscoveryCssFile),
        fs.readFile(commandCenterCssFile),
        fs.readFile(commandCenterJsFile),
        fs.readFile(residentJourneyCssFile),
        fs.readFile(residentJourneyJsFile),
        fs.readFile(smartNextStepCssFile),
        fs.readFile(smartNextStepJsFile)
      ]);
      const versionFor=(buffer)=>crypto.createHash('sha256').update(buffer).digest('hex').slice(0,12);
      const runtime=`<script src="/assets/public-content-runtime.js?v=${versionFor(runtimeBuffer)}" defer></script>`;
      const sidebarCss=`<link rel="stylesheet" href="/assets/district-sidebar-v202.css?v=${versionFor(sidebarCssBuffer)}">`;
      const sidebarJs=`<script src="/assets/district-sidebar-v202.js?v=${versionFor(sidebarJsBuffer)}" defer></script>`;
      const focusedCss=`<link rel="stylesheet" href="/assets/district-focused-pages-v203.css?v=${versionFor(focusedCssBuffer)}">`;
      const focusedJs=`<script src="/assets/district-focused-pages-v203.js?v=${versionFor(focusedJsBuffer)}" defer></script>`;
      const focusedLayoutCss=`<link rel="stylesheet" href="/assets/district-focused-layout-v204.css?v=${versionFor(focusedLayoutCssBuffer)}">`;
      const focusedLayoutJs=`<script src="/assets/district-focused-layout-v204.js?v=${versionFor(focusedLayoutJsBuffer)}" defer></script>`;
      const routeCss=`<link rel="stylesheet" href="/assets/public-route-integration-v205.css?v=${versionFor(routeCssBuffer)}">`;
      const routeJs=`<script src="/assets/public-route-integration-v205.js?v=${versionFor(routeJsBuffer)}" defer></script>`;
      const visualQaCss=`<link rel="stylesheet" href="/assets/district-visual-qa-v206.css?v=${versionFor(visualQaCssBuffer)}">`;
      const pageIdentityCss=`<link rel="stylesheet" href="/assets/district-page-identity-v207.css?v=${versionFor(pageIdentityCssBuffer)}">`;
      const pageIdentityJs=`<script src="/assets/district-page-identity-v207.js?v=${versionFor(pageIdentityJsBuffer)}" defer></script>`;
      const hierarchyCss=`<link rel="stylesheet" href="/assets/district-content-hierarchy-v208.css?v=${versionFor(hierarchyCssBuffer)}">`;
      const hierarchyJs=`<script src="/assets/district-content-hierarchy-v208.js?v=${versionFor(hierarchyJsBuffer)}" defer></script>`;
      const lightHierarchyCss=`<link rel="stylesheet" href="/assets/district-light-hierarchy-v209.css?v=${versionFor(lightHierarchyCssBuffer)}">`;
      const lightHierarchyJs=`<script src="/assets/district-light-hierarchy-v209.js?v=${versionFor(lightHierarchyJsBuffer)}" defer></script>`;
      const aestheticCss=`<link rel="stylesheet" href="/assets/district-aesthetic-restoration-v210.css?v=${versionFor(aestheticCssBuffer)}">`;
      const aestheticJs=`<script src="/assets/district-aesthetic-restoration-v210.js?v=${versionFor(aestheticJsBuffer)}" defer></script>`;
      const homeAestheticCss=`<link rel="stylesheet" href="/assets/district-homepage-aesthetic-v211.css?v=${versionFor(homeAestheticCssBuffer)}">`;
      const homeAestheticJs=`<script src="/assets/district-homepage-aesthetic-v211.js?v=${versionFor(homeAestheticJsBuffer)}" defer></script>`;
      const globalPolishCss=`<link rel="stylesheet" href="/assets/district-global-polish-v212.css?v=${versionFor(globalPolishCssBuffer)}">`;
      const globalPolishJs=`<script src="/assets/district-global-polish-v212.js?v=${versionFor(globalPolishJsBuffer)}" defer></script>`;
      const digitalFeedCss=`<link rel="stylesheet" href="/assets/district-digital-feed-v213.css?v=${versionFor(digitalFeedCssBuffer)}">`;
      const digitalFeedJs=`<script src="/assets/district-digital-feed-v213.js?v=${versionFor(digitalFeedJsBuffer)}" defer></script>`;
      const feedPublishingCss=`<link rel="stylesheet" href="/assets/district-feed-publishing-v214.css?v=${versionFor(feedPublishingCssBuffer)}">`;
      const feedPublishingJs=`<script src="/assets/district-feed-publishing-v214.js?v=${versionFor(feedPublishingJsBuffer)}" defer></script>`;
      const progressThreadsCss=`<link rel="stylesheet" href="/assets/district-progress-threads-v215.css?v=${versionFor(progressThreadsCssBuffer)}">`;
      const progressThreadsJs=`<script src="/assets/district-progress-threads-v215.js?v=${versionFor(progressThreadsJsBuffer)}" defer></script>`;
      const mobileCorrectionsCss=`<link rel="stylesheet" href="/assets/district-mobile-corrections-v216.css?v=${versionFor(mobileCorrectionsCssBuffer)}">`;
      const mobilePolishCss=`<link rel="stylesheet" href="/assets/district-mobile-polish-v217.css?v=${versionFor(mobilePolishCssBuffer)}">`;
      const mobileNavigationCss=`<link rel="stylesheet" href="/assets/district-mobile-navigation-v218.css?v=${versionFor(mobileNavigationCssBuffer)}">`;
      const mobileNavigationJs=`<script src="/assets/district-mobile-navigation-v218.js?v=${versionFor(mobileNavigationJsBuffer)}" defer></script>`;
      const contrastAccessibilityCss=`<link rel="stylesheet" href="/assets/district-contrast-accessibility-v219.css?v=${versionFor(contrastAccessibilityCssBuffer)}">`;
      const contrastAccessibilityJs=`<script src="/assets/district-contrast-accessibility-v219.js?v=${versionFor(contrastAccessibilityJsBuffer)}" defer></script>`;
      const performanceInteractionCss=`<link rel="stylesheet" href="/assets/district-performance-interaction-v220.css?v=${versionFor(performanceInteractionCssBuffer)}">`;
      const performanceInteractionJs=`<script src="/assets/district-performance-interaction-v220.js?v=${versionFor(performanceInteractionJsBuffer)}" defer></script>`;
      const darkDesktopCss=`<link rel="stylesheet" href="/assets/district-dark-desktop-v221.css?v=${versionFor(darkDesktopCssBuffer)}">`;
      const darkDesktopJs=`<script src="/assets/district-dark-desktop-v221.js?v=${versionFor(darkDesktopJsBuffer)}" defer></script>`;
      const componentCohesionCss=`<link rel="stylesheet" href="/assets/district-component-cohesion-v222.css?v=${versionFor(componentCohesionCssBuffer)}">`;
      const componentCohesionJs=`<script src="/assets/district-component-cohesion-v222.js?v=${versionFor(componentCohesionJsBuffer)}" defer></script>`;
      const publicDiscoveryCss=`<link rel="stylesheet" href="/assets/district-public-discovery-v223.css?v=${versionFor(publicDiscoveryCssBuffer)}">`;
      const commandCenterCss=`<link rel="stylesheet" href="/assets/district-command-center-v224.css?v=${versionFor(commandCenterCssBuffer)}">`;
      const commandCenterJs=`<script src="/assets/district-command-center-v224.js?v=${versionFor(commandCenterJsBuffer)}" defer></script>`;
      const residentJourneyCss=`<link rel="stylesheet" href="/assets/district-resident-journey-v225.css?v=${versionFor(residentJourneyCssBuffer)}">`;
      const residentJourneyJs=`<script src="/assets/district-resident-journey-v225.js?v=${versionFor(residentJourneyJsBuffer)}" defer></script>`;
      const smartNextStepCss=`<link rel="stylesheet" href="/assets/district-smart-next-step-v226.css?v=${versionFor(smartNextStepCssBuffer)}">`;
      const smartNextStepJs=`<script src="/assets/district-smart-next-step-v226.js?v=${versionFor(smartNextStepJsBuffer)}" defer></script>`;
      const rssLink='<link rel="alternate" type="application/rss+xml" title="Scarborough / Mt. Grace District Office Updates" href="/api/public/feed.xml">';
      if(!html.includes('/assets/district-sidebar-v202.css')){
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,sidebarCss+'</head>'):sidebarCss+html;
      }
      if(!html.includes('/assets/district-focused-pages-v203.css')){
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,focusedCss+'</head>'):focusedCss+html;
      }
      if(!html.includes('/assets/district-focused-layout-v204.css')){
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,focusedLayoutCss+'</head>'):focusedLayoutCss+html;
      }
      if(!html.includes('/assets/public-route-integration-v205.css')){
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,routeCss+'</head>'):routeCss+html;
      }
      if(!html.includes('/assets/district-visual-qa-v206.css')){
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,visualQaCss+'</head>'):visualQaCss+html;
      }
      if(!html.includes('/assets/district-page-identity-v207.css')){
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,pageIdentityCss+'</head>'):pageIdentityCss+html;
      }
      if(!html.includes('/assets/district-content-hierarchy-v208.css')){
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,hierarchyCss+'</head>'):hierarchyCss+html;
      }
      if(!html.includes('/assets/district-light-hierarchy-v209.css')){
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,lightHierarchyCss+'</head>'):lightHierarchyCss+html;
      }
      if(!html.includes('/assets/district-aesthetic-restoration-v210.css')){
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,aestheticCss+'</head>'):aestheticCss+html;
      }
      if(!html.includes('/assets/district-homepage-aesthetic-v211.css')){
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,homeAestheticCss+'</head>'):homeAestheticCss+html;
      }
      if(!html.includes('/assets/district-global-polish-v212.css')){
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,globalPolishCss+'</head>'):globalPolishCss+html;
      }
      if(!html.includes('/assets/district-digital-feed-v213.css')){
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,digitalFeedCss+'</head>'):digitalFeedCss+html;
      }
      if(!html.includes('/assets/district-feed-publishing-v214.css')){
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,feedPublishingCss+'</head>'):feedPublishingCss+html;
      }
      if(!html.includes('/assets/district-progress-threads-v215.css')){
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,progressThreadsCss+'</head>'):progressThreadsCss+html;
      }
      if(!html.includes('/assets/district-mobile-corrections-v216.css')){
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,mobileCorrectionsCss+'</head>'):mobileCorrectionsCss+html;
      }
      if(!html.includes('/assets/district-mobile-polish-v217.css')){
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,mobilePolishCss+'</head>'):mobilePolishCss+html;
      }
      if(!html.includes('/assets/district-mobile-navigation-v218.css')){
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,mobileNavigationCss+'</head>'):mobileNavigationCss+html;
      }
      if(!html.includes('/assets/district-contrast-accessibility-v219.css')){
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,contrastAccessibilityCss+'</head>'):contrastAccessibilityCss+html;
      }
      if(!html.includes('/assets/district-performance-interaction-v220.css')){
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,performanceInteractionCss+'</head>'):performanceInteractionCss+html;
      }
      if(!html.includes('/assets/district-dark-desktop-v221.css')){
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,darkDesktopCss+'</head>'):darkDesktopCss+html;
      }
      if(!html.includes('/assets/district-component-cohesion-v222.css')){
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,componentCohesionCss+'</head>'):componentCohesionCss+html;
      }
      if(!html.includes('/assets/district-public-discovery-v223.css')){
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,publicDiscoveryCss+'</head>'):publicDiscoveryCss+html;
      }
      if(!html.includes('/assets/district-command-center-v224.css')){
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,commandCenterCss+'</head>'):commandCenterCss+html;
      }
      if(!html.includes('/assets/district-resident-journey-v225.css')){
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,residentJourneyCss+'</head>'):residentJourneyCss+html;
      }
      if(!html.includes('/assets/district-smart-next-step-v226.css')){
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,smartNextStepCss+'</head>'):smartNextStepCss+html;
      }
      if(!html.includes('/api/public/feed.xml')){
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,rssLink+'</head>'):rssLink+html;
      }
      if(!html.includes('/assets/public-content-runtime.js')){
        html=/<\/body>/i.test(html)?html.replace(/<\/body>/i,runtime+'</body>'):html+runtime;
      }
      if(!html.includes('/assets/district-sidebar-v202.js')){
        html=/<\/body>/i.test(html)?html.replace(/<\/body>/i,sidebarJs+'</body>'):html+sidebarJs;
      }
      if(!html.includes('/assets/district-focused-pages-v203.js')){
        html=/<\/body>/i.test(html)?html.replace(/<\/body>/i,focusedJs+'</body>'):html+focusedJs;
      }
      if(!html.includes('/assets/district-focused-layout-v204.js')){
        html=/<\/body>/i.test(html)?html.replace(/<\/body>/i,focusedLayoutJs+'</body>'):html+focusedLayoutJs;
      }
      if(!html.includes('/assets/public-route-integration-v205.js')){
        html=/<\/body>/i.test(html)?html.replace(/<\/body>/i,routeJs+'</body>'):html+routeJs;
      }
      if(!html.includes('/assets/district-page-identity-v207.js')){
        html=/<\/body>/i.test(html)?html.replace(/<\/body>/i,pageIdentityJs+'</body>'):html+pageIdentityJs;
      }
      if(!html.includes('/assets/district-content-hierarchy-v208.js')){
        html=/<\/body>/i.test(html)?html.replace(/<\/body>/i,hierarchyJs+'</body>'):html+hierarchyJs;
      }
      if(!html.includes('/assets/district-light-hierarchy-v209.js')){
        html=/<\/body>/i.test(html)?html.replace(/<\/body>/i,lightHierarchyJs+'</body>'):html+lightHierarchyJs;
      }
      if(!html.includes('/assets/district-aesthetic-restoration-v210.js')){
        html=/<\/body>/i.test(html)?html.replace(/<\/body>/i,aestheticJs+'</body>'):html+aestheticJs;
      }
      if(!html.includes('/assets/district-homepage-aesthetic-v211.js')){
        html=/<\/body>/i.test(html)?html.replace(/<\/body>/i,homeAestheticJs+'</body>'):html+homeAestheticJs;
      }
      if(!html.includes('/assets/district-global-polish-v212.js')){
        html=/<\/body>/i.test(html)?html.replace(/<\/body>/i,globalPolishJs+'</body>'):html+globalPolishJs;
      }
      if(!html.includes('/assets/district-digital-feed-v213.js')){
        html=/<\/body>/i.test(html)?html.replace(/<\/body>/i,digitalFeedJs+'</body>'):html+digitalFeedJs;
      }
      if(!html.includes('/assets/district-feed-publishing-v214.js')){
        html=/<\/body>/i.test(html)?html.replace(/<\/body>/i,feedPublishingJs+'</body>'):html+feedPublishingJs;
      }
      if(!html.includes('/assets/district-progress-threads-v215.js')){
        html=/<\/body>/i.test(html)?html.replace(/<\/body>/i,progressThreadsJs+'</body>'):html+progressThreadsJs;
      }
      if(!html.includes('/assets/district-mobile-navigation-v218.js')){
        html=/<\/body>/i.test(html)?html.replace(/<\/body>/i,mobileNavigationJs+'</body>'):html+mobileNavigationJs;
      }
      if(!html.includes('/assets/district-contrast-accessibility-v219.js')){
        html=/<\/body>/i.test(html)?html.replace(/<\/body>/i,contrastAccessibilityJs+'</body>'):html+contrastAccessibilityJs;
      }
      if(!html.includes('/assets/district-performance-interaction-v220.js')){
        html=/<\/body>/i.test(html)?html.replace(/<\/body>/i,performanceInteractionJs+'</body>'):html+performanceInteractionJs;
      }
      if(!html.includes('/assets/district-dark-desktop-v221.js')){
        html=/<\/body>/i.test(html)?html.replace(/<\/body>/i,darkDesktopJs+'</body>'):html+darkDesktopJs;
      }
      if(!html.includes('/assets/district-component-cohesion-v222.js')){
        html=/<\/body>/i.test(html)?html.replace(/<\/body>/i,componentCohesionJs+'</body>'):html+componentCohesionJs;
      }
      if(!html.includes('/assets/district-command-center-v224.js')){
        html=/<\/body>/i.test(html)?html.replace(/<\/body>/i,commandCenterJs+'</body>'):html+commandCenterJs;
      }
      if(!html.includes('/assets/district-resident-journey-v225.js')){
        html=/<\/body>/i.test(html)?html.replace(/<\/body>/i,residentJourneyJs+'</body>'):html+residentJourneyJs;
      }
      if(!html.includes('/assets/district-smart-next-step-v226.js')){
        html=/<\/body>/i.test(html)?html.replace(/<\/body>/i,smartNextStepJs+'</body>'):html+smartNextStepJs;
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

app.get('/staff',(req,res)=>res.redirect(req.user?'/staff/index.html':'/staff/login.html'));
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
