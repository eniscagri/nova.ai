package com.novaai.chat;

import com.getcapacitor.BridgeActivity;
import android.os.Build;
import android.os.Bundle;
import android.view.ViewGroup;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);
        if (Build.VERSION.SDK_INT < 35 || bridge == null) return;
        // Edge-to-edge windows must account for the keyboard as well as system bars.
        // Earlier Android versions continue using the activity's adjustResize.
        ViewCompat.setOnApplyWindowInsetsListener(bridge.getWebView(), (view, windowInsets) -> {
            Insets bars = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            Insets keyboard = windowInsets.getInsets(WindowInsetsCompat.Type.ime());
            ViewGroup.MarginLayoutParams params = (ViewGroup.MarginLayoutParams) view.getLayoutParams();
            int bottom = Math.max(bars.bottom, keyboard.bottom);
            if (params.leftMargin != bars.left || params.topMargin != bars.top || params.rightMargin != bars.right || params.bottomMargin != bottom) {
                params.setMargins(bars.left, bars.top, bars.right, bottom);
                view.setLayoutParams(params);
            }
            return WindowInsetsCompat.CONSUMED;
        });
        ViewCompat.requestApplyInsets(bridge.getWebView());
    }
}
