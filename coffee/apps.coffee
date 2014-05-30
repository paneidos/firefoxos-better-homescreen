console.log "Read"
HIDDEN_ROLES = ['system', 'keyboard', 'homescreen', 'input', 'search']

currentLayout = new Layout()
@currentLayout = currentLayout
currentLayout.init()
console.log "Y"
loader = navigator.mozApps.mgmt.getAll()


console.log loader

loader.onsuccess = (ev)->
  console.log "EV"
  ev.target.result.filter (app)->
    HIDDEN_ROLES.indexOf(app.manifest.role) == -1
  .forEach (app)->
    if app.manifest.entry_points
      entryPointNames = Object.keys(app.manifest.entry_points)
      for entryPointName in entryPointNames
        if app.manifest.entry_points[entryPointName].icons
          currentLayout.addOrAssignApp(app, entryPointName)
    else
      currentLayout.addOrAssignApp(app, null)
  currentLayout.addNewApps()
  currentLayout.writeData()


console.log "Done"
