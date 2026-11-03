/* Xiangli: deterministic procedural environment. Three.js r158, no external assets. */
(() => {
'use strict';
const $=id=>document.getElementById(id), canvas=$('scene');
let renderer;
try {renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(e){$('loading').innerHTML='<p>浏览器无法启用 WebGL</p><small>请在支持硬件加速的电脑浏览器中打开。</small>';return;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.88;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(43,innerWidth/innerHeight,.08,450);
scene.background=new THREE.Color('#b9c4c7');scene.fog=new THREE.Fog('#b9c4c7',70,220);
const sun=new THREE.DirectionalLight('#fff1db',2.35);sun.position.set(-30,48,-36);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-65,right:65,top:65,bottom:-65,near:1,far:170});sun.shadow.normalBias=.025;sun.shadow.bias=-.00012;sun.shadow.radius=3;scene.add(sun);
const hemi=new THREE.HemisphereLight('#c8d4df','#534f44',1.1);scene.add(hemi);
const village=new THREE.Group();scene.add(village);
let seed=38107;
function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
function range(a,b){return a+rand()*(b-a);}
const boxGeo=new THREE.BoxGeometry(1,1,1), planeGeo=new THREE.PlaneGeometry(1,1), cylGeo=new THREE.CylinderGeometry(.5,.5,1,12), sphereGeo=new THREE.SphereGeometry(.5,10,7);
const assets={};const materials={};
const blenderAssets=window.XiangliBlenderAssets;
function blendBakedTexture(texture,source,opacity){
 if(!source||typeof Image==='undefined')return;
 const image=new Image(),canvas=texture.image;
 image.onload=()=>{
  const g=canvas.getContext('2d');
  g.save();
  g.globalCompositeOperation='soft-light';
  g.globalAlpha=opacity;
  g.drawImage(image,0,0,canvas.width,canvas.height);
  g.restore();
  texture.needsUpdate=true;
 };
 image.src=source;
}
function tex(name,w,h,draw,color=true){const c=document.createElement('canvas');c.width=w;c.height=h;c.xiangliTexture=name;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);if(color)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());assets[name]=t;return t;}
function noise(g,w,h,n,alpha){for(let i=0;i<n;i++){const v=Math.floor(range(30,170));g.fillStyle=`rgba(${v},${v-3},${v-9},${alpha*rand()})`;g.fillRect(rand()*w,rand()*h,range(.5,2.5),range(.5,3));}}
function wallTexture(name,base,tile){const fresh=name==='clean';return tex(name,768,1536,(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);
 // Correlated colour at several scales: wear must form patches, not just pixel noise.
 for(const scale of [180,70,22])for(let j=0;j<(fresh?15:80);j++){const x=rand()*w,y=rand()*h,r=range(scale*.5,scale*1.8),gr=g.createRadialGradient(x,y,0,x,y,r);const grey=rand()>.23?'34,33,27':'233,223,203';gr.addColorStop(0,`rgba(${grey},${fresh?.025:range(.045,.16)})`);gr.addColorStop(1,`rgba(${grey},0)`);g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}
 if(tile){const brick=name==='wall3',tw=brick?55:32,th=brick?25:19;g.lineWidth=1.3;for(let y=0;y<h;y+=th){g.strokeStyle=fresh?'#797e6730':'#58594c78';g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();g.fillStyle='#edeadd44';g.fillRect(0,y+1,w,1);for(let x=(brick&&y/th%2)*tw/2;x<w;x+=tw){g.fillStyle='#4a4c3f66';g.fillRect(x,y,1,th);if(rand()<.18){g.fillStyle=`rgba(39,41,34,${fresh?.025:range(.04,.2)})`;g.fillRect(x+1,y+2,tw-2,th-3);}}}}
 if(!fresh){
  // Missing ceramic patches reveal grey mortar or older brickwork.
  for(let i=0;i<26;i++){let x=rand()*w,y=rand()*h,r=range(8,40);g.beginPath();for(let j=0;j<12;j++){const a=j*Math.PI/6,rr=r*range(.55,1.5);g.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}g.closePath();g.fillStyle=i%3?'#67675d88':'#928573bb';g.fill();g.strokeStyle='#c9c4b177';g.stroke();}
  for(let i=0;i<190;i++){const x=rand()*w,y=rand()*h,ww=range(1.5,18),hh=range(25,430),gr=g.createLinearGradient(0,y,0,y+hh);gr.addColorStop(0,`rgba(30,34,24,${range(.07,.25)})`);gr.addColorStop(1,'rgba(30,34,24,0)');g.fillStyle=gr;g.fillRect(x,y,ww,hh);}
  // Thick damp bands under parapets and along the pavement.
  for(const top of [true,false]){const gr=g.createLinearGradient(0,top?0:h,0,top?170:h-280);gr.addColorStop(0,'rgba(30,33,24,.55)');gr.addColorStop(.25,'rgba(41,44,28,.3)');gr.addColorStop(1,'rgba(41,44,28,0)');g.fillStyle=gr;g.fillRect(0,top?0:h-280,w,top?170:280);}
  for(let i=0;i<23;i++){g.strokeStyle='#373c2c88';g.lineWidth=range(.5,1.2);g.beginPath();let x=rand()*w,y=rand()*h;g.moveTo(x,y);for(let k=0;k<8;k++){x+=range(-10,12);y+=range(4,18);g.lineTo(x,y);}g.stroke();}
 }
 noise(g,w,h,65000,fresh?.08:.24);
 });}
const wallColors=['#b1a79a','#c3c0ae','#a9b0ab','#a18675','#c8beaa','#a2a49f'];
wallColors.forEach((c,i)=>{const t=wallTexture('wall'+i,c,i!==0&&i!==5);blendBakedTexture(t,blenderAssets?.maps.wall,.48);materials['wall'+i]=new THREE.MeshStandardMaterial({map:t,bumpMap:t,bumpScale:.025,roughness:.97});});
const clean=wallTexture('clean','#e1ddce',true);materials.clean=new THREE.MeshStandardMaterial({map:clean,bumpMap:clean,bumpScale:.012,roughness:.85});
const asphalt=tex('asphalt',768,768,(g,w,h)=>{g.fillStyle='#7b7a73';g.fillRect(0,0,w,h);noise(g,w,h,65000,.55);for(let i=0;i<45;i++){const x=rand()*w,y=rand()*h,r=range(12,90),gr=g.createRadialGradient(x,y,1,x,y,r);gr.addColorStop(0,i%3?'#2c30294a':'#a9a59855');gr.addColorStop(1,'#33392f00');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}for(let i=0;i<24;i++){g.beginPath();g.strokeStyle='#282d26aa';g.lineWidth=range(.6,2);let x=rand()*w,y=rand()*h;g.moveTo(x,y);for(let k=0;k<10;k++){x+=range(-22,22);y+=range(6,23);g.lineTo(x,y);}g.stroke();}});asphalt.wrapS=asphalt.wrapT=THREE.RepeatWrapping;asphalt.repeat.set(12,14);
blendBakedTexture(asphalt,blenderAssets?.maps.road,.56);
materials.road=new THREE.MeshStandardMaterial({map:asphalt,bumpMap:asphalt,bumpScale:.035,roughness:1});
// Mottled pavement with broad repairs and chipped edges, varied at street scale.
const repairs=tex('repairs',512,512,(g,w,h)=>{
 for(let j=0;j<8;j++){
  const x=range(45,w-45),y=range(45,h-45),r=range(10,58);
  g.beginPath();for(let k=0;k<12;k++){const a=k*Math.PI/6,rr=r*range(.63,1.38);g.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr*.55);}g.closePath();
  g.fillStyle=j%3?'#33352d4c':'#aaa39365';g.fill();g.strokeStyle='#262b2155';g.stroke();
 }

});
const repairMat=new THREE.MeshStandardMaterial({map:repairs,transparent:true,depthWrite:false,roughness:.95,polygonOffset:true,polygonOffsetFactor:-2});
const paving=tex('paving',512,512,(g,w,h)=>{g.fillStyle='#a5a49a';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=32)for(let x=-32;x<w;x+=64){let xx=x+(y/32%2)*32;g.fillStyle=`hsl(45,5%,${range(57,68)}%)`;g.fillRect(xx+1,y+1,62,30);g.fillStyle='#e0dfd233';g.fillRect(xx+2,y+2,60,1);}noise(g,w,h,18000,.2);});paving.wrapS=paving.wrapT=THREE.RepeatWrapping;paving.repeat.set(3,3);materials.paving=new THREE.MeshStandardMaterial({map:paving,bumpMap:paving,bumpScale:.025,roughness:1});
const fan=tex('fan',128,128,(g)=>{g.clearRect(0,0,128,128);g.fillStyle='#515650';g.beginPath();g.arc(64,64,53,0,Math.PI*2);g.fill();g.strokeStyle='#9a9c91';g.lineWidth=2;for(let r=10;r<55;r+=6){g.beginPath();g.arc(64,64,r,0,Math.PI*2);g.stroke();}for(let i=0;i<20;i++){const a=i*Math.PI/10;g.beginPath();g.moveTo(64,64);g.lineTo(64+Math.cos(a)*53,64+Math.sin(a)*53);g.stroke();}g.fillStyle='#acada0';g.beginPath();g.arc(64,64,9,0,Math.PI*2);g.fill();});materials.fan=new THREE.MeshStandardMaterial({map:fan,transparent:true,roughness:.85});
const shade=tex('shade',128,128,g=>{const gr=g.createRadialGradient(64,64,4,64,64,64);gr.addColorStop(0,'rgba(20,23,15,.55)');gr.addColorStop(.55,'rgba(20,23,15,.18)');gr.addColorStop(1,'rgba(20,23,15,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);});materials.shadow=new THREE.MeshBasicMaterial({map:shade,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
function mat(color,metal=0,rough=.85){const key=color+'|'+metal+'|'+rough;if(!materials[key])materials[key]=new THREE.MeshStandardMaterial({color,metalness:metal,roughness:rough});return materials[key];}
const M={concrete:mat('#7e8074'),edge:mat('#a09f90'),dark:mat('#343a36'),rust:mat('#785e43',.16),bar:mat('#91998c',.35,.68),pipe:mat('#aaa68f',.08),ac:mat('#a5a894',.08),glass:mat('#25302f',.15,.48),glassLight:mat('#5e6b65',.18,.5),warm:new THREE.MeshStandardMaterial({color:'#c7ac79',emissive:'#d79a44',emissiveIntensity:.25,roughness:.65}),black:mat('#262c26'),curb:mat('#909183'),roof:mat('#717669'),wood:mat('#75604a'),green:mat('#485b3a')};
const residentialLights=[
 new THREE.MeshStandardMaterial({color:'#75817e',roughness:.52,emissive:'#ffc57d',emissiveIntensity:0}),
 new THREE.MeshStandardMaterial({color:'#697777',roughness:.52,emissive:'#d6e1f4',emissiveIntensity:0}),
 new THREE.MeshStandardMaterial({color:'#7d8277',roughness:.54,emissive:'#ffd9a0',emissiveIntensity:0})
];
const globals=new THREE.Group();village.add(globals);
class Builder{
 constructor(root){this.root=root;this.batches=new Map();}
 add(geo,material,x,y,z,w,h,d,rx=0,ry=0,rz=0){let key=geo.uuid+material.uuid;let b=this.batches.get(key);if(!b){b={geo,material,items:[]};this.batches.set(key,b);}const o=new THREE.Object3D();o.position.set(x,y,z);o.rotation.set(rx,ry,rz);o.scale.set(w,h,d);o.updateMatrix();b.items.push(o.matrix.clone());}
 box(x,y,z,w,h,d,m,rx=0,ry=0,rz=0){this.add(boxGeo,m,x,y,z,w,h,d,rx,ry,rz);}
 plane(x,y,z,w,h,m,rx=0,ry=0,rz=0){this.add(planeGeo,m,x,y,z,w,h,1,rx,ry,rz);}
 cylinder(x,y,z,w,h,d,m,rx=0,ry=0,rz=0){this.add(cylGeo,m,x,y,z,w,h,d,rx,ry,rz);}
 finish(){for(const b of this.batches.values()){const mesh=new THREE.InstancedMesh(b.geo,b.material,b.items.length);b.items.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.castShadow=b.geo!==planeGeo;mesh.receiveShadow=true;this.root.add(mesh);}this.batches.clear();}
}
function line(root,points,r=.018,m=M.dark){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,16,r,5,false),m);root.add(mesh);return mesh;}
const titleNames=['阿芬便利店','潮汕鲜粿条','顺记五金水电','巷里裁缝铺','老陈单车维修','街坊早餐','榕树下理发','小刘生鲜'];
// Street-facing trade signs are fictional, with colors concentrated at shop level.
titleNames[1]='顺成辅料';
titleNames[3]='兴发车缝';
titleNames[5]='同兴裁片';
const signMats=[];
for(let i=0;i<titleNames.length;i++){const t=tex('sign'+i,1024,256,(g,w,h)=>{g.fillStyle=['#a8332b','#174d73','#a34130','#216463','#934829','#1d4d66','#a63f32','#506944'][i];g.fillRect(0,0,w,h);noise(g,w,h,14000,.16);g.strokeStyle='#e8e1c588';g.lineWidth=4;g.strokeRect(11,11,w-22,h-22);g.fillStyle='#f0e9cf';g.font='bold 112px "Microsoft YaHei",sans-serif';g.textBaseline='middle';g.textAlign='center';g.fillText(titleNames[i],w/2,107,w-55);g.font='24px sans-serif';g.fillStyle='#e2dac0bb';g.fillText(['便 民 日 常 · 街 坊 小 店','每日现做 · 欢迎光临','维修安装 · 服务街坊','来料加工 · 衣物修补'][i%4],w/2,207,w-60);});signMats.push(new THREE.MeshStandardMaterial({map:t,roughness:.9,emissive:'#ffffff',emissiveMap:t,emissiveIntensity:.04}));}
const shutter=tex('shutter',256,256,(g,w,h)=>{g.fillStyle='#8b8c7f';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=8){g.fillStyle='#50584a66';g.fillRect(0,y,w,2);g.fillStyle='#d5d7bc55';g.fillRect(0,y+3,w,1);}noise(g,w,h,8000,.15);});materials.shutter=new THREE.MeshStandardMaterial({map:shutter,bumpMap:shutter,bumpScale:.035,roughness:.8,metalness:.15});
const contactGeo=new THREE.PlaneGeometry(1,1);
// Localised wall marks, notices, rust and torn cloth. All labels are fictional.
const wearMats=[];
for(let i=0;i<4;i++){const map=tex('wear'+i,512,768,(g,w,h)=>{g.clearRect(0,0,w,h);for(let j=0;j<65;j++){const x=rand()*w,y=rand()*h,r=range(12,100),gr=g.createRadialGradient(x,y,1,x,y,r);gr.addColorStop(0,'rgba(37,43,24,.27)');gr.addColorStop(1,'rgba(37,43,24,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}g.save();g.translate(38,480);g.rotate(-.03+i*.015);g.font='bold 42px "Microsoft YaHei",sans-serif';g.fillStyle=i%2?'#713e2b99':'#393a2bbb';g.fillText(['水电维修','单间出租','旧物回收','街坊便民'][i],0,0);g.font='24px sans-serif';g.fillText('示意广告 · 非真实号码',0,36);g.restore();for(let j=0;j<9;j++){const x=range(20,w-70),y=range(200,650);g.fillStyle=['#c1bc9a99','#a4a183aa','#d1c7ac99'][j%3];g.fillRect(x,y,range(30,55),range(40,70));g.fillStyle='#45463899';for(let k=0;k<4;k++)g.fillRect(x+4,y+7+k*8,range(15,29),1.5);}noise(g,w,h,6000,.15);});wearMats.push(new THREE.MeshStandardMaterial({map,transparent:true,roughness:1,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));}
const stain=tex('rust',256,512,(g,w,h)=>{g.clearRect(0,0,w,h);for(let j=0;j<38;j++){const x=range(25,w-25),y=range(0,70),hh=range(90,430),gr=g.createLinearGradient(0,y,0,y+hh);gr.addColorStop(0,'rgba(69,51,28,.38)');gr.addColorStop(1,'rgba(51,45,23,0)');g.fillStyle=gr;g.fillRect(x,y,range(2,17),hh);}});materials.rustStain=new THREE.MeshStandardMaterial({map:stain,transparent:true,depthWrite:false,roughness:1});
const cloth=tex('cloth',256,256,(g,w,h)=>{g.fillStyle='#476a69';g.fillRect(0,0,w,h);for(let j=0;j<w;j++){g.fillStyle=`rgba(14,26,24,${.13+.13*Math.sin(j*.17)})`;g.fillRect(j,0,1,h);}noise(g,w,h,14000,.25);for(let j=0;j<8;j++){g.strokeStyle='#c2bf9b44';g.lineWidth=1;g.strokeRect(rand()*w,rand()*h,range(8,40),range(6,25));}});materials.tarp=new THREE.MeshStandardMaterial({map:cloth,side:THREE.DoubleSide,roughness:.93});
function laneX(z){return Math.sin(z/17)*.65+Math.sin(z/7)*.16;}
const buildings=[],pickTargets=[];
function makeBuilding(config,register=true){const {id,x,z,w,d,floors,rotation=0,floorH=2.85,groundH=3.15}=config,h=floors*floorH+groundH,root=new THREE.Group();root.position.set(x,0,z);root.rotation.y=rotation;root.name='Xiangli_Building_'+String(id+1).padStart(2,'0');root.userData={...config,height:h,renovated:false};village.add(root);seed=11231+id*849;
 const b=new Builder(root),wall=materials['wall'+id%6];
 const weathering=new THREE.Group();weathering.name='removable_wall_wear';root.add(weathering);const dirt=new Builder(weathering);
 const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),wall);body.position.y=h/2+.18;body.castShadow=true;body.receiveShadow=true;root.add(body);body.userData.building=id;pickTargets.push(body);
 b.box(0,.38,0,w+.12,.6,d+.12,mat('#777e73'));
 b.box(0,h+.22,0,w+.32,.24,d+.32,M.concrete);b.box(0,h+.36,0,w-.3,.06,d-.3,M.roof);
 // Four front-local facades; their elements share batched geometry.
 const sides=[{width:w,depth:d/2,angle:0},{width:d,depth:w/2,angle:Math.PI/2},{width:w,depth:d/2,angle:Math.PI},{width:d,depth:w/2,angle:-Math.PI/2}];
 sides.forEach(({width,depth,angle},side)=>{const c=Math.cos(angle),s=Math.sin(angle);function P(u,y,v){return [u*c+v*s,y,-u*s+v*c];}function box(u,y,v,ww,hh,dd,m){b.box(...P(u,y,v),ww,hh,dd,m,0,angle);}function plane(u,y,v,ww,hh,m){b.plane(...P(u,y,v),ww,hh,m,0,angle);}
 const cols=width>10.5?3:2,span=(width-1.6)/cols;
 const frame=mat((id+side)%3===0?'#b6b9b3':'#88918a',.33,.57);
 for(let f=0;f<floors;f++){const y=groundH+floorH*.47+f*floorH;
  for(let k=0;k<cols;k++){const u=(k-(cols-1)/2)*span+range(-.1,.1),ww=Math.min(1.25+(id%4)*.18,span-.65),hh=1.35+(id%3)*.15,lit=rand();
   box(u,y,depth+.024,ww+.24,hh+.22,.06,M.dark);
   box(u,y,depth+.068,ww,hh,.07,lit>.59+((id+side)%3-1)*.055?residentialLights[(id+2*f+k+side)%3]:lit>.36?M.glass:M.glassLight);
   // recessed frame and window mullions
   for(const q of [-1,1]){box(u+q*(ww/2+.015),y,depth+.12,.072,hh+.14,.10,frame);box(u,y+q*hh/2,depth+.12,ww+.12,.072,.10,frame);}
   box(u,y,depth+.14,.055,hh,.055,frame);box(u,y+.13,depth+.14,ww,.045,.055,frame);
   if((id+f+k+side)%5===0)box(u-ww*.28,y,depth+.104,ww*.31,hh*.87,.014,mat('#ad9c83'));
   box(u,y-hh/2-.1,depth+.2,ww+.34,.13,.46,M.edge);
   if(rand()>.15){const cage=depth+.35+((id+f)%3)*.09;
    for(let r=0;r<7;r++)box(u-ww/2+r*ww/6,y,cage,.019,hh+.08,.024,M.bar);
    for(const q of [-1,1]){box(u,y+q*(hh/2+.06),cage,ww+.12,.025,.035,M.bar);box(u+q*(ww/2+.04),y,depth+.29,.025,hh+.12,.3,M.bar);}
    box(u,y-.2,cage,ww+.12,.022,.03,M.bar);
   }
   // compressor unit, brackets, fan grille and drain
   const originalAC=(f+k+id+side)%3!==0;
   if(originalAC||k===0){const au=Math.min(u+ww/2+.43,width/2-.42),ay=y-.34+(originalAC?range(-.2,.15):0);
    box(au,ay,depth+.34,.7,.5,.49,M.ac);plane(au+.1,ay,depth+.592,.39,.39,materials.fan);
    for(const q of [-1,1])box(au+q*.25,ay-.3,depth+.37,.035,.08,.57,M.rust);
    box(au-.23,ay,depth+.596,.14,.32,.009,mat('#9a9e90'));
    for(let slat=0;slat<5;slat++)box(au-.23,ay-.12+slat*.06,depth+.605,.115,.013,.008,M.dark);
    box(au-.35,ay+.26,depth+.29,.032,.48,.04,M.pipe);
    if(f%2===0)dirt.plane(...P(au,ay-.7,depth+.034),1.2,1.5,materials.rustStain,0,angle);
   }
   if(side===0&&f===2&&id%3===0&&k===0){box(u,y-.9,depth+.7,ww+.7,.16,1.25,M.concrete);for(let r=0;r<8;r++)box(u-ww/2-.25+r*(ww+.5)/7,y-.4,depth+1.28,.025,.92,.025,M.bar);box(u,y+.06,depth+1.28,ww+.6,.035,.04,M.bar);
    for(let q=0;q<3;q++)box(u-.5+q*.45,y-.35,depth+.91,.28,.7,.015,mat(['#899eae','#b89c7e','#e0d5c1'][q]));
   }
   if(side===0&&id%4===1&&f===1&&k===0){const bw=ww+.7;box(u,y-hh/2-.15,depth+.55,bw,.15,1.05,M.concrete);box(u,y+hh/2+.25,depth+.55,bw,.08,1.05,M.rust);for(let r=0;r<10;r++)box(u-bw/2+r*bw/9,y,depth+1.05,.022,hh+.4,.022,M.bar);for(const q of [-1,1])box(u,y+q*hh*.35,depth+1.05,bw,.025,.04,M.bar);if(id%3)box(u-bw*.2,y-.3,depth+1.06,bw*.58,.65,.015,mat('#566c62'));}
  }
  if(f%2===1&&id%3===0)box(0,y-floorH*.44,depth+.05,width,.075,.12,M.edge);
 }
 const pipeU=width/2-.38;box(pipeU,h*.48,depth+.13,.1,h-.4,.13,M.pipe);
 for(let y=1;y<h;y+=2.5)box(pipeU,y,depth+.14,.18,.055,.19,M.bar);
 // Retrofitted drain stacks with elbows and differing diameters.
 for(let p=0;p<(id+side)%3;p++){const u=-width*.43+p*.33,v=depth+.16;box(u,h*.47,v,.105+p*.025,h*.93,.11+p*.02,M.pipe);box(u+.25,.45,v,.6,.12,.14,M.pipe);box(u+.55,.7,v,.12,.5,.14,M.pipe);for(let yy=2;yy<h;yy+=3.3)box(u,yy,v+.02,.17,.06,.17,M.rust);}
 for(let yy=4;yy<Math.min(h,12);yy+=2.8){const pts=[P(-width/2,yy,depth+.15),P(0,yy-.18,depth+.2),P(width/2,yy+.05,depth+.15)];line(root,pts,.018,M.dark);}
 dirt.plane(...P(-width*.17,1.7,depth+.075),Math.min(4.5,width*.6),3.3,wearMats[(id+side)%4],0,angle);
 // Street elevation details stay attached to the building when it is moved.
 if ((side===0||side===2)&&(id+side)%3===0) {
  const bannerU=width*.29,bannerY=groundH+floorH*.82;
  box(bannerU,bannerY+.34,depth+.235,2.35,.022,.022,M.bar);
  plane(bannerU,bannerY,depth+.23,2.3,.55,signMats[(id+side)%8]);
 }
 const hasShops=side===0&&(id%5!==2)||side===1&&id%4===0;
 if(hasShops){const count=id%3===0?1:2,shopW=(width-.7)/count;
  for(let k=0;k<count;k++){const u=(k-(count-1)/2)*shopW,sy=range(-.12,.12);box(u,1.46,depth+.09,shopW-.18,2.45,.15,M.dark);
   if((id+k+side)%3===0){plane(u,1.35,depth+.178,shopW-.27,2.15,materials.shutter);}else{
    box(u,1.36,depth+.18,shopW-.29,2.1,.08,M.glass);box(u,1.3,depth+.24,.045,2.2,.06,M.bar);
    for(const q of [-1,1])box(u+q*.14,1.3,depth+.29,.018,.3,.03,M.bar);
    box(u,2.48,depth+.2,shopW-.27,.2,.07,mat('#c5b87c'));
    for(const q of [-1,1])box(u+q*(shopW*.5-.23),1.39,depth+.244,.064,2.14,.044,M.bar);
    box(u,1.12,depth+.244,shopW-.29,.055,.045,M.bar);
    const display=mat(['#78645b','#6b7d86','#978560'][(id+k)%3]);
    box(u-shopW*.28,.52,depth+.29,shopW*.22,.61,.21,display);
   }
   const signY=2.94+sy;plane(u,signY,depth+.235,shopW-.08,.7,signMats[(id+k+side)%8]);box(u,signY,depth+.15,shopW,.78,.15,M.rust);
   const awning=mat(['#556b59','#744e44','#526c78','#9a9174'][id%4]),reach=range(.7,1.65),ay=2.52+sy;
   box(u,ay,depth+reach*.5,shopW,.055,reach,awning);box(u,ay-.13,depth+reach,shopW,.24,.035,awning);
   if(id%2===0)for(let r=0;r<Math.floor(shopW/.29);r++)box(u-shopW/2+.12+r*.29,ay+.03,depth+reach*.5,.07,.008,reach,mat('#c1bda3'));
   for(const q of [-1,1])box(u+q*(shopW/2-.12),ay-.15,depth+reach*.5,.025,.025,reach,M.rust);
   if(k===0&&id%3===0){box(u,2.0,depth+.2,shopW*.8,.07,.08,mat('#c4b78d'));}
  }
 }else{const du=-width*.15;box(du,1.3,depth+.04,1.1,2.4,.1,M.dark);box(du+.08,1.3,depth+.11,.9,2.2,.06,mat('#626b60'));if(side===0){for(const s of [-1,1])box(du+s*.65,1.38,depth+.12,.13,2.3,.012,mat('#803b29'));box(du,2.63,depth+.12,1.35,.18,.012,mat('#803b29'));box(du,.15,depth+.55,1.6,.22,.8,M.concrete);}}
 // parapets
 box(0,h+.72,depth-.05,width,.72,.14,wall);box(0,h+1.1,depth-.05,width+.08,.09,.23,M.edge);
 });
 // Roof clutter, cylindrical stainless water tank and stairhouse.
 const roofHeight=1.7+(id%4)*.34,roofW=w*(.3+(id%3)*.07),roofD=d*.35;
 b.box(-w*.24,h+roofHeight*.5+.3,-d*.22,roofW,roofHeight,roofD,wall);b.box(-w*.24,h+roofHeight+.35,-d*.22,roofW+.2,.14,roofD+.3,M.edge);
 b.box(w*.23,h+.72,-d*.22,1.7,.12,1.7,M.dark);
 for(const a of [-1,1])for(const c of [-1,1])b.box(w*.23+a*.64,h+.52,-d*.22+c*.64,.05,.55,.05,M.rust);
 const tankmat=mat('#b7bfbb',.65,.38);b.cylinder(w*.23,h+1.48,-d*.22,1.52,1.45,1.52,tankmat);b.cylinder(w*.23,h+2.23,-d*.22,1.6,.07,1.6,M.bar);
 for(let yy=0;yy<5;yy++)b.cylinder(w*.23,h+.84+yy*.29,-d*.22,1.55,.035,1.55,M.bar);
 b.box(w*.23+.87,h+1,-d*.22,.07,1.5,.07,M.pipe);
 if(id%3===0){b.box(0,h+1.02,d*.2,w*.58,.06,d*.36,mat('#5e7776',.3,.45),-.12);for(let k=0;k<6;k++)b.box(-w*.24+k*w*.09,h+1.06,d*.2,.025,.02,d*.35,M.bar,-.12);}
 else{for(const q of [-1,1])b.box(q*w*.26,h+1,d*.24,.035,1.3,.035,M.rust);line(root,[[-w*.26,h+1.55,d*.24],[0,h+1.4,d*.24],[w*.26,h+1.55,d*.24]],.012,M.dark);for(let k=0;k<3;k++)b.box(-w*.16+k*w*.16,h+1.1,d*.24,.45,.68,.015,mat(['#bba98a','#9aafa9','#c8c2b2'][k]));}
 // Lean-to roofing, roof patch repairs, crates and the occasional satellite dish.
 if(id%2===0){const rw=w*range(.4,.64),rd=d*.28,xx=w*.06,zz=d*.25,rm=mat(['#607477','#8c8e80','#736e5c'][id%3],.15,.8);b.box(xx,h+1.4,zz,rw,.07,rd,rm,0,0,.035);for(let j=0;j<Math.ceil(rw/.22);j++)b.box(xx-rw/2+j*.22,h+1.46,zz,.055,.04,rd,rm);for(const s of [-1,1])b.box(xx+s*(rw/2-.15),h+.85,zz,.06,1.2,.06,M.rust);}
 for(let j=0;j<4;j++){const xx=range(-w*.35,w*.35),zz=range(-d*.25,d*.3);b.box(xx,h+.42,zz,range(.6,2),.035,range(.6,1.5),mat(['#41473b','#7a7763','#87877a'][j%3]));}
 if(id%4===1){b.add(sphereGeo,mat('#aaa99b',.1),-w*.32,h+1.6,d*.18,1.15,.18,1.15,-.65,0,.2);b.box(-w*.32,h+.9,d*.18,.07,1,.07,M.rust);}
 dirt.finish();b.finish();
 const shadow=new THREE.Mesh(contactGeo,materials.shadow);shadow.rotation.x=-Math.PI/2;shadow.position.y=.052;shadow.scale.set(w+4,d+4,1);root.add(shadow);
 root.traverse(o=>{if(o.isMesh)o.userData.building=id;});
 const building={root,body,config,wall,h,weathering};if(register)buildings.push(building);return building;
}
const gb=new Builder(globals);
// These are compressed gameplay relationships, not surveyed Kangle coordinates.
const roadNetwork=[{name:'外缘主路',width:8,points:[[-42,65],[-42,10],[-41,-58]]},{name:'巷内商业街',width:4.3,points:[[0,63],[.5,35],[0,10],[-.5,-15],[0,-28]]},{name:'东西横巷',width:4.5,points:[[-42,10],[-19,10],[0,10],[22,10],[47,10]]},{name:'西侧支巷',width:2.2,points:[[-17,59],[-17,10],[-17,-44]]},{name:'东侧支巷',width:2.2,points:[[18,59],[18,10],[18,-44]]}];
const pitPosition={x:-1.05,z:22,w:1.45,d:1.25};
function groundSurface(width,depth,y,material){const s=new THREE.Shape();s.moveTo(-width/2,-depth/2);s.lineTo(width/2,-depth/2);s.lineTo(width/2,depth/2);s.lineTo(-width/2,depth/2);s.closePath();
 for(const r of [{x:47,z:0,w:6,d:120},pitPosition]){const p=new THREE.Path(),x=r.x-r.w/2,xx=r.x+r.w/2,v=-r.z-r.d/2,vv=-r.z+r.d/2;p.moveTo(x,v);p.lineTo(x,vv);p.lineTo(xx,vv);p.lineTo(xx,v);p.closePath();s.holes.push(p);}
 const geometry=new THREE.ShapeGeometry(s),uv=geometry.attributes.uv;
 for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/width+.5,uv.getY(i)/depth+.5);
 const mesh=new THREE.Mesh(geometry,material);mesh.rotation.x=-Math.PI/2;mesh.position.y=y;mesh.receiveShadow=true;globals.add(mesh);
}
groundSurface(180,180,-.045,mat('#868b7b'));groundSurface(112,136,.048,materials.road);
{
 const detail=new Builder(globals);
 for(let z=-33;z<62;z+=5.7)detail.plane(laneX(z)+range(-.75,.75),.053,z,range(2.6,4.5),range(3.7,6),repairMat,-Math.PI/2,0,range(-.4,.4));
 detail.finish();
}
// Dense but non-overlapping parcels: independent frontages and variable setbacks.
let id=0;
const parcelRng=()=>{let t=38117;return()=>{t=(Math.imul(t,1664525)+1013904223)>>>0;return t/4294967296;};};
const pr=parcelRng();
for(let col=0;col<4;col++){
 let cursor=-43+pr()*3.5;
 for(let row=0;row<6;row++){
  const w=9.3+pr()*3.6,d=10.2+pr()*3.4;if(cursor+w>7&&cursor<13)cursor=13;const z=cursor+w/2;
  const sign=col<2?-1:1,inner=col===1||col===2;
  const setback=1.85+pr()*.65+Math.sin(z*.16)*.22;
  let x=laneX(z)+sign*(setback+d/2);
  if(!inner)x=sign*(18.1+d/2+pr()*.9);
  const floors=[3,6,4,7,5,2,6,4,8,3,5,7][(row*3+col*5)%12];
  if(!(inner&&row<2))makeBuilding({id:id++,x,z,w,d,floors,rotation:(sign<0?Math.PI/2:-Math.PI/2)+(pr()-.5)*.025,floorH:2.65+pr()*.38,groundH:2.8+pr()*.55});
  cursor+=w+.85+pr()*1.25+(row===2?2:0);
 }
}
// Broken, narrow raised thresholds; no regular park-like pavements inside.
for(const building of buildings){const c=building.config,sgn=c.x<0?-1:1,face=c.x-sgn*c.d/2;
 gb.box(face-sgn*.26,.1,c.z,.58,.2,c.w+.15,M.curb);
 if(c.id%3===1)gb.box(face-sgn*.7,.07,c.z-c.w*.27,.65,.14,1.7,M.concrete);
}
for(let j=-42;j<42;j+=5.8){const x=laneX(j)-1.48;gb.box(x,.075,j,.36,.045,.7,M.dark);for(let r=0;r<6;r++)gb.box(x-.15+r*.06,.103,j,.021,.012,.57,M.bar);}
// Repair seams, patched concrete and irregular damp pavement.
const wetPatches=[];
const wetMap=tex('wet-ground',256,256,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='#79868b';g.beginPath();for(let k=0;k<24;k++){const a=k*Math.PI/12,r=range(72,121);g.lineTo(128+Math.cos(a)*r,128+Math.sin(a)*r*.65);}g.closePath();g.fill();noise(g,w,h,12000,.26);});
const wetMat=new THREE.MeshStandardMaterial({map:wetMap,transparent:true,opacity:.55,roughness:.19,metalness:.16,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
for(let j=0;j<65;j++){const z=range(-45,45),x=laneX(z)+range(-1.6,1.6);if(j<30){const mesh=new THREE.Mesh(planeGeo,wetMat);mesh.rotation.x=-Math.PI/2;mesh.rotation.z=rand()*6;mesh.position.set(x,.054,z);mesh.scale.set(range(.4,2.3),range(.4,3.2),1);globals.add(mesh);wetPatches.push(mesh);}else{gb.box(x,.052,z,range(.25,1.1),.015,range(.4,1.6),mat(['#72766a','#85877a','#585f54','#949386'][j%4]),0,range(-.15,.15));}}
for(let j=0;j<5;j++)line(globals,[[laneX(-35+j*17)-1.5,.065,-35+j*17],[laneX(-35+j*17),.065,-34.8+j*17],[laneX(-35+j*17)+1.7,.065,-35.2+j*17]],.014,mat('#45493f'));
function manhole(x,z){gb.cylinder(x,.07,z,.92,.04,.92,mat('#4d554a',.45,.7));for(let k=0;k<3;k++){const ring=new THREE.Mesh(new THREE.TorusGeometry(.15+k*.11,.012,4,32),M.bar);ring.rotation.x=Math.PI/2;ring.position.set(x,.096,z);globals.add(ring);}for(let k=-2;k<=2;k++)gb.box(x+k*.12,.098,z,.014,.005,.54,M.dark);}
for(const z of [-26,-4,23,40])manhole(laneX(z)+.25,z);
const tireGeo=new THREE.TorusGeometry(.205,.043,8,20);
const rimGeo=new THREE.CylinderGeometry(.143,.143,.081,16);
const scooterShellGeo=blenderAssets?new THREE.BufferGeometry():sphereGeo;
if(blenderAssets){
 const [positions,normals]=blenderAssets.scooterShell;
 scooterShellGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 scooterShellGeo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
}
function scooter(x,z,a,color,parent=globals){
 const root=new THREE.Group();root.position.set(x,0,z);root.rotation.y=a;parent.add(root);
 const b=new Builder(root),paint=mat(color,.18,.52),rubber=mat('#262526'),trim=mat('#302e2b');
 for(const zWheel of [-.51,.56]){
  b.add(tireGeo,rubber,0,.298,zWheel,1,1,1,0,Math.PI/2);
  b.add(rimGeo,M.bar,0,.298,zWheel,1,1,1,0,0,Math.PI/2);
  b.cylinder(0,.298,zWheel,.15,.115,.15,trim,0,0,Math.PI/2);
 }
 b.add(scooterShellGeo,paint,0,.68,-.37,.46,.43,.72);
 b.add(sphereGeo,trim,0,.916,-.24,.48,.136,.66);
 b.box(0,.405,.15,.4,.105,.62,trim);
 b.add(scooterShellGeo,paint,0,.78,.49,.38,.66,.2,-.15);
 b.add(sphereGeo,paint,0,.535,.57,.18,.11,.58);
 b.cylinder(0,.73,.475,.046,.75,.046,M.bar,-.23);
 b.cylinder(0,1.235,.45,.045,.72,.045,trim,0,0,Math.PI/2);
 b.add(sphereGeo,mat('#e0dcc5',.12,.35),0,1.07,.605,.29,.13,.065);
 b.add(sphereGeo,mat('#9e322c',.08,.44),0,.72,-.751,.21,.085,.04);
 for(const q of [-1,1]){
  b.cylinder(q*.29,1.38,.435,.025,.29,.025,M.bar,0,0,-q*.3);
  b.add(sphereGeo,trim,q*.338,1.526,.435,.153,.074,.05);
 }
 if(rand()>.5){
  b.box(0,1.036,-.548,.51,.19,.36,paint);
  b.add(sphereGeo,paint,0,1.139,-.548,.52,.15,.37);
 }
 b.finish();return root;
}
const editableProps=[];
for(let i=0;i<29;i++){const z=range(-18,56),side=i%2?-1:1;const root=scooter(laneX(z)+side*range(1.5,2.1),z,side*range(.55,1.4),['#46514e','#8a9892','#765648','#465a5e','#a6a293'][i%5]);editableProps.push({root,title:'街边电动车',size:[1.35,1.5,1.35],move:0,remove:0,lesson:'车辆停放需要给步行和住户出入口留空间。'});}
const greenSpaces=[];
function tree(x,z,size=1){const root=new THREE.Group(),b=new Builder(root),id='prop-'+editableProps.length;root.position.set(x,0,z);greenSpaces.push({id,x,z,r:1.7*size,ground:true,w:.8*size,d:.8*size});b.cylinder(0,1.9*size,0,.22*size,3.8*size,.22*size,mat('#726347'));for(let k=0;k<19;k++){const a=k*2.4,rr=(k%4)*.3*size;b.add(sphereGeo,mat(['#536541','#6d7b4f','#677448','#3d5835'][k%4]),Math.cos(a)*rr,3.6*size+(k%3)*.47*size,Math.sin(a)*rr,1.9*size,1.5*size,1.8*size);}b.cylinder(0,.21,0,.8*size,.4,.8*size,mat('#86735a'));b.finish();editableProps.push({root,title:'街角树与树池',size:[2.4*size,4.8*size,2.4*size],move:28,remove:14,lesson:'树冠提供遮阴，树池则占用地面种植空间。移树需要考虑根系与养护。'});}
// Greenery clusters by doors and balconies, rather than evenly spaced street trees.
for(const [x,z,size] of [[-1.8,30,.85],[2,7,.72],[-2,-18,.65],[39,44,1.2],[-38,-43,1.2]])tree(x+laneX(z),z,size);
function plant(x,y,z,s=1,builder=gb){if(y===0)greenSpaces.push({x,z,r:.2*s});builder.cylinder(x,y+.16*s,z,.38*s,.32*s,.38*s,mat('#8c6951'));for(let j=0;j<7;j++)builder.add(sphereGeo,M.green,x+Math.sin(j*2.4)*.11*s,y+.35*s+(j%3)*.1*s,z+Math.cos(j*2.4)*.11*s,.22*s,.32*s,.22*s);}
function stool(x,z,color){const root=localGroup(x,z),b=new Builder(root);x=0;z=0;b.box(x,.52,z,.4,.1,.4,mat(color));for(const a of [-1,1])for(const side of [-1,1])b.box(x+a*.14,.27,z+side*.14,.055,.45,.055,mat(color));b.finish();editableProps.push({root,title:'街坊矮凳',size:[.5,.6,.5],move:1,remove:1,lesson:'小座位让街坊有停留和交谈的机会。'});}
function bin(x,z){const root=localGroup(x,z),b=new Builder(root);x=0;z=0;const green=mat('#456b4b',.1,.9);b.box(x,.66,z,1.55,1.2,1.05,green);b.box(x,.15,z,1.45,.15,.95,M.dark);b.box(x,1.29,z-.05,1.63,.1,1.12,M.dark,.1);for(let k=0;k<9;k++)b.box(x-.69+k*.17,1.35,z-.05,.08,.06,1.07,mat('#5c6754'),.1);for(const s of [-1,1])b.cylinder(x+s*.6,.2,z-.42,.25,.12,.25,M.black,0,0,Math.PI/2);b.finish();editableProps.push({root,title:'街边垃圾箱',size:[1.7,1.5,1.2],move:3,remove:2,lesson:'小垃圾箱应兼顾居民投放距离和清运路线。'});}
function cart(x,z,a=0){const root=new THREE.Group();root.position.set(x,0,z);root.rotation.y=a;globals.add(root);const b=new Builder(root);b.box(0,.72,0,1.1,1.05,.68,mat('#8c9184',.35,.6));b.box(0,1.3,0,1.22,.09,.78,M.bar);for(const q of [-1,1])b.box(q*.5,1.65,-.24,.035,.7,.035,M.bar);b.box(0,2.05,-.24,1.25,.06,.8,mat('#886149'));b.box(0,1.55,-.28,1,.43,.025,M.glass);for(const q of [-1,1])b.cylinder(q*.43,.24,0,.35,.1,.35,M.black,0,0,Math.PI/2);b.plane(0,.8,.35,1,.75,signMats[1]);b.finish();editableProps.push({root,title:"流动摊车",size:[1.4,2.1,1.2],move:12,remove:7,lesson:"流动摊车的位置影响客流和街巷通行。"});}
for(const building of buildings){const c=building.config;if(Math.abs(c.x)>20)continue;const s=c.x<0?-1:1,face=c.x-s*c.d/2;
 const x=face-s*.55,z=c.z-c.w*.27;
 if(c.id%3===0){plant(x,0,z,1.4);plant(x+s*.13,0,z+.65,.85);stool(x-s*.25,z+1.2,['#98604a','#6b7d66','#b2a07c'][c.id%3]);}
 if(c.id%4===1){cart(face-s*.8,c.z+c.w*.2,s*.1);gb.box(face-s*.4,.35,c.z-c.w*.2,.62,.65,.55,mat('#ad9267'));}
 if(c.id%4===2){bin(face-s*.8,z);for(let k=0;k<3;k++)gb.add(sphereGeo,mat('#303b30'),face-s*range(.5,1.2),.23,z+.8+k*.3,.5,.5,.45);}
 // A little litter where objects accumulate; the lane remains walkable.
 for(let k=0;k<7;k++){const xx=face-s*range(.25,1.2),zz=c.z+range(-c.w*.45,c.w*.45);gb.box(xx,.069,zz,range(.04,.18),.009,range(.05,.25),mat(['#9b9479','#b5af96','#686d57'][k%3]),0,range(0,6));}
 if(c.id%3===1){const yy=c.groundH+c.floorH*2-.45,fixtures=new THREE.Group(),b=new Builder(fixtures);building.streetFixtures=fixtures;village.add(fixtures);b.box(face-s*.28,yy-.08,c.z,.64,.12,1.9,M.concrete);for(let k=0;k<3;k++)plant(face-s*.38,yy,c.z+(k-1)*.43,.7,b);b.finish();}
}
// Service pipes collect along walls; bundles sag and cross the lane at differing heights.
for(let i=0;i<9;i++){const z=-17+i*8.8,cx=laneX(z);for(let k=0;k<5;k++)line(globals,[[cx-3.1,5.6+k*.095,z-.2],[cx-.5,4.6+k*.09,z+.45],[cx+3.1,6.1+k*.1,z+.9]],.011+(k===0?.013:0),M.dark);}
for(const side of [-1,1])for(let k=0;k<7;k++)line(globals,[[-side*2.85,6.3+k*.07,-21],[-side*2.9,5.9+k*.07,-15],[-side*2.85,6.2+k*.07,2],[-side*3.1,5.8+k*.07,24],[-side*3,6.2+k*.07,45]],.013,M.dark);
// A few patched tarpaulins span part of the alley, leaving views of the sky.
for(const [z,y,w] of [[-19,4.7,3.9],[10,5.3,3.6],[33,4.8,3.4]]){
 const geometry=new THREE.PlaneGeometry(w,2.1,10,5),pos=geometry.attributes.position;
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),yy=pos.getY(i);pos.setZ(i,-.25*(1-Math.pow(x/(w*.5),2))+.04*Math.sin(x*16+yy*4));}geometry.computeVertexNormals();
 const mesh=new THREE.Mesh(geometry,materials.tarp);mesh.rotation.x=-Math.PI/2;mesh.rotation.z=.07;mesh.position.set(laneX(z),y,z);mesh.receiveShadow=true;mesh.castShadow=true;globals.add(mesh);
}
// Vertical shop boards give the street a layered commercial silhouette.
for(const building of buildings){const c=building.config;if(Math.abs(c.x)>20||c.id%2)continue;const side=c.x<0?-1:1,x=c.x-side*(c.d/2+.5),z=c.z-c.w*.3;
 const fixtures=building.streetFixtures||new THREE.Group(),b=new Builder(fixtures);building.streetFixtures=fixtures;village.add(fixtures);
 b.box(x,3.7,z,.07,1.9,.82,M.rust);b.plane(x-side*.045,3.7,z,.78,1.7,signMats[(c.id+2)%8],0,side<0?Math.PI/2:-Math.PI/2);
 b.box(x,4.73,z,.12,.08,.85,M.dark);b.finish();
}
// Fictional entrance marker: aged concrete, not a reconstruction of a named place.
gb.box(-3.5,2.6,63,.48,5.2,.5,M.concrete);gb.box(3.4,2.6,63,.48,5.2,.5,M.concrete);gb.box(0,5.45,63,7.5,1.1,.4,mat('#aaa995'));
const entranceTex=tex('entrance',1024,180,(g,w,h)=>{g.fillStyle='#aaa995';g.fillRect(0,0,w,h);noise(g,w,h,18000,.3);g.font='bold 115px serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#5b5742';g.fillText('同 兴 里',w/2,h*.53);});const entranceMat=new THREE.MeshStandardMaterial({map:entranceTex,roughness:1});gb.plane(0,5.45,63.21,7.3,1.05,entranceMat);
// Uneven distant roofline with a modern skyline beyond the village.
seed=19031;
for(let j=0;j<30;j++){
 const x=-77+(j%10)*17+range(-2,2),z=j<10?-65:j<20?65:-85,h=range(8,27),w=range(10,15),d=range(10,14);
 gb.box(x,h/2,z,w,h,d,materials['wall'+j%6]);gb.box(x,h+.2,z,w+.15,.24,d+.2,M.concrete);
 if(j%2===0)gb.cylinder(x+w*.22,h+.85,z,.95,1.35,.95,mat('#a1aaa5',.4));
 for(const [span,depth,a] of [[w,d/2,0],[d,w/2,Math.PI/2],[w,d/2,Math.PI],[d,w/2,-Math.PI/2]]){
  const c=Math.cos(a),s=Math.sin(a);
  const trim=mat(j%3===0?'#adb3a9':'#87928b',.22,.68);
  const facade=(u,y,v,ww,hh,dd,m)=>gb.box(x+u*c+v*s,y,z-u*s+v*c,ww,hh,dd,m,0,a);
  for(let f=2;f<h-.65;f+=3)for(let k=-1;k<=1;k++){
   const u=k*span*.27;
   const occupied=(j*37+(k+1)*13+Math.floor(f/3)*17+Math.round(a*10))%19;
   facade(u,f,depth+.044,1.18,1.37,.075,occupied>=0&&occupied<7?residentialLights[(j+k+3)%3]:M.glass);
   for(const q of [-1,1]){
    facade(u+q*.59,f,depth+.1,.067,1.45,.055,trim);
    facade(u,f+q*.69,depth+.1,1.22,.067,.055,trim);
   }
   facade(u,f,depth+.101,.049,1.36,.057,trim);
   facade(u,f-.77,depth+.13,1.39,.105,.25,M.edge);
   if((j+k+Math.floor(f/3))%3!==0){
    const au=u+.98,ay=f-.4;
    facade(au,ay,depth+.23,.59,.42,.35,M.ac);
    facade(au,ay-.24,depth+.25,.48,.06,.36,M.rust);
    gb.plane(x+au*c+(depth+.41)*s,ay,z-au*s+(depth+.41)*c,.33,.33,materials.fan,0,a);
   }
  }
 }
}
for(let j=0;j<13;j++){const x=-115+j*19,z=-128+range(-8,8),h=range(38,73);gb.box(x,h/2,z,range(8,15),h,range(9,16),mat('#899b9e'));for(let yy=4;yy<h;yy+=3)gb.box(x,yy,z+7.1,8,.1,.03,mat('#a6b3b2'));}
// V03 district landmarks, public-space references and fictional inspection cases.
const sceneNodes=new Map(),featurePins=new THREE.Group(),steamSprites=[];scene.add(featurePins);featurePins.visible=false;
let activeNode=null,inspectionOn=false;
function registerNode(data,root,dirty=null,safe=null){root.name=data.id;root.userData={sceneNode:data.id};globals.add(root);root.traverse(o=>{if(o.isMesh){o.userData.sceneNode=data.id;pickTargets.push(o);}});if(safe)safe.visible=false;
 const pin=new THREE.Group();pin.position.set(data.x,data.pinY||3.1,data.z);const pm=new THREE.MeshBasicMaterial({color:data.type==='hazard'?'#e6a252':'#c5d09a',depthTest:false});const tip=new THREE.Mesh(new THREE.SphereGeometry(.19,8,6),pm);pin.add(tip);const stem=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,1.1,5),pm);stem.position.y=-.55;pin.add(stem);
 const map=tex('label-'+data.id,512,96,(g,w,h)=>{g.fillStyle=data.type==='hazard'?'#714a28ee':'#304c40ee';g.fillRect(0,0,w,h);g.fillStyle='#fff4d9';g.font='500 40px "Microsoft YaHei",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(data.title,w/2,h/2,w-30);});const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map,depthTest:false,transparent:true}));sprite.scale.set(5.6,1.05,1);sprite.position.y=.8;sprite.userData.sceneNode=data.id;pin.add(sprite);pickTargets.push(sprite);featurePins.add(pin);sceneNodes.set(data.id,{...data,root,dirty,safe,resolved:false,pin,pinMaterial:pm});
}
for(const [i,prop] of editableProps.entries()){
 const {root,title,size,move,remove,lesson}=prop;
 registerNode({id:'prop-'+i,title:title+' '+(i+1),x:root.position.x,z:root.position.z,size,move,remove,kind:'街巷物件',type:'prop',detail:lesson,lesson},root);
}
function localGroup(x,z){const g=new THREE.Group();g.position.set(x,0,z);return g;}
function board(b,text,x,y,z,w=3,h=.7,bg='#64684e',ry=0){const map=tex('board-'+text,768,Math.round(768*h/w),(g,cw,ch)=>{g.fillStyle=bg;g.fillRect(0,0,cw,ch);noise(g,cw,ch,2500,.19);g.fillStyle='#e9dfb9';g.font='bold '+Math.floor(ch*.58)+'px "Microsoft YaHei",serif';g.textAlign='center';g.textBaseline='middle';g.fillText(text,cw/2,ch*.53,cw-22);});const m=new THREE.MeshStandardMaterial({map,roughness:.9});b.box(x,y,z-.025,w+.08,h+.08,.08,M.rust,0,ry);b.plane(x,y,z+.022,w,h,m,0,ry);}
// East-side creek: a shape cut into both ground surfaces, with a footbridge.
const creekWater=new THREE.Mesh(new THREE.PlaneGeometry(5.6,120),new THREE.MeshStandardMaterial({color:'#415b50',roughness:.38,metalness:.15}));creekWater.rotation.x=-Math.PI/2;creekWater.position.set(47,-.25,0);globals.add(creekWater);
for(const x of [44.05,49.95]){gb.box(x,-.35,0,.25,.8,120,M.concrete);gb.box(x,.2,0,.45,.32,121,M.curb);for(let z=-59;z<61;z+=3){if(z>6&&z<14)continue;gb.box(x,.78,z,.08,1.05,.08,M.bar);}for(const y of [.62,1.16]){gb.box(x,y,-27,.04,.045,64,M.bar);gb.box(x,y,38,.04,.045,48,M.bar);}}
gb.box(47,.15,10,8,.32,4.8,M.concrete);for(const z of [7.7,12.3]){gb.box(47,1.1,z,8,.055,.055,M.bar);for(let x=43;x<52;x+=1.2)gb.box(x,.73,z,.055,.82,.055,M.bar);}
for(let z=-52;z<58;z+=7)gb.box(41,.12,z,2.8,.13,5.8,materials.paving);
for(let z=-53;z<63;z+=8)gb.box(-42,.055,z,.1,.016,3.4,mat('#b9b598'));
const creekNode=localGroup(42,10),cb=new Builder(creekNode);board(cb,'涌边慢行',0,2.6,0,2.7,.65,'#435c54');for(const x of [-1.2,1.2])cb.box(x,1.25,-.05,.065,2.5,.065,M.bar);cb.finish();registerNode({id:'creek',title:'涌边与小桥',type:'culture',kind:'地理观察',x:42,z:10,detail:'以海珠村落的河涌与巷道关系为参考，将一条水边通路接入横巷。这里的位置和尺寸是游戏压缩布局。',lesson:'观察桥头、巷口和公共空间如何形成连接节点；河涌的排水与生态作用需要与沿岸生活共同考虑。',size:[4,3,4]},creekNode);
// Ancestral hall and its forecourt: protected social space, not a demolition target.
const hall=localGroup(0,-44),hb=new Builder(hall),brick=materials.wall3;
hb.box(0,.2,0,17,.4,12.2,M.concrete);hb.box(0,2.4,-.3,15.5,4.4,10.5,brick);hb.box(0,2.45,5.02,4.2,4.2,.1,mat('#353b32'));
for(const x of [-5.6,-2.6,2.6,5.6]){hb.cylinder(x,2.4,5.75,.27,4.5,.27,mat('#743b2b'));hb.box(x,.35,5.75,.55,.35,.55,M.concrete);}
for(const x of [-1,1]){hb.box(x*1.7,2.3,5.15,1.4,3.65,.13,mat('#563d2a'));for(let k=0;k<4;k++)hb.box(x*1.7,1.1+k*.76,5.24,1.18,.09,.05,mat('#8f7751'));}
board(hb,'同兴家祠',0,4.6,5.8,4.1,.8,'#514f3e');
for(const x of [-3.1,3.1]){hb.box(x,2.4,5.2,.28,3.3,.02,mat('#91462e'));}
for(const side of [-1,1]){
 hb.box(0,5.9,side*2.7,17.1,.16,6.1,mat('#545e54'),side*.515);
 for(let k=0;k<70;k++)hb.cylinder(-8.2+k*.237,5.97,side*2.7,.12,6.1,.12,mat('#666c5d'),Math.PI/2+side*.515);
 hb.box(0,4.46,side*5.5,17.3,.18,.32,mat('#5d5947'));
}
hb.cylinder(0,7.42,0,.24,17.5,.24,mat('#797c66'),0,0,Math.PI/2);
// Wok-ear gable silhouettes are inspired by Lingnan grey-brick architecture.
const gs=new THREE.Shape();gs.moveTo(-5.5,4.1);gs.lineTo(-5.5,6.5);gs.quadraticCurveTo(-5.5,7.6,-4.7,7.6);gs.quadraticCurveTo(-3.9,7.6,-3.6,6.3);gs.lineTo(0,7.7);gs.lineTo(3.6,6.3);gs.quadraticCurveTo(3.9,7.6,4.7,7.6);gs.quadraticCurveTo(5.5,7.6,5.5,6.5);gs.lineTo(5.5,4.1);gs.closePath();
const ggeo=new THREE.ExtrudeGeometry(gs,{depth:.2,bevelEnabled:false,curveSegments:8});for(const x of [-8,8]){const mesh=new THREE.Mesh(ggeo,mat('#7b7e6c'));mesh.rotation.y=Math.PI/2;mesh.position.x=x;mesh.castShadow=true;hall.add(mesh);}
for(let x=-3;x<=3;x+=1.2)hb.box(x,.1,6.6,1.2,.2,1.2,M.concrete);hb.box(0,.05,7.5,7,.1,1.1,M.curb);
hb.finish();registerNode({id:'hall',title:'祠堂与前埕',type:'culture',kind:'岭南文化',x:0,z:-44,pinY:9,detail:'虚构的“同兴家祠”：青砖、灰瓦、镬耳山墙与临街前埕。参考海珠村落祠堂临街、邻接民居与公共场地的关系，不对应一座真实祠堂。',lesson:'前埕不只是空地，也承载街坊交往与文化活动。更新方案应同时考虑文化延续、公共空间和日常通行。',size:[18,9,14]},hall);
gb.box(0,.09,-28.5,28,.18,15,materials.paving);for(const x of [-12,12]){gb.box(x,.5,-29,2.8,.25,.65,M.wood);for(const xx of [-.9,.9])gb.box(x+xx,.27,-29,.12,.45,.55,M.dark);}tree(-11,-34,1.55);tree(11,-35,1.15);
// Small seated neighbours and a vendor, built from reusable low-detail forms.
function person(parent,x,z,color,seated=false){const b=new Builder(parent),skin=mat('#b99e7e'),pants=mat('#444d45'),cloth=mat(color);const y=seated?.91:1.02;b.box(x,y,z,.39,.6,.27,cloth);b.add(sphereGeo,skin,x,y+.48,z,.32,.38,.32);for(const side of [-1,1]){b.box(x+side*.26,y-.02,z+.06,.1,.5,.12,cloth,0,0,side*.1);if(seated){b.box(x+side*.11,.5,z+.18,.15,.14,.48,pants);b.box(x+side*.11,.27,z+.38,.14,.43,.15,pants);}else b.box(x+side*.11,.39,z,.14,.64,.16,pants);}b.finish();}
const neighbours=localGroup(0,0);person(neighbours,-11.6,-28.7,'#756267',true);person(neighbours,11.4,-29,'#727d6b',true);globals.add(neighbours);
// Cantonese breakfast stall: metal counter, rice-roll tray, bamboo steamers, stools.
const breakfast=localGroup(1.6,43),bb=new Builder(breakfast);bb.box(.3,.66,0,1.45,1.2,.72,mat('#969f94',.45,.4));bb.box(.3,1.3,0,1.62,.1,.88,M.bar);bb.box(.3,1.56,-.18,1.4,.48,.055,M.glassLight);
for(const x of [-.55,1.15])bb.box(x,1.25,-.42,.045,2.45,.045,M.bar);bb.box(.3,2.42,-.06,2.2,.055,1.7,mat('#8b533d'));board(bb,'阿婆肠粉 · 生滚粥',.3,2.78,-.25,3.7,.68,'#81422e');
for(let k=0;k<3;k++){bb.cylinder(-.1,1.45+k*.13,.12,.42,.12,.42,mat('#b59a63'));bb.cylinder(-.1,1.51+k*.13,.12,.44,.025,.44,mat('#bdaa79'));}bb.cylinder(.7,1.47,.05,.35,.32,.35,mat('#a7afa6',.65,.32));bb.box(.35,.8,.4,1.3,.7,.03,mat('#b5986f'));board(bb,'肠粉  粥  豆浆',.3,.85,.43,1.25,.5,'#a8926c');bb.finish();person(breakfast,.45,-.78,'#6f7d75');registerNode({id:'breakfast',title:'肠粉粥档',type:'life',kind:'街坊生活',x:1.6,z:43,detail:'早班工人顺路买一份肠粉，街坊在小凳上吃粥。早餐档与住宅、作坊共享同一条生活巷。',lesson:'小店的价值不只在外观：位置便利、价格和熟人交往共同构成社区生活。改造要为这些日常需求留下空间。',size:[4,3.4,3]},breakfast);
for(const [x,z] of [[-.6,43.9],[1,44.7],[3,44.2]])stool(x,z,'#8f5543');
const steamMap=tex('steam',64,64,(g)=>{const t=g.createRadialGradient(32,32,0,32,32,31);t.addColorStop(0,'rgba(236,233,217,.5)');t.addColorStop(1,'rgba(236,233,217,0)');g.fillStyle=t;g.fillRect(0,0,64,64);});for(let i=0;i<5;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:steamMap,transparent:true,opacity:.14,depthWrite:false}));sp.position.set(1.5,2+i*.17,43.12);sp.scale.set(.35,.55,1);globals.add(sp);steamSprites.push({sp,phase:i/5});}
// Everyday community resources are present from the start, not only after renovation.
const teaCorner=localGroup(-11,-28),tc=new Builder(teaCorner);tc.cylinder(0,.63,0,1.15,.12,1.15,M.wood);tc.cylinder(0,.32,0,.11,.55,.11,M.dark);for(let k=0;k<3;k++)tc.cylinder(-.35+k*.32,.76,.1,.14,.13,.14,mat('#c5bb99'));tc.cylinder(.15,.87,-.12,.24,.32,.24,mat('#92836b'));tc.finish();registerNode({id:'tea-corner',title:'榕树下茶桌',type:'life',kind:'邻里交往',x:-11,z:-28,detail:'祠堂前埕边缘，一壶茶、几张凳子，是街坊歇脚、聊天与互助的地方。这里值得保留的不只是建筑外观，还有日常交往。',lesson:'从人文地理看，地方感来自人与空间的长期关系。公共空间的更新应听取常来这里的人，而不仅考虑外来游客的观看。',storyEn:'Under the banyan tree, tea is an invitation to sit, talk and look out for one another. The shared space matters as much as the building.',size:[2,1.5,2]},teaCorner);
const craftHome=localGroup(-35,-21),ch=new Builder(craftHome);ch.box(0,.75,0,2.8,1.3,1.3,M.wood);for(const x of [-1.3,1.3])ch.box(x,1.5,-.45,.07,2.9,.07,M.wood);ch.box(0,3,-.1,3.1,.1,2,mat('#776656'));board(ch,'广绣与制衣小工坊',0,2.58,.9,3.2,.65,'#725544');for(let k=0;k<3;k++){ch.box(-.8+k*.8,1.75,-.1,.62,.75,.025,mat(['#a57d68','#8c9b80','#ad9674'][k]));for(let j=0;j<5;j++)ch.box(-.97+k*.8+j*.085,1.75,-.08,.025,.5,.008,mat('#c4b485'));}ch.finish();registerNode({id:'craft-home',title:'广绣与制衣工坊',type:'culture',kind:'文化与产业',x:-35,z:-21,detail:'这是一处虚构的小工坊：把手作、设计和社区制衣网络放在一起观察。外来务工者的技能与本地手艺共同构成社区的生产生活。',lesson:'人文地理与经济地理关注劳动、产业网络和空间联系。文化出海可以连接工艺、设计与叙事，也需要尊重手艺的来源与创作者。',storyEn:'Guangzhou embroidery is a living craft. This fictional workshop connects handwork, textile skills and contemporary design, while giving credit to the people behind them.',size:[3.5,3.2,2.4]},craftHome);
const storyCorner=localGroup(35,45),sc=new Builder(storyCorner);for(const x of [-1.2,1.2])sc.box(x,1.4,-.5,.08,2.8,.08,M.wood);sc.box(0,2.9,0,3,.1,2.2,mat('#688071'));board(sc,'粤语讲古 · 街坊小聚',0,2.55,1.1,3,.55,'#65705b');sc.box(0,.55,0,2.1,.16,.6,M.wood);for(const x of [-.8,.8])sc.box(x,.25,0,.1,.5,.5,M.dark);sc.finish();registerNode({id:'story-corner',title:'粤语讲古角',type:'culture',kind:'地方记忆',x:35,z:45,detail:'给讲故事、听粤曲和日常交流留一处小角落。社区的声音包括本地街坊，也包括来到广州生活的人。',lesson:'地方文化在迁移与交流中持续生长。大湾区文化具有多样性，广府文化是其中的重要组成部分，不能用一个符号概括所有地方。',storyEn:'Cantonese storytelling shares memories through language and performance. A neighbourhood also makes room for the stories of newcomers.',size:[3.2,3.2,2.5]},storyCorner);
const serviceHome=localGroup(-37,-10),sh=new Builder(serviceHome);sh.box(0,.7,0,2.6,1.2,1.5,mat('#71887a'));for(const x of [-1.2,1.2])sh.box(x,1.3,-.5,.06,2.6,.06,M.wood);sh.box(0,2.7,0,3,.08,2.2,mat('#657c6b'));board(sh,'街坊便民点',0,2.3,1.05,2.8,.5,'#536c57');sh.finish();registerNode({id:'service-home',title:'街坊便民点',type:'life',kind:'公共服务',x:-37,z:-10,detail:'借一把雨伞、问一条路、收一份社区通知。小小的服务点，连接街坊日常。',lesson:'设施的服务范围要沿实际可走的道路来观察；隔得近也可能需要绕路。地图中的服务覆盖使用简化路网距离。',size:[3,2.9,2.4]},serviceHome);
sceneNodes.get('hall').storyEn='An ancestral hall can be a place of family memory and community gatherings. Its forecourt remains part of everyday neighbourhood life.';
sceneNodes.get('breakfast').storyEn='Fresh rice rolls and congee are an everyday breakfast here. This small stall serves neighbours and early-shift workers, not just visitors.';
// Four reversible fictional observations. No flames or accident simulation.
const rubbish=localGroup(-36.5,12),rb=new Builder(rubbish);rb.box(0,.15,0,5.3,.3,3.7,M.concrete);for(const x of [-2.3,2.3])rb.box(x,1.4,-1.1,.09,2.7,.09,M.bar);rb.box(0,2.75,-.3,5.6,.12,3.5,mat('#687b6a'));board(rb,'生活垃圾收集点',0,2.32,1.4,4.6,.65,'#45624e');rb.finish();
const overflow=new THREE.Group(),tidy=new THREE.Group();rubbish.add(overflow,tidy);const ob=new Builder(overflow),tb=new Builder(tidy);for(let i=0;i<10;i++){ob.add(sphereGeo,mat(i%2?'#353c30':'#817657'),range(-2.3,2.3),.36,range(-1.4,1.8),range(.35,.75),range(.4,.7),range(.35,.7));if(i<5)ob.box(range(-2,2),.16,range(.8,2.2),.4,.3,.3,mat('#aa9473'));}for(let i=0;i<4;i++){tb.box(-1.7+i*1.1,.7,0,.82,1.1,.85,mat(['#556c51','#59747b','#887556','#5e655e'][i]));tb.box(-1.7+i*1.1,1.29,0,.87,.1,.9,M.dark);}ob.finish();tb.finish();registerNode({id:'waste',title:'垃圾收集点外溢',type:'hazard',kind:'环境卫生',x:-36.5,z:12,detail:'收集设施设在便于清运的外缘道路旁；本示例中袋装垃圾和纸箱溢出到路边。垃圾站本身是必要设施，问题是收集与维护状态。',lesson:'清运频率、分类容器和服务半径共同影响卫生。把垃圾点简单移远，也可能让居民更难使用。',action:'清运并整理收集点',size:[6,3.3,5]},rubbish,overflow,tidy);
const bikes=localGroup(.75,31),bikeDirty=new THREE.Group(),bikeSafe=new THREE.Group();bikes.add(bikeDirty,bikeSafe);for(let k=0;k<4;k++)scooter(-.8+k*.55,k%2?.65:0,-.65+k*.42,['#666d60','#8c7a67','#435c58','#a3a295'][k],bikeDirty);
line(bikeDirty,[[1.8,2.5,-.9],[1.2,1.5,-.3],[.5,.1,.3],[-.3,.1,.8]],.024,mat('#383d31'));const bkb=new Builder(bikeDirty);bkb.box(1.8,1.8,-.9,.3,.42,.12,mat('#a89e7b'));bkb.finish();for(let k=0;k<4;k++)scooter(-41.2-.75,2.5+k*1.3,Math.PI/2,['#666d60','#8c7a67','#435c58','#a3a295'][k],bikeSafe);
registerNode({id:'bikes',title:'电动车占道与临时拉线',type:'hazard',kind:'通行与用电',x:.75,z:31,detail:'几辆电动车挤在住宅出口，旁边还有从墙边拉出的临时充电线。这里表现的是占用出口和不规范充电情境，不把所有电动车都视为危险。',lesson:'住宅出口应保持畅通，车辆停放与充电要有合适位置。示例整改会把车辆移到外缘停放区并移除临时线缆。',action:'归位车辆并移除临时线缆',size:[3.4,2.8,3]},bikes,bikeDirty,bikeSafe);
// Road hole is real geometry, with a lowered bottom and water below street level.
const pit=localGroup(pitPosition.x,pitPosition.z),pb=new Builder(pit);pb.box(0,-.58,0,1.45,.1,1.25,mat('#323d30'));for(const x of [-.73,.73])pb.box(x,-.23,0,.12,.65,1.35,M.concrete);for(const z of [-.64,.64])pb.box(0,-.23,z,1.5,.65,.12,M.concrete);pb.finish();const openPit=new THREE.Group(),coveredPit=new THREE.Group();pit.add(openPit,coveredPit);const wb=new Builder(openPit);wb.box(0,-.24,0,1.32,.035,1.1,mat('#435a42',.1,.28));wb.box(-.6,.15,-.5,.12,.22,.16,mat('#a59a6b'));wb.finish();line(openPit,[[.55,-.3,0],[.8,.15,.2],[1,.12,1.6],[1.5,.1,2.1]],.06,M.dark);const cover=new Builder(coveredPit);for(let x=-.66;x<.72;x+=.13)cover.box(x,.095,0,.06,.09,1.3,M.bar);for(const z of [-.59,.59])cover.box(0,.09,z,1.5,.09,.08,M.rust);cover.finish();registerNode({id:'pit',title:'未覆盖的积水检修坑',type:'hazard',kind:'排水与步行',x:pitPosition.x,z:pitPosition.z,detail:'巷边有一处低于路面的浅检修坑，留有积水与抽水软管。示例中缺少完整盖板，夜间或雨后容易被忽视。',lesson:'排水设施也要兼顾步行安全。整改示例增加固定格栅盖板；这不代表已经完成真实的排水能力校核。',action:'加装检修盖板',size:[2,1,2]},pit,openPit,coveredPit);
const drain=localGroup(1.7,-8),db=new Builder(drain);db.box(0,.08,0,.58,.07,1,M.dark);for(let j=-3;j<=3;j++)db.box(j*.07,.13,0,.03,.04,.85,M.bar);db.finish();const blocked=new THREE.Group(),clear=new THREE.Group();drain.add(blocked,clear);const blb=new Builder(blocked);for(let j=0;j<15;j++)blb.box(range(-.3,.3),.16,range(-.5,.5),range(.08,.2),.015,range(.1,.22),mat(j%2?'#8d8055':'#aba486'),0,rand()*6);blb.finish();registerNode({id:'drain',title:'被落叶与杂物堵塞的雨水口',type:'hazard',kind:'雨水径流',x:1.7,z:-8,detail:'落叶、塑料片和纸屑覆盖了巷边雨水口。下雨时，局部积水可能与排水口维护状态有关。',lesson:'地表坡度、雨水口位置和维护状态共同影响径流路径。清理入口是维护措施，不能替代管网与地形分析。',action:'清理雨水口杂物',size:[1.4,.8,1.5]},drain,blocked,clear);
// Designated parking on the outer road, with enough room to stand clear of doors.
gb.box(-40.7,.055,36,4.2,.02,8,mat('#626f58'));for(const z of [32.2,39.8])gb.box(-40.7,.075,z,4.2,.025,.07,mat('#c4ba8a'));for(let z=32.5;z<40;z+=1.3)gb.box(-40.7,.075,z,3.7,.02,.035,mat('#b6b096'));board(gb,'外缘停放区',-39,2.3,32,3.4,.7,'#405c4c');

gb.finish();
const shopLights=[];
for(const i of [5,10,14]){const c=buildings[i].config,side=c.x<0?-1:1,lamp=new THREE.PointLight('#ffd69b',3,8,2);buildings[i].shopLight=lamp;lamp.position.set(c.x-side*(c.d/2+.65),2.3,c.z);scene.add(lamp);shopLights.push(lamp);}
const outline=new THREE.LineSegments(new THREE.EdgesGeometry(boxGeo),new THREE.LineBasicMaterial({color:'#e4b561',transparent:true,opacity:.85,depthTest:true}));outline.visible=false;scene.add(outline);
let planning=null;
let selected=9,mode='overview',light='day',comparison=false,observation='life';
let target=new THREE.Vector3(0,8,3),radius=106,azimuth=.74,polar=.94;
const streetPosition=new THREE.Vector3(.1,1.75,47);let yaw=0,pitch=.12;let cameraTween=null;
function cameraUpdate(){if(mode==='lane'){camera.position.copy(streetPosition);camera.lookAt(streetPosition.x+Math.sin(yaw)*Math.cos(pitch),streetPosition.y+Math.sin(pitch),streetPosition.z-Math.cos(yaw)*Math.cos(pitch));}else{camera.position.set(target.x+radius*Math.sin(polar)*Math.sin(azimuth),target.y+radius*Math.cos(polar),target.z+radius*Math.sin(polar)*Math.cos(azimuth));camera.lookAt(target);}}
function setView(v){mode=v;cameraTween=null;keys.clear();document.body.classList.toggle('lane',v==='lane');$('walk-controls').hidden=v!=='lane';document.querySelectorAll('[data-view]').forEach(e=>e.classList.toggle('active',e.dataset.view===v));if(v==='lane'){streetPosition.set(.15,1.72,65);yaw=0;pitch=.08;toast('拖动环顾 · WASD / 屏幕箭头行走 · Esc 返回');}else{target.set(0,8,5);azimuth=.66;polar=v==='top'?.045:1.07;radius=v==='top'?149:128;if(innerWidth<760){radius*=1.23;target.x=4;}}cameraUpdate();}
function select(i){$('focus').firstChild.textContent='靠近这栋楼 ';activeNode=null;$('building-facts').hidden=false;$('renovate').hidden=false;$('export').hidden=false;$('resolve').hidden=true;$('node-detail').hidden=true;$('places').value='';selected=i;const b=buildings[i],c=b.config;outline.visible=b.root.visible;outline.position.set(c.x,b.h/2+.18,c.z);outline.rotation.y=c.rotation;outline.scale.set(c.w+.18,b.h+.12,c.d+.18);$('index').textContent=String(i+1).padStart(2,'0')+' / '+buildings.length;$('building-name').textContent=['榕荫巷','青石里','同兴巷','南风里'][i%4]+' '+String(i+1).padStart(2,'0')+' 号';$('floors').textContent=(b.root.visible?c.floors+1:0)+' 层';$('height').textContent=(b.root.visible?b.h+.18:0).toFixed(1)+' m';$('status').textContent=!b.root.visible?'已拆除腾地':b.relocated?'已原型迁建':b!==baseBuildings[i]?'退界重建':b.root.userData.renovated?'已翻新':'原有建筑';$('description').textContent=i%5===2?'住宅入口旁留着门槛、管线和墙上旧告示。楼顶的加建与邻楼高低错落。':'楼下是小店，楼上住着街坊。雨棚、窗笼和后装管线，让每栋楼有了不同的样子。';$('renovate').firstChild.textContent=b.root.userData.renovated?'恢复原有外观 ':'试试立面翻新 ';if(lightProfiles.length)showLightProfile();if(planning)planning.inspectBuilding(i);}
let toastTimer;function toast(s){$('toast').textContent=s;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3500);}
function renovate(){const b=buildings[selected],on=!b.root.userData.renovated;b.root.userData.renovated=on;b.body.material=on?materials.clean:b.wall;b.weathering.visible=!on; // facade fixtures intentionally retained
 for(const child of b.root.children)if(child.isInstancedMesh&&child.material===b.wall)child.material=on?materials.clean:b.wall;
 // Parapet batch may currently carry the clean material when restored.
 if(!on)for(const child of b.root.children)if(child.isInstancedMesh&&child.material===materials.clean)child.material=b.wall;
 select(selected);toast(on?'已演示立面翻新，保留原有建筑结构。':'已恢复原有外观。');}
function focus(){if(activeNode){focusNode(sceneNodes.get(activeNode));return;}const b=buildings[selected];if(mode==='lane'){const c=b.config,nx=Math.sin(c.rotation),nz=Math.cos(c.rotation);streetPosition.set(c.x+nx*(c.d/2+1.4),1.72,c.z+nz*(c.d/2+1.4));yaw=Math.atan2(-nx,nz);pitch=.3;return;}cameraTween={start:performance.now(),from:target.clone(),to:new THREE.Vector3(b.config.x,b.h*.4,b.config.z),fromR:radius,toR:Math.max(30,b.h*1.7)};}
function lighting(value){
 light=value;
 const evening=value==='evening',soft=value==='soft',rain=value==='rain';
 sun.intensity=evening?.16:rain?.4:soft?1.0:2.7;
 sun.position.set(-18,evening?14:39,30);
 sun.color.set(evening?'#c5d2e4':'#fff0d9');
 hemi.intensity=evening?1.0:rain?1.15:soft?1.49:1.28;
 hemi.color.set(evening?'#a5b7cd':'#d6e0ee');
 hemi.groundColor.set(evening?'#494240':'#787063');
 scene.background.set(evening?'#727f91':rain?'#aeb9bf':soft?'#b9c4c7':'#ccd7db');
 scene.fog.color.copy(scene.background);scene.fog.near=rain?48:70;
 M.warm.emissiveIntensity=evening?1.65:rain?.8:.2;
 residentialLights.forEach((m,i)=>{m.emissiveIntensity=evening?[1.35,.82,1.04][i]:0;});
 for(const m of signMats)m.emissiveIntensity=evening?.42:rain?.14:.025;
 for(const l of shopLights)l.intensity=evening?20:rain?8:2;
 wetMat.opacity=rain?.8:.4;
 materials.road.roughness=rain?.5:.94;
 renderer.toneMappingExposure=evening?1.1:1.04;
}
// Teaching observations use actual simplified geometry, not arbitrary score increments.
const lightProfiles=[],lightLayer=new THREE.Group(),greenLayer=new THREE.Group(),trialGreening=new THREE.Group();scene.add(lightLayer,greenLayer,trialGreening);lightLayer.visible=false;greenLayer.visible=false;trialGreening.visible=false;
let greeningOn=false;
const trialCanopies=[{x:-12,z:-24,r:1.7},{x:39,z:28,r:1.8},{x:-36,z:44,r:1.7}];
{const b=new Builder(trialGreening);for(const c of trialCanopies){b.cylinder(c.x,1.5,c.z,.18,3,.18,M.wood);for(let k=0;k<6;k++)b.add(sphereGeo,mat('#607d45'),c.x+Math.sin(k*2.4)*.5,3+(k%2)*.4,c.z+Math.cos(k*2.4)*.5,2.1,1.7,2.1);b.box(c.x,.22,c.z,1.2,.4,1.2,M.concrete);}b.finish();}
const baseBuildings=buildings.slice(), replacements=new Map();
let baselineSun, workSignature='';
let peoplePerRoom=2;
function roomCount(b){return b?Math.floor(b.config.w*b.config.d*.72/24)*b.config.floors:0;}
function livingCapacity(b){return roomCount(b)*peoplePerRoom;}
function replacementConfig(c){return {...c,w:c.w*.86,d:c.d*.82,floors:Math.max(2,c.floors-2)};}
function activeBuilding(id){const b=buildings[id];return b.root.visible?b:null;}
function sampleLight(){
 scene.updateMatrixWorld(true);
 const blockers=buildings.filter(b=>b.root.visible).map(b=>({b,inverse:b.body.matrixWorld.clone().invert(),box:b.body.geometry.boundingBox|| (b.body.geometry.computeBoundingBox(),b.body.geometry.boundingBox)}));
 const solar=[], lat=23.1*Math.PI/180, dec=-23.44*Math.PI/180;
 for(let minute=7.5;minute<1440;minute+=15){
  const hour=(minute/60-12)*Math.PI/12;
  const east=-Math.cos(dec)*Math.sin(hour), up=Math.sin(lat)*Math.sin(dec)+Math.cos(lat)*Math.cos(dec)*Math.cos(hour);
  const north=Math.cos(lat)*Math.sin(dec)-Math.sin(lat)*Math.cos(dec)*Math.cos(hour);
  if(up>0)solar.push(new THREE.Vector3(east,up,-north));
 }
 for(const dot of lightLayer.children){dot.geometry.dispose();dot.material.dispose();}lightLayer.clear();
 const ray=new THREE.Ray(),local=new THREE.Ray(),hit=new THREE.Vector3();
 for(const b of buildings){
  const c=b.config,nx=Math.sin(c.rotation),nz=Math.cos(c.rotation),rows=[];
  if(b.root.visible)for(let f=0;f<=c.floors;f++){
   const y=f===0?1.8:c.groundH+(f-.53)*c.floorH+.18;
   const center=new THREE.Vector3(c.x+nx*(c.d/2+.06),y,c.z+nz*(c.d/2+.06));
   let count=0;
   for(const offset of [-.26,0,.26]){
    const origin=center.clone().add(new THREE.Vector3(nz*c.w*offset,0,-nx*c.w*offset));
    for(const direction of solar){
     if(direction.x*nx+direction.z*nz<=0)continue;
     ray.set(origin,direction);
     if(!blockers.some(o=>o.b!==b&&local.copy(ray).applyMatrix4(o.inverse).intersectBox(o.box,hit)))count++;
    }
   }
   const minutes=count*5;rows.push(minutes);
   const dot=new THREE.Mesh(new THREE.SphereGeometry(.18,7,5),new THREE.MeshBasicMaterial({color:new THREE.Color().setHSL(.03+Math.min(minutes/300,1)*.27,.65,.5)}));
   dot.position.copy(center);lightLayer.add(dot);
  }
  lightProfiles[c.id]={id:c.id,rows,middle:rows[Math.floor(rows.length/2)]??0};
 }
 baselineSun??=lightProfiles.map(p=>p.rows.slice());
}
function applyBuildingWorks(works,edits){
 const locations=Object.fromEntries(Object.entries(edits).filter(([id])=>id.startsWith('building-')));
 const signature=JSON.stringify([works,locations]);if(signature===workSignature)return;
 workSignature=signature;
 for(const original of baseBuildings){
  const id=original.config.id,work=works[id],at=locations['building-'+id],c=original.config;
  original.root.position.set(at?.x??c.x,0,at?.z??c.z);original.root.visible=!work;if(original.streetFixtures)original.streetFixtures.visible=!work&&!at;if(original.shopLight)original.shopLight.visible=!work&&!at;
  if(work==='rebuild'&&!replacements.has(id))replacements.set(id,makeBuilding(replacementConfig(original.config),false));
  const replacement=replacements.get(id);
  if(replacement)replacement.root.visible=work==='rebuild';
  buildings[id]=work==='rebuild'?replacement:at?{...original,config:{...c,x:at.x,z:at.z},relocated:true}:original;
 }
 sampleLight();renderMiniMap();
}
function greenCoverage(){const greens=greeningOn?[...greenSpaces,...trialCanopies]:greenSpaces;let covered=0,total=0;for(let x=-35;x<=41;x+=1)for(let z=-54;z<=61;z+=1){total++;if(greens.some(c=>(c.x-x)**2+(c.z-z)**2<c.r*c.r))covered++;}return +(covered/total*100).toFixed(1);}
function buildGreenLayer(){greenLayer.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});greenLayer.clear();for(const c of [...greenSpaces,...(greeningOn?trialCanopies:[])]){const mesh=new THREE.Mesh(new THREE.RingGeometry(c.r*.8,c.r,24),new THREE.MeshBasicMaterial({color:'#a9d372',transparent:true,opacity:.85,side:THREE.DoubleSide,depthTest:false}));mesh.rotation.x=-Math.PI/2;mesh.position.set(c.x,.08,c.z);mesh.renderOrder=5;greenLayer.add(mesh);}}
function showLightProfile(){
 const panel=$('light-profile'),profile=lightProfiles[selected];
 panel.hidden=activeNode!==null||observation!=='light';if(!profile)return;
 const before=baselineSun[selected],after=profile.rows;
 panel.innerHTML='<small>冬至晴天 · 临街立面直射日照（分钟）</small><table><thead><tr><th>楼层</th><th>原状</th><th>现方案</th></tr></thead><tbody>'+before.map((minutes,f)=>'<tr><td>'+(f+1)+'F</td><td>'+minutes+'</td><td>'+(after[f]===undefined?'—':after[f]+(after[f]!==minutes?'（'+(after[f]>minutes?'+':'')+(after[f]-minutes)+'）':''))+'</td></tr>').join('')+'</tbody></table>';
 if(observation==='light')updateStudy();
}
function updateStudy(){const p=lightProfiles[selected],solved=[...sceneNodes.values()].filter(n=>n.type==='hazard'&&n.resolved).length;
 const data=observation==='risk'?{domain:'地理 × 环境治理 × 公共安全',title:'问题，发生在什么位置？',body:'垃圾外溢、占用出口、积水检修坑和堵塞雨水口，分别连接到清运可达性、通行空间与径流路径。点击地图上的观察点，试一次改善。',metrics:'已改善 '+solved+' / 4 处示例观察点。'}:observation==='light'?{domain:'地理 × 光学 × 城市规划',title:'阳光是奢侈的。哪层楼能晒到？',body:'用广州约23.1°N的冬至太阳路径，每15分钟检查临街立面三点是否被民居体块挡住。楼层、朝向和楼距共同改变结果。',metrics:p?.rows.length?'中层临街立面 '+p.middle+' 分钟<br><small>三点平均；采用当地太阳时，忽略云、阳台、树冠及非民居遮挡。可在右侧比较每层。室内亮度需另行评估。</small>':'此地块已腾空。请选邻楼查看日照变化。'}:{domain:'地理 × 生态 × 社区生活',title:'窄巷里的绿，能种在哪里？',body:'绿色圈显示示意树冠位置。试在前埕边缘、涌边和外缘道路补绿，避免占用狭窄出口。补绿增加室外绿量，不会自动解决中层室内采光。',metrics:planning?(()=>{const m=planning.metrics();return '地面种植率 '+m.ground.before+'% → '+m.ground.after+'%<br>树冠覆盖 '+m.canopyBefore+'% → '+m.green+'%<br><small>固定教学范围内的估算。</small>';})():'示意树冠覆盖：'+greenCoverage()+'%'};
 $('study-domain').textContent=data.domain;$('study-title').textContent=data.title;$('study-body').textContent=data.body;$('study-metrics').innerHTML=data.metrics;$('greening').hidden=observation!=='green';$('greening').textContent=greeningOn?'撤销这次补绿':'试种三处补绿';}
function setObservation(value){observation=value;$('study-diagnosis').hidden=!['water','light','green'].includes(value);if(planning&&['water','human','gis'].includes(value)){$('observe').value=value;lightLayer.visible=false;greenLayer.visible=false;featurePins.visible=false;planning.showStudy(value);return;}$('observe').value=value;document.body.classList.toggle('observing',value!=='life');$('study-card').hidden=value==='life';lightLayer.visible=value==='light';greenLayer.visible=value==='green';featurePins.visible=value==='risk';for(const n of sceneNodes.values())n.pin.visible=n.root.visible&&n.type==='hazard';showLightProfile();if(value!=='life')updateStudy();if(value==='green')setView('top');if(value==='light')setView('overview');if(planning)planning.renderControls();}
function toggleGreening(){greeningOn=!greeningOn;trialGreening.visible=greeningOn;buildGreenLayer();updateStudy();renderMiniMap();toast(greeningOn?'已在三处公共空间边缘补绿；楼体遮挡并未改变。':'已撤销示例补绿。');}
function inspectNode(id){$('focus').firstChild.textContent='走近这里 ';const n=sceneNodes.get(id);if(!n)return;activeNode=id;$('places').value=id;$('index').textContent=n.kind;$('building-name').textContent=n.title;$('description').textContent=n.detail;$('building-facts').hidden=true;$('light-profile').hidden=true;$('renovate').hidden=true;$('export').hidden=true;$('resolve').hidden=n.type!=='hazard';$('resolve').textContent=n.resolved?'恢复原始示例':n.action;$('node-detail').hidden=false;$('node-detail').innerHTML='<b>'+n.kind+(n.type==='hazard'?(n.resolved?' · 已改善':' · 待观察'):'')+'</b>'+n.lesson;outline.visible=n.root.visible;outline.position.set(n.x,n.size[1]/2,n.z);outline.rotation.y=0;outline.scale.set(...n.size);if(planning)planning.inspectNode(id);}
function focusNode(n){if(mode==='lane'){streetPosition.set(n.x,1.72,n.z+Math.max(3,n.size[2]/2+1));yaw=0;pitch=.12;return;}cameraTween={start:performance.now(),from:target.clone(),to:new THREE.Vector3(n.x,n.size[1]*.3,n.z),fromR:radius,toR:Math.max(23,n.size[0]*2.2)};}
function setResolved(n,value){n.resolved=value;if(n.dirty)n.dirty.visible=!value;if(n.safe)n.safe.visible=value;n.pinMaterial.color.set(value?'#9dbd7a':'#e6a252');}
function resolveNode(){if(!activeNode)return;const n=sceneNodes.get(activeNode);if(n.type!=='hazard')return;setResolved(n,!n.resolved);inspectNode(n.id);updateStudy();renderMiniMap();toast(n.resolved?'已完成示例改善。可在同一观察点恢复对照。':'已恢复原始观察点。');}
function renderMiniMap(){const px=x=>100+x*1.43,py=z=>96+z*1.22;let s='<svg viewBox="0 0 205 190" role="img" aria-label="虚构教学街区的主路、巷道、河涌和观察点"><rect x="0" y="0" width="205" height="190" fill="#e4e5d7"/><rect x="'+px(44)+'" y="'+py(-60)+'" width="9" height="146" fill="#7b9b91"/>';
 for(const road of roadNetwork)s+='<polyline points="'+road.points.map(p=>px(p[0])+','+py(p[1])).join(' ')+'" fill="none" stroke="#b1b6a2" stroke-width="'+Math.max(2,road.width*1.2)+'"/>';
 s+='<rect x="'+px(-14)+'" y="'+py(-36)+'" width="40" height="18" fill="#cfccaa"/>';
 for(const b of buildings){if(!b.root.visible)continue;const c=b.config,co=Math.cos(c.rotation),si=Math.sin(c.rotation);const pts=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,d])=>px(c.x+a*c.w/2*co+d*c.d/2*si)+','+py(c.z-a*c.w/2*si+d*c.d/2*co)).join(' ');s+='<polygon points="'+pts+'" fill="#8f9986" stroke="#d8ddce" stroke-width=".4"/>';}
 for(const n of sceneNodes.values())s+='<g data-node="'+n.id+'"><circle cx="'+px(n.x)+'" cy="'+py(n.z)+'" r="4.4" fill="'+(n.type==='hazard'?(n.resolved?'#729452':'#be8349'):'#426b59')+'" stroke="#fff6d9" stroke-width="1.3"/><title>'+n.title+'</title></g>';
 if(greeningOn)for(const c of trialCanopies)s+='<circle cx="'+px(c.x)+'" cy="'+py(c.z)+'" r="3.5" fill="#96b262"/>';
 s+='</svg>';$('mini-map').innerHTML=s;}
function setCompare(on){comparison=on;document.body.classList.toggle('comparing',on);$('compare-labels').hidden=!on;$('compare').textContent=on?'退出对照':'昼夜对照';camera.aspect=(innerWidth/(on?2:1))/innerHeight;camera.updateProjectionMatrix();}
function renderScene(){if(!comparison){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setScissorTest(false);renderer.setViewport(0,0,innerWidth,innerHeight);renderer.render(scene,camera);return;}const restore=light;camera.aspect=innerWidth/2/innerHeight;camera.updateProjectionMatrix();renderer.setScissorTest(true);for(let i=0;i<2;i++){renderer.setViewport(i*innerWidth/2,0,innerWidth/2,innerHeight);renderer.setScissor(i*innerWidth/2,0,innerWidth/2,innerHeight);lighting(i?'evening':'day');renderer.render(scene,camera);}renderer.setScissorTest(false);lighting(restore);}
function setupDistrictUI(){sampleLight();buildGreenLayer();renderMiniMap();$('places').innerHTML='<option value="">选择祠堂、小店或观察点</option>'+[...sceneNodes.values()].map(n=>'<option value="'+n.id+'">'+n.title+'</option>').join('');$('places').onchange=e=>{if(e.target.value){inspectNode(e.target.value);focusNode(sceneNodes.get(e.target.value));}};$('resolve').onclick=resolveNode;$('observe').onchange=e=>setObservation(e.target.value);$('greening').onclick=toggleGreening;$('compare').onclick=()=>setCompare(!comparison);$('sources').onclick=()=>$('source-dialog').showModal();$('close-sources').onclick=()=>$('source-dialog').close();$('mini-map').onclick=e=>{const id=e.target.closest('[data-node]')?.dataset.node;if(id){inspectNode(id);focusNode(sceneNodes.get(id));}};}

const ray=new THREE.Raycaster();let pointers=new Map(),down=null,dragged=false,pinch=null;const keys=new Set();
canvas.addEventListener('pointerdown',e=>{canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});down={x:e.clientX,y:e.clientY};dragged=false;if(pointers.size===2){const a=[...pointers.values()];pinch={dist:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};}});
canvas.addEventListener('pointermove',e=>{if(planning?.tool&&!pointers.size){const p=planningGround(e);if(p)planning.preview(p);return;}const prev=pointers.get(e.pointerId);if(!prev)return;const dx=e.clientX-prev.x,dy=e.clientY-prev.y;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)dragged=true;cameraTween=null;
 if(pointers.size===2&&mode!=='lane'){const a=[...pointers.values()],dist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),x=(a[0].x+a[1].x)/2,y=(a[0].y+a[1].y)/2;if(pinch){radius=THREE.MathUtils.clamp(radius*pinch.dist/Math.max(1,dist),22,180);target.x-=(x-pinch.x)*radius*.001;target.z-=(y-pinch.y)*radius*.001;}pinch={dist,x,y};}
 else if(mode==='lane'){yaw+=dx*.004;pitch=THREE.MathUtils.clamp(pitch-dy*.003,-.7,1.2);}else if(e.buttons===2||e.shiftKey){target.x-=dx*radius*.001;target.z-=dy*radius*.001;}else{azimuth-=dx*.004;polar=THREE.MathUtils.clamp(polar+dy*.003,.035,1.43);}cameraUpdate();});
// A named handler keeps touch cancellation and ordinary release identical.
function release(e){const click=!dragged&&pointers.size===1;pointers.delete(e.pointerId);pinch=null;if(click&&planning?.tool){const p=planningGround(e);if(p){if(planning.tool.type==='new')planning.pickSite(p.x,p.z);else{planning.showMap();planning.chooseSite(p.x,p.z);}}down=null;return;}if(click){const rect=canvas.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((comparison?((e.clientX-rect.left)%(rect.width/2))/(rect.width/2):(e.clientX-rect.left)/rect.width)*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const hit=ray.intersectObjects([...pickTargets,...(planning?planning.pickMeshes():[])].filter(o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;}),false)[0];if(hit){if(hit.object.userData.planItem)planning.selectItem(hit.object.userData.planItem);else if(hit.object.userData.sceneNode)inspectNode(hit.object.userData.sceneNode);else if(hit.object.userData.building!==undefined)select(hit.object.userData.building);}}down=null;}
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);pinch=null;down=null;});canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('wheel',e=>{e.preventDefault();if(mode!=='lane'){radius=THREE.MathUtils.clamp(radius*Math.exp(e.deltaY*.001),22,180);cameraTween=null;cameraUpdate();}},{passive:false});
window.addEventListener('keydown',e=>{if(e.key==='Escape'){if(planning?.cancel())return;if($('help').open)$('help').close();else setView('overview');}if(mode==='lane'&&['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)&&!['INPUT','SELECT','BUTTON'].includes(document.activeElement.tagName)&&!$('help').open){keys.add(e.key);e.preventDefault();}});window.addEventListener('keyup',e=>keys.delete(e.key));window.addEventListener('blur',()=>keys.clear());document.addEventListener('visibilitychange',()=>keys.clear());
document.querySelectorAll('[data-walk]').forEach(el=>{const key={forward:'w',back:'s',left:'a',right:'d'}[el.dataset.walk];el.addEventListener('pointerdown',e=>{e.preventDefault();el.setPointerCapture(e.pointerId);keys.add(key);});['pointerup','pointercancel','lostpointercapture'].forEach(ev=>el.addEventListener(ev,()=>keys.delete(key)));});
document.querySelectorAll('[data-view]').forEach(el=>el.onclick=()=>setView(el.dataset.view));$('focus').onclick=focus;$('renovate').onclick=renovate;$('light').onchange=e=>lighting(e.target.value);$('guide').onclick=()=>$('help').showModal();$('close-help').onclick=()=>$('help').close();$('reset').onclick=()=>{buildings.forEach(b=>{b.root.userData.renovated=false;b.body.material=b.wall;b.weathering.visible=true;for(const c of b.root.children)if(c.isInstancedMesh&&c.material===materials.clean)c.material=b.wall;});for(const node of sceneNodes.values())if(node.type==='hazard')setResolved(node,false);if(greeningOn)toggleGreening();setCompare(false);setObservation('life');setView('overview');select(9);lighting('day');$('light').value='day';toast('已恢复初始场景。');};
$('export').onclick=async()=>{const button=$('export');button.disabled=true;toast('正在打包建筑几何体与贴图…');try{await new Promise(r=>setTimeout(r,30));const b=buildings[selected],blob=await window.exportBuildingGLB(b.root);const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=b.root.name+'.glb';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);toast('建筑 GLB 已导出，可继续导入三维项目。');}catch(e){toast('导出失败：'+e.message);}finally{button.disabled=false;}};
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
setupDistrictUI();setView('overview');select(9);lighting('day');
let last=performance.now(),frames=0,statTime=last;
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;if(document.hidden)return;
 if(mode==='lane'&&keys.size){let f=(keys.has('w')||keys.has('ArrowUp')?1:0)-(keys.has('s')||keys.has('ArrowDown')?1:0),r=(keys.has('d')||keys.has('ArrowRight')?1:0)-(keys.has('a')||keys.has('ArrowLeft')?1:0);const n=Math.hypot(f,r)||1;streetPosition.x+= (Math.sin(yaw)*f+Math.cos(yaw)*r)/n*dt*4;streetPosition.z+=(-Math.cos(yaw)*f+Math.sin(yaw)*r)/n*dt*4;streetPosition.x=THREE.MathUtils.clamp(streetPosition.x,-55,58);streetPosition.z=THREE.MathUtils.clamp(streetPosition.z,-65,69);}
 if(cameraTween){const t=Math.min(1,(now-cameraTween.start)/850),e=t*t*(3-2*t);target.lerpVectors(cameraTween.from,cameraTween.to,e);radius=THREE.MathUtils.lerp(cameraTween.fromR,cameraTween.toR,e);if(t===1)cameraTween=null;}
 cameraUpdate();renderScene();for(const item of steamSprites){const t=(now*.00017+item.phase)%1;item.sp.position.y=1.8+t*1.5;item.sp.position.x=sceneNodes.get('breakfast').x-.1+Math.sin(now*.0005+item.phase)*.12;item.sp.position.z=sceneNodes.get('breakfast').z+.12;item.sp.material.opacity=sceneNodes.get('breakfast').root.visible?(1-t)*.2:0;item.sp.scale.set(.3+t*.6,.5+t*.8,1);}frames++;
 if(now-statTime>1500){$('scene-stats').textContent=`${buildings.filter(b=>b.root.visible).length} 栋民居 · 祠堂 / 涌边 / 风险观察 · ${Math.round(frames*1000/(now-statTime))} FPS`;frames=0;statTime=now;}
}
renderer.render(scene,camera);$('loading').remove();requestAnimationFrame(frame);
function planningGround(e){const rect=canvas.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);return ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),new THREE.Vector3());}
// Read-only inspection surface for integration and deterministic validation.
window.Xiangli={scene,camera,renderer,buildings,sceneNodes,roadNetwork,lightProfiles,baseBuildings,activeBuilding,roomCount,livingCapacity,replacementConfig,get baselineSun(){return baselineSun;},inspectNode,resolveNode,setObservation,setCompare,toggleGreening,greenCoverage,select,setView,renovate,lighting,get selected(){return selected;}};
if(window.installPlanning){
 planning=window.installPlanning({api:window.Xiangli,THREE,Builder,M,mat,boxGeo,sphereGeo,scene,globals,buildings,sceneNodes,board,materials,greenSpaces,trialCanopies,toast,focus,setView,comparison:()=>comparison,activeNode:()=>activeNode,observation:()=>observation,refreshGreen(){buildGreenLayer();if(observation==='green')updateStudy();},
 applyOriginalState(state){peoplePerRoom=state.occupancy;applyBuildingWorks(state.buildingWorks,state.objectEdits);for(const b of baseBuildings){const on=state.renovated.includes(b.config.id);b.root.userData.renovated=on;b.body.material=on?materials.clean:b.wall;b.weathering.visible=!on;for(const child of b.root.children)if(child.isInstancedMesh&&(child.material===b.wall||child.material===materials.clean))child.material=on?materials.clean:b.wall;}for(const n of sceneNodes.values())if(n.type==='hazard')setResolved(n,state.resolved.includes(n.id));if(greeningOn!==state.greening)toggleGreening();if(activeNode)inspectNode(activeNode);else select(selected);},
 positionObject(n,x,z,visible){n.x=x;n.z=z;n.root.position.set(x,0,z);n.root.visible=visible;n.pin.position.x=x;n.pin.position.z=z;n.pin.visible=visible&&n.type==='hazard';},
 returnToStart(){setCompare(false);setObservation('life');setView('overview');select(9);lighting('day');$('light').value='day';}
 });window.Xiangli.planning=planning;window.Xiangli.renovate=planning.buyRenovation;window.Xiangli.resolveNode=planning.buyHazard;window.Xiangli.toggleGreening=planning.buyGreening;
}

})();
