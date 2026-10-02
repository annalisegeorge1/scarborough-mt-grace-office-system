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

app.get('/robots.txt',(req,res)=>res.type('text/plain').send('User-agent: *\nDisallow: /staff/\nDisallow: /api/\n'));

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
      const [runtimeBuffer,sidebarCssBuffer,sidebarJsBuffer,focusedCssBuffer,focusedJsBuffer,focusedLayoutCssBuffer,focusedLayoutJsBuffer,routeCssBuffer,routeJsBuffer,visualQaCssBuffer,pageIdentityCssBuffer,pageIdentityJsBuffer,hierarchyCssBuffer,hierarchyJsBuffer,lightHierarchyCssBuffer,lightHierarchyJsBuffer,aestheticCssBuffer,aestheticJsBuffer,homeAestheticCssBuffer,homeAestheticJsBuffer,globalPolishCssBuffer,globalPolishJsBuffer,digitalFeedCssBuffer,digitalFeedJsBuffer,feedPublishingCssBuffer,feedPublishingJsBuffer]=await Promise.all([
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
        fs.readFile(feedPublishingJsFile)
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
      cachedPublicIndex=html;
    }
    res.setHeader('Cache-Control','no-cache');
    res.type('html').send(cachedPublicIndex);
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
