var HIDDEN_ROLES = ['system', 'keyboard', 'homescreen', 'input', 'search'];

navigator.mozApps.mgmt.getAll().onsuccess = function(ev) {
  ev.target.result.filter(function(app) { return HIDDEN_ROLES.indexOf(app.manifest.role)===-1; }).forEach(function(app) {
    if(app.manifest.entry_points)
    {
      var entryPointNames = Object.keys(app.manifest.entry_points);
      for(var i = 0; i < entryPointNames.length; i++)
      {
        if(app.manifest.entry_points[entryPointNames[i]].icons)
        {
          Layout.addOrAssignApp(app, entryPointNames[i]);
        }
      }
    }
    else
    {
      Layout.addOrAssignApp(app, null);
    }
  });
  Layout.addNewApps();
  Layout.writeData();
}
