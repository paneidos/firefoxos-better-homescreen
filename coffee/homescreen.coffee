console.log "Load HomeScreen"
TILES_X = 4
TILES_Y = 4
HOTBAR_APPS = [
  ["app://communications.gaiamobile.org", "dialer"],
  ["app://sms.gaiamobile.org", null],
  ["app://communications.gaiamobile.org", "contacts"],
  ["app://browser.gaiamobile.org", null]
]

global = @

class HotBar
  constructor: (@width)->
    console.log("Init HotBar")
    @tiles = []
    i = 0
    while i < @width
      @tiles.push(null)
      i += 1
    console.log @tiles
    @node = document.querySelector('#hotbar')
    @tileNodes = @tiles.map (val, index)->
      console.log("Tile ",index)
      node = document.createElement("div")
      node.classList.add("tileContainer")
      node
    @tileNodes.forEach (node)->
      @node.appendChild(node)
    , @
  tilesToJSON: ->
    JSON.stringify(@tiles.map (tile)->
      if tile
        tile.serialize()
      else
        tile
    )
  isEmpty: (x)->
    !@tiles[x]
  findApp: (appOrigin, entryPoint)->
    for tile in @tiles
      if tile != null && tile.appOrigin == appOrigin && tile.entryPoint == entryPoint
        return tile
    null
  hasApp: (appOrigin, entryPoint)->
    @tiles.some (tile)->
      tile != null && tile.appOrigin == appOrigin && tile.entryPoint == entryPoint
  hasSpace: ->
    @tiles.some (tile)->
      tile == null
  placeApp: (appIcon, index)->
    console.log "X"
    @tiles[index] = appIcon
    @tileNodes[index].appendChild(appIcon.node)
    appIcon.rebindEvents()
  addApp: (appIcon)->
    for tile, i in @tiles
      if tile == null
        @placeApp appIcon, i
        return

class HomeScreen
  constructor: (@width, @height)->
    self = this;
    @tiles = Array(width * height)
    @tileNodes = Array(width * height)
    @emptyTiles = [true for i in 0..(width*height)]
    @emptyTileNodes = @emptyTiles.map (_, index)->
      x = index % @width
      y = (index - x) / @width
      node = document.createElement('div')
      node.classList.add 'empty-tile'
      node.style.width = "calc(100% / "+@width+")";
      node.style.height = "calc(100% / "+@height+")";
      node.style.top = "calc(100% * "+y+"/"+@height+")";
      node.style.left = "calc(100% * "+x+"/"+@width+")";
      node
    , @
    @node = document.createElement('div');
    @node.classList.add 'homescreen'
    @emptyTileNodes.forEach (emptyTileNode)->
      @node.appendChild(emptyTileNode)
    , @
  tilesToJSON: ->
    @tiles.map (tile, index)->
      x = index % @width;
      y = (index - x) / @width;
      { x: x, y: y, tile: tile.serialize(), tileType: tile.type }
    , @
  tilesFromJSON: (jsonObject)->
    jsonObject.forEach (tileData)->
      return if tileData == null
      x = tileData.x;
      y = tileData.y;
      tile = global[tileData.tileType].deserialize.apply null, tileData.tile
      @placeTile tile, x, y
    , @
  findAppTile: (appOrigin, entryPoint)->
    for tile in @tiles
      return tile if tile && tile.appOrigin == appOrigin && tile.entryPoint == entryPoint
    null
  findSpace: (width, height)->
    maxX = @width - width
    maxY = @height - height
    for y in [0..maxY]
      for x in [0..maxX]
        if width == 1 && height == 1
          return [x, y] if @isEmptyTile(x, y)
        else
          allEmpty = true
          for xx in [0...width]
            for yy in [0...height]
              allEmpty = false unless @isEmptyTile(x+xx, y+yy)
          return [x, y] if allEmpty
    null
  isEmptyTile: (x, y)->
    @emptyTiles[y * @width + x]
  hasSpace: (width, height)->
    @findSpace(width, height) != null
  placeTile: (tileBlock, x, y)->
    index = y * @width + x;
    tileNode = @createTileNode(x, y, tileBlock.width, tileBlock.height);
    @tiles[index] = tileBlock
    @tileNodes[index] = tileNode
    tileNode.appendChild(tileBlock.node)
    tileBlock.rebindEvents()
    @node.appendChild(tileNode)
    for xx in [0...(tileBlock.width)]
      for yy in [0...(tileBlock.height)]
        @emptyTiles[(y+yy) * @width + x + xx] = false
    tileBlock
  createTileNode: (x, y, width, height)->
    node = document.createElement('div')
    node.classList.add 'tileContainer'
    node.style.width = "calc(100% * "+width+" / "+@width+")"
    node.style.height = "calc(100% * "+height+" / "+@height+")"
    node.style.top = "calc(100% * "+y+"/"+@height+")"
    node.style.left = "calc(100% * "+x+"/"+@width+")"
    node

class Layout
  constructor: ->
    @homescreens = []
    @homescreensNode = document.querySelector('#homescreensWrapper')
    @homescreensScroller = document.querySelector('#homescreensScroller')
    @hotbar = null
    @newApps = []
  writeData: ->
    localStorage.setItem('tilesX', @tilesX)
    localStorage.setItem('tilesY', @tilesY)
    localStorage.setItem('hotbar', @hotbar.tilesToJSON())
    localStorage.setItem('homescreens', JSON.stringify(@homescreens.map (homescreen)->
      homescreen.tilesToJSON()
    ))
    localStorage.setItem('inited', true)
  resetData: ->
    localStorage.removeItem('tilesX')
    localStorage.removeItem('tilesY')
    localStorage.removeItem('hotbar')
    localStorage.removeItem('homescreens')
    localStorage.removeItem('inited')
  initHotBar: ->
    console.log "Init HotBar Layout"
    @hotbar = new HotBar(@tilesX)
    @homescreensNode.style.flex = @tilesY
  newData: ->
    @tilesX = TILES_X
    @tilesY = TILES_Y
    @initHotBar()
    if @homescreens.length == 0
      @addNewHomeScreen()
    @writeData()
  readData: ->
    unless localStorage.getItem('inited')
      @newData()
      return
    @tilesX = ~~localStorage.getItem('tilesX')
    @tilesY = ~~localStorage.getItem('tilesY')
    @initHotBar()
    if hotbar = localStorage.getItem('hotbar')
      hotbar = JSON.parse(hotbar)
      console.log "HotBar should be done"
      hotbar.forEach (tile, index)->
        if tile
          appIcon = new AppIcon(tile[0], tile[1], tile[2], tile[3])
          @hotbar.placeApp(appIcon, index)
      , @
    homescreens = localStorage.getItem('homescreens')
    if homescreens
      homescreens = JSON.parse(homescreens)
      homescreens.forEach (homescreenData)->
        homescreen = new HomeScreen(@tilesX, @tilesY)
        homescreen.tilesFromJSON(homescreenData)
        @addHomeScreen(homescreen)
      , @
    @addNewHomeScreen() if @homescreens.length == 0
  addOrAssignApp: (app, entryPoint)->
    appIcon = null
    if appIcon = @hotbar.findApp(app.origin, entryPoint)
      appIcon.setApp(app)
      return
    for homescreen in @homescreens
      if appIcon = homescreen.findAppTile(app.origin, entryPoint)
        appIcon.setApp(app)
        return
    @newApps.push([app, entryPoint])
  addApp: (app, entryPoint, try_hotbar)->
    appIcon = new AppIcon(app.origin, entryPoint)
    appIcon.setApp(app)
    if try_hotbar
      if @hotbar.hasSpace()
        @hotbar.addApp(appIcon)
        return
    emptySpace = null
    for homescreen in @homescreens
      if emptySpace = homescreen.findSpace(1, 1)
        homescreen.placeTile(appIcon, emptySpace[0], emptySpace[1])
        return
    homescreen = @addNewHomeScreen()
    emptySpace = homescreen.findSpace(1,1)
    homescreen.placeTile(appIcon, emptySpace[0], emptySpace[1])
  addNewApps: ->
    HOTBAR_APPS.forEach (desc)->
      index = -1
      for newApp,i in @newApps
        if newApp[0].origin == desc[0] && newApp[1] == desc[1]
          index = i
          break
      if index >= 0
        appDesc = @newApps.splice(i,1)[0]
        @addApp(appDesc[0], appDesc[1], true)
    , @
    @newApps.forEach (appDesc)->
      @addApp(appDesc[0], appDesc[1], false)
    , @
  addHomeScreen: (homescreen)->
    containerNode = document.createElement('div')
    containerNode.appendChild(homescreen.node)
    containerNode.classList.add('homescreenContainer')
    containerNode.style.left = (100 * @homescreens.length) + "%"
    @homescreens.push(homescreen)
    @homescreensNode.appendChild(containerNode)
    homescreen
  addNewHomeScreen: ->
    @addHomeScreen(new HomeScreen(@tilesX, @tilesY))
  gotoHomeScreen: (index)->
    index = 0 if index < 0
    index = @homescreens.length - 1 if index >= @homescreens.length
    translateX = -@homescreensScroller.clientWidth * index
    @homescreensScroller.style.transform = "translateX("+translateX+"px)"
    @currentScreen = index
  init: ->
    @movingHomeScreen = no
    @currentTouch = null
    @currentScreen = 0
    @readData()
    @bindEvents()
  bindEvents: ->
    swipeNode = @homescreensNode
    swipeNode.ontouchstart = (e)=>
      @currentTouch = e.touches[0]
    swipeNode.ontouchmove = (e)=>
      newTouch = e.touches[0]
      if @movingHomeScreen
        @homescreensScroller.style.transform = "translateX(" + (newTouch.pageX - @currentTouch.pageX) + "px)"
      else
        xDiff = Math.abs(newTouch.pageX - @currentTouch.pageX)
        yDiff = Math.abs(newTouch.pageY - @currentTouch.pageY)
        if xDiff > 2 || yDiff > 2
          @homescreensScroller.style.transitionDuration = "0s"
          @movingHomeScreen = yes
    swipeNode.ontouchend = (e)=>
      if @movingHomeScreen
        e.preventDefault()
        @homescreensScroller.style.transitionDuration = ""
        newTouch = e.touches[0]
        if (newTouch.pageX - @currentTouch.pageX)*2 >= @homescreensScroller.clientWidth
          @gotoHomeScreen(@currentScreen - 1)
        else if (@currentTouch.pageX - newTouch.pageX)*2 >= @homescreensScroller.clientWidth
          @gotoHomeScreen(@currentScreen + 1)
        else
          @gotoHomeScreen(@currentScreen)
        @movingHomeScreen = no

@Layout = Layout
