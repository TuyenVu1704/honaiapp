import nodemailer from 'nodemailer'
import { config } from 'dotenv'
import { EmailData } from '~/constants/types'
import { USER_MESSAGE } from '~/constants/messages'
import { generateEmailTemplate } from '~/html/emailTemplates'

config()

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})

export const sendMail = async (emailData: EmailData) => {
  const { to, subject, templateName, dynamic_Field } = emailData
  const htmlContent = generateEmailTemplate(templateName, dynamic_Field)
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html: htmlContent
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(USER_MESSAGE.EMAIL_SENT_SUCCESSFULLY)
  } catch (error) {
    console.log(USER_MESSAGE.EMAIL_SENT_FAILED, error)
    throw new Error(USER_MESSAGE.EMAIL_SENT_FAILED)
  }
}
