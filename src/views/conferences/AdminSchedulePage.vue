<template>
    <ion-page>
      <ion-header class="mk-header no-print">
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button :default-href="`/conference/${conferenceId}`" />
          </ion-buttons>
          <ion-title>إدارة البرنامج</ion-title>
        </ion-toolbar>
      </ion-header>
  
      <ion-content class="admin-schedule" dir="rtl">
        <div class="page-wrap">
          <div v-if="!unlocked" class="lock-card no-print">
            <div class="lock-icon">🔐</div>
            <h1>دخول الإدارة</h1>
            <p>اكتب كلمة الإدارة المؤقتة الخاصة بهذا المؤتمر.</p>
  
            <ion-item>
              <ion-label position="stacked">كلمة الإدارة</ion-label>
              <ion-input v-model="adminPass" type="password" />
            </ion-item>
  
            <ion-button expand="block" :disabled="checkingPass" @click="unlockAdmin">
              {{ checkingPass ? 'جاري التحقق...' : 'دخول' }}
            </ion-button>
  
            <p v-if="message" class="message errorish">{{ message }}</p>
          </div>
  
          <template v-else>
            <div class="top-card no-print">
              <div>
                <div class="eyebrow">لوحة الإدارة</div>
                <h1>تعديل برنامج المؤتمر</h1>
                <p>التعديل هنا يُحفظ مباشرة في Google Sheet.</p>
              </div>
  
              <div class="top-actions">
                <ion-button fill="outline" @click="loadSchedule">تحديث</ion-button>
                <ion-button fill="outline" @click="exportPdf">تصدير PDF</ion-button>
                <ion-button fill="clear" color="medium" @click="lockAgain">خروج</ion-button>
              </div>
            </div>
  
            <ion-card class="form-card no-print">
              <ion-card-header>
                <ion-card-title>إضافة فقرة جديدة</ion-card-title>
              </ion-card-header>
  
              <ion-card-content>
                <ScheduleForm
                  :model="newForm"
                  :saving="saving"
                  save-label="إضافة للبرنامج"
                  cancel-label="مسح"
                  @pick-date="openPicker('new', 'day')"
                  @pick-start="openPicker('new', 'start')"
                  @pick-end="openPicker('new', 'end')"
                  @save="saveNewItem"
                  @cancel="resetNewForm"
                />
              </ion-card-content>
            </ion-card>
  
            <div class="section-head no-print">
              <h2>الفقرات الحالية</h2>
              <span>{{ schedule.length }}</span>
            </div>
  
            <p v-if="loading" class="center no-print">جاري التحميل...</p>
  
            <div v-else-if="schedule.length === 0" class="empty no-print">
              لا توجد فقرات بعد.
            </div>
  
            <ion-accordion-group
              v-else
              multiple
              :value="openDays"
              class="no-print"
              @ionChange="openDays = Array.isArray($event.detail.value) ? $event.detail.value : [$event.detail.value]"
            >
              <ion-accordion v-for="group in groupedSchedule" :key="group.day" :value="group.day">
                <ion-item slot="header" class="day-header">
                  <ion-label>
                    <strong>{{ formatDay(group.day) }}</strong>
                    <p>{{ group.items.length }} فقرة</p>
                  </ion-label>
                </ion-item>
  
                <div slot="content" class="day-content">
                  <div
                    v-for="item in group.items"
                    :key="item.id || `${item.day}-${item.start_time}-${item.title}`"
                    class="schedule-block"
                  >
                    <div class="schedule-row">
                      <div class="time">
                        <strong>{{ displayTime(item.start_time, item.ap) }}</strong>
                        <span>{{ displayEndForItem(item) }}</span>
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
  
                    <ion-card v-if="editingId === item.id" class="inline-edit-card">
                      <ion-card-header>
                        <ion-card-title>تعديل الفقرة</ion-card-title>
                      </ion-card-header>
  
                      <ion-card-content>
                        <ScheduleForm
                          :model="editForm"
                          :saving="saving"
                          save-label="حفظ التعديل"
                          cancel-label="إلغاء"
                          @pick-date="openPicker('edit', 'day')"
                          @pick-start="openPicker('edit', 'start')"
                          @pick-end="openPicker('edit', 'end')"
                          @save="saveEditedItem"
                          @cancel="cancelEdit"
                        />
                      </ion-card-content>
                    </ion-card>
                  </div>
                </div>
              </ion-accordion>
            </ion-accordion-group>
  
            <p v-if="message" class="message no-print">{{ message }}</p>
  
            <!-- Printable PDF version -->
            <div class="print-area">
              <h1>برنامج المؤتمر</h1>
  
              <section v-for="group in groupedSchedule" :key="`print-${group.day}`">
                <h2>{{ formatDay(group.day) }}</h2>
  
                <table>
                  <thead>
                    <tr>
                      <th>الوقت</th>
                      <th>الفقرة</th>
                      <th>المتكلم</th>
                      <th>المكان</th>
                    </tr>
                  </thead>
  
                  <tbody>
                    <tr v-for="item in group.items" :key="`pdf-${item.id}`">
                      <td>{{ displayTime(item.start_time, item.ap) }} - {{ displayEndForItem(item) }}</td>
                      <td>{{ item.title }}</td>
                      <td>{{ item.speaker }}</td>
                      <td>{{ item.location }}</td>
                    </tr>
                  </tbody>
                </table>
              </section>
            </div>
          </template>
        </div>
  
        <ion-modal :is-open="picker.open" @didDismiss="picker.open = false">
          <ion-header>
            <ion-toolbar>
              <ion-title>{{ picker.kind === 'day' ? 'اختيار التاريخ' : 'اختيار الوقت' }}</ion-title>
              <ion-buttons slot="end">
                <ion-button @click="picker.open = false">إغلاق</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
  
          <ion-content class="ion-padding">
            <ion-datetime
              :presentation="picker.kind === 'day' ? 'date' : 'time'"
              hour-cycle="h12"
              :value="pickerValue"
              @ionChange="applyPickerValue"
            />
          </ion-content>
        </ion-modal>
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
    IonModal,
    IonDatetime,
    IonAccordion,
    IonAccordionGroup,
  } from '@ionic/vue'
  
  import { computed, defineComponent, h, onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import { fetchConferenceSchedule } from '@/services/sheets'
  import { CONFERENCE_ADMIN_API } from '@/config/conferenceAdmin'
  
  const route = useRoute()
  const conferenceId = String(route.params.id || '')
  
  type AdminScheduleRow = {
    id?: string
    conference_id: string
    day: string
    start_time: string
    end_time: string
    ap: string
    title: string
    speaker: string
    location: string
  }
  
  const LAST_DATE_KEY = `mk_admin_schedule_last_date_${conferenceId}`
  
  const unlocked = ref(false)
  const checkingPass = ref(false)
  const adminPass = ref('')
  const loading = ref(false)
  const saving = ref(false)
  const message = ref('')
  const editingId = ref('')
  const schedule = ref<AdminScheduleRow[]>([])
  const openDays = ref<string[]>([])
  
  const newForm = ref<AdminScheduleRow>(emptyForm())
  const editForm = ref<AdminScheduleRow>(emptyForm())
  
  const picker = ref<{
    open: boolean
    target: 'new' | 'edit'
    kind: 'day' | 'start' | 'end'
  }>({
    open: false,
    target: 'new',
    kind: 'day',
  })
  
  const activeForm = computed(() =>
    picker.value.target === 'new' ? newForm.value : editForm.value
  )
  
  const pickerValue = computed(() => {
    const f = activeForm.value
    if (picker.value.kind === 'day') return f.day || todayISO()
    if (picker.value.kind === 'start') return timeToPickerValue(f.start_time, f.ap)
    return timeToPickerValue(f.end_time, f.ap)
  })
  
  const ScheduleForm = defineComponent({
    name: 'ScheduleForm',
    props: {
      model: { type: Object, required: true },
      saving: { type: Boolean, default: false },
      saveLabel: { type: String, default: 'حفظ' },
      cancelLabel: { type: String, default: 'مسح' },
    },
    emits: ['save', 'cancel', 'pickDate', 'pickStart', 'pickEnd'],
    setup(props, { emit }) {
      const m = props.model as any
  
      return () =>
        h('div', { class: 'mini-form' }, [
          h('button', { class: 'picker-field', type: 'button', onClick: () => emit('pickDate') }, [
            h('span', {}, '📅 التاريخ'),
            h('strong', {}, m.day || 'اختار التاريخ'),
          ]),
  
          h(IonItem, {}, () => [
            h(IonLabel, { position: 'stacked' }, () => 'اكتب التاريخ يدويًا'),
            h(IonInput, {
              value: m.day,
              placeholder: '2026-06-12',
              onIonInput: (ev: any) => {
                m.day = String(ev.detail.value || '')
                if (m.day) localStorage.setItem(LAST_DATE_KEY, m.day)
              },
            }),
          ]),
  
          h('div', { class: 'manual-time-grid' }, [
            h('div', { class: 'time-with-ap' }, [
              h(IonItem, {}, () => [
                h(IonLabel, { position: 'stacked' }, () => 'وقت البداية'),
                h(IonInput, {
                  value: m.start_time,
                  placeholder: '9:30',
                  onIonInput: (ev: any) => (m.start_time = String(ev.detail.value || '')),
                }),
              ]),
              h('button', { type: 'button', class: m.ap === 'AM' ? 'ap-mini active' : 'ap-mini', onClick: () => (m.ap = 'AM') }, 'AM'),
              h('button', { type: 'button', class: m.ap === 'PM' ? 'ap-mini active' : 'ap-mini', onClick: () => (m.ap = 'PM') }, 'PM'),
            ]),
  
            h('div', { class: 'time-with-ap' }, [
              h(IonItem, {}, () => [
                h(IonLabel, { position: 'stacked' }, () => 'وقت النهاية اختياري'),
                h(IonInput, {
                  value: m.end_time,
                  placeholder: 'اتركه فاضيًا',
                  onIonInput: (ev: any) => (m.end_time = String(ev.detail.value || '')),
                }),
              ]),
              h('button', { type: 'button', class: m.ap === 'AM' ? 'ap-mini active' : 'ap-mini', onClick: () => (m.ap = 'AM') }, 'AM'),
              h('button', { type: 'button', class: m.ap === 'PM' ? 'ap-mini active' : 'ap-mini', onClick: () => (m.ap = 'PM') }, 'PM'),
            ]),
          ]),
  
          h('div', { class: 'picker-grid' }, [
            h('button', { class: 'picker-field', type: 'button', onClick: () => emit('pickStart') }, [
              h('span', {}, '🕒 اختار البداية'),
              h('strong', {}, displayTime(m.start_time, m.ap) || 'اختار الوقت'),
            ]),
            h('button', { class: 'picker-field', type: 'button', onClick: () => emit('pickEnd') }, [
              h('span', {}, '🕒 اختار النهاية'),
              h('strong', {}, displayTime(m.end_time, m.ap) || 'اختياري'),
            ]),
          ]),
  
          h(IonItem, {}, () => [
            h(IonLabel, { position: 'stacked' }, () => 'العنوان'),
            h(IonInput, {
              value: m.title,
              placeholder: 'عنوان الفقرة',
              onIonInput: (ev: any) => (m.title = String(ev.detail.value || '')),
            }),
          ]),
  
          h(IonItem, {}, () => [
            h(IonLabel, { position: 'stacked' }, () => 'المتكلم'),
            h(IonInput, {
              value: m.speaker,
              placeholder: 'اختياري',
              onIonInput: (ev: any) => (m.speaker = String(ev.detail.value || '')),
            }),
          ]),
  
          h(IonItem, {}, () => [
            h(IonLabel, { position: 'stacked' }, () => 'المكان'),
            h(IonInput, {
              value: m.location,
              placeholder: 'اختياري',
              onIonInput: (ev: any) => (m.location = String(ev.detail.value || '')),
            }),
          ]),
  
          h('div', { class: 'actions' }, [
            h(IonButton, { expand: 'block', disabled: props.saving, onClick: () => emit('save') }, () =>
              props.saving ? 'جاري الحفظ...' : props.saveLabel
            ),
            h(IonButton, { expand: 'block', fill: 'outline', color: 'medium', onClick: () => emit('cancel') }, () =>
              props.cancelLabel
            ),
          ]),
        ])
    },
  })
  
  onMounted(() => {})
  
  const sortedSchedule = computed(() => {
    return [...schedule.value].sort((a, b) => {
      const ad = `${a.day} ${to24(a.start_time, a.ap)}`
      const bd = `${b.day} ${to24(b.start_time, b.ap)}`
      return ad.localeCompare(bd)
    })
  })
  
  const groupedSchedule = computed(() => {
    const map = new Map<string, AdminScheduleRow[]>()
  
    sortedSchedule.value.forEach((item) => {
      const day = item.day || 'بدون تاريخ'
      if (!map.has(day)) map.set(day, [])
      map.get(day)!.push(item)
    })
  
    return Array.from(map.entries()).map(([day, items]) => ({ day, items }))
  })
  
  function emptyForm(): AdminScheduleRow {
    return {
      id: '',
      conference_id: conferenceId,
      day: localStorage.getItem(LAST_DATE_KEY) || todayISO(),
      start_time: '',
      end_time: '',
      ap: 'AM',
      title: '',
      speaker: '',
      location: '',
    }
  }
  
  async function unlockAdmin() {
    message.value = ''
  
    if (!adminPass.value.trim()) {
      message.value = 'اكتب كلمة الإدارة.'
      return
    }
  
    checkingPass.value = true
  
    try {
      const res = await postAdmin({ action: 'ping' })
  
      if (res.error === 'Unauthorized') {
        message.value = res.debug || 'كلمة الإدارة غير صحيحة.'
        return
      }
  
      unlocked.value = true
      await loadSchedule()
    } catch (e) {
      console.error(e)
      message.value = 'حدث خطأ أثناء التحقق من كلمة الإدارة.'
    } finally {
      checkingPass.value = false
    }
  }
  
  function lockAgain() {
    unlocked.value = false
    adminPass.value = ''
    schedule.value = []
    message.value = ''
  }
  
  async function loadSchedule() {
    loading.value = true
    message.value = ''
  
    try {
      const rows = (await fetchConferenceSchedule(conferenceId, true)) as any[]
  
      schedule.value = rows.map((r) => ({
        id: String(r.id || ''),
        conference_id: String(r.conference_id || conferenceId),
        day: String(r.day || ''),
        start_time: String(r.start_time || ''),
        end_time: String(r.end_time || ''),
        ap: normalizeAP(r.ap || r.ampm || r.start_ampm || r.end_ampm),
        title: String(r.title || ''),
        speaker: String(r.speaker || ''),
        location: String(r.location || ''),
      }))
  
      openDays.value = groupedSchedule.value.map((g) => g.day)
    } catch (e) {
      console.error(e)
      message.value = 'حدث خطأ أثناء تحميل البرنامج.'
    } finally {
      loading.value = false
    }
  }
  
  function openPicker(target: 'new' | 'edit', kind: 'day' | 'start' | 'end') {
    picker.value = { open: true, target, kind }
  }
  
  function applyPickerValue(ev: any) {
    const value = String(ev.detail.value || '')
    const f = activeForm.value
  
    if (picker.value.kind === 'day') {
      f.day = value.substring(0, 10)
      if (f.day) localStorage.setItem(LAST_DATE_KEY, f.day)
    } else {
      const parsed = pickerTimeToParts(value)
  
      if (picker.value.kind === 'start') f.start_time = parsed.time
      else f.end_time = parsed.time
  
      f.ap = parsed.ap
    }
  
    picker.value.open = false
  }
  
  async function saveNewItem() {
    await saveItem(newForm.value, false)
  }
  
  async function saveEditedItem() {
    await saveItem(editForm.value, true)
  }
  
  async function saveItem(form: AdminScheduleRow, isEdit: boolean) {
    message.value = ''
  
    if (!form.day || !form.start_time || !form.title.trim()) {
      message.value = 'كمّل التاريخ ووقت البداية والعنوان.'
      return
    }
  
    saving.value = true
  
    try {
      localStorage.setItem(LAST_DATE_KEY, form.day)
  
      const item = {
        id: isEdit ? editingId.value : form.id || '',
        conference_id: conferenceId,
        day: form.day,
        start_time: form.start_time,
        end_time: form.end_time || '',
        ap: normalizeAP(form.ap),
        title: form.title,
        speaker: form.speaker,
        location: form.location,
      }
  
      const res = await postAdmin({
        action: 'saveScheduleItem',
        item,
      })
  
      if (!res.ok) throw new Error(res.error || 'Save failed')
  
      message.value = 'تم الحفظ ✅'
  
      if (isEdit) cancelEdit()
      else resetNewForm()
  
      await loadSchedule()
    } catch (e) {
      console.error(e)
      message.value = 'حدث خطأ أثناء الحفظ. تأكد من كلمة الإدارة.'
    } finally {
      saving.value = false
    }
  }
  
  function editItem(item: AdminScheduleRow) {
    if (!item.id) {
      message.value = 'هذه الفقرة لا تحتوي على id. تأكد من أن Apps Script أنشأ id أو أن sheets.ts يرجّع id.'
      return
    }
  
    editingId.value = item.id
    editForm.value = { ...item, ap: normalizeAP(item.ap) }
  }
  
  function cancelEdit() {
    editingId.value = ''
    editForm.value = emptyForm()
  }
  
  function resetNewForm() {
    newForm.value = emptyForm()
  }
  
  async function deleteItem(item: AdminScheduleRow) {
    if (!item.id) {
      message.value = 'لا يمكن حذف هذه الفقرة لأنها لا تحتوي على id.'
      return
    }
  
    if (!confirm('هل تريد حذف هذه الفقرة؟')) return
  
    saving.value = true
  
    try {
      const res = await postAdmin({
        action: 'deleteScheduleItem',
        id: item.id,
      })
  
      if (!res.ok) throw new Error(res.error || 'Delete failed')
  
      message.value = 'تم الحذف ✅'
      await loadSchedule()
    } catch (e) {
      console.error(e)
      message.value = 'حدث خطأ أثناء الحذف. تأكد من كلمة الإدارة.'
    } finally {
      saving.value = false
    }
  }
  
  async function postAdmin(payload: any) {
    const body = {
      conferenceId,
      adminPass: adminPass.value,
      ...payload,
    }
  
    const res = await fetch(CONFERENCE_ADMIN_API, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  
    return await res.json()
  }
  
  function exportPdf() {
    window.print()
  }
  
  function todayISO() {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`
  }
  
  function getNextItem(item: AdminScheduleRow) {
    const sameDay = sortedSchedule.value.filter((x) => x.day === item.day)
    const index = sameDay.findIndex((x) => x.id === item.id)
  
    if (index >= 0 && sameDay[index + 1]) return sameDay[index + 1]
    return null
  }
  
  function displayEndForItem(item: AdminScheduleRow) {
    if (item.end_time) return displayTime(item.end_time, item.ap)
  
    const next = getNextItem(item)
    if (next?.start_time) return displayTime(next.start_time, next.ap)
  
    return 'مفتوح'
  }
  
  function displayTime(time: string, ap?: string) {
    const cleanTime = String(time || '').trim()
    if (!cleanTime) return ''
    return `${cleanTime} ${normalizeAP(ap)}`
  }
  
  function normalizeAP(value: any) {
    const s = String(value || '').trim().toUpperCase()
    return s === 'PM' ? 'PM' : 'AM'
  }
  
  function to24(time: string, ap?: string) {
    const match = String(time || '').match(/(\d{1,2})(?::(\d{2}))?/)
    if (!match) return '00:00'
  
    let h = Number(match[1])
    const m = Number(match[2] || 0)
    const p = normalizeAP(ap)
  
    if (p === 'PM' && h < 12) h += 12
    if (p === 'AM' && h === 12) h = 0
  
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }
  
  function timeToPickerValue(time: string, ap?: string) {
    if (!time) return `2026-01-01T09:00:00`
    return `2026-01-01T${to24(time, ap)}:00`
  }
  
  function pickerTimeToParts(value: string) {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return { time: '', ap: 'AM' }
  
    let h = d.getHours()
    const m = d.getMinutes()
    const ap = h >= 12 ? 'PM' : 'AM'
  
    h = h % 12
    if (h === 0) h = 12
  
    return {
      time: `${h}:${String(m).padStart(2, '0')}`,
      ap,
    }
  }
  
  function formatDay(day: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return day
  
    try {
      return new Date(`${day}T12:00:00`).toLocaleDateString('ar-EG', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return day
    }
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
  
  .lock-card,
  .top-card,
  .form-card,
  .inline-edit-card,
  .schedule-row {
    background: white;
    border-radius: 24px;
    border: 1px solid rgba(15, 23, 42, .08);
    box-shadow: 0 8px 22px rgba(15, 23, 42, .06);
  }
  
  .lock-card {
    padding: 24px;
    text-align: center;
    margin-top: 50px;
  }
  
  .lock-icon {
    font-size: 46px;
  }
  
  .lock-card h1,
  .top-card h1 {
    margin: 8px 0;
    color: #0f172a;
    font-weight: 950;
  }
  
  .lock-card p,
  .top-card p {
    color: #475569;
    line-height: 1.7;
    font-weight: 700;
  }
  
  .top-card {
    padding: 20px;
    margin-bottom: 16px;
    background:
      radial-gradient(circle at top left, rgba(14, 165, 233, .22), transparent 38%),
      linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%);
  }
  
  .top-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 14px;
  }
  
  .eyebrow {
    color: #0284c7;
    font-weight: 950;
    font-size: 13px;
  }
  
  .form-card,
  .inline-edit-card {
    margin-bottom: 16px;
  }
  
  .inline-edit-card {
    border: 2px solid #0891b2;
    background: #ecfeff;
  }
  
  .picker-grid,
  .manual-time-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  
  .time-with-ap {
    display: grid;
    grid-template-columns: 1fr 44px 44px;
    gap: 6px;
    align-items: stretch;
  }
  
  .ap-mini {
    border: 1px solid rgba(15, 23, 42, .08);
    background: #f8fafc;
    color: #475569;
    border-radius: 14px;
    font-weight: 950;
  }
  
  .ap-mini.active {
    background: #0891b2;
    color: white;
  }
  
  .picker-field {
    width: 100%;
    border: 1px solid rgba(15, 23, 42, .08);
    background: #f8fafc;
    border-radius: 18px;
    padding: 12px;
    text-align: right;
    margin-bottom: 10px;
  }
  
  .picker-field span {
    display: block;
    color: #64748b;
    font-size: 12px;
    font-weight: 800;
  }
  
  .picker-field strong {
    display: block;
    margin-top: 5px;
    color: #0f172a;
    font-size: 15px;
    font-weight: 950;
  }
  
  .mini-form ion-item,
  .lock-card ion-item {
    --background: #f8fafc;
    --border-radius: 16px;
    border-radius: 16px;
    margin-bottom: 10px;
  }
  
  .actions {
    margin-top: 14px;
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
  
  .day-header {
    --background: #e0f2fe;
    --border-radius: 18px;
    border-radius: 18px;
    margin-bottom: 10px;
  }
  
  .day-header strong {
    color: #0f172a;
    font-weight: 950;
  }
  
  .day-header p {
    color: #0369a1;
    font-weight: 800;
  }
  
  .day-content {
    padding: 8px 0 18px;
  }
  
  .center,
  .empty {
    text-align: center;
    padding: 28px 0;
    color: #334155;
  }
  
  .schedule-block {
    margin-bottom: 12px;
  }
  
  .schedule-row {
    display: grid;
    grid-template-columns: 86px 1fr 72px;
    gap: 10px;
    padding: 13px;
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
  
  .message {
    text-align: center;
    color: #0891b2;
    font-weight: 900;
  }
  
  .errorish {
    color: #b91c1c;
  }
  
  .print-area {
    display: none;
  }
  
  @media print {
    .no-print {
      display: none !important;
    }
  
    .print-area {
      display: block;
      direction: rtl;
      color: #111827;
      padding: 24px;
      font-family: Arial, sans-serif;
    }
  
    .print-area h1 {
      text-align: center;
      margin-bottom: 24px;
    }
  
    .print-area h2 {
      margin: 24px 0 10px;
      background: #e0f2fe;
      padding: 10px;
      border-radius: 8px;
    }
  
    .print-area table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
    }
  
    .print-area th,
    .print-area td {
      border: 1px solid #cbd5e1;
      padding: 8px;
      text-align: right;
      font-size: 13px;
    }
  
    .print-area th {
      background: #f1f5f9;
      font-weight: 800;
    }
  }
  
  @media (max-width: 390px) {
    .page-wrap {
      padding: 13px;
    }
  
    .picker-grid,
    .manual-time-grid,
    .schedule-row {
      grid-template-columns: 1fr;
    }
  
    .time-with-ap {
      grid-template-columns: 1fr 44px 44px;
    }
  
    .row-actions {
      flex-direction: row;
    }
  }
  </style>