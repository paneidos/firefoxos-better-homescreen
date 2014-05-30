class Block
  constructor: (@width,@height)->

class AppIcon extends Block
  constructor: (@appOrigin, @entryPoint, @appName, @appIcon)->
    @node = document.createElement("div")
    @node.classList.add "tile", "app-tile"
    imageContainerNode = document.createElement("div")
    imageContainerNode.classList.add 'app-image'
    nameContainerNode = document.createElement("div")
    nameContainerNode.classList.add 'app-name'
    @imageNode = new Image()
    @nameNode = document.createElement("span")
    imageContainerNode.appendChild(@imageNode)
    nameContainerNode.appendChild(@nameNode)
    @node.appendChild(nameContainerNode)
    @node.appendChild(imageContainerNode)
    @imageNode.src = @appIcon if @appIcon
    @nameNode.textContent = @appName if @appName
  type: "AppIcon"
  width: 1
  height: 1
  serialize: ->
    [@appOrigin, @entryPoint, @appName, @appIcon]
  rebindEvents: ->
    @node.onclick = =>
      @launch()
  launch: ->
    if @app
      if @entryPoint != null
        @app.launch(@entryPoint)
      else
        @app.launch()
    else
      alert("This App is no longer available.")
  setApp: (app)->
    @app = app;
    if @entryPoint
      appEntryPoint = app.manifest.entry_points[@entryPoint];
      @appName = appEntryPoint.name
      @appIcon = app.origin + @largestIcon(appEntryPoint.icons)
    else
      @appName = app.manifest.name;
      @appIcon = app.origin + @largestIcon(app.manifest.icons)
    @nameNode.textContent = @appName
    @imageNode.src = @appIcon
    @
  largestIcon: (icons)->
    icons[Math.max.apply(Math, Object.keys(icons).map(Number))]

AppIcon.deserialize = (appOrigin, entryPoint, appName, appIcon)->
  new AppIcon(appOrigin, entryPoint, appName, appIcon)

class DemoWidget extends Block
  constructor: ->
    @node = document.createElement("div")
    @node.classList.add 'animation'
  type: "DemoWidget"
  width: 3
  height: 1
  rebindEvents: ->
    @node.onclick = ->
      alert("You clicked the widget")
  serialize: ->
    {}

DemoWidget.deserialize = ->
  new DemoWidget()

@DemoWidget = DemoWidget
@AppIcon = AppIcon
