# PEHER Search and AI Discovery

## Architecture

PEHER generates public discovery resources at request time:

- `/sitemap.xml` combines canonical non-product pages from `public.seo_pages` in Supabase with all
  published products and their real `updated_at` timestamps.
- Product sitemap entries include product-image metadata.
- `/merchant-feed.xml` publishes live product variants, prices, stock, specifications, shipping,
  and identifiers from Supabase.
- `/robots.txt` allows all standards-compliant crawlers and advertises the XML sitemap.
- `/llms.txt` is an AI-readable Markdown guide generated from Supabase SEO pages, products, and
  store settings.
- IndexNow submissions notify participating search engines when product and SEO-page URLs change.

Browser roles cannot query or edit `public.seo_pages` directly. The table has RLS enabled, public
grants revoked, and is accessed only through the backend secret key. Admin mutations require the
`seo` permission.

## Sitemap Management

Use **Admin > SEO & Search Indexing > Supabase sitemap registry**.

Each entry controls:

- Canonical path, such as `/about`
- Search and AI display title
- AI-readable description
- XML sitemap inclusion
- `llms.txt` inclusion
- Indexable status
- Sort order

Published product URLs are automatic and must not be added manually. Hidden, draft, and archived
products are excluded by the backend catalog query.

Google ignores sitemap `priority` and `changefreq`, so PEHER does not emit them. `lastmod` is emitted
only from real database modification timestamps.

## Robots and Private Pages

`robots.txt` contains a wildcard allow rule and does not block search or AI bots. Account, admin,
cart, checkout, login, and wishlist pages retain page-level `noindex,nofollow` metadata because they
are not useful public search results. Robots rules are not a security boundary; protected data
still requires authentication and authorization.

`llms.txt` is a proposed discovery convention, not an access-control mechanism and not a ranking
guarantee. Crawlers may ignore it.

## IndexNow

The verification file is hosted at:

```text
https://peher.studio/ff85b0677418408ef5f56661ad43f6bd54e9283cf45a14878df2f8b53d151425.txt
```

The backend submits batches to `https://api.indexnow.org/indexnow`, includes `keyLocation`, limits
submissions to same-origin URLs, and retries transient network, HTTP 429, and HTTP 5xx failures with
exponential backoff.

Use **Submit all URLs** in Admin SEO after the first production deployment. Product create, update,
visibility, and delete operations submit the changed product URL and affected discovery feeds
automatically.

IndexNow serves participating engines such as Bing and shares accepted submissions across protocol
participants. It does not submit general product pages directly to Google.

## Google Search

For Google:

1. Verify `https://peher.studio` in Google Search Console.
2. Submit `https://peher.studio/sitemap.xml`.
3. Inspect representative product URLs with URL Inspection.
4. Register `https://peher.studio/merchant-feed.xml` in Google Merchant Center.
5. Monitor Product snippets, Merchant listings, sitemap, and indexing reports.

Google treats sitemap submission as a discovery hint, not an indexing or ranking guarantee. Request
indexing in Search Console only for important individual URLs when necessary.

## Production Verification

Check these URLs after every SEO deployment:

```text
https://peher.studio/robots.txt
https://peher.studio/sitemap.xml
https://peher.studio/merchant-feed.xml
https://peher.studio/llms.txt
https://peher.studio/ff85b0677418408ef5f56661ad43f6bd54e9283cf45a14878df2f8b53d151425.txt
```

Expected results:

- HTTP 200
- Correct UTF-8 content type
- Absolute canonical URLs using `https://peher.studio`
- No draft or hidden products
- Accurate product `lastmod` values
- IndexNow key file containing only the key
