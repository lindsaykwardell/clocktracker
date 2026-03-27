package app.clocktracker.mobile;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.View;
import android.widget.RemoteViews;

public class RolesWidgetProvider extends AppWidgetProvider {

    private static final String PREFS_NAME = "CapacitorStorage";

    private static final int[] ROLE_TEXT_IDS = {
        R.id.widget_role_1,
        R.id.widget_role_2,
        R.id.widget_role_3,
        R.id.widget_role_4,
        R.id.widget_role_5,
    };

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_roles);

            for (int i = 0; i < ROLE_TEXT_IDS.length; i++) {
                String entry = prefs.getString("widget_role_" + i, "");
                if (entry != null && !entry.isEmpty()) {
                    views.setTextViewText(ROLE_TEXT_IDS[i], entry);
                    views.setViewVisibility(ROLE_TEXT_IDS[i], View.VISIBLE);
                } else {
                    views.setViewVisibility(ROLE_TEXT_IDS[i], View.GONE);
                }
            }

            // Tap widget to open the app
            Intent intent = new Intent(context, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                context, 2, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }
}
