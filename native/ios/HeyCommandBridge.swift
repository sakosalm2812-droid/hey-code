import Foundation
import UIKit
import WebKit
import os

/// HEY "Command Channel" — the iOS / iPadOS target router for the virtual terminal.
///
/// The Next.js web layer calls this bridge by posting JSON to the WebKit message
/// handler named `heyCommand` (see src/lib/terminal/strategies/ios-strategy.ts).
///
/// Contracts:
///   { "action": "launchApp", "app": "spotify" } -> resolves "spotify" against the
///       friendly-name dictionary, verifies `UIApplication.shared.canOpenURL(url)`,
///       then opens the URL.
///   { "action": "exitApp" }  -> OS application exit routine.
///
/// The dictionary is authoritative on the native layer so friendly names never
/// directly become schemes.
final class HeyCommandBridge: NSObject, WKScriptMessageHandler {

    static let handlerName = "heyCommand"

    private let log = Logger(subsystem: "com.hey.app", category: "CommandChannel")

    /// Predefined dictionary mapping friendly app names to Apple URL schemes.
    /// Keep in sync with src/lib/terminal/app-catalog.ts (iOS column).
    private let appSchemeDictionary: [String: String] = [
        "calculator": "calculator://",
        "spotify": "spotify://",
        "maps": "maps://",
        "settings": "app-settings:",
        "browser": "https://",
        "calendar": "calshow://",
        "files": "shareddocuments://",
        "messages": "sms:",
    ]

    private weak var webView: WKWebView?

    init(webView: WKWebView) {
        self.webView = webView
        super.init()
    }

    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard message.name == Self.handlerName else {
            log.warning("Dropping message for unknown handler \(message.name, privacy: .public)")
            return
        }

        guard let body = message.body as? [String: Any],
              let action = body["action"] as? String else {
            log.error("Bridge message missing action or non-dictionary body")
            scriptError(error: "bridge message must be JSON with an `action` string.")
            return
        }

        switch action {
        case "launchApp":
            handleLaunchApp(body)
        case "exitApp":
            handleExitApp()
        default:
            log.warning("Unknown bridge action: \(action, privacy: .public)")
            scriptError(error: "Unknown bridge action: \(action)")
        }
    }

    // MARK: - launchApp

    private func handleLaunchApp(_ body: [String: Any]) {
        guard let friendly = (body["app"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines),
              !friendly.isEmpty else {
            log.error("launchApp called without an `app` field")
            scriptError(error: "launchApp requires an `app` friendly name, e.g. \"spotify\".")
            return
        }

        guard let scheme = appSchemeDictionary[friendly.lowercased()] else {
            log.warning("No URL scheme for friendly name: \(friendly, privacy: .public)")
            scriptError(error: "No URL scheme registered for \"\(friendly)\".")
            return
        }

        guard let url = outputURL(fromScheme: scheme) else {
            log.error("Could not build URL from scheme: \(scheme, privacy: .public)")
            scriptError(error: "Invalid URL scheme for \"\(friendly)\".")
            return
        }

        let application = UIApplication.shared
        guard application.canOpenURL(url) else {
            let message = "canOpenURL returned false — \"\(friendly)\" is not installed or its scheme is not declared in Info.plist."
            log.error("\(message, privacy: .public)")
            scriptError(error: message)
            return
        }

        log.info("Opening \(url.absoluteString, privacy: .public) for \(friendly, privacy: .public)")
        application.open(url, options: [:]) { [weak self] succeeded in
            guard let self else { return }
            if succeeded {
                self.log.info("Opened \(friendly, privacy: .public) successfully")
            } else {
                let message = "UIApplication.shared.open failed for \"\(friendly)\"."
                self.log.error("\(message, privacy: .public)")
                self.scriptError(error: message)
            }
        }
    }

    // MARK: - exitApp

    private func handleExitApp() {
        log.info("Exit routine invoked from web layer")
        exit(0)
    }

    // MARK: - helpers

    private func outputURL(fromScheme scheme: String) -> URL? {
        var candidate = scheme
        if !candidate.hasSuffix("://") && candidate != "https://" && candidate != "sms:" && candidate != "app-settings:" {
            candidate += "://"
        }
        return URL(string: candidate)
    }

    private func scriptError(error: String) {
        let script = "window.dispatchEvent(new CustomEvent('heyCommandError', { detail: \(error.asJSString()) }));"
        webView?.evaluateJavaScript(script, completionHandler: nil)
    }
}

private extension String {
    func asJSString() -> String {
        let escaped = replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "\"", with: "\\\"")
            .replacingOccurrences(of: "\n", with: "\\n")
            .replacingOccurrences(of: "\r", with: "\\r")
        return "\"\(escaped)\""
    }
}