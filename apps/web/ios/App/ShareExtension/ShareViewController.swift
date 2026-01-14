import UIKit
import Social
import UniformTypeIdentifiers

/// MyMind Share Extension - Saves URLs to MyMind knowledge base
/// Target: <50 lines of core logic
class ShareViewController: UIViewController {

    // MARK: - Properties
    private let apiEndpoint = "https://mymind.app/api/save" // TODO: Configure for environment
    private let appGroupID = "group.com.mymind.app"

    // UI Elements
    private var statusLabel: UILabel!
    private var activityIndicator: UIActivityIndicatorView!

    // MARK: - Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        processSharedContent()
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
                            self?.saveURL(url.absoluteString)
                        } else if let urlData = item as? Data, let url = URL(dataRepresentation: urlData, relativeTo: nil) {
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
        // Get auth token from Keychain
        guard let authToken = getAuthToken() else {
            showError("Please log in to MyMind app first")
            return
        }

        // Prepare request
        guard let apiURL = URL(string: apiEndpoint) else {
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
            showError("Failed to prepare request")
            return
        }

        // Send request
        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            DispatchQueue.main.async {
                if let error = error {
                    self?.showError("Network error: \(error.localizedDescription)")
                    return
                }

                guard let httpResponse = response as? HTTPURLResponse else {
                    self?.showError("Invalid response")
                    return
                }

                if httpResponse.statusCode == 200 || httpResponse.statusCode == 201 {
                    self?.showSuccess()
                } else if httpResponse.statusCode == 401 {
                    self?.showError("Please log in to MyMind app first")
                } else {
                    self?.showError("Save failed (code: \(httpResponse.statusCode))")
                }
            }
        }.resume()
    }

    // MARK: - Keychain Access
    private func getAuthToken() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: "com.mymind.app.auth",
            kSecAttrAccount as String: "supabase_token",
            kSecAttrAccessGroup as String: appGroupID,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        if status == errSecSuccess, let data = result as? Data {
            return String(data: data, encoding: .utf8)
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
