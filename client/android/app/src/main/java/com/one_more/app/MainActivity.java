package com.one_more.app;

import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.webkit.WebView;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginHandle;
import com.getcapacitor.WebViewListener;

import ee.forgr.capacitor.social.login.GoogleProvider;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;

import java.util.Locale;

public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {

    private boolean edgeToEdgeInsetsApplied;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        setTheme(R.style.AppTheme_NoActionBar);
        super.onCreate(savedInstanceState);
        configureEdgeToEdgeWindow();
    }

    @Override
    public void onStart() {
        super.onStart();
        applyForcedEdgeToEdgeInsets();
    }

    @Override
    public void onResume() {
        super.onResume();
        applyForcedEdgeToEdgeInsets();
    }

    private void configureEdgeToEdgeWindow() {
        Window window = getWindow();
        WindowCompat.setDecorFitsSystemWindows(window, false);
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setNavigationBarContrastEnforced(false);
        }
        window.getDecorView().setBackgroundColor(Color.BLACK);
    }

    /**
     * Capacitor SystemBars n’active le passthrough (contenu sous les barres) que si WebView ≥ 140.
     * Sur beaucoup d’émulateurs / appareils, le parent garde du padding → bandes noires.
     * On remplace ce comportement pour coller à iOS : padding 0 + variables CSS --safe-area-inset-*.
     */
    private void applyForcedEdgeToEdgeInsets() {
        if (getBridge() == null) return;
        WebView webView = getBridge().getWebView();
        if (webView == null) return;
        View parent = (View) webView.getParent();
        if (parent == null) return;

        webView.setBackgroundColor(Color.TRANSPARENT);

        ViewCompat.setOnApplyWindowInsetsListener(parent, (v, insets) -> {
            Insets systemBarsInsets = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            Insets imeInsets = insets.getInsets(WindowInsetsCompat.Type.ime());
            boolean keyboardVisible = insets.isVisible(WindowInsetsCompat.Type.ime());

            v.setPadding(0, 0, 0, keyboardVisible ? imeInsets.bottom : 0);
            v.setBackgroundColor(Color.TRANSPARENT);

            int bottomInset = keyboardVisible ? 0 : systemBarsInsets.bottom;
            injectSafeAreaCss(
                webView,
                systemBarsInsets.top,
                systemBarsInsets.right,
                bottomInset,
                systemBarsInsets.left
            );

            return new WindowInsetsCompat.Builder(insets)
                .setInsets(
                    WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout(),
                    Insets.of(
                        systemBarsInsets.left,
                        systemBarsInsets.top,
                        systemBarsInsets.right,
                        keyboardVisible ? imeInsets.bottom : systemBarsInsets.bottom
                    )
                )
                .build();
        });

        if (!edgeToEdgeInsetsApplied) {
            edgeToEdgeInsetsApplied = true;
            getBridge().addWebViewListener(
                new WebViewListener() {
                    @Override
                    public void onPageCommitVisible(WebView view, String url) {
                        super.onPageCommitVisible(view, url);
                        parent.requestApplyInsets();
                    }
                }
            );
        }

        parent.requestApplyInsets();
    }

    private static void injectSafeAreaCss(WebView webView, int top, int right, int bottom, int left) {
        float density = webView.getResources().getDisplayMetrics().density;
        int topPx = (int) (top / density);
        int rightPx = (int) (right / density);
        int bottomPx = (int) (bottom / density);
        int leftPx = (int) (left / density);

        String script = String.format(
            Locale.US,
            """
            try {
              document.documentElement.style.setProperty("--safe-area-inset-top", "%dpx");
              document.documentElement.style.setProperty("--safe-area-inset-right", "%dpx");
              document.documentElement.style.setProperty("--safe-area-inset-bottom", "%dpx");
              document.documentElement.style.setProperty("--safe-area-inset-left", "%dpx");
            } catch (e) { console.error('safe area inject', e); }
            """,
            topPx,
            rightPx,
            bottomPx,
            leftPx
        );
        webView.evaluateJavascript(script, null);
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode >= GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MIN
                && requestCode < GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MAX) {
            PluginHandle pluginHandle = getBridge().getPlugin("SocialLogin");
            if (pluginHandle == null) {
                Log.i("Google Activity Result", "SocialLogin login handle is null");
                return;
            }
            Plugin plugin = pluginHandle.getInstance();
            if (!(plugin instanceof SocialLoginPlugin)) {
                Log.i("Google Activity Result", "SocialLogin plugin instance is not SocialLoginPlugin");
                return;
            }
            ((SocialLoginPlugin) plugin).handleGoogleLoginIntent(requestCode, data);
            return;
        }

        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {}
}
