import { Ajax } from '@/helper/ajax';

export type EmailTemplate = {
  _id: string;
  key: string;
  slug?: string;
  title: string;
  subject: string;
  body: string;
  params?: string;
  created_at?: string;
  updated_at?: string;
}; 

export const getEmailTemplates = async (): Promise<EmailTemplate[]> => {
  const response = await Ajax.get('admin/email-template');
  return response.data || [];
};

export const getEmailTemplateById = async (id: string): Promise<EmailTemplate> => {
  const response = await Ajax.post('/admin/email-template/update', { id });
  if (!response || response.status !== 1) {
    throw new Error(response?.message || 'Email template not found');
  }
  const template = response.data || response;
  return {
    _id: template._id || template.id,
    ...template,
  };
};

export const updateEmailTemplate = async (id: string, templateData: Partial<EmailTemplate>): Promise<any> => {
  const response = await Ajax.post('/admin/email-template/save', { id, ...templateData });
  return response;
};


export const getEmailTemplateDetails =  async (id: string): Promise<EmailTemplate> => {
  const response = await Ajax.post('/admin/email-template/view', { id });
    if (!response || response.status !== 1) {
        throw new Error(response?.message || 'Email template not found');
    }
    const template = response.data || response;
    return {
        _id: template._id || template.id,
        ...template,
    };
} ;