import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailTemplate extends Document {
  _id: mongoose.Types.ObjectId;
  key: string;
  subject: string;
  body: string;
  title?: string;
  params?: string;
  created_at?: Date;
  updated_at: Date;
}

// Register the schema only once
const EmailTemplateSchema = new Schema<IEmailTemplate>({
  key: { type: String, required: true, unique: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  title: { type: String },
  params: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { collection: 'email_template' });

const EmailTemplate =
  mongoose.models.EmailTemplate ||
  mongoose.model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema);

export async function getEmailTemplateByKey(
  key: string,
  data: Record<string, any> = {}
): Promise<{ subject: string; body: string } | null> {

  if (!key || typeof key !== 'string' || !key.trim()) return null;

  const template = await EmailTemplate.findOne({ key: new RegExp('^' + key.trim() + '$', 'i') }).lean() as { subject?: string; body?: string; title?: string; params?: string } | null;

  if (!template) return null;

  // Prepare data for placeholders
  if (template.params) {
    const paramList = template.params.split(',').map(p => p.trim()).filter(Boolean);
    for (const param of paramList) {
      if (data[param] === undefined || data[param] === null) data[param] = '';
    }
  }

  // Parse template
  return parseTemplate(template, data);
}

function parseTemplate(
  template: { subject?: string; body?: string; title?: string } | null,
  data: Record<string, any> = {}
): { subject: string; body: string } {
  if (!template) return { subject: '', body: '' };

  let subject = template.subject?.trim() || template.title || 'Notification';
  let body = template.body || '';

  if (!data.app_name) data.app_name = process.env.APP_NAME || 'App';

  for (const [k, value] of Object.entries(data)) {
    const regex = new RegExp(`{{\\s*${k}\\s*}}`, 'g');
    subject = subject.replace(regex, String(value ?? ''));
    body = body.replace(regex, String(value ?? ''));
  }

  // Remove unreplaced placeholders
  subject = subject.replace(/{{\s*[\w]+\s*}}/g, '');
  body = body.replace(/{{\s*[\w]+\s*}}/g, '');

  return { subject, body };
}
