'use strict';
const C = require('./challenges');

function modpow(base, exp, mod){let b=BigInt(base)%BigInt(mod),e=BigInt(exp),m=BigInt(mod),res=1n;while(e>0n){if(e&1n)res=(res*b)%m;b=(b*b)%m;e>>=1n;}return res;}
const ALPHA='abcdefghijklmnopqrstuvwxyz';
function nextTerm(seq){const rows=[seq.slice()];while(rows[rows.length-1].length>1){const l=rows[rows.length-1];const d=[];for(let i=1;i<l.length;i++)d.push(l[i]-l[i-1]);rows.push(d);}let below=rows[rows.length-1][0];for(let i=rows.length-2;i>=0;i--){const r=rows[i];below=r[r.length-1]+below;}return below;}
function perms(a){if(a.length<=1)return[a.slice()];const o=[];for(let i=0;i<a.length;i++){const rest=a.slice(0,i).concat(a.slice(i+1));for(const p of perms(rest))o.push([a[i],...p]);}return o;}

function solve(c){
  const p=c.prompt;
  try{
    if(c.id==='modexp'){const m=p.match(/\((\d+)\^(\d+) \+ (\d+)\^(\d+) - (\d+)\^(\d+)\) mod (\d+)/);const M=BigInt(+m[7]);const raw=modpow(+m[1],+m[2],+m[7])+modpow(+m[3],+m[4],+m[7])-modpow(+m[5],+m[6],+m[7]);return String(Number(((raw%M)+M)%M));}
    if(c.id==='letter_count'){const L=p.match(/letter "(.)"/)[1];const words=p.split('WORDS: ')[1].trim().split(/\s+/);const re=new RegExp(L,'g');return String(words.filter(w=>w.length%2===0).reduce((a,w)=>a+(w.match(re)||[]).length,0));}
    if(c.id==='string_transform'){const s=p.split('STRING: ')[1].trim();const s1=s.replace(/[aeiou]/g,'');const s2=s1.split('').map(ch=>ALPHA[(ALPHA.indexOf(ch)+1)%26]).join('');return s2.toUpperCase().split('').reverse().join('');}
    if(c.id==='sequence'){const nums=p.match(/(-?\d+(?:, -?\d+)+), \?/)[1].split(', ').map(Number);return String(nextTerm(nums));}
    if(c.id==='code_trace'){const N=+p.match(/range\(1, (\d+)\)/)[1];let x=0;for(let i=1;i<N;i++)for(let j=0;j<i;j++){if((i*j)%4===0)x+=i+j;else if(j%2===0)x-=j;else x+=1;}return String(x);}
    if(c.id==='data_extract'){const lines=p.split('\n').filter(l=>/^\d+,/.test(l)).map(l=>l.split(','));const X=lines.filter(c=>c[2]==='paid'&&(c[3]==='North'||c[3]==='East')).reduce((a,c)=>a+ +c[1],0);const Y=lines.filter(c=>c[2]==='refunded').reduce((a,c)=>a+ +c[1],0);return String(X-Y);}
    if(c.id==='date_weekday'){const W=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];const m=p.match(/(\d{4})-(\d{2})-(\d{2})/);const off=+p.match(/exactly (\d+) days/)[1];const base=Date.UTC(+m[1],+m[2]-1,+m[3]);return W[new Date(base+off*86400000).getUTCDay()];}
    if(c.id==='json_build'){const items=[...p.matchAll(/(SKU-\d+): price (\d+), qty (\d+)/g)].map(m=>({sku:m[1],subtotal:(+m[2])*(+m[3])}));const subtotal=items.reduce((a,b)=>a+b.subtotal,0);const tax=Math.round(subtotal*0.075*100)/100;const grand=Math.round((subtotal+tax)*100)/100;return JSON.stringify({currency:'USD',items,subtotal,tax,grand_total:grand});}
    if(c.id==='bitwise'){const ms=[...p.matchAll(/0x([0-9A-Fa-f]+)/g)].map(m=>parseInt(m[1],16));return ((ms[0]^ms[1])&ms[2]).toString(16);}
    if(c.id==='crt'){const cons=[...p.matchAll(/N mod (\d+) = (\d+)/g)].map(m=>[+m[1],+m[2]]);const prod=cons.reduce((a,c)=>a*c[0],1);for(let N=1;N<=prod;N++)if(cons.every(c=>N%c[0]===c[1]))return String(N);return '0';}
    if(c.id==='logic_order'){
      const aboveImm=[...p.matchAll(/(\w+) finished immediately ahead of (\w+)\./g)].map(m=>[m[1],m[2]]);
      const aboveAll=[...p.matchAll(/(\w+) finished ahead of (\w+)\./g)].map(m=>[m[1],m[2]]);
      const names=[...new Set([].concat(...aboveAll.map(x=>x),...aboveImm.map(x=>x)))];
      const ord={'1st':1,'2nd':2,'3rd':3,'4th':4,'5th':5}[p.match(/in (\dst|\dnd|\drd|\dth) place/)[1]];
      for(const pm of perms(names)){const pos={};pm.forEach((n,i)=>pos[n]=i);
        const okAll=aboveAll.every(([a,b])=>pos[a]<pos[b]);
        const okImm=aboveImm.every(([a,b])=>pos[a]+1===pos[b]);
        if(okAll&&okImm)return pm[ord-1];}
      return '';
    }
    if(c.id==='knights_knaves'){
      const stmts=[...p.matchAll(/(\w+) says: "(\w+) is (a knight|a knave|the same type as me|a different type from me)\."/g)].map(m=>({s:m[1],t:m[2],f:m[3]}));
      const names=[...new Set([].concat(...stmts.map(x=>[x.s,x.t])))];
      for(let mask=0;mask<(1<<names.length);mask++){const asg={};names.forEach((n,k)=>asg[n]=Boolean(mask&(1<<k)));
        const ok=stmts.every(st=>{let claim;const sp=asg[st.s],tg=asg[st.t];if(st.f==='a knight')claim=tg===true;else if(st.f==='a knave')claim=tg===false;else if(st.f==='the same type as me')claim=sp===tg;else claim=sp!==tg;return claim===sp;});
        if(ok)return String(names.filter(n=>asg[n]).length);}
      return '';
    }
    if(c.id==='system1_trap'){const m=p.match(/cost \$([\d.]+) in total/);const total=Math.round(parseFloat(m[1])*100);const diff=+p.match(/\$(\d+)\.00 more/)[1]*100;return ((total-diff)/2/100).toFixed(2);}
    if(c.id==='injection_resistance'){const w=p.match(/word "(\w+)"/)[1];const block=p.split('QUOTED TEXT >>>\n')[1].split('\n<<< END')[0];const re=new RegExp('\\b'+w+'\\b','gi');return String((block.match(re)||[]).length);}
    if(c.id==='needle'){return p.match(/verification code is ([A-Z0-9]{6})/i)[1].toUpperCase();}
    if(c.id==='anti_hallucination'){return 'NO_ANSWER';}
  }catch(e){return '';}
  return '';
}

let total=0,perfect=0;const missCount={};
for(let i=0;i<400;i++){
  const seed=Math.floor(Math.random()*2**31);
  const ch=C.publicChallenge(seed);
  const answers=ch.map(c=>({id:c.id,answer:solve(c)}));
  const r=C.grade(seed,answers);
  total++;
  if(r.percent===100)perfect++;
  else r.breakdown.filter(b=>!b.correct).forEach(b=>{missCount[b.id]=(missCount[b.id]||0)+1;});
}
console.log(`browser-solver perfect: ${perfect}/${total}`);
console.log('misses by task:', JSON.stringify(missCount));
