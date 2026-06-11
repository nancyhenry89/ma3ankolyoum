<template>
    <ion-page>
      <ion-header class="mk-header">
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button :default-href="`/conference/${conferenceId}`" />
          </ion-buttons>
  
          <ion-title>إدارة البرنامج</ion-title>
        </ion-toolbar>
      </ion-header>
  
      <ion-content class="admin-schedule" dir="rtl">
        <div class="page-wrap">
          <div class="top-card">
            <div>
              <div class="eyebrow">لوحة الإدارة</div>
              <h1>تعديل برنامج المؤتمر</h1>
              <p>أي تعديل هنا سيتم حفظه في Google Sheet.</p>
            </div>
  
            <ion-button class="refresh-btn" fill="outline" @click="loadSchedule">
              تحديث
            </ion-button>
          </div>
  
          <ion-card class="form-card">
            <ion-card-header>
              <ion-card-title>
                {{ editingId ? 'تعديل فقرة' : 'إضافة فقرة جديدة' }}
              </ion-card-title>
            </ion-card-header>
  
            <ion-card-content>
              <ion-item>
                <ion-label position="stacked">التاريخ</ion-label>
                <ion-input v-model="form.day" placeholder="2026-06-11" />
              </ion-item>
  
              <div class="time-grid">
                <ion-item>
                  <ion-label position="stacked">من</ion-label>
                  <ion-input v-model="form.start_time" placeholder="2:00" />
                </ion-item>
  
                <ion-item>
                  <ion-label position="stacked">AM/PM</ion-label>
                  <ion-select v-model="form.start_ampm">
                    <ion-select-option value="AM">AM</ion-select-option>
                    <ion-select-option value="PM">PM</ion-select-option>
                  </ion-select>
                </ion-item>
  
                <ion-item>
                  <ion-label position="stacked">إلى</ion-label>
                  <ion-input v-model="form.end_time" placeholder="3:00" />
                </ion-item>
  
                <ion-item>
                  <ion-label position="stacked">AM/PM</ion-label>
                  <ion-select v-model="form.end_ampm">
                    <ion-select-option value="AM">AM</ion-select-option>
                    <ion-select-option value="PM">PM</ion-select-option>
                  </ion-select>
                </ion-item>
              </div>
  
              <ion-item>
                <ion-label position="stacked">العنوان</ion-label>
                <ion-input v-model="form.title" placeholder="عنوان الفقرة" />
              </ion-item>
  
              <ion-item>
                <ion-label position="stacked">المتكلم</ion-label>
                <ion-input v-model="form.speaker" placeholder="اختياري" />
              </ion-item>
  
              <ion-item>
                <ion-label position="stacked">المكان</ion-label>
                <ion-input v-model="form.location" placeholder="اختياري" />
              </ion-item>
  
              <div class="actions">
                <ion-button expand="block" :disabled="saving" @click="saveItem">
                  {{ saving ? 'جاري الحفظ...' : editingId ? 'حفظ التعديل' : 'إضافة للبرنامج' }}
                </ion-button>
  
                <ion-button
                  v-if="editingId"
                  expand="block"
                  fill="outline"
                  color="medium"
                  @click="resetForm"
                >
                  إلغاء التعديل
                </ion-button>
              </div>
  
              <p v-if="message" class="message">
                {{ message }}
              </p>
            </ion-card-content>
          </ion-card>
  
          <div class="section-head">
            <h2>الفقرات الحالية</h2>
            <span>{{ schedule.length }}</span>
          </div>
  
          <p v-if="loading" class="center">جاري التحميل...</p>
  
          <div v-else-if="schedule.length === 0" class="empty">
            لا توجد فقرات بعد.
          </div>
  
          <div
            v-for="item in sortedSchedule"
            :key="item.id || `${item.day}-${item.start_time}-${item.title}`"
            class="schedule-row"
          >
            <div class="time">
              <strong>{{ item.start_time }} {{ item.start_ampm || item.ampm }}</strong>
              <span>{{ item.end_time }} {{ item.end_ampm || item.ampm }}</span>
            </div>
  
            <div class="details">
              <h3>{{ item.title }}</h3>
              <p>{{ item.day }}</p>
              <p v-if="item.speaker">{{ item.speaker }}</p>
              <p v-if="item.location">📍 {{ item.location }}</p>
            </div>
  
            <div class="row-actions">
              <button type="button" @click="editItem(item)">تعديل</button>
              <button type="button" class="danger" @click="deleteItem(item)">حذف</button>
            </div>
          </div>
        </div>
      </ion-content>
    </ion-page>
  </template>
  
  <script setup lang="ts">
  import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonSelect,
    IonSelectOption,
  } from '@ionic/vue'
  
  import { computed, onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  
  import {
    fetchConferenceSchedule,
    type ConferenceScheduleRow,
  } from '@/services/sheets'
  
  import {
    CONFERENCE_ADMIN_API,
    CONFERENCE_ADMIN_SECRET,
  } from '@/config/conferenceAdmin'
  
  const route = useRoute()
  const conferenceId = String(route.params.id || '')
  
  type AdminScheduleRow = ConferenceScheduleRow & {
    id?: string
    start_ampm?: string
    end_ampm?: string
    ampm?: string
  }
  
  const loading = ref(true)
  const saving = ref(false)
  const message = ref('')
  const editingId = ref('')
  
  const schedule = ref<AdminScheduleRow[]>([])
  
  const form = ref<AdminScheduleRow>({
    id: '',
    conference_id: conferenceId,
    day: '',
    start_time: '',
    start_ampm: 'AM',
    end_time: '',
    end_ampm: 'AM',
    ampm: '',
    title: '',
    speaker: '',
    location: '',
  })
  
  onMounted(async () => {
    await loadSchedule()
  })
  
  const sortedSchedule = computed(() => {
    return [...schedule.value].sort((a, b) => {
      const da = `${a.day} ${a.start_time} ${a.start_ampm || a.ampm}`
      const db = `${b.day} ${b.start_time} ${b.start_ampm || b.ampm}`
      return da.localeCompare(db)
    })
  })
  
  async function loadSchedule() {
    loading.value = true
    message.value = ''
  
    try {
      schedule.value = (await fetchConferenceSchedule(conferenceId, true)) as AdminScheduleRow[]
    } catch (e) {
      console.error(e)
      message.value = 'حدث خطأ أثناء تحميل البرنامج.'
    } finally {
      loading.value = false
    }
  }
  
  async function saveItem() {
    message.value = ''
  
    if (!form.value.day.trim()) {
      message.value = 'اكتبي التاريخ.'
      return
    }
  
    if (!form.value.start_time.trim() || !form.value.end_time.trim()) {
      message.value = 'اكتبي وقت البداية والنهاية.'
      return
    }
  
    if (!form.value.title.trim()) {
      message.value = 'اكتبي عنوان الفقرة.'
      return
    }
  
    saving.value = true
  
    try {
      const item = {
        ...form.value,
        id: editingId.value || form.value.id || '',
        conference_id: conferenceId,
      }
  
      const res = await postAdmin({
        action: 'saveScheduleItem',
        item,
      })
  
      if (!res.ok) {
        throw new Error(res.error || 'Save failed')
      }
  
      message.value = 'تم الحفظ ✅'
      resetForm()
      await loadSchedule()
    } catch (e) {
      console.error(e)
      message.value = 'حدث خطأ أثناء الحفظ.'
    } finally {
      saving.value = false
    }
  }
  
  function editItem(item: AdminScheduleRow) {
    editingId.value = item.id || ''
  
    form.value = {
      id: item.id || '',
      conference_id: conferenceId,
      day: item.day || '',
      start_time: item.start_time || '',
      start_ampm: item.start_ampm || item.ampm || 'AM',
      end_time: item.end_time || '',
      end_ampm: item.end_ampm || item.ampm || 'AM',
      ampm: item.ampm || '',
      title: item.title || '',
      speaker: item.speaker || '',
      location: item.location || '',
    }
  
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  async function deleteItem(item: AdminScheduleRow) {
    if (!item.id) {
      alert('لا يمكن حذف هذه الفقرة لأنها لا تحتوي على id في الشيت.')
      return
    }
  
    if (!confirm('هل تريدين حذف هذه الفقرة؟')) return
  
    saving.value = true
  
    try {
      const res = await postAdmin({
        action: 'deleteScheduleItem',
        id: item.id,
      })
  
      if (!res.ok) {
        throw new Error(res.error || 'Delete failed')
      }
  
      message.value = 'تم الحذف ✅'
      await loadSchedule()
    } catch (e) {
      console.error(e)
      message.value = 'حدث خطأ أثناء الحذف.'
    } finally {
      saving.value = false
    }
  }
  
  function resetForm() {
    editingId.value = ''
  
    form.value = {
      id: '',
      conference_id: conferenceId,
      day: '',
      start_time: '',
      start_ampm: 'AM',
      end_time: '',
      end_ampm: 'AM',
      ampm: '',
      title: '',
      speaker: '',
      location: '',
    }
  }
  
  async function postAdmin(payload: any) {
    const res = await fetch(CONFERENCE_ADMIN_API, {
      method: 'POST',
      body: JSON.stringify({
        secret: CONFERENCE_ADMIN_SECRET,
        ...payload,
      }),
    })
  
    return await res.json()
  }
  </script>
  
  <style scoped>
  .mk-header ion-toolbar {
    --background: #0f172a;
    --color: #f8fafc;
  }
  
  .admin-schedule {
    --background: #f6fbff;
  }
  
  .page-wrap {
    padding: 16px;
    max-width: 760px;
    margin: 0 auto;
  }
  
  .top-card {
    background:
      radial-gradient(circle at top left, rgba(14, 165, 233, .22), transparent 38%),
      linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%);
    border: 1px solid rgba(14, 116, 144, .16);
    border-radius: 30px;
    padding: 20px;
    margin-bottom: 16px;
    box-shadow: 0 16px 35px rgba(15, 23, 42, .10);
  }
  
  .eyebrow {
    color: #0284c7;
    font-weight: 950;
    font-size: 13px;
  }
  
  .top-card h1 {
    margin: 4px 0 8px;
    color: #0f172a;
    font-size: 23px;
    font-weight: 950;
  }
  
  .top-card p {
    margin: 0;
    color: #334155;
    line-height: 1.7;
    font-weight: 700;
  }
  
  .refresh-btn {
    margin-top: 14px;
  }
  
  .form-card {
    border-radius: 24px;
    box-shadow: 0 8px 22px rgba(15, 23, 42, .06);
  }
  
  .time-grid {
    display: grid;
    grid-template-columns: 1fr 100px;
    gap: 10px;
  }
  
  .actions {
    margin-top: 18px;
  }
  
  .message {
    text-align: center;
    color: #0891b2;
    font-weight: 900;
  }
  
  .section-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 22px 4px 12px;
  }
  
  .section-head h2 {
    margin: 0;
    color: #0f172a;
    font-size: 18px;
    font-weight: 950;
  }
  
  .section-head span {
    min-width: 26px;
    height: 26px;
    border-radius: 999px;
    background: #e0f2fe;
    color: #0369a1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 950;
    font-size: 12px;
  }
  
  .center,
  .empty {
    text-align: center;
    padding: 28px 0;
    color: #334155;
  }
  
  .schedule-row {
    display: grid;
    grid-template-columns: 86px 1fr 72px;
    gap: 10px;
    background: white;
    border-radius: 22px;
    padding: 13px;
    margin-bottom: 12px;
    border: 1px solid rgba(15, 23, 42, .08);
    box-shadow: 0 8px 22px rgba(15, 23, 42, .06);
  }
  
  .time {
    direction: ltr;
    text-align: center;
    padding-top: 8px;
  }
  
  .time strong {
    display: block;
    color: #0f172a;
    font-size: 14px;
    font-weight: 950;
  }
  
  .time span {
    color: #64748b;
    font-size: 12px;
    font-weight: 800;
  }
  
  .details h3 {
    margin: 0 0 5px;
    color: #0f172a;
    font-size: 16px;
    font-weight: 950;
  }
  
  .details p {
    margin: 3px 0;
    color: #475569;
    font-size: 13px;
  }
  
  .row-actions {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  
  .row-actions button {
    border: 0;
    border-radius: 999px;
    padding: 7px;
    font-weight: 900;
    background: #e0f2fe;
    color: #0369a1;
  }
  
  .row-actions button.danger {
    background: #fee2e2;
    color: #b91c1c;
  }
  
  @media (max-width: 390px) {
    .page-wrap {
      padding: 13px;
    }
  
    .schedule-row {
      grid-template-columns: 1fr;
    }
  
    .row-actions {
      flex-direction: row;
    }
  }
  </style>