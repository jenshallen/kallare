/* Vinkällaren – mat och vin. Delad logik för mobilappen och vinlistan hos Claude.
   Varje vin har en stilprofil (prof): b fyllighet 1–5, t tanniner 0–5, a syra 1–5, s sötma 0–5,
   o ek 0–5, f mousserande 0/1, g druva, tags stilord. Rätterna nedan beskriver vad de vill ha. */
(function(root){
"use strict";
const norm=s=>String(s||"").toLowerCase().replace(/[éèêë]/g,"e").replace(/[àâá]/g,"a").replace(/[ôó]/g,"o").replace(/ç/g,"c").replace(/[üú]/g,"u").replace(/[íî]/g,"i").replace(/\s+/g," ");

/* ---------- reservprofil när ett vin saknar prof ---------- */
function guessProf(w){
  const n=norm([w.name,w.producer,w.sub,w.region,w.style].join(" ")), ty=w.type||"";
  const P=(b,t,a,s,o,f,g,tags)=>({b,t,a,s,o,f,g,tags});
  if(ty==="Champagne"||/champagne|cava|cremant|mousser/.test(n)) return P(3,0,5,1,1,1,"chardonnay",["citrus","toast","orchard"]);
  if(ty==="Sött"||/sauternes|tokaj|auslese|eiswein|port/.test(n)) return P(5,0,3,5,2,0,"semillon",["honey","stone","tropical"]);
  if(/riesling|mosel|saar|rheingau|alsace/.test(n)) return P(2,0,5,/spatlese/.test(n)?4:/kabinett/.test(n)?3:1,0,0,"riesling",["citrus","orchard","mineral"]);
  if(ty==="Vitt") return P(4,0,4,0,2,0,"chardonnay",["citrus","orchard","nut"]);
  if(/barolo|barbaresco|nebbiolo|langhe/.test(n)) return P(4,5,5,0,1,0,"nebbiolo",["red","floral","earth","spice"]);
  if(/brunello|chianti|sangiovese|montalcino/.test(n)) return P(4,4,4,0,2,0,"sangiovese",["red","earth","herb"]);
  if(/bourgogne|burgund|cote de nuits|cote de beaune|pinot|chambolle|gevrey|vosne|pommard|volnay/.test(n)) return P(3,2,4,0,2,0,"pinot",["red","earth","floral"]);
  if(/rhone|cote rotie|hermitage|syrah|shiraz|cornas/.test(n)) return P(5,4,4,0,2,0,"syrah",["dark","pepper","smoke"]);
  if(/ribera|rioja|tempranillo|toro|vega sicilia/.test(n)) return P(5,4,3,0,4,0,"tempranillo",["dark","spice","toast"]);
  if(/saint-emilion|st-emilion|pomerol|merlot/.test(n)) return P(4,4,4,0,3,0,"merlot",["red","dark","herb"]);
  if(/bordeaux|pauillac|margaux|estephe|julien|napa|cabernet/.test(n)) return P(5,5,3,0,3,0,"cabernet",["dark","herb","earth"]);
  return P(4,3,3,0,2,0,"",["dark"]);
}
const prof=w=>w.prof||guessProf(w);

/* ---------- rätter ---------- */
/* want: [min,max] per egenskap. g: druvor som passar extra bra (+). tags: stilord som lyfter. types: vintyper som passar. */
const D=(id,name,kw,want,g,tags,types,why)=>({id,name,kw,want,g,tags,types,why});
const DISHES=[
 D("beef","Rött kött",["entrecote","ryggbiff","oxfile","biff","ribeye","rib-eye","rib eye","t-bone","tbone","steak","oxkind","hamburgare","burgare","tournedos","flankstek","flank","picanha","hangar","bavette","nötkött","notkott","oxkött","oxkott","chateaubriand","tomahawk","entrecôte","côte de boeuf","cote de boeuf"],
   {b:[4,5],t:[3,5],a:[3,5],s:[0,0]},["cabernet","tempranillo","syrah","merlot","nebbiolo"],["dark","spice","herb"],["Rött"],"Tanninerna möter köttets protein och fett."),
 D("stew","Gryta och långkok",["gryta","bourguignon","hogrev","oxsvans","kalops","osso buco","ossobuco","ragu","boeuf","daube","brasserad","braserad","långkok","langkok","stuvad","chili con carne","oxkinder"],
   {b:[4,5],t:[3,5],a:[3,5],s:[0,0]},["pinot","nebbiolo","sangiovese","syrah","tempranillo","cabernet"],["earth","savory","red","spice"],["Rött"],"Djup och jordighet som matchar den långkokta såsen."),
 D("lamb","Lamm",["lamm","lammstek","lammracks","lammrack","lammfiol","lammkotlett","lammkött","lammkott","lammsadel"],
   {b:[4,5],t:[3,5],a:[3,5],s:[0,0]},["cabernet","syrah","tempranillo","merlot","nebbiolo"],["herb","dark","earth"],["Rött"],"Örtighet och tanniner som passar lammets smak."),
 D("game","Vilt",["älg","alg","hjort","rådjur","radjur","ren ","renstek","renfile","vildsvin","vilt","viltfärs","fasan","rapphöna","rapphona","duva","orre","skogsfågel"],
   {b:[3,5],t:[3,5],a:[4,5],s:[0,0]},["nebbiolo","syrah","pinot","sangiovese","tempranillo"],["earth","red","pepper","savory"],["Rött"],"Syra och jordiga toner som lyfter viltsmaken."),
 D("duck","Anka och gås",["anka","ankbröst","ankbrost","confit","gås","gas ","gåsbröst","ankleg"],
   {b:[3,5],t:[2,4],a:[4,5],s:[0,0]},["pinot","nebbiolo","syrah","merlot"],["red","earth","spice"],["Rött"],"Hög syra skär genom fettet, röd frukt passar fågeln."),
 D("chicken","Kyckling och ljus fågel",["kyckling","kycklingfile","kalkon","pärlhöna","parlhona","majskyckling","coq au vin","fågel","fagel"],
   {b:[2,4],t:[0,3],a:[3,5],s:[0,1]},["chardonnay","pinot"],["orchard","citrus","nut","red"],["Vitt","Champagne","Rött"],"Medelfyllig stil som inte tar över det milda köttet."),
 D("pork","Fläsk",["fläskfile","flaskfile","fläsk","flask","kotlett","karre","karré","revben","spareribs","pulled pork","sidfläsk","sidflask","skinka","julskinka","porchetta","fläskkarré","grisfile","gris"],
   {b:[3,4],t:[0,3],a:[4,5],s:[0,2]},["pinot","riesling","chardonnay","sangiovese"],["red","orchard","spice"],["Rött","Vitt","Champagne"],"Frisk syra och lagom kropp till det milda fläsket."),
 D("veal","Kalv",["kalv","kalvfile","kalvschnitzel","wienerschnitzel","schnitzel","vitello","kalvstek","kalvkotlett","saltimbocca"],
   {b:[3,4],t:[1,3],a:[4,5],s:[0,0]},["chardonnay","pinot","nebbiolo"],["orchard","nut","red","floral"],["Vitt","Rött"],"Elegans och syra som passar kalvens finess."),
 D("oilyfish","Lax och fet fisk",["lax","röding","roding","tonfisk","makrill","sill","gravlax","rökt lax","rokt lax","halstrad lax","laxfile","ål","sejrom"],
   {b:[2,4],t:[0,2],a:[4,5],s:[0,1]},["chardonnay","pinot","riesling"],["citrus","mineral","orchard","red"],["Vitt","Champagne"],"Syran balanserar fiskens fett."),
 D("whitefish","Vit fisk",["torsk","sej","kolja","gös","gos ","piggvar","hälleflundra","halleflundra","sjötunga","sjotunga","abborre","rödspätta","rodspatta","fisk","havsabborre","bläckfisk","blackfisk","fiskgryta","bouillabaisse","fish"],
   {b:[2,4],t:[0,1],a:[4,5],s:[0,1]},["chardonnay","riesling"],["citrus","mineral","orchard","nut"],["Vitt","Champagne"],"Fräsch syra och mineral som låter fisken stå i centrum."),
 D("shellfish","Skaldjur",["hummer","kräftor","kraftor","kräfta","räkor","rakor","räksmörgås","krabba","pilgrimsmusslor","pilgrim","musslor","havskräftor","havskraftor","scampi","skaldjur","langust","skaldjursplatå","moules"],
   {b:[2,4],t:[0,0],a:[4,5],s:[0,1]},["chardonnay","riesling"],["citrus","mineral","toast"],["Champagne","Vitt"],"Hög syra och mineral till skaldjurens sälta och sötma."),
 D("oyster","Ostron och rom",["ostron","kaviar","löjrom","lojrom","stenbitsrom","rom ","sashimi","crudo","ceviche","tartar på fisk"],
   {b:[1,3],t:[0,0],a:[5,5],s:[0,1]},["chardonnay"],["citrus","mineral","toast"],["Champagne","Vitt"],"Knivskarp syra och sälta – klassisk champagnematch."),
 D("asian","Asiatiskt och kryddstarkt",["sushi","thai","curry","indisk","indiskt","kryddig","kryddstark","stark","chili","wok","sötsur","sotsur","asiatisk","asiatiskt","koreansk","vietnamesisk","pad thai","dumplings","ramen","tikka","tandoori","szechuan","kimchi"],
   {b:[1,3],t:[0,1],a:[4,5],s:[1,4]},["riesling"],["citrus","orchard","floral","tropical"],["Vitt","Champagne"],"Lite restsötma och låg alkohol dämpar hettan."),
 D("tomato","Pasta, pizza och tomat",["pizza","tomat","bolognese","lasagne","pasta","spaghetti","arrabiata","amatriciana","penne","italienskt","italiensk","parmigiana","caponata"],
   {b:[3,4],t:[2,4],a:[4,5],s:[0,0]},["sangiovese","nebbiolo"],["red","herb","earth"],["Rött"],"Hög syra som klarar tomatens syrlighet."),
 D("mushroom","Svamp, tryffel och risotto",["tryffel","svamp","kantarell","karljohan","risotto","champinjon","murklor","shiitake","svampsås","svampsas","porcini"],
   {b:[3,5],t:[1,4],a:[4,5],s:[0,0]},["nebbiolo","pinot","tempranillo","chardonnay"],["earth","savory","floral","nut"],["Rött","Vitt"],"Jordiga, mogna toner som speglar svampen."),
 D("bbq","Grillat och rökt",["grillat","grill","bbq","barbecue","grillad","rökt","rokt","rökig","texas","brisket","spett","kebab","pulled"],
   {b:[4,5],t:[3,5],a:[3,4],s:[0,1]},["syrah","cabernet","tempranillo"],["smoke","spice","pepper","dark"],["Rött"],"Kraftig frukt och rökighet som tål grillsmaken."),
 D("hardcheese","Lagrad ost",["parmesan","parmigiano","comte","comté","lagrad ost","cheddar","gruyere","gruyère","västerbotten","vasterbotten","prästost","prastost","manchego","pecorino","ostbricka","ost"],
   {b:[3,5],t:[2,4],a:[4,5],s:[0,1]},["nebbiolo","tempranillo","chardonnay","sangiovese"],["nut","earth","toast"],["Rött","Champagne","Vitt"],"Syra och struktur som matchar ostens sälta och umami."),
 D("bluecheese","Ädelost",["ädelost","adelost","roquefort","gorgonzola","stilton","blåmögel","blamogel","blåmögelost"],
   {b:[3,5],t:[0,1],a:[3,5],s:[4,5]},["semillon","riesling"],["honey","stone"],["Sött","Vitt"],"Söt och salt – sött vin är den klassiska kombinationen."),
 D("softcheese","Vit- och getost",["chevre","chèvre","getost","brie","camembert","vitmögel","vitmogel","burrata","mozzarella","fetaost"],
   {b:[2,4],t:[0,1],a:[4,5],s:[0,2]},["riesling","chardonnay"],["citrus","mineral","orchard"],["Vitt","Champagne"],"Frisk syra mot ostens krämighet."),
 D("dessert","Dessert",["dessert","äppelpaj","appelpaj","tarte tatin","creme brulee","crème brûlée","fruktsallad","mandeltårta","mandeltarta","pannacotta","panna cotta","cheesecake","tårta","tarta","paj","sorbet","glass","citronpaj","clafoutis"],
   {b:[3,5],t:[0,0],a:[3,5],s:[4,5]},["semillon","riesling"],["honey","stone","tropical","citrus"],["Sött","Vitt"],"Vinet bör vara minst lika sött som desserten."),
 D("chocolate","Choklad",["choklad","chokladfondant","brownie","chokladtårta","chokladtarta","mörk choklad","tryffelpralin"],
   {b:[5,5],t:[2,4],a:[3,4],s:[0,5]},["syrah","tempranillo","cabernet","semillon"],["dark","spice","honey"],["Sött","Rött"],"Svår match – ett mycket fylligt, fruktigt vin eller sött vin klarar sig bäst."),
 D("foiegras","Gåslever och terrin",["foie gras","foie","gåslever","gaslever","terrin","paté","pate","pastej","leverpastej"],
   {b:[4,5],t:[0,1],a:[3,5],s:[3,5]},["semillon","riesling"],["honey","stone"],["Sött","Vitt","Champagne"],"Sötma och syra balanserar levern rikedom."),
 D("aperitif","Fördrink och tilltugg",["aperitif","fördrink","fordrink","tilltugg","chips","nyår","nyar","fest","mingel","snittar","toast skagen","skagen","canapé","canape","bubbel","firande","välkomstdrink","valkomstdrink","jordgubbar"],
   {b:[2,4],t:[0,0],a:[4,5],s:[0,1]},["chardonnay","pinot"],["citrus","toast","orchard"],["Champagne"],"Mousse och syra väcker aptiten."),
 D("veg","Grönsaker och vegetariskt",["grönsaker","gronsaker","sallad","vegetarisk","vego","vegansk","sparris","grönsaksgratäng","linser","bönor","bonor","halloumi","falafel","tofu"],
   {b:[2,3],t:[0,2],a:[4,5],s:[0,2]},["riesling","chardonnay","pinot"],["citrus","herb","orchard","mineral"],["Vitt","Champagne","Rött"],"Frisk stil utan kraftig ek och tannin."),
 D("homestyle","Husman",["köttbullar","kottbullar","pannbiff","kåldolmar","kaldolmar","wallenbergare","biff à la lindström","lindström","korv","stroganoff","isterband","kroppkakor","pytt"],
   {b:[3,4],t:[2,3],a:[4,5],s:[0,1]},["pinot","sangiovese","nebbiolo","tempranillo"],["red","earth","spice"],["Rött"],"Lagom kropp och syra till husmanssåserna."),
 D("festive","Julbord och högtid",["julbord","jul","påsk","pask","midsommar","sillbord","smörgåsbord","smorgasbord"],
   {b:[2,4],t:[0,2],a:[4,5],s:[0,3]},["riesling","chardonnay","pinot"],["citrus","toast","orchard"],["Champagne","Vitt"],"Mångsidig, frisk stil som klarar många smaker på en gång.")
];
/* tillägg: såser, tillbehör och tillagning */
const M=(id,name,kw,fn,why)=>({id,name,kw,fn,why});
const MODS=[
 M("rich","Smör- eller gräddsås",["bea","bearnaise","béarnaise","hollandaise","beurre blanc","smörsås","smorsas","gräddsås","graddsas","grädde","gradde","ostsås","ostsas","carbonara","aioli","majonnäs","majonnas","remoulad","gratäng","gratang","pommes","mos"],
   w=>{w.a[0]=Math.max(w.a[0],4);w.b[0]=Math.max(w.b[0],3);},"syran skär genom den feta såsen"),
 M("redwine","Rödvinssås",["rödvinssås","rodvinssas","rödvin","rodvin","demi","demi-glace","skysås","skysas","jus"],
   w=>{w.b[0]=Math.max(w.b[0],4);w.types=["Rött"];},"fylligt rött speglar den mörka såsen"),
 M("pepper","Pepparsås",["peppar","pepparsås","pepparsas","au poivre","grönpeppar","gronpeppar"],
   w=>{w.tags=[...w.tags,"pepper","spice"];w.g=[...w.g,"syrah"];},"kryddiga toner möter pepparn"),
 M("mush","Svamp/tryffel",["tryffel","svamp","kantarell","karljohan","murklor","champinjon"],
   w=>{w.tags=[...w.tags,"earth","savory"];w.g=[...w.g,"nebbiolo","pinot"];},"jordighet som matchar svampen"),
 M("acid","Citron och vinäger",["citron","lime","vinaigrette","kapris","tomatsalsa","sylt"],
   w=>{w.a[0]=Math.max(w.a[0],4);},"hög syra klarar citrus och vinäger"),
 M("spicy","Hetta",["chili","stark","kryddig","kryddstark","jalapeno","sriracha","harissa","wasabi"],
   w=>{w.t[1]=Math.min(w.t[1],2);w.s[1]=Math.max(w.s[1],3);w.s[0]=Math.max(w.s[0],1);w.b[1]=Math.min(w.b[1],3);},"låga tanniner och lite sötma tål hettan"),
 M("sweet","Söt glaze",["honung","glaze","glasyr","teriyaki","lönnsirap","lonnsirap","sötsur","sotsur","bbq-sås","bbq sas"],
   w=>{w.s[1]=Math.max(w.s[1],2);},"fruktighet som matchar sötman"),
 M("smoke","Grillat/rökt",["grillad","grillat","rökt","rokt","kolgrill","eld"],
   w=>{w.tags=[...w.tags,"smoke","spice"];},"rökiga toner tål grillsmaken"),
 M("herbs","Örter",["rosmarin","timjan","salvia","dragon","örter","orter","pesto","gremolata","chimichurri"],
   w=>{w.tags=[...w.tags,"herb"];},"örtighet i vinet möter örterna")
];

function detect(text){
  const t=" "+norm(text)+" ";
  const hit=kw=>kw.some(k=>t.includes(norm(k)));
  // längsta nyckelord vinner bland rätterna
  const PRI={asian:3,beef:2,stew:2,lamb:2,game:2,duck:2,chicken:2,pork:2,veal:2,oilyfish:2,whitefish:2,shellfish:2,oyster:2,foiegras:2,bluecheese:2,dessert:2,chocolate:2,homestyle:2,tomato:1,festive:1};
  let mains=DISHES.map(d=>({d,len:Math.max(0,...d.kw.filter(k=>t.includes(norm(k))).map(k=>k.length))})).filter(x=>x.len>0).sort((a,b)=>(PRI[b.d.id]||0)-(PRI[a.d.id]||0)||b.len-a.len).map(x=>x.d);
  const mods=MODS.filter(m=>hit(m.kw));
  // en sås som också är huvudrätt (t.ex. svamp) räknas bara som tillägg om det finns ett kött
  return {main:mains[0]||null,others:mains.slice(1),mods};
}
function wantFor(det){
  const d=det.main; if(!d) return null;
  const w={b:[...d.want.b],t:[...d.want.t],a:[...d.want.a],s:[...d.want.s],g:[...d.g],tags:[...d.tags],types:[...d.types]};
  for(const o of det.others.slice(0,1)){ o.tags.forEach(x=>w.tags.push(x)); }
  for(const m of det.mods) m.fn(w);
  return w;
}
const STATUS_PTS={peak:14,now:9,late:8,early:4,past:-6,young:-30,none:0};
function scoreWine(wine,want,statusOf){
  const p=prof(wine); let s=60; const why=[];
  const dist=(v,[lo,hi])=>v<lo?lo-v:v>hi?v-hi:0;
  const db=dist(p.b,want.b),dt=dist(p.t,want.t),da=dist(p.a,want.a),ds=dist(p.s,want.s);
  s-=db*7+dt*8+da*7+ds*10;
  if(want.t[1]<=1&&p.t>=3) s-=12;            // tanninrikt till fisk/skaldjur
  if(want.s[0]>=3&&p.s<2) s-=20;             // torrt vin till söt dessert
  if(want.types.includes(wine.type)) s+=8; else s-=6;
  if(p.g&&want.g.includes(p.g)) {s+=8;}
  const tagHits=(p.tags||[]).filter(x=>want.tags.includes(x)); s+=Math.min(12,tagHits.length*4);
  if(p.f&&want.types.includes("Champagne")) s+=4;
  const st=statusOf?statusOf(wine):"none"; s+=STATUS_PTS[st]||0;
  return {score:Math.max(0,Math.min(100,Math.round(s))),st,tagHits,p};
}
const TAGNAME={dark:"mörk frukt",red:"röd frukt",citrus:"citrus",orchard:"äpple och päron",stone:"stenfrukt",tropical:"tropisk frukt",herb:"örter",earth:"jordighet",mineral:"mineral",spice:"kryddor",pepper:"peppar",smoke:"rökighet",toast:"rostade toner",nut:"nötter",honey:"honung",floral:"blommighet",savory:"umami"};
const STNAME={peak:"vid topp nu",now:"drickfärdig",late:"i sitt sena skede – drick snart",early:"nyss öppnat",past:"förbi sitt fönster",young:"egentligen för ungt",none:""};
function explain(det,r){
  const parts=[det.main.why];
  if(r.tagHits.length) parts.push("Har "+r.tagHits.slice(0,2).map(x=>TAGNAME[x]||x).join(" och ")+".");
  if(det.mods.length) parts.push("Med "+det.mods[0].name.toLowerCase()+": "+det.mods[0].why+".");
  if(STNAME[r.st]) parts.push("Vinet är "+STNAME[r.st]+".");
  return parts.join(" ");
}
const TIERS=[{id:"low",name:"Vardag",sub:"under 1 000 kr",lo:0,hi:999},{id:"mid",name:"Mellan",sub:"1 000–2 500 kr",lo:1000,hi:2500},{id:"high",name:"Fest",sub:"över 2 500 kr",lo:2501,hi:1e9}];
function recommend(text,wines,statusOf,opts){
  opts=opts||{}; const per=opts.perTier||3;
  const det=detect(text); const want=wantFor(det);
  if(!want) return {det,want:null,best:[],tiers:[]};
  const pool=wines.filter(w=>(w.qty||0)>0&&w.place!=="Primör").map(w=>({w,...scoreWine(w,want,statusOf)})).filter(x=>x.score>=35);
  pool.sort((a,b)=>b.score-a.score||(a.w.value||0)-(b.w.value||0));
  // en rad per vin+årgång (magnum och helflaska slås ihop)
  const seen=new Set(), uniq=[];
  for(const x of pool){const k=(x.w.name||"")+"|"+(x.w.year||"");if(seen.has(k))continue;seen.add(k);x.why=explain(det,x);uniq.push(x);}
  // variation: högst ett vin per egendom/cuvée i varje prisklass och bland toppvalen
  const pick=(list,n)=>{const out=[],used=new Set();for(const x of list){const k=(x.w.producer||"")+"|"+(x.w.name||"");if(used.has(k))continue;used.add(k);out.push(x);if(out.length>=n)break;}return out;};
  const tiers=TIERS.map(t=>({...t,items:pick(uniq.filter(x=>(x.w.value||0)>=t.lo&&(x.w.value||0)<=t.hi),per)}));
  return {det,want,best:pick(uniq,3),tiers,all:uniq};
}
function describe(det){
  if(!det.main) return "";
  return [det.main.name,...det.others.slice(0,1).map(o=>o.name.toLowerCase()),...det.mods.map(m=>m.name.toLowerCase())].join(" · ");
}
const QUICK=["Entrecôte med béarnaise","Lammstek","Älgfilé","Anka","Lax","Hummer","Kyckling","Pasta bolognese","Svamprisotto","Ostbricka","Ädelost","Äppelpaj","Fördrink"];
root.Pairing={recommend,detect,describe,guessProf,prof,DISHES,MODS,QUICK,TIERS};
})(typeof window!=="undefined"?window:globalThis);
