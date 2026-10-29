package hey.external.control

/**
 * External Hey Accessibility Service — SOURCE SCAFFOLD, NOT COMPILED OR TESTED
 * ON THIS HOST (no Android SDK/Java on the authoring machine).
 *
 * Purpose: turn HEY action envelopes (see src/core/externalControlBridge.js)
 * into real OS-level interactions on OTHER apps when a gesture or command is
 * bound with target "os-level" or "paired_device".
 *
 * Android model (honest):
 *   - Requires BIND_ACCESSIBILITY_SERVICE + the manifest service declaration.
 *   - The USER must grant the accessibility permission (system Settings).
 *   - Every performed action is the result of a `queueExternalCommand` envelope
 *     that already passed identity/permission/risk/confirmation gates in HEY.
 *
 * Security rules (must be preserved when compiling):
 *   - Actions come ONLY from a channel that carries verified, confirmed
 *     envelopes; never raw strings from a prompt.
 *   - `high`/`critical` risk envelopes must be confirmed at the OS prompt layer.
 *   - Respect `globalAction`, pointer-down/up, swipe gestures, scroll, and
 *     text where allowed; nothing here ever reads or exfiltrates content.
 *   - Command surface = `SIMPLE_ACTION_CATALOG` in externalControlBridge.js:
 *     open registered apps (`Intent.ACTION_MAIN`/CATEGORY_LAUNCHER), open
 *     http(s) URLs (ACTION_VIEW), media/volume keys, show desktop/home.
 *     Never script or inspect another app's contents.
 */

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.content.Intent
import android.graphics.Path
import android.os.Build
import android.view.accessibility.AccessibilityEvent
import org.json.JSONObject

class ExternalHeyAccessibilityService : AccessibilityService() {

    companion object {
        const val ACTION_QUEUE = "hey.external.ACTION_QUEUE"
    }

    override fun onServiceConnected() {
        // A real implementation would start a local connection that consumes
        // validated envelopes from the HEY bridge (target "os-level").
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Reserved for future reaction-to-UI; not needed for gesture dispatch.
    }

    override fun onInterrupt() {}

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val raw = intent?.getStringExtra("envelope") ?: return START_NOT_STICKY
        consumeEnvelope(raw)
        return START_NOT_STICKY
    }

    private fun consumeEnvelope(raw: String) {
        val envelope = try { JSONObject(raw) } catch (_: Exception) { return }
        val command = envelope.optString("command", "")
        val confirmed = envelope.optBoolean("requiresConfirmation", false) == false
        val source = envelope.optString("source", "")
        // Fail-closed: only envelopes from HEY's bridge are eligible.
        if (source != "external-control-bridge") return
        // Fail-closed: high/critical risk must be confirmed by the operator.
        val risk = envelope.optString("risk", "low")
        if (!confirmed && (risk == "high" || risk == "critical")) return
        when (command) {
            "input.back" -> performGlobalAction(GLOBAL_ACTION_BACK)
            "input.home" -> performGlobalAction(GLOBAL_ACTION_HOME)
            "input.recents" -> performGlobalAction(GLOBAL_ACTION_RECENTS)
            "input.notifications" -> performGlobalAction(GLOBAL_ACTION_NOTIFICATIONS)
            "input.scroll" -> performSwipe()
            "input.primary_click" -> performClickAt(envelope)
            "media.play_pause" -> performGlobalAction(GLOBAL_ACTION_MEDIA_CONTROL_PLAY_PAUSE)
            else -> Unit // unknown commands are ignored, never guessed
        }
    }

    private fun performSwipe() {
        val display = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) display else null
        val bounds = resources.displayMetrics ?: return
        val width = display?.width ?: bounds.widthPixels
        val height = display?.height ?: bounds.heightPixels
        val path = Path().apply {
            moveTo(width * 0.5f, height * 0.75f)
            lineTo(width * 0.5f, height * 0.25f)
        }
        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0, 300))
            .build()
        dispatchGesture(gesture, null, null)
    }

    private fun performClickAt(envelope: JSONObject) {
        val x = envelope.optDouble("x", -1.0)
        val y = envelope.optDouble("y", -1.0)
        if (x < 0.0 || y < 0.0) return
        val display = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) display else null
        val bounds = resources.displayMetrics ?: return
        val width = display?.width ?: bounds.widthPixels
        val height = display?.height ?: bounds.heightPixels
        val path = Path().apply { moveTo((x * width).toFloat(), (y * height).toFloat()) }
        val tap = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0, 80))
            .build()
        dispatchGesture(tap, null, null)
    }
}