/** Billboards em espaço de câmera: compatíveis com perspectiva, topo e ortográfica. */
export const emberFragment = `
uniform sampler2D uMask;
uniform vec3 uColor;
uniform float uPower, uFlicker, uEmission;
varying vec2 vUv;
varying vec3 vColor;
#include <fog_pars_fragment>
void main(){
  float grain=.45+.55*texture2D(uMask,vUv).a;
  gl_FragColor=vec4(mix(vec3(.035,.018,.008),uColor*vColor*grain*uEmission*uFlicker,min(uPower,1.)),1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

export const emberVertex = `
varying vec2 vUv;
varying vec3 vColor;
#include <fog_pars_vertex>
void main(){vUv=uv;vColor=color;vec4 mvPosition=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;
#include <fog_vertex>
}`;

export const glowFragment = `
uniform sampler2D uMask;
uniform vec3 uColor;
uniform float uPower, uFlicker, uOpacity;
varying vec2 vUv;
#include <fog_pars_fragment>
void main(){gl_FragColor=vec4(uColor,texture2D(uMask,vUv).a*uOpacity*uPower*uFlicker);
#include <tonemapping_fragment>
#include <colorspace_fragment>
#include <fog_fragment>
}`;

export const glowVertex = `
varying vec2 vUv;
#include <fog_pars_vertex>
void main(){vUv=uv;vec4 mvPosition=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;
#include <fog_vertex>
}`;

export const particleFragment = `
uniform sampler2D uMask;
uniform vec3 uCore, uMiddle, uTip;
uniform float uOpacity, uKind, uTime;
varying vec2 vUv;
varying float vAge, vFade;
#include <fog_pars_fragment>
void main(){
  vec2 sampleUv=vUv;
  if(uKind<.5)sampleUv.x+=sin(vUv.y*8.-uTime*3.1)*.045*vUv.y;
  float mask=texture2D(uMask,sampleUv).a;
  float heat=clamp(vAge*.75+vUv.y*.25,0.,1.);
  vec3 tint=mix(uCore,uMiddle,smoothstep(.05,.48,heat));
  tint=mix(tint,uTip,smoothstep(.45,1.,heat));
  gl_FragColor=vec4(tint,mask*vFade*uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

export const particleVertex = `
attribute vec4 aParticle;
uniform float uTime, uPower, uFlicker, uSpeed, uLifetime;
uniform float uHeight, uWidth, uSpread, uSway, uKind;
uniform vec2 uWind;
varying vec2 vUv;
varying float vAge, vFade;
#include <fog_pars_vertex>
void main(){
  float phase=aParticle.x;
  float seed=aParticle.y;
  float age=fract(uTime*uSpeed/(uLifetime*(.8+seed*.5))+phase);
  float fade=smoothstep(0.,.13,age)*(1.-smoothstep(.64,1.,age));
  float heat=sqrt(max(uPower,.0001));
  float angle=aParticle.w;
  float radius=aParticle.z*uSpread*(1.-age*.62);
  vec3 center=vec3(cos(angle)*radius,.24+age*uHeight*heat*(.88+.12*uFlicker),sin(angle)*radius);
  center.xz+=uWind*age*age;
  center.x+=sin(uTime*1.71+seed*31.+age*4.)*uSway*age;
  center.z+=cos(uTime*1.13+seed*23.+age*3.)*uSway*age;
  float width=uWidth*(.65+seed*.65)*heat;
  vec2 dimensions;
  if(uKind<.5){
    dimensions=vec2(width*(1.-age*.72),width*(1.5-age*.4))*(.9+uFlicker*.1);
  }else if(uKind<1.5){
    dimensions=vec2(width,width*1.8)*(1.-age*.5);
  }else{
    center.y+=.5;
    dimensions=vec2(width)*(1.+age*1.8);
  }
  vec4 mvPosition=modelViewMatrix*vec4(center,1.);
  vec2 scale=vec2(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz));
  float turn=sin(seed*32.+uTime*.37)*.28;
  mat2 rotation=mat2(cos(turn),-sin(turn),sin(turn),cos(turn));
  mvPosition.xy+=rotation*(position.xy*dimensions*scale);
  gl_Position=projectionMatrix*mvPosition;
  vUv=uv;vAge=age;vFade=fade*min(uPower,1.5)*uFlicker;
  #include <fog_vertex>
}`;

