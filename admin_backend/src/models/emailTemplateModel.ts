import mongoose, { Document, Schema, Model } from 'mongoose';

/**
 * Email Template Interface
 * (_id is already provided by Document, no need to redeclare)
 */
export interface IEmailTemplate extends Document {
  key: string;
  subject: string;
  body: string;
  title?: string;
  params?: string;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Email Template Schema
 */
const EmailTemplateSchema = new Schema<IEmailTemplate>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    body: {
      type: String,
      required: true
    },
    title: {
      type: String,
      trim: true
    },
    params: {
      type: String,
      trim: true
    },
    created_at: {
      type: Date,
      default: Date.now
    },
    updated_at: {
      type: Date,
      default: Date.now
    }
  },
  {
    collection: 'email_template'
  }
);

/**
 * Auto-update updated_at
 */
EmailTemplateSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

/**
 * Prevent model overwrite (Next.js / hot reload safe)
 */
const EmailTemplate: Model<IEmailTemplate> =
  mongoose.models.EmailTemplate ||
  mongoose.model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema);

export default EmailTemplate;

/**
 * Get Email Template By Key
 */
export async function getEmailTemplateByKey(
  key: string,
  data: Record<string, any> = {}
): Promise<{ subject: string; body: string } | null> {

  if (!key || typeof key !== 'string' || !key.trim()) return null;

  const template = await EmailTemplate
    .findOne({ key: new RegExp(`^${escapeRegex(key.trim())}$`, 'i') })
    .lean<IEmailTemplate>();

  if (!template) return null;

  /**
   * Ensure declared params exist
   */
  if (template.params) {
    const paramList = template.params
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    for (const param of paramList) {
      if (data[param] === undefined || data[param] === null) {
        data[param] = '';
      }
    }
  }

  return parseTemplate(template, data);
}

/**
 * Parse Template Placeholders
 */
function parseTemplate(
  template: Pick<IEmailTemplate, 'subject' | 'body' | 'title'>,
  data: Record<string, any> = {}
): { subject: string; body: string } {

  let subject =
    template.subject?.trim() ||
    template.title?.trim() ||
    'Notification';

  let body = template.body || '';

  if (!data.app_name) {
    data.app_name = process.env.APP_NAME || 'App';
  }

  for (const [key, value] of Object.entries(data)) {
    const safeKey = escapeRegex(key);
    const regex = new RegExp(`{{\\s*${safeKey}\\s*}}`, 'g');

    subject = subject.replace(regex, String(value ?? ''));
    body = body.replace(regex, String(value ?? ''));
  }

  // Remove unreplaced placeholders
  subject = subject.replace(/{{\s*[\w]+\s*}}/g, '');
  body = body.replace(/{{\s*[\w]+\s*}}/g, '');

  return { subject, body };
}

/**
 * Escape regex characters
 */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
