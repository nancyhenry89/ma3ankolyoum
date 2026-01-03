import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.nancyhenry.ma3ankolyoum',
  appName: 'معاً كل يوم',
  webDir: 'dist',
  server: {
    // cleartext مش ضروري لو كله https، بس سيبيه احتياطيًا
    cleartext: true,
    allowNavigation: [
      'nancyhenry89.github.io',
      'docs.google.com',
      '*.googleusercontent.com'
    ]
  }
}

export default config
