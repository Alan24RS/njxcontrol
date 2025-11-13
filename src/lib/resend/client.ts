import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY

if (!apiKey) {
  console.warn(
    '⚠️  RESEND_API_KEY is not defined. Email sending will not work. Please add it to your .env.local file. See docs/RESEND_SETUP.md for instructions.'
  )
}

export const resend = new Resend(apiKey || 'placeholder')
