import { readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(appDir, 'dist/public');
const indexPath = path.join(outputDir, 'index.html');
const sitemapPath = path.join(outputDir, 'sitemap.xml');
const robotsPath = path.join(outputDir, 'robots.txt');
const indexHtml = await readFile(indexPath, 'utf8');
const rawSiteUrl = process.env.VITE_PUBLIC_URL?.trim();

function escapeXml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

if (!rawSiteUrl) {
  await writeFile(
    indexPath,
    indexHtml.replace(/\s*<meta property="og:url" content=""\s*\/>/, ''),
  );
  await unlink(sitemapPath).catch(() => {});
  process.exit(0);
}

const parsedSiteUrl = new URL(rawSiteUrl);
if (!['http:', 'https:'].includes(parsedSiteUrl.protocol) || parsedSiteUrl.username || parsedSiteUrl.password) {
  throw new Error('VITE_PUBLIC_URL must be a public http(s) origin without credentials.');
}
if (parsedSiteUrl.pathname !== '/' || parsedSiteUrl.search || parsedSiteUrl.hash) {
  throw new Error('VITE_PUBLIC_URL must be the public site origin, without a path or query.');
}

const siteUrl = parsedSiteUrl.origin;
const canonicalUrl = `${siteUrl}/`;
const absoluteHeroImage = `${siteUrl}/images/hero-lips.jpg`;
let html = indexHtml.replace(
  /\s*<meta property="og:url" content=""\s*\/>/,
  `\n    <meta property="og:url" content="${escapeXml(canonicalUrl)}" />`,
);

if (!/<link rel="canonical"/.test(html)) {
  html = html.replace(
    '</head>',
    `    <link rel="canonical" href="${escapeXml(canonicalUrl)}" />\n  </head>`,
  );
}
html = html
  .replace(/(<meta property="og:image" content=")[^"]*(" \/>)/, `$1${escapeXml(absoluteHeroImage)}$2`)
  .replace(/(<meta name="twitter:image" content=")[^"]*(" \/>)/, `$1${escapeXml(absoluteHeroImage)}$2`);

const structuredData = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (structuredData) {
  const json = JSON.parse(structuredData[1]);
  json.url = canonicalUrl;
  html = html.replace(structuredData[0], `<script type="application/ld+json">\n      ${JSON.stringify(json)}\n    </script>`);
}

await writeFile(indexPath, html);
await writeFile(
  sitemapPath,
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${escapeXml(canonicalUrl)}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n`,
);

const robots = await readFile(robotsPath, 'utf8');
await writeFile(
  robotsPath,
  `${robots.replace(/^Sitemap:.*\n?/gm, '').trimEnd()}\nSitemap: ${canonicalUrl}sitemap.xml\n`,
);
