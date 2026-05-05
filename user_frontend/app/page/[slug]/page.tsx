// @ts-nocheck
"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { authService } from "@/services/auth.service";

interface PageData {
  title: string;
  body: string;
}

const DynamicPage: React.FC = () => {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const res = await authService.getPage(slug);
        if (res.status === 1) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Page load failed", err);
      } finally {
        setLoading(false);
      }
    };
    if (slug) {
      fetchPage();
    }
  }, [slug]);

  if (loading) return <div>Loading...</div>;

  if (!data) return <div>Page not found</div>;

  return (
    <>
      {/* Main content area */}
      <div className="w-full">
        <div className="px-3 sm:px-6 lg:px-15">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight pb-3">
            {data.title}
          </h1>

          <div className="w-full p-4 sm:p-6 md:p-6 mt-4 sm:mt-6 rounded-lg shadow max-w-2xl bg-card text-card-foreground">
            <div
              className="leading-relaxed"
              dangerouslySetInnerHTML={{ __html: data.body }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default DynamicPage;
