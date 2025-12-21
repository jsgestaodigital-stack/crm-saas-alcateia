// Autentique Integration Configuration
// Set to true when AUTENTIQUE_WEBHOOK_SECRET is configured and Autentique account is ready

export const AUTENTIQUE_ENABLED = false;

// Helper to check if Autentique features should be rendered
export const isAutentiqueEnabled = () => AUTENTIQUE_ENABLED;
