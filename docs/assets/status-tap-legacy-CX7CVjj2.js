System.register(["./index-legacy-BlMgSlR_.js"],function(e,t){"use strict";var n,r,s,i,o;return{setters:[e=>{n=e.be,r=e.bf,s=e.bg,i=e.bh,o=e.bi}],execute:function(){
/*!
             * (C) Ionic http://ionicframework.com - MIT License
             */
e("startStatusTap",()=>{const e=window;e.addEventListener("statusTap",()=>{n(()=>{const t=e.innerWidth,n=e.innerHeight,a=document.elementFromPoint(t/2,n/2);if(!a)return;const c=r(a);c&&new Promise(e=>s(c,e)).then(()=>{i(async()=>{c.style.setProperty("--overflow","hidden"),await o(c,300),c.style.removeProperty("--overflow")})})})})})}}});
