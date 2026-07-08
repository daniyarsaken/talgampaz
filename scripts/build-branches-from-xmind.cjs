const fs=require('fs'), zlib=require('zlib');
const Admless=null;
// read enrichment (descRu etc.) from current index.html BRANCHES
const html=fs.readFileSync('/home/user/talgampaz/index.html','utf8');
const s=html.indexOf('[', html.indexOf('const BRANCHES = ['));
let d=0,end=-1; for(let i=s;i<html.length;i++){const c=html[i]; if(c==='[')d++; else if(c===']'){d--; if(!d){end=i;break;}}}
const OLD=eval(html.slice(s,end+1));
const variants={}; // term -> [{desc,descRu,gloss,tr,gen}]
(function walk(ns){ns.forEach(n=>{ if(n.term){ (variants[n.term]=variants[n.term]||[]).push({desc:n.desc,descRu:n.descRu,gloss:n.gloss,tr:n.tr,gen:n.gen}); } if(n.children) walk(n.children); });})(OLD);

// read user's xmind via python-produced json (already validated) -> re-extract here with unzip
const { execSync }=require('child_process');
const jsonStr=execSync(`python3 -c "import zipfile,sys; sys.stdout.write(zipfile.ZipFile('/root/.claude/uploads/8ec2f66a-cda1-5452-9373-8fb1fd1f075b/e483f7f4-talgampaztuystyq.xmind').read('content.json').decode('utf-8'))"`).toString();
const content=JSON.parse(jsonStr);
const root=content[0].rootTopic;

const CATMETA={
 'Ұрпақ':{id:'urpaq',tag:'Төмен',dir:'потомки ↓',hue:145,labelRu:'Потомки'},
 'Ата-ана':{id:'ata-ana',tag:'Түбір',dir:'родители и предки',hue:210,labelRu:'Родители'},
 'Бауырлар':{id:'bauyr',tag:'Қатар',dir:'братья и сёстры',hue:275,labelRu:'Братья и сёстры'},
 'Қайын жұрт':{id:'qaiyn',tag:'Құда',dir:'родня через брак',hue:42,labelRu:'Родня через брак'},
 'Құда-жекжат':{id:'quda',tag:'Жекжат',dir:'сватья',hue:100,labelRu:'Сваты'}
};
const GROUPRU={
 'Әке жағы':'Родня по отцу','Әке буыны':'Поколение отца','Немере ағайын':'Двоюродные','Аталас':'Родня по деду',
 'Нағашы ата-әже':'Дед и бабушка по матери','Нағашы аға-апа':'Дяди и тёти по матери','Жиен-бөле':'Племянники и двоюродные',
 'Ер бауырлар':'Братья','Қыз бауырлар':'Сёстры','Жеңге-жезде':'Супруги брата/сестры','Жалпы':'Общие',
 'Қайын ата-ене':'Свёкор и свекровь','Қайын аға-іні':'Братья супруга','Абысын-бажа':'Свояки','Келін-күйеу':'Невестка и зять',
 'Құда-құдағи':'Сват и сватья','Жас буын':'Молодое поколение'
};
function parseGen(str){ if(!str) return 0; str=str.trim(); if(str.startsWith('+')) return parseInt(str); if(str.startsWith('-')) return parseInt(str); return 0; }
function noteParse(note){
  if(!note) return {};
  const lines=note.split('\n'); let tr=null,gen=0,descLines=lines;
  if(lines[0].includes(' · ')){ const [a,b]=lines[0].split(' · '); tr=a.trim(); gen=parseGen((b||'').replace('буын','')); descLines=lines.slice(1); }
  return {tr,gen,desc:descLines.join(' ').trim()};
}
function enrich(term, kkDesc){
  const vs=variants[term]||[];
  if(!vs.length) return {};
  let v=vs.find(x=>x.desc===kkDesc)||vs[0];
  return {descRu:v.descRu, glossFallback:v.gloss, trFallback:v.tr, genFallback:v.gen};
}
let infoCount=0;
function conv(t, depth){
  const rawTitle=t.title||''; const primary=rawTitle.split('\n')[0].trim();
  const note=(t.notes&&t.notes.plain&&t.notes.plain.content)||'';
  const kids=(t.children&&t.children.attached)||[];
  const isInfo = primary.includes(' — ');
  const out={};
  if(isInfo){
    const parts=primary.split(' — ');
    out.term=parts[0].trim(); out.gloss=parts.slice(1).join(' — ').trim();
    const np=noteParse(note); const en=enrich(out.term, np.desc);
    out.tr=np.tr||en.trFallback||''; out.gen=(np.tr?np.gen:(en.genFallback||0));
    out.desc=np.desc|| ''; if(!out.desc){ const v=(variants[out.term]||[])[0]; out.desc=v?v.desc:''; }
    if(en.descRu) out.descRu=en.descRu;
    infoCount++;
  } else {
    out.label=primary; if(GROUPRU[primary]) out.labelRu=GROUPRU[primary];
  }
  if(kids.length) out.children=kids.map(k=>conv(k,depth+1));
  return out;
}
const cats=(root.children.attached).map(cat=>{
  const label=cat.title.split('\n')[0].trim();
  const meta=CATMETA[label]||{id:label,tag:'',dir:'',hue:200,labelRu:''};
  const note=(cat.notes&&cat.notes.plain&&cat.notes.plain.content)||'';
  const kids=(cat.children&&cat.children.attached)||[];
  return { id:meta.id, label, labelRu:meta.labelRu, tag:meta.tag, dir:meta.dir, hue:meta.hue, note, children:kids.map(k=>conv(k,2)) };
});
fs.writeFileSync('branches.json', JSON.stringify(cats,null,1));
console.log('top categories:', cats.map(c=>c.label).join(', '));
console.log('info nodes (terms):', infoCount);
// quick structure preview
function pv(n,d){ const t=n.term?('· '+n.term+' — '+n.gloss+(n.children?' [+'+n.children.length+']':'')):('# '+n.label); console.log('  '.repeat(d)+t); (n.children||[]).forEach(c=>pv(c,d+1)); }
cats.forEach(c=>{ console.log('# '+c.label); (c.children||[]).forEach(c2=>pv(c2,1)); });
