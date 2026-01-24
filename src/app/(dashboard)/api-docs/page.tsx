'use client';

import { PageHeader } from "@/components/shared/page-header";

export default function ApiDocsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="API Documentation" 
        description="Interactive documentation for systemic REST endpoints and core server operations."
        breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'API Docs' }
        ]}
      />

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden min-h-[800px]">
        {/* Use Swagger UI from unpkg CDN for zero-dependency docs */}
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
        <div id="swagger-ui"></div>
        <script 
            src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" 
            crossOrigin="anonymous"
            onLoad={() => {
                // @ts-ignore
                window.ui = SwaggerUIBundle({
                    url: '/openapi.json',
                    dom_id: '#swagger-ui',
                    deepLinking: true,
                    presets: [
                        // @ts-ignore
                        SwaggerUIBundle.presets.apis,
                        // @ts-ignore
                        SwaggerUIStandalonePreset
                    ],
                    layout: "BaseLayout"
                });
            }}
        ></script>
      </div>
    </div>
  );
}
