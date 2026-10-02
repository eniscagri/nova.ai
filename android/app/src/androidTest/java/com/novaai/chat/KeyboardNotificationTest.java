package com.novaai.chat;

import android.Manifest;
import android.app.NotificationManager;
import android.content.Context;
import android.graphics.Bitmap;
import android.view.inputmethod.InputMethodManager;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.io.FileOutputStream;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class KeyboardNotificationTest {
    private boolean js(ActivityScenario<MainActivity> app, String script) throws Exception {
        CountDownLatch done = new CountDownLatch(1);
        AtomicBoolean result = new AtomicBoolean();
        app.onActivity(activity -> activity.getBridge().getWebView().evaluateJavascript(script, value -> { result.set("true".equals(value)); done.countDown(); }));
        assertTrue("WebView script callback", done.await(5, TimeUnit.SECONDS));
        return result.get();
    }
    private void waitFor(ActivityScenario<MainActivity> app, String script) throws Exception {
        long until = System.currentTimeMillis() + 20000;
        do { if (js(app, script)) return; Thread.sleep(200); } while (System.currentTimeMillis() < until);
        fail("Expected application state: " + script);
    }
    private void screenshot(String filename) throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        Bitmap bitmap = InstrumentationRegistry.getInstrumentation().getUiAutomation().takeScreenshot();
        assertNotNull(bitmap);
        try (FileOutputStream file = new FileOutputStream(new java.io.File(context.getExternalFilesDir(null), filename))) { bitmap.compress(Bitmap.CompressFormat.PNG, 100, file); }
        bitmap.recycle();
    }
    @Test public void liveAiRespondsFromAndroidWebView() throws Exception {
        try (ActivityScenario<MainActivity> app = ActivityScenario.launch(MainActivity.class)) {
            waitFor(app, "document.readyState === 'complete'");
            js(app, "window.__novaLiveReply = null; fetch('https://nova-ai-3lfh.onrender.com/api/chat', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({messages:[{role:'user',content:'Türkçe tek kelimeyle selam ver.'}],stream:false,conversationStyle:'dengeli'})}).then(async r => {if(!r.ok) throw new Error('HTTP '+r.status); return r.json();}).then(r => window.__novaLiveReply = r.message?.content || '').catch(e => window.__novaLiveError = String(e)); true");
            waitFor(app, "typeof window.__novaLiveReply === 'string' && window.__novaLiveReply.trim().length > 0");
            assertTrue("Android WebView must receive a real AI answer", js(app, "!window.__novaLiveError && window.__novaLiveReply.trim().length > 0"));
        }
    }
    @Test public void composerStaysAboveKeyboard() throws Exception {
        try (ActivityScenario<MainActivity> app = ActivityScenario.launch(MainActivity.class)) {
            waitFor(app, "!!document.querySelector('.composer textarea')");
            js(app, "document.querySelector('.composer textarea').focus(); true");
            app.onActivity(activity -> {
                activity.getBridge().getWebView().requestFocus();
                ((InputMethodManager) activity.getSystemService(Context.INPUT_METHOD_SERVICE)).showSoftInput(activity.getBridge().getWebView(), InputMethodManager.SHOW_IMPLICIT);
            });
            AtomicBoolean keyboardVisible = new AtomicBoolean();
            long until = System.currentTimeMillis() + 10000;
            do {
                app.onActivity(activity -> { WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(activity.getBridge().getWebView()); keyboardVisible.set(insets != null && insets.isVisible(WindowInsetsCompat.Type.ime())); });
                if (keyboardVisible.get()) break;
                Thread.sleep(200);
            } while (System.currentTimeMillis() < until);
            assertTrue("Keyboard must be visible", keyboardVisible.get());
            waitFor(app, "document.querySelector('.composer').getBoundingClientRect().bottom <= window.innerHeight && document.querySelector('.composer textarea').getBoundingClientRect().top >= 0");
            app.onActivity(activity -> {
                android.webkit.WebView view = activity.getBridge().getWebView();
                int[] location = new int[2]; view.getLocationOnScreen(location);
                WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(view);
                assertTrue("WebView must end above IME", location[1] + view.getHeight() <= view.getRootView().getHeight() - insets.getInsets(WindowInsetsCompat.Type.ime()).bottom + 2);
            });
            screenshot("keyboard-proof.png");
        }
    }
    @Test public void remindersCanBeEnabledAndDelivered() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        InstrumentationRegistry.getInstrumentation().getUiAutomation().grantRuntimePermission(context.getPackageName(), Manifest.permission.POST_NOTIFICATIONS);
        try (ActivityScenario<MainActivity> app = ActivityScenario.launch(MainActivity.class)) {
            waitFor(app, "!!document.querySelector('.tone-chip')");
            js(app, "document.querySelector('.reminder-prompt button:last-child')?.click(); document.querySelector('.tone-chip').click(); true");
            waitFor(app, "!!document.querySelector('input[aria-label=\"Kullanım hatırlatmalarını etkinleştir\"]:not(:disabled)')");
            js(app, "(()=>{const input=document.querySelector('input[aria-label=\"Kullanım hatırlatmalarını etkinleştir\"]'); if(!input.checked) input.click(); return true;})()");
            assertTrue("Notification test button must not be exposed in settings", js(app, "!document.querySelector('.notification-test')"));
            js(app, "window.__testScheduled=false; window.Capacitor.Plugins.LocalNotifications.schedule({notifications:[{id:62005,title:'Nova test',body:'Notification delivery verification',channelId:'nova-reminders',schedule:{at:new Date(Date.now()+5000).toISOString()},autoCancel:true}]}).then(()=>window.__testScheduled=true); true");
            waitFor(app, "window.__testScheduled === true");
            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            boolean delivered = false;
            long until = System.currentTimeMillis() + 20000;
            do {
                for (android.service.notification.StatusBarNotification notification : manager.getActiveNotifications()) if (notification.getId() == 62005) delivered = true;
                if (delivered) break;
                Thread.sleep(250);
            } while (System.currentTimeMillis() < until);
            assertTrue("Nova test notification must be delivered", delivered);
            assertTrue(js(app, "document.querySelector('input[aria-label=\"Kullanım hatırlatmalarını etkinleştir\"]').checked"));
            screenshot("notification-settings-proof.png");
        }
    }

    // Explicitly requested emulator setup. Does not sign in or alter account data.
    @Test public void enableRequestedDeviceReminders() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        InstrumentationRegistry.getInstrumentation().getUiAutomation().grantRuntimePermission(context.getPackageName(), Manifest.permission.POST_NOTIFICATIONS);
        try (ActivityScenario<MainActivity> app = ActivityScenario.launch(MainActivity.class)) {
            waitFor(app, "!!window.Capacitor?.Plugins?.LocalNotifications && !!document.querySelector('#root > *')");
            js(app, "(()=>{window.novaDeviceReminderReady=false; const plugin=window.Capacitor.Plugins.LocalNotifications; plugin.createChannel({id:'nova-reminders',name:'Nova hatırlatmaları',importance:3}).then(()=>plugin.cancel({notifications:[62001,62002,62003,62004,62005].map(id=>({id}))})).then(()=>plugin.schedule({notifications:[{id:62001,title:'Bir fikrin mi var?',body:'Nova ile iki dakikada netleştir.',schedule:{on:{weekday:3,hour:18,minute:0},allowWhileIdle:true},channelId:'nova-reminders',extra:{destination:'chat',source:'usage-reminder'}},{id:62002,title:'Haftana küçük bir adım ekle',body:'Aklındaki soruyu veya yeni hedefini Nova’ya yaz.',schedule:{on:{weekday:7,hour:12,minute:0},allowWhileIdle:true},channelId:'nova-reminders',extra:{destination:'chat',source:'usage-reminder'}},{id:62005,title:'Nova bildirimleri hazır',body:'Hatırlatmalar açık.',schedule:{at:new Date(Date.now()+5000),allowWhileIdle:true},channelId:'nova-reminders',extra:{destination:'chat',source:'usage-reminder-test'}}]})).then(()=>{localStorage.setItem('nova-ai-reminders-enabled','true');localStorage.setItem('nova-ai-reminders-prompted','true');localStorage.setItem('nova-ai-reminders-plan','weekly-v2');window.novaDeviceReminderReady=true;}); return true;})()");
            waitFor(app, "window.novaDeviceReminderReady === true");
            com.capacitorjs.plugins.localnotifications.NotificationStorage storage = new com.capacitorjs.plugins.localnotifications.NotificationStorage(context);
            assertTrue(storage.getSavedNotificationIds().contains("62001"));
            assertTrue(storage.getSavedNotificationIds().contains("62002"));
            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            boolean delivered = false;
            long until = System.currentTimeMillis() + 20000;
            do {
                for (android.service.notification.StatusBarNotification item : manager.getActiveNotifications()) if (item.getId() == 62005) delivered = true;
                if (delivered) break;
                Thread.sleep(250);
            } while (System.currentTimeMillis() < until);
            assertTrue("Requested notification delivered", delivered);
        }
    }
}
