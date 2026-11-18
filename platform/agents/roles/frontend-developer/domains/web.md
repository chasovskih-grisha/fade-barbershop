---
seat: frontend-developer
domain: web
tag: frontend
owns:
  - apps/web
except:
  - apps/web/src/lib/seo
  - apps/web/src/app/sitemap.ts
  - apps/web/src/app/robots.ts
---

Public site behavior. SEO metadata files listed in except belong to the seo seat. Design primitives belong to the designer.
