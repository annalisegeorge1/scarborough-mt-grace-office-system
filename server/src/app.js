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
      const [runtimeBuffer,sidebarCssBuffer,sidebarJsBuffer,focusedCssBuffer,focusedJsBuffer,focusedLayoutCssBuffer,focusedLayoutJsBuffer]=await Promise.all([
        fs.readFile(runtimeFile),
        fs.readFile(sidebarCssFile),
        fs.readFile(sidebarJsFile),
        fs.readFile(focusedCssFile),
        fs.readFile(focusedJsFile),
        fs.readFile(focusedLayoutCssFile),
        fs.readFile(focusedLayoutJsFile)
      ]);
      const versionFor=(buffer)=>crypto.createHash('sha256').update(buffer).digest('hex').slice(0,12);
      const runtime=`<script src="/assets/public-content-runtime.js?v=${versionFor(runtimeBuffer)}" defer></script>`;
      const sidebarCss=`<link rel="stylesheet" href="/assets/district-sidebar-v202.css?v=${versionFor(sidebarCssBuffer)}">`;
      const sidebarJs=`<script src="/assets/district-sidebar-v202.js?v=${versionFor(sidebarJsBuffer)}" defer></script>`;
      const focusedCss=`<link rel="stylesheet" href="/assets/district-focused-pages-v203.css?v=${versionFor(focusedCssBuffer)}">`;
      const focusedJs=`<script src="/assets/district-focused-pages-v203.js?v=${versionFor(focusedJsBuffer)}" defer></script>`;
      const focusedLayoutCss=`<link rel="stylesheet" href="/assets/district-focused-layout-v204.css?v=${versionFor(focusedLayoutCssBuffer)}">`;
      const focusedLayoutJs=`<script src="/assets/district-focused-layout-v204.js?v=${versionFor(focusedLayoutJsBuffer)}" defer></script>`;
      if(!html.includes('/assets/district-sidebar-v202.css')){
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,sidebarCss+'</head>'):sidebarCss+html;
      }
      if(!html.includes('/assets/district-focused-pages-v203.css')){
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,focusedCss+'</head>'):focusedCss+html;
      }
      if(!html.includes('/assets/district-focused-layout-v204.css')){
        html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,focusedLayoutCss+'</head>'):focusedLayoutCss+html;
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
