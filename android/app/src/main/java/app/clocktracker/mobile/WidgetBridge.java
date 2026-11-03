package app.clocktracker.mobile;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Intent;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridge extends Plugin {

    @PluginMethod()
    public void refreshWidgets(PluginCall call) {
        android.content.Context context = getContext();
        AppWidgetManager manager = AppWidgetManager.getInstance(context);

        refreshProvider(context, manager, StatsWidgetProvider.class);
        refreshProvider(context, manager, ScriptsWidgetProvider.class);
        refreshProvider(context, manager, RolesWidgetProvider.class);

        call.resolve();
    }

    private void refreshProvider(android.content.Context context, AppWidgetManager manager, Class<?> providerClass) {
        ComponentName component = new ComponentName(context, providerClass);
        int[] ids = manager.getAppWidgetIds(component);
        if (ids.length > 0) {
            Intent intent = new Intent(context, providerClass);
            intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
            context.sendBroadcast(intent);
        }
    }
}
