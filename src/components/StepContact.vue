<script setup lang="ts">
import { computed } from 'vue'
import { formatPhone, normalizePhone } from '../survey'
import { useI18n } from '../stores/i18n'

const { t } = useI18n()

const props = defineProps<{
  companyName: string
  phone: string
  showErrors: boolean
  phoneValid: boolean
}>()

const emit = defineEmits<{
  'update:companyName': [value: string]
  'update:phone': [value: string]
}>()

const phoneDisplay = computed(() => formatPhone(props.phone))

function onPhoneInput(event: Event) {
  const el = event.target as HTMLInputElement
  const digits = normalizePhone(el.value)
  el.value = formatPhone(digits)
  emit('update:phone', digits)
}

const nameError = computed(() => props.showErrors && !props.companyName.trim())
const phoneError = computed(() => props.showErrors && !props.phoneValid)
</script>

<template>
  <section>
    <h2 class="heading">{{ t('survey.contactHeading') }}</h2>

    <div class="field">
      <label class="label" for="company">
        <span>{{ t('survey.companyLabel') }}</span>
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true">
          <circle cx="12" cy="8" r="3.5" stroke="var(--brand)" stroke-width="1.7" />
          <path
            d="M5 19.5c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5"
            stroke="var(--brand)"
            stroke-width="1.7"
            stroke-linecap="round"
          />
        </svg>
      </label>
      <input
        id="company"
        class="input"
        :class="{ invalid: nameError }"
        type="text"
        autocomplete="organization"
        :value="companyName"
        :aria-invalid="nameError"
        @input="emit('update:companyName', ($event.target as HTMLInputElement).value)"
      />
      <p v-if="nameError" class="error">{{ t('survey.companyMissing') }}</p>
    </div>

    <div class="field">
      <label class="label" for="phone">
        <span>{{ t('survey.phoneLabel') }}</span>
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true">
          <path
            d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3c0 1.1-.9 2-2 2A16.5 16.5 0 0 1 4.5 5.5c0-1.1.9-2 2-2Z"
            stroke="var(--brand)"
            stroke-width="1.7"
            stroke-linejoin="round"
          />
        </svg>
      </label>
      <input
        id="phone"
        class="input phone"
        :class="{ invalid: phoneError }"
        type="tel"
        inputmode="numeric"
        dir="ltr"
        placeholder="07XX XXX XXXX"
        autocomplete="tel"
        :value="phoneDisplay"
        :aria-invalid="phoneError"
        @input="onPhoneInput"
      />
      <p v-if="phoneError" class="error">{{ t('survey.phoneInvalid') }}</p>
    </div>
  </section>
</template>

<style scoped>
.heading {
  margin: 0 0 22px;
  font-size: 1.45rem;
  font-weight: 800;
}

.field + .field {
  margin-top: 18px;
}

.label {
  display: flex;
  align-items: center;
  /* Follows the text direction rather than pinning to the physical right. */
  justify-content: flex-start;
  flex-direction: row-reverse;
  gap: 7px;
  margin-bottom: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-muted);
}

.input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border: 1px solid var(--field-border);
  border-radius: var(--radius-sm);
  background: var(--field);
  font-size: 0.95rem;
  color: var(--text);
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}

.input::placeholder {
  color: var(--text-faint);
}

/* The field is dir="ltr"; `start` keeps digits at the reading edge in both locales. */
.input.phone {
  text-align: start;
}

.input:focus {
  outline: none;
  background: var(--surface);
  border-color: var(--brand);
}

.input.invalid {
  border-color: #D94A4A;
}

.error {
  margin: 6px 2px 0;
  font-size: 0.74rem;
  color: #D94A4A;
}

@media (min-width: 768px) {
  .heading {
    font-size: 1.7rem;
  }

  .input {
    height: 52px;
  }
}
</style>
