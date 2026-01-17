//
//  ShareViewController.swift
//  ShareExtension
//
//  Created by senik on 1/16/26.
//

import UIKit
import Social
import UniformTypeIdentifiers

/// MyMind Share Extension - Saves URLs to MyMind knowledge base
/// Shares the same Keychain access group as main app for auth token access
class ShareViewController: UIViewController {

    // MARK: - Properties

    /// App Group for Keychain sharing - MUST match KeychainBridge.swift
    private let appGroupID = "group.com.mymind.app"

    /// Keychain service identifier - MUST match KeychainBridge.swift
    private let keychainService = "com.mymind.app.auth"

    /// Keychain account identifier - MUST match KeychainBridge.swift
    private let keychainAccount = "supabase_token"

    // UI Elements
    private var statusLabel: UILabel!
    private var activityIndicator: UIActivityIndicatorView!

    // MARK: - Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        processSharedContent()
    }

    // MARK: - Configuration

    /// Get API endpoint from Info.plist with environment awareness
    private var apiEndpoint: String {
        // Read from Info.plist
        if let plist = Bundle.main.infoDictionary {
            #if DEBUG
            // Use dev endpoint in debug builds if available
            if let devEndpoint = plist["ApiEndpointDev"] as? String, !devEndpoint.isEmpty {
                print("[ShareExtension] Using dev API endpoint: \(devEndpoint)")
                return devEndpoint
            }
            #endif

            // Fall back to production endpoint
            if let prodEndpoint = plist["ApiEndpoint"] as? String, !prodEndpoint.isEmpty {
                print("[ShareExtension] Using production API endpoint: \(prodEndpoint)")
                return prodEndpoint
            }
        }

        // Ultimate fallback (should not happen if Info.plist is configured)
        print("[ShareExtension] WARNING: No API endpoint configured, using default")
        return "https://mymind.app/api/save"
    }

    // MARK: - UI Setup
    private func setupUI() {
        view.backgroundColor = UIColor.systemBackground.withAlphaComponent(0.95)

        // Status label
        statusLabel = UILabel()
        statusLabel.text = "Saving to MyMind..."
        statusLabel.textAlignment = .center
        statusLabel.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(statusLabel)

        // Activity indicator
        activityIndicator = UIActivityIndicatorView(style: .large)
        activityIndicator.translatesAutoresizingMaskIntoConstraints = false
        activityIndicator.startAnimating()
        view.addSubview(activityIndicator)

        NSLayoutConstraint.activate([
            activityIndicator.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            activityIndicator.centerYAnchor.constraint(equalTo: view.centerYAnchor, constant: -20),
            statusLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            statusLabel.topAnchor.constraint(equalTo: activityIndicator.bottomAnchor, constant: 16)
        ])
    }

    // MARK: - Content Processing
    private func processSharedContent() {
        print("[ShareExtension] Processing shared content...")

        guard let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem,
              let attachments = extensionItem.attachments else {
            showError("No content to share")
            return
        }

        // Find URL in attachments
        for attachment in attachments {
            if attachment.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                attachment.loadItem(forTypeIdentifier: UTType.url.identifier) { [weak self] item, error in
                    DispatchQueue.main.async {
                        if let url = item as? URL {
                            print("[ShareExtension] Extracted URL: \(url.absoluteString)")
                            self?.saveURL(url.absoluteString)
                        } else if let urlData = item as? Data, let url = URL(dataRepresentation: urlData, relativeTo: nil) {
                            print("[ShareExtension] Extracted URL from data: \(url.absoluteString)")
                            self?.saveURL(url.absoluteString)
                        } else {
                            self?.showError("Could not extract URL")
                        }
                    }
                }
                return
            }
        }

        showError("No URL found to save")
    }

    // MARK: - API Request
    private func saveURL(_ urlString: String) {
        print("[ShareExtension] Attempting to save URL: \(urlString)")

        // Get auth token from Keychain
        guard let authToken = getAuthToken() else {
            print("[ShareExtension] ERROR: No auth token found in Keychain")
            showError("Please log in to MyMind app first")
            return
        }

        print("[ShareExtension] Auth token retrieved (length: \(authToken.count) chars)")

        // Prepare request
        guard let apiURL = URL(string: apiEndpoint) else {
            print("[ShareExtension] ERROR: Invalid API endpoint URL")
            showError("Invalid API endpoint")
            return
        }

        var request = URLRequest(url: apiURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 10

        let body: [String: Any] = [
            "url": urlString,
            "source": "ios-share-extension",
            "auth_token": authToken
        ]

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        } catch {
            print("[ShareExtension] ERROR: Failed to serialize request body")
            showError("Failed to prepare request")
            return
        }

        print("[ShareExtension] Sending request to: \(apiURL.absoluteString)")

        // Send request
        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            DispatchQueue.main.async {
                if let error = error {
                    print("[ShareExtension] Network error: \(error.localizedDescription)")
                    self?.showError("Network error: \(error.localizedDescription)")
                    return
                }

                guard let httpResponse = response as? HTTPURLResponse else {
                    print("[ShareExtension] ERROR: Invalid response type")
                    self?.showError("Invalid response")
                    return
                }

                print("[ShareExtension] Response status: \(httpResponse.statusCode)")

                if httpResponse.statusCode == 200 || httpResponse.statusCode == 201 {
                    print("[ShareExtension] SUCCESS: URL saved")
                    self?.showSuccess()
                } else if httpResponse.statusCode == 401 {
                    print("[ShareExtension] ERROR: Unauthorized (401) - token may be expired")
                    self?.showError("Please log in to MyMind app first")
                } else {
                    // Try to extract error message from response
                    if let data = data, let errorBody = String(data: data, encoding: .utf8) {
                        print("[ShareExtension] ERROR response body: \(errorBody)")
                    }
                    self?.showError("Save failed (code: \(httpResponse.statusCode))")
                }
            }
        }.resume()
    }

    // MARK: - Keychain Access

    /// Retrieve auth token from shared Keychain
    /// Query parameters MUST match KeychainBridge.swift exactly
    private func getAuthToken() -> String? {
        print("[ShareExtension] Querying Keychain...")
        print("[ShareExtension] - Service: \(keychainService)")
        print("[ShareExtension] - Account: \(keychainAccount)")
        print("[ShareExtension] - Access Group: \(appGroupID)")

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: keychainAccount,
            kSecAttrAccessGroup as String: appGroupID,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        if status == errSecSuccess, let data = result as? Data {
            let token = String(data: data, encoding: .utf8)
            print("[ShareExtension] Token found in Keychain")
            return token
        } else if status == errSecItemNotFound {
            print("[ShareExtension] No token found in Keychain (errSecItemNotFound)")
        } else {
            print("[ShareExtension] Keychain query failed with status: \(status)")
            // Common error codes:
            // -25291 (errSecNotAvailable) - No trust result
            // -25300 (errSecItemNotFound) - Item not found
            // -34018 - Missing entitlement
        }

        return nil
    }

    // MARK: - UI Feedback
    private func showSuccess() {
        activityIndicator.stopAnimating()
        statusLabel.text = "Saved!"

        // Show checkmark animation
        let checkmark = UILabel()
        checkmark.text = "✓"
        checkmark.font = .systemFont(ofSize: 48, weight: .bold)
        checkmark.textColor = .systemGreen
        checkmark.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(checkmark)

        NSLayoutConstraint.activate([
            checkmark.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            checkmark.centerYAnchor.constraint(equalTo: view.centerYAnchor, constant: -20)
        ])

        // Dismiss after delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) { [weak self] in
            self?.extensionContext?.completeRequest(returningItems: nil)
        }
    }

    private func showError(_ message: String) {
        activityIndicator.stopAnimating()
        statusLabel.text = message
        statusLabel.textColor = .systemRed

        // Add cancel button
        let cancelButton = UIButton(type: .system)
        cancelButton.setTitle("Cancel", for: .normal)
        cancelButton.translatesAutoresizingMaskIntoConstraints = false
        cancelButton.addTarget(self, action: #selector(cancelTapped), for: .touchUpInside)
        view.addSubview(cancelButton)

        NSLayoutConstraint.activate([
            cancelButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            cancelButton.topAnchor.constraint(equalTo: statusLabel.bottomAnchor, constant: 20)
        ])
    }

    @objc private func cancelTapped() {
        extensionContext?.cancelRequest(withError: NSError(domain: "com.mymind.share", code: 0))
    }
}
