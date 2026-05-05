import { Request, Response } from "express";
import SeoMetaModel from "../models/seoMetaModel";
import { asyncHandler } from "../middlewares/asyncHandler";

class SeoController {
  /**
   * Generate sitemap.xml dynamically from active SEO meta entries
   */
  static generateSitemap = asyncHandler(async (req: Request, res: Response) => {
    const entries = await SeoMetaModel.getActiveSitemapEntries();
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n';

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    for (const entry of entries) {
      const loc = entry.url;
      const lastmod = entry.last_modified.replace('T', ' ').replace(/\.\d{3}Z$/, '');
      xml += '  <url>\n';
      xml += `    <loc>${loc}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>${entry.change_frequency}</changefreq>\n`;
      xml += `    <priority>${entry.priority}</priority>\n`;
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    res.set('Content-Type', 'application/xml');
    res.send(xml);
  });
}

export default SeoController;
