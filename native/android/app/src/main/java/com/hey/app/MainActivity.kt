package com.hey.app

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.util.Log
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import org.json.JSONObject

/**
 * HEY "Command Channel" — the Android target router for the virtual terminal.
 *
 * The Next.js web layer calls this bridge through the global `window.heyAndroid`
 * surface (see src/lib/terminal/strategies/android-strategy.ts). Method matching
 * is done by de-referencing the injected JS interface directly, so package name
 * resolution happens with the exact packageManager/startActivity pair required by
 * the terminal spec, inside an explicit try/catch that reports missing packages
 * back into the terminal transcript.
 */
class MainActivity : ComponentActivity() {

    companion object {
        private const val TAG = "HeyCommandChannel"
        private const val START_URL = "https://app.hey.example" // Replace with deployed app origin
    }

    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)
        webView.setBackgroundColor(Color.BLACK)

        val layout = FrameLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }
        layout.addView(webView)
        setContentView(layout)

        configureWebView()

        val bridge = CommandChannelBridge(this)
        webView.addJavascriptInterface(bridge, "heyAndroid")
        Log.i(TAG, "heyAndroid bridge attached with JavascriptInterface surface")

        webView.loadUrl(START_URL)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView() {
        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE

        webView.setWebViewClient(WebViewClient())
        webView.setWebChromeClient(WebChromeClient())

        // Required so the WebRTC camera stream reaches the MediaPipe gesture engine.
        webView.setWebChromeClient(object : WebChromeClient() {
            override fun onPermissionRequest(request: android.webkit.PermissionRequest) {
                runOnUiThread { request.grant(request.resources) }
            }
        })
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }

    /**
     * The "Native Method Channel" for launching OS applications. Every public
     * method below is exposed to JavaScript as `window.heyAndroid.<name>`.
     */
    inner class CommandChannelBridge(private val context: Context) {

        /**
         * Resolves and starts the package for [packageName] using the platform
         * package manager. Returns a JSON string {ok, message} that the web layer
         * logs verbatim into the terminal transcript. Missing packages are handled
         * gracefully inside the try/catch, as required.
         */
        @JavascriptInterface
        fun launchApp(packageName: String): String {
            Log.i(TAG, "launchApp(packageName=$packageName)")
            return try {
                val intent: Intent? = context.packageManager.getLaunchIntentForPackage(packageName)
                if (intent == null) {
                    val message = "Package not found: $packageName"
                    Log.w(TAG, message)
                    JSONObject()
                        .put("ok", false)
                        .put("message", message)
                        .toString()
                } else {
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    context.startActivity(intent)
                    val message = "Launched $packageName"
                    Log.i(TAG, message)
                    JSONObject()
                        .put("ok", true)
                        .put("message", message)
                        .toString()
                }
            } catch (e: Exception) {
                val message = "Failed to launch $packageName: ${e.message ?: e.javaClass.simpleName}"
                Log.e(TAG, message, e)
                JSONObject()
                    .put("ok", false)
                    .put("message", message)
                    .toString()
            }
        }

        /** Safety probe used by the web layer to preview launch-ability. */
        @JavascriptInterface
        fun canLaunchApp(packageName: String): Boolean {
            return try {
                context.packageManager.getLaunchIntentForPackage(packageName) != null
            } catch (e: Exception) {
                Log.e(TAG, "canLaunchApp($packageName) threw", e)
                false
            }
        }

        /**
         * OS application exit routine. Fires the implicit MAIN intent for the
         * current activity category with terminal flags, mirroring the closed-fist
         * gesture action.
         */
        @JavascriptInterface
        fun exitApp() {
            Log.i(TAG, "Exit routine invoked from web layer")
            try {
                val intent = Intent(Intent.ACTION_MAIN).apply {
                    addCategory(Intent.CATEGORY_HOME)
                    flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(intent)
                android.os.Process.killProcess(android.os.Process.myPid())
            } catch (e: Exception) {
                Log.e(TAG, "Exit routine failed", e)
            }
        }

        /** Opens the system settings page (used by "settings" target on devices missing it). */
        @JavascriptInterface
        fun openSystemSettings() {
            try {
                context.startActivity(Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            } catch (e: Exception) {
                Log.e(TAG, "Could not open system settings", e)
            }
        }

        /** Opens an external URI (e.g. https:// for the browser target). */
        @JavascriptInterface
        fun openUri(uri: String): String {
            return try {
                val parsed = Uri.parse(uri)
                if (parsed.scheme == null) {
                    val message = "No scheme in URI: $uri"
                    Log.w(TAG, message)
                    JSONObject().put("ok", false).put("message", message).toString()
                } else {
                    context.startActivity(
                        Intent(Intent.ACTION_VIEW, parsed).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    )
                    JSONObject().put("ok", true).put("message", "Opened $uri").toString()
                }
            } catch (e: Exception) {
                val message = "Failed to open $uri: ${e.message ?: e.javaClass.simpleName}"
                Log.e(TAG, message, e)
                JSONObject().put("ok", false).put("message", message).toString()
            }
        }
    }
}