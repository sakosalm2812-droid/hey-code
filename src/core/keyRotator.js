/**
 * HEY Teacher Engine - API Key Pool & Rotator
 * Automatically rotates through Google, NVIDIA, and OpenRouter API keys
 * Retries on 429 (Rate Limit) or 403 (Forbidden/Quota)
 * Persists active key index in localStorage
 */

const STORAGE_KEYS_KEY = "hey_api_keys";
const STORAGE_INDEX_KEY = "hey_key_rotator_index";

export class KeyRotator {
  /**
   * @param {string[]} [initialKeys] Optional array of API keys
   */
  constructor(initialKeys = []) {
    this.keys = [];
    this.currentIndex = 0;
    this.init(initialKeys);
  }

  /**
   * Initialize keys and active index from argument or localStorage
   */
  init(initialKeys = []) {
    try {
      if (Array.isArray(initialKeys) && initialKeys.length > 0) {
        this.keys = this.sanitizeKeys(initialKeys);
      } else {
        const stored = localStorage.getItem(STORAGE_KEYS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.keys = this.sanitizeKeys(parsed);
          }
        }
      }

      const storedIndex = localStorage.getItem(STORAGE_INDEX_KEY);
      if (storedIndex !== null) {
        const idx = parseInt(storedIndex, 10);
        this.currentIndex = !Number.isNaN(idx) && idx >= 0 && idx < (this.keys.length || 1) ? idx : 0;
      } else {
        this.currentIndex = 0;
      }
    } catch (err) {
      console.warn("KeyRotator initialization warning:", err);
      this.keys = initialKeys ? this.sanitizeKeys(initialKeys) : [];
      this.currentIndex = 0;
    }
  }

  /**
   * Clean and normalize keys array
   */
  sanitizeKeys(rawKeys) {
    if (!Array.isArray(rawKeys)) return [];
    return rawKeys
      .map((k) => (typeof k === "string" ? k.trim() : ""))
      .filter((k) => k.length > 0);
  }

  /**
   * Replace pool with new keys
   * @param {string[]|string} newKeys Array or comma/newline separated string
   */
  setKeys(newKeys) {
    let keyArray = [];
    if (typeof newKeys === "string") {
      keyArray = newKeys.split(/[\n,;]+/).map((k) => k.trim());
    } else if (Array.isArray(newKeys)) {
      keyArray = newKeys;
    }

    this.keys = this.sanitizeKeys(keyArray);
    this.currentIndex = 0;

    try {
      localStorage.setItem(STORAGE_KEYS_KEY, JSON.stringify(this.keys));
      localStorage.setItem(STORAGE_INDEX_KEY, "0");
    } catch (err) {
      console.error("Failed to persist keys to localStorage:", err);
    }

    return this.keys.length;
  }

  /**
   * Returns copy of active keys
   */
  getKeys() {
    return [...this.keys];
  }

  /**
   * Get total count of loaded keys
   */
  getKeyCount() {
    return this.keys.length;
  }

  /**
   * Get current active key
   */
  getCurrentKey() {
    if (this.keys.length === 0) return null;
    if (this.currentIndex >= this.keys.length) {
      this.currentIndex = 0;
    }
    return this.keys[this.currentIndex];
  }

  /**
   * Rotate to the next key and persist active index to localStorage
   */
  rotateKey() {
    if (this.keys.length <= 1) {
      this.currentIndex = 0;
      try {
        localStorage.setItem(STORAGE_INDEX_KEY, "0");
      } catch {}
      return this.getCurrentKey();
    }

    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    try {
      localStorage.setItem(STORAGE_INDEX_KEY, String(this.currentIndex));
    } catch (err) {
      console.error("Failed to persist key index to localStorage:", err);
    }

    console.info(`[KeyRotator] Switched to key #${this.currentIndex + 1} of ${this.keys.length}`);
    return this.getCurrentKey();
  }

  /**
   * Detect key provider type
   */
  detectProvider(key = "") {
    if (!key) return "unknown";
    if (key.startsWith("AIzaSy")) return "google";
    if (key.startsWith("nvapi-")) return "nvidia";
    if (key.startsWith("sk-or-")) return "openrouter";
    if (key.startsWith("sk-")) return "openai-compatible";
    return "general";
  }

  /**
   * Prepare request URL & options injected with current key
   */
  prepareRequest(url, options = {}, key) {
    const clonedOptions = {
      ...options,
      headers: { ...(options.headers || {}) },
    };

    let processedUrl = url;
    if (processedUrl.includes("{{KEY}}")) {
      processedUrl = processedUrl.replace(/\{\{KEY\}\}/g, encodeURIComponent(key));
    } else if (processedUrl.includes("KEY_PLACEHOLDER")) {
      processedUrl = processedUrl.replace(/KEY_PLACEHOLDER/g, encodeURIComponent(key));
    }

    // Google Gemini query parameter injection if url mentions googleapis
    if (processedUrl.includes("generativelanguage.googleapis.com") && !processedUrl.includes("key=")) {
      const sep = processedUrl.includes("?") ? "&" : "?";
      processedUrl = `${processedUrl}${sep}key=${encodeURIComponent(key)}`;
    }

    // Header injection
    const provider = this.detectProvider(key);
    if (provider === "google") {
      clonedOptions.headers["x-goog-api-key"] = key;
    }

    // Check Authorization header
    const authHeader = clonedOptions.headers["Authorization"] || clonedOptions.headers["authorization"];
    if (authHeader && authHeader.includes("{{KEY}}")) {
      clonedOptions.headers["Authorization"] = authHeader.replace("{{KEY}}", key);
    } else if (!authHeader && (provider === "openrouter" || provider === "nvidia" || provider === "openai-compatible" || !processedUrl.includes("key="))) {
      clonedOptions.headers["Authorization"] = `Bearer ${key}`;
    }

    return { processedUrl, clonedOptions };
  }

  /**
   * Fetch with automatic rotation on 429 (Rate Limit) or 403 (Forbidden/Quota)
   * Saves the active key index to localStorage so it remembers where it left off.
   *
   * @param {string} url Request URL
   * @param {RequestInit} [options] Fetch options
   * @returns {Promise<Response>}
   */
  async fetchWithRotation(url, options = {}) {
    if (this.keys.length === 0) {
      throw new Error("No API keys found in KeyRotator pool. Please configure keys in Settings.");
    }

    const totalKeys = this.keys.length;
    let attempts = 0;
    const errors = [];

    while (attempts < totalKeys) {
      const currentKey = this.getCurrentKey();
      if (!currentKey) {
        throw new Error("Invalid active key in KeyRotator pool.");
      }

      const { processedUrl, clonedOptions } = this.prepareRequest(url, options, currentKey);

      try {
        const response = await fetch(processedUrl, clonedOptions);

        // Check for rate-limiting or quota denial
        if (response.status === 429 || response.status === 403) {
          const statusText = response.status === 429 ? "Rate Limit Exceeded (429)" : "Quota/Forbidden (403)";
          console.warn(`[KeyRotator] Key #${this.currentIndex + 1} hit ${statusText}. Rotating to next key...`);
          errors.push({
            keyIndex: this.currentIndex,
            status: response.status,
            message: statusText,
          });

          // Switch to next key in array and persist to localStorage
          this.rotateKey();
          attempts += 1;
          continue;
        }

        // Successful or standard status
        return response;
      } catch (networkError) {
        console.warn(`[KeyRotator] Network error on key #${this.currentIndex + 1}:`, networkError.message);
        errors.push({
          keyIndex: this.currentIndex,
          error: networkError.message,
        });

        // Rotate and try next key if network error appears to be key/auth related
        this.rotateKey();
        attempts += 1;
      }
    }

    const failureReason = errors.map((e) => `[Key #${e.keyIndex + 1}: ${e.status || e.error}]`).join(", ");
    throw new Error(`All ${totalKeys} API keys in the pool were exhausted or rejected. Reasons: ${failureReason}`);
  }

  /**
   * Get status summary for diagnostic and UI indicators
   */
  getStatus() {
    return {
      totalKeys: this.keys.length,
      currentIndex: this.currentIndex,
      activeKeyMasked: this.getCurrentKey()
        ? `${this.getCurrentKey().slice(0, 6)}...${this.getCurrentKey().slice(-4)}`
        : "None",
      currentProvider: this.detectProvider(this.getCurrentKey() || ""),
    };
  }
}

// Singleton instance for global app usage
export const keyRotator = new KeyRotator();
export default keyRotator;
