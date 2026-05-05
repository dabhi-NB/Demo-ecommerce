import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getSeoMetas, type SeoMeta } from "@/services/seo.service";

function generateSitemapXml(data: SeoMeta[]) {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n` +
    data
      .map(
        (row) =>
          `  <url>\n` +
          `    <loc>${row.url}</loc>\n` +
          `    <lastmod>${row.last_modified}</lastmod>\n` +
          `    <changefreq>${row.change_frequency}</changefreq>\n` +
          `    <priority>${row.priority}</priority>\n` +
          `  </url>`,
      )
      .join("\n") +
    "\n</urlset>"
  );
}

const Sitemap: React.FC = () => {
  const {
    data = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["seo-metas"],
    queryFn: getSeoMetas,
  });

  let content;
  if (isLoading) {
    content = (
      <div className="text-center py-10 text-muted-foreground">Loading...</div>
    );
  } else if (isError) {
    content = (
      <div className="text-center py-10 text-destructive">
        {(error as any)?.message || "Failed to fetch sitemap data"}
      </div>
    );
  } else {
    const xml = generateSitemapXml(data);
    content = (
      <pre className="bg-muted p-4 rounded overflow-x-auto text-sm">{xml}</pre>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Sitemap XML Preview</h1>
      {content}
    </div>
  );
};

export default Sitemap;
