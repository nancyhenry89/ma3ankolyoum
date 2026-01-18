System.register(["./index-legacy-Fy8yh88G.js"],function(t,e){"use strict";var n,r,a;return{setters:[t=>{n=t.aa,r=t.ab,a=t.ac}],execute:function(){
/*!
             * (C) Ionic http://ionicframework.com - MIT License
             */
t("createSwipeBackGesture",(t,e,i,s,c)=>{const o=t.ownerDocument.defaultView;let u=n(t);const l=t=>u?-t.deltaX:t.deltaX;return r({el:t,gestureName:"goback-swipe",gesturePriority:101,threshold:10,canStart:r=>(u=n(t),(t=>{const{startX:e}=t;return u?e>=o.innerWidth-50:e<=50})(r)&&e()),onStart:i,onMove:t=>{const e=l(t)/o.innerWidth;s(e)},onEnd:t=>{const e=l(t),n=o.innerWidth,r=e/n,i=(t=>u?-t.velocityX:t.velocityX)(t),s=i>=0&&(i>.2||e>n/2),d=(s?1-r:r)*n;let h=0;if(d>5){const t=d/Math.abs(i);h=Math.min(t,540)}c(s,r<=0?.01:a(0,r,.9999),h)}})})}}});
