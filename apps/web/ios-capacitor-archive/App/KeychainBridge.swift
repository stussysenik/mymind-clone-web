import Foundation
import Capacitor
import Security

/// KeychainBridge - Native Capacitor plugin for iOS Keychain access
/// Enables auth token sharing between main app and Share Extension
@objc(KeychainBridge)
public class KeychainBridge: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "KeychainBridge"
    public let jsName = "KeychainBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setToken", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getToken", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearToken", returnType: CAPPluginReturnPromise)
    ]

    // MARK: - Configuration
    // Must match ShareViewController.swift exactly
    private let service = "com.mymind.app.auth"
    private let account = "supabase_token"
    private let accessGroup = "group.com.mymind.app"

    // MARK: - Plugin Methods

    /// Store auth token in Keychain with App Group access
    @objc func setToken(_ call: CAPPluginCall) {
        guard let token = call.getString("token") else {
            call.reject("Missing token parameter")
            return
        }

        guard let tokenData = token.data(using: .utf8) else {
            call.reject("Failed to encode token")
            return
        }

        // Delete existing token first (if any)
        let deleteQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecAttrAccessGroup as String: accessGroup
        ]
        SecItemDelete(deleteQuery as CFDictionary)

        // Add new token
        let addQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecAttrAccessGroup as String: accessGroup,
            kSecValueData as String: tokenData,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock
        ]

        let status = SecItemAdd(addQuery as CFDictionary, nil)

        if status == errSecSuccess {
            print("[KeychainBridge] Token stored successfully")
            call.resolve(["success": true])
        } else {
            print("[KeychainBridge] Failed to store token: \(status)")
            call.reject("Failed to store token in Keychain (status: \(status))")
        }
    }

    /// Retrieve auth token from Keychain
    @objc func getToken(_ call: CAPPluginCall) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecAttrAccessGroup as String: accessGroup,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        if status == errSecSuccess, let data = result as? Data, let token = String(data: data, encoding: .utf8) {
            print("[KeychainBridge] Token retrieved successfully")
            call.resolve(["token": token])
        } else if status == errSecItemNotFound {
            print("[KeychainBridge] No token found in Keychain")
            call.resolve(["token": NSNull()])
        } else {
            print("[KeychainBridge] Failed to retrieve token: \(status)")
            call.resolve(["token": NSNull()])
        }
    }

    /// Remove auth token from Keychain
    @objc func clearToken(_ call: CAPPluginCall) {
        let deleteQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecAttrAccessGroup as String: accessGroup
        ]

        let status = SecItemDelete(deleteQuery as CFDictionary)

        if status == errSecSuccess || status == errSecItemNotFound {
            print("[KeychainBridge] Token cleared successfully")
            call.resolve(["success": true])
        } else {
            print("[KeychainBridge] Failed to clear token: \(status)")
            call.reject("Failed to clear token from Keychain (status: \(status))")
        }
    }
}
