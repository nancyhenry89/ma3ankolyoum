<template>
    <div class="bk">
      <template v-for="(b, i) in blocks" :key="i">
        <p v-if="b.type === 'p'" class="bkP">{{ b.text }}</p>
  
        <div v-else-if="b.type === 'h2'" class="bkH2">{{ b.text }}</div>
        <div v-else-if="b.type === 'h3'" class="bkH3">{{ b.text }}</div>
  
        <div v-else-if="b.type === 'quote'" class="bkQuote">“{{ b.text }}”</div>
  
        <ul v-else-if="b.type === 'ul'" class="bkUl">
          <li v-for="(it, idx) in b.items" :key="idx">{{ it }}</li>
        </ul>
  
        <ol v-else-if="b.type === 'ol'" class="bkOl">
          <li v-for="(it, idx) in b.items" :key="idx">{{ it }}</li>
        </ol>
  
        <div v-else-if="b.type === 'callout'" class="bkCallout">
          <div class="bkCalloutTop">
            <span v-if="b.icon" class="bkIcon">{{ b.icon }}</span>
            <span v-if="b.title" class="bkCalloutTitle">{{ b.title }}</span>
          </div>
          <div class="bkCalloutText">{{ b.text }}</div>
        </div>
  
        <div v-else-if="b.type === 'divider'" class="bkDivider"></div>
      </template>
    </div>
  </template>
  
  <script setup lang="ts">
  import type { Block } from "@/services/booksContent"
  defineProps<{ blocks: Block[] }>()
  </script>
  
  <style scoped>
  .bk { padding: 14px 14px 40px; }
  
  .bkP { white-space: pre-wrap; line-height: 1.9; font-size: 16px; margin: 0 0 12px; }
  
  .bkH2 { font-size: 20px; font-weight: 800; margin: 18px 0 10px; }
  .bkH3 { font-size: 17px; font-weight: 800; margin: 14px 0 8px; opacity: 0.95; }
  
  .bkQuote {
    padding: 12px 12px;
    border-inline-start: 4px solid var(--ion-color-primary);
    background: rgba(255,255,255,0.06);
    border-radius: 14px;
    line-height: 1.8;
    margin: 10px 0 14px;
  }
  
  .bkUl, .bkOl { margin: 6px 0 14px 20px; line-height: 1.9; }
  .bkUl li, .bkOl li { margin: 6px 0; }
  
  .bkCallout {
    border-radius: 16px;
    padding: 12px 12px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.10);
    margin: 10px 0 14px;
  }
  .bkCalloutTop { display: flex; gap: 10px; align-items: center; font-weight: 800; margin-bottom: 6px; }
  .bkIcon { font-size: 18px; }
  .bkCalloutText { white-space: pre-wrap; line-height: 1.9; }
  
  .bkDivider { height: 1px; background: rgba(255,255,255,0.12); margin: 16px 0; }
  </style>
  