export default {
  async fetch(request, env) {
    // Cloudflare Workers static assets will automatically serve files from `dist/`
    // and fall back to index.html for SPA routes due to not_found_handling config.
    // This worker just passes through to the asset binding.
    return env.ASSETS.fetch(request);
  },
};
