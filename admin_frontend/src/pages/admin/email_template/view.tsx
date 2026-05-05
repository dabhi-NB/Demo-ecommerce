import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import {
  getEmailTemplateById,
  type EmailTemplate,
} from "@/services/email_template.service";
import EmailLayout from "./emaillayout";

const EmailTemplateView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      getEmailTemplateById(id)
        .then(setTemplate)
        .catch((err) => setError(err.message || "Failed to load template"))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading)
    return (
      <EmailLayout>
        <div className="text-white text-center">Loading...</div>
      </EmailLayout>
    );
  if (error)
    return (
      <EmailLayout>
        <div className="text-red-400 text-center">{error}</div>
      </EmailLayout>
    );
  if (!template) return null;

  return (
    <EmailLayout>
      <div className="flex flex-col w-full">
        {/* Subject and title */}
        <div className="bg-white px-6 pt-2 pb-4 border-b border-neutral-200 text-center">
          <h1 className="text-2xl font-bold mb-2 text-black">
            {template.title}
          </h1>
          <div className="inline-block bg-[#ebebeb] rounded px-3 py-1">
            <span className="text-muted-foreground font-semibold">
              Subject:
            </span>
            <span className="ml-2 text-base text-black">
              {template.subject}
            </span>
          </div>
        </div>
        {/* Email body */}
        <div className="bg-[#ebebeb] px-0 md:px-8 py-8 min-h-[200px]">
          <div
            className="prose max-w-none text-black mx-auto"
            dangerouslySetInnerHTML={{ __html: template.body }}
          />
        </div>
      </div>
    </EmailLayout>
  );
};

export default EmailTemplateView;
