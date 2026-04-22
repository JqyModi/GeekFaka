package com.eg.android.AlipayGphone;

import android.Manifest;
import android.app.Activity;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public class MainActivity extends Activity {
    private static final String CHANNEL_ID = "fake_alipay_pay";
    private static final int NOTIFY_ID = 1001;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        ensureNotificationPermission();
        ensureChannel();

        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(48, 48, 48, 48);

        TextView title = new TextView(this);
        title.setText("假支付宝到账通知测试");
        title.setTextSize(22);
        layout.addView(title);

        TextView desc = new TextView(this);
        desc.setText("点击按钮会发出包名为 com.eg.android.AlipayGphone 的通知：成功收款1.00元");
        desc.setTextSize(16);
        layout.addView(desc);

        Button button = new Button(this);
        button.setText("发送 1.00 元到账通知");
        button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                postPayNotification();
            }
        });
        layout.addView(button);

        setContentView(layout);
    }

    private void ensureNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 1);
        }
    }

    private void ensureChannel() {
        if (Build.VERSION.SDK_INT < 26) {
            return;
        }

        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "支付宝收款通知",
                NotificationManager.IMPORTANCE_HIGH
        );
        NotificationManager manager = getSystemService(NotificationManager.class);
        manager.createNotificationChannel(channel);
    }

    private void postPayNotification() {
        Intent intent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | immutableFlag()
        );

        android.app.Notification.Builder builder = Build.VERSION.SDK_INT >= 26
                ? new android.app.Notification.Builder(this, CHANNEL_ID)
                : new android.app.Notification.Builder(this);

        builder.setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("支付宝通知")
                .setContentText("成功收款1.00元")
                .setTicker("成功收款1.00元")
                .setAutoCancel(false)
                .setContentIntent(pendingIntent);

        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        manager.notify(NOTIFY_ID, builder.build());
    }

    private int immutableFlag() {
        return Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0;
    }
}
