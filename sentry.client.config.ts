import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://a40f0c65d294660bab900bc7d453ccad@o4510566101811200.ingest.de.sentry.io/4510566105088080",

  // Add optional integrations for additional features
  integrations: [
    Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1.0,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
