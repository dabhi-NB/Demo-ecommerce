import api from './api'

export interface SiteSettings {
  appName: string
  logoUrl: string
  announcement: string | null
}

export const getSiteSettings = async (): Promise<SiteSettings> => {
  try {
    const res = await api.get('/settings/site')
    return res.data.data
  } catch {
    // Return defaults if API fails
    return {
      appName: 'RV Mobile',
      logoUrl: '/logo.png',
      announcement: null,
    }
  }
}
