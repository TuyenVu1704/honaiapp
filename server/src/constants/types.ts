export interface EmailData {
  to: string
  subject: string
  templateName: string
  dynamic_Field: Record<string, string>
}
