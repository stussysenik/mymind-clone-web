#import <Capacitor/Capacitor.h>

/// Objective-C bridge for KeychainBridge Swift plugin
/// Required for Capacitor plugin registration
CAP_PLUGIN(KeychainBridge, "KeychainBridge",
    CAP_PLUGIN_METHOD(setToken, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getToken, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(clearToken, CAPPluginReturnPromise);
)
