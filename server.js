const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({
    users: [],
    books: seedBooks(),
    orders: [],
    favorites: []
  }, null, 2));
}

function seedBooks() {
  return [
    {id:'b1',title:'The Alchemist',author:'Paulo Coelho',category:'Fiction',condition:'Like New',price:320,oldPrice:450,city:'Dhaka',seller:'RidAgain Store',description:'A beautiful story about following your dreams.',image:'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=700',createdAt:Date.now(),status:'available'},
    {id:'b2',title:'Atomic Habits',author:'James Clear',category:'Self Development',condition:'Good',price:380,oldPrice:550,city:'Chattogram',seller:'Book Corner',description:'Small changes, remarkable results.',image:'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=700',createdAt:Date.now()-1000,status:'available'},
    {id:'b3',title:'Sapiens',author:'Yuval Noah Harari',category:'History',condition:'Very Good',price:450,oldPrice:650,city:'Dhaka',seller:'Nafis Books',description:'A brief history of humankind.',image:'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=700',createdAt:Date.now()-2000,status:'available'},
    {id:'b4',title:'পথের পাঁচালী',author:'বিভূতিভূষণ বন্দ্যোপাধ্যায়',category:'বাংলা সাহিত্য',condition:'Good',price:180,oldPrice:260,city:'Rajshahi',seller:'পাতার ঘ্রাণ',description:'বাংলা সাহিত্যের এক কালজয়ী উপন্যাস।',image:'https://images.unsplash.com/photo-1513001900722-370f803f498d?w=700',createdAt:Date.now()-3000,status:'available'},
    {id:'b5',title:'Deep Work',author:'Cal Newport',category:'Productivity',condition:'Like New',price:400,oldPrice:600,city:'Dhaka',seller:'Read & Rise',description:'Rules for focused success in a distracted world.',image:'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=700',createdAt:Date.now()-4000,status:'available'},
    {id:'b6',title:'শেষের কবিতা',author:'রবীন্দ্রনাথ ঠাকুর',category:'বাংলা সাহিত্য',condition:'Acceptable',price:120,oldPrice:200,city:'Sylhet',seller:'বইবাড়ি',description:'রবীন্দ্রনাথের জনপ্রিয় উপন্যাস।',image:'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=700',createdAt:Date.now()-5000,status:'available'}
  ];
}
function readDB(){ return JSON.parse(fs.readFileSync(DB_FILE,'utf8')); }
function writeDB(db){ fs.writeFileSync(DB_FILE, JSON.stringify(db,null,2)); }
function send(res,status,data,headers={}){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8',...headers});res.end(JSON.stringify(data));}
function parseBody(req){return new Promise((resolve,reject)=>{let s='';req.on('data',c=>{s+=c;if(s.length>8*1024*1024) reject(new Error('Request too large'));});req.on('end',()=>{try{resolve(s?JSON.parse(s):{});}catch(e){reject(e);}});});}
function tokenFor(user){return crypto.createHmac('sha256',process.env.SESSION_SECRET||'ridagain-change-this-secret').update(user.id+':'+user.passwordHash).digest('hex');}
function auth(req,db){const h=req.headers.authorization||'';const token=h.replace(/^Bearer\s+/i,'');return db.users.find(u=>token && token===tokenFor(u))||null;}
function safeUser(u){return {id:u.id,name:u.name,email:u.email,city:u.city||''};}
function serveStatic(req,res){
  let p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(p==='/') p='/index.html';
  const full=path.normalize(path.join(PUBLIC,p));
  if(!full.startsWith(PUBLIC)){res.writeHead(403);return res.end('Forbidden');}
  fs.readFile(full,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found');}
    const ext=path.extname(full);const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
    res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream'});res.end(data);
  });
}
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(!url.pathname.startsWith('/api/')) return serveStatic(req,res);
  try{
    const db=readDB(), method=req.method, p=url.pathname;
    if(method==='GET'&&p==='/api/books'){
      let books=db.books.filter(b=>b.status==='available');
      const q=(url.searchParams.get('q')||'').toLowerCase();
      const cat=url.searchParams.get('category')||'';
      const city=url.searchParams.get('city')||'';
      const condition=url.searchParams.get('condition')||'';
      if(q) books=books.filter(b=>[b.title,b.author,b.category,b.seller].join(' ').toLowerCase().includes(q));
      if(cat) books=books.filter(b=>b.category===cat);
      if(city) books=books.filter(b=>b.city===city);
      if(condition) books=books.filter(b=>b.condition===condition);
      return send(res,200,books.sort((a,b)=>b.createdAt-a.createdAt));
    }
    if(method==='POST'&&p==='/api/signup'){
      const body=await parseBody(req);
      if(!body.name||!body.email||!body.password||body.password.length<8) return send(res,400,{error:'নাম, ইমেইল এবং কমপক্ষে ৮ অক্ষরের পাসওয়ার্ড দিন।'});
      if(db.users.some(u=>u.email.toLowerCase()===body.email.toLowerCase())) return send(res,409,{error:'এই ইমেইলে অ্যাকাউন্ট আছে।'});
      const salt=crypto.randomBytes(16).toString('hex');
      const passwordHash=crypto.scryptSync(body.password,salt,64).toString('hex');
      const user={id:crypto.randomUUID(),name:body.name,email:body.email.toLowerCase(),city:body.city||'',salt,passwordHash,createdAt:Date.now()};
      db.users.push(user);writeDB(db);return send(res,201,{token:tokenFor(user),user:safeUser(user)});
    }
    if(method==='POST'&&p==='/api/login'){
      const body=await parseBody(req),u=db.users.find(x=>x.email===String(body.email||'').toLowerCase());
      if(!u||crypto.scryptSync(String(body.password||''),u.salt,64).toString('hex')!==u.passwordHash) return send(res,401,{error:'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।'});
      return send(res,200,{token:tokenFor(u),user:safeUser(u)});
    }
    if(method==='GET'&&p==='/api/me'){
      const u=auth(req,db);return u?send(res,200,{user:safeUser(u)}):send(res,401,{error:'Login required'});
    }
    if(method==='POST'&&p==='/api/books'){
      const u=auth(req,db);if(!u)return send(res,401,{error:'বই বিক্রি করতে লগইন করুন।'});
      const b=await parseBody(req);
      if(!b.title||!b.author||!b.price||!b.category||!b.condition)return send(res,400,{error:'সব প্রয়োজনীয় তথ্য পূরণ করুন।'});
      const book={id:crypto.randomUUID(),title:String(b.title).slice(0,120),author:String(b.author).slice(0,100),category:b.category,condition:b.condition,price:Math.max(1,Number(b.price)),oldPrice:Number(b.oldPrice)||null,city:b.city||u.city||'ঢাকা',seller:u.name, sellerId:u.id,description:String(b.description||'').slice(0,1000),image:b.image||'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=700',createdAt:Date.now(),status:'available'};
      db.books.push(book);writeDB(db);return send(res,201,book);
    }
    if(method==='POST'&&p==='/api/orders'){
      const u=auth(req,db);if(!u)return send(res,401,{error:'অর্ডার করতে লগইন করুন।'});
      const b=await parseBody(req),book=db.books.find(x=>x.id===b.bookId&&x.status==='available');
      if(!book)return send(res,404,{error:'বইটি আর পাওয়া যাচ্ছে না।'});
      if(book.sellerId===u.id)return send(res,400,{error:'নিজের বই নিজে অর্ডার করা যাবে না।'});
      const order={id:crypto.randomUUID(),bookId:book.id,bookTitle:book.title,price:book.price,buyerId:u.id,buyerName:u.name,sellerId:book.sellerId||null,sellerName:book.seller,status:'pending',createdAt:Date.now()};
      db.orders.push(order);writeDB(db);return send(res,201,{message:'অর্ডার রিকোয়েস্ট পাঠানো হয়েছে। বিক্রেতার সঙ্গে যোগাযোগ করে ডেলিভারি নিশ্চিত করুন।',order});
    }
    if(method==='GET'&&p==='/api/my-books'){
      const u=auth(req,db);if(!u)return send(res,401,{error:'Login required'});
      return send(res,200,db.books.filter(b=>b.sellerId===u.id));
    }
    if(method==='GET'&&p==='/api/my-orders'){
      const u=auth(req,db);if(!u)return send(res,401,{error:'Login required'});
      return send(res,200,db.orders.filter(o=>o.buyerId===u.id||o.sellerId===u.id));
    }
    if(method==='DELETE'&&p.startsWith('/api/books/')){
      const u=auth(req,db);if(!u)return send(res,401,{error:'Login required'});
      const id=p.split('/').pop(),book=db.books.find(b=>b.id===id);
      if(!book||book.sellerId!==u.id)return send(res,403,{error:'এই বইটি সরানোর অনুমতি নেই।'});
      book.status='removed';writeDB(db);return send(res,200,{ok:true});
    }
    return send(res,404,{error:'Not found'});
  }catch(e){console.error(e);send(res,500,{error:'Server error'});}
});
server.listen(PORT,()=>console.log(`RidAgain running on ${PORT}`));
