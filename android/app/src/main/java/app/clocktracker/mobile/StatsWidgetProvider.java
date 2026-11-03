package app.clocktracker.mobile;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.widget.RemoteViews;

public class StatsWidgetProvider extends AppWidgetProvider {

    private static final String PREFS_NAME = "CapacitorStorage";
    private static final int COLOR_UP = Color.parseColor("#22C55E");   // green-500
    private static final int COLOR_DOWN = Color.parseColor("#E11D48"); // rose-600
    private static final int COLOR_FLAT = Color.parseColor("#D97706"); // amber-600

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        String totalGames = prefs.getString("widget_total_games", "0");
        String totalRoles = prefs.getString("widget_total_roles", "0");
        String totalScripts = prefs.getString("widget_total_scripts", "0");
        String winRate = prefs.getString("widget_win_rate", "0");

        String trendGames = prefs.getString("widget_trend_games", "");
        String trendRoles = prefs.getString("widget_trend_roles", "");
        String trendScripts = prefs.getString("widget_trend_scripts", "");
        String trendWinRate = prefs.getString("widget_trend_win_rate", "");

        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_stats);

            views.setTextViewText(R.id.widget_games_count, totalGames);
            views.setTextViewText(R.id.widget_roles_count, totalRoles);
            views.setTextViewText(R.id.widget_scripts_count, totalScripts);
            views.setTextViewText(R.id.widget_win_rate, winRate + "%");

            setTrend(views, R.id.widget_trend_games, trendGames);
            setTrend(views, R.id.widget_trend_roles, trendRoles);
            setTrend(views, R.id.widget_trend_scripts, trendScripts);
            setTrend(views, R.id.widget_trend_win_rate, trendWinRate);

            // Tap widget to open the app
            Intent intent = new Intent(context, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }

    private void setTrend(RemoteViews views, int viewId, String trend) {
        if (trend == null || trend.isEmpty()) {
            views.setTextViewText(viewId, "-");
            views.setTextColor(viewId, COLOR_FLAT);
        } else if (trend.startsWith("+")) {
            views.setTextViewText(viewId, trend);
            views.setTextColor(viewId, COLOR_UP);
        } else if (trend.startsWith("-")) {
            views.setTextViewText(viewId, trend);
            views.setTextColor(viewId, COLOR_DOWN);
        } else {
            views.setTextViewText(viewId, trend);
            views.setTextColor(viewId, COLOR_FLAT);
        }
    }
}
