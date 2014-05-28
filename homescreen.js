var TILES_X = 4;
var TILES_Y = 4;
var HOTBAR_APPS = [
  ["app://communications.gaiamobile.org", "dialer"],
  ["app://sms.gaiamobile.org", null],
  ["app://communications.gaiamobile.org", "contacts"],
  ["app://browser.gaiamobile.org", null]
];

function HotBar(width) {
  var self = this;
  this.width = width;
  this.tiles = [];
  for(var i=0;i<width;i++) { this.tiles.push(null); }
  this.node = document.querySelector('#hotbar');
  this.tileNodes = this.tiles.map(function(val, index) {
    console.log("Tile ",index);
    var node = document.createElement("div");
    node.classList.add("tileContainer");
    return node;
  });
  this.tileNodes.forEach(function(node) {
    self.node.appendChild(node);
  });
  return this;
}
HotBar.prototype = {
  tilesToJSON: function() {
    return JSON.stringify(this.tiles.map(function(tile) {
      if(tile) {
        return tile.serialize();
      } else {
        return tile;
      }
    }));
  },
  isEmpty: function(x) {
    return typeof this.tiles[x] === "undefined";
  },
  findApp: function(appOrigin, entryPoint) {
    for(var i=0;i<this.tiles.length;i++)
    {
      if(this.tiles[i].appOrigin == appOrigin && this.tiles[i].entryPoint == entryPoint) {
        return this.tiles[i];
      }
    }
    return null;
  },
  hasApp: function(appOrigin, entryPoint) {
    return this.tiles.some(function(tile) { return tile !== null && tile.appOrigin === appOrigin && tile.entryPoint === entryPoint });
  },
  hasSpace: function() {
    return this.tiles.some(function(tile) { return tile === null; });
  },
  placeApp: function(appIcon, index) {
    this.tiles[index] = appIcon;
    this.tileNodes[index].appendChild(appIcon.node);
    appIcon.rebindEvents();
  },
  addApp: function(appIcon) {
    for(var i = 0; i < this.tiles.length; i++)
    {
      if(this.tiles[i] == null)
      {
        this.placeApp(appIcon, i);
        return;
      }
    }
  }
};

function HomeScreen(width, height) {
  var self = this;
  this.width = width;
  this.height = height;
  this.tiles = Array(width * height);
  this.tileNodes = Array(width * height);
  this.emptyTiles = [];
  for(var i=0;i<width*height;i++) { this.emptyTiles.push(true); }
  this.emptyTileNodes = this.emptyTiles.map(function(_, index) {
    var x = index % self.width;
    var y = (index - x) / self.width;
    var node = document.createElement('div');
    node.classList.add('empty-tile');
    node.style.width = "calc(100% / "+self.width+")";
    node.style.height = "calc(100% / "+self.height+")";
    node.style.top = "calc(100% * "+y+"/"+self.height+")";
    node.style.left = "calc(100% * "+x+"/"+self.width+")";
    return node;
  });
  this.node = document.createElement('div');
  this.node.classList.add('homescreen');
  this.emptyTileNodes.forEach(function(emptyTileNode) {
    this.node.appendChild(emptyTileNode);
  }, this);
  return this;
}

HomeScreen.prototype = {
  tilesToJSON: function() {
    return this.tiles.map(function(tile, index) {
      return { index: index, tile: tile.serialize(), tileType: tile.type };
    });
  },
  tilesFromJSON: function(jsonObject) {
    jsonObject.forEach(function(tileData) {
      if(tileData === null) return;
      var x = tileData.index % this.width;
      var y = (tileData.index - x) / this.width;
      var tile = window[tileData.tileType].deserialize.apply(null, tileData.tile);
      this.placeTile(tile, x, y);
    }, this);
  },
  findAppTile: function(appOrigin, entryPoint) {
    for(var i=0;i<this.tiles.length;i++) {
      if(this.tiles[i] && this.tiles[i].appOrigin == appOrigin && this.tiles[i].entryPoint == entryPoint) {
        return this.tiles[i];
      }
    }
    return null;
  },
  findSpace: function(width, height) {
    var maxX = this.width - width;
    var maxY = this.height - height;
    for(var y = 0; y <= maxY; y++) {
      for(var x = 0; x <= maxX; x++) {
        if(width === 1 && height === 1) {
          if(this.isEmptyTile(x, y)) return [x, y];
        } else {
          var allEmpty = true;
          for(var xx = 0; xx < width; xx++) {
            for(var yy = 0; yy < height; yy++) {
              if(!this.isEmptyTile(x+xx, y+yy)) {
                allEmpty = false;
              }
            }
          }
          if(allEmpty) return [x, y];
        }
      }
    }
    return null;
  },
  isEmptyTile: function(x, y) {
    return this.emptyTiles[y * this.width + x];
  },
  hasSpace: function(width, height) {
    return this.findSpace(width, height) !== null;
  },
  placeTile: function(tileBlock, x, y) {
    var index = y * this.width + x;
    var tileNode = this.createTileNode(x, y, tileBlock.width, tileBlock.height);
    this.tiles[index] = tileBlock;
    this.tileNodes[index] = tileNode;
    tileNode.appendChild(tileBlock.node);
    tileBlock.rebindEvents();
    this.node.appendChild(tileNode);
    for(var xx=0;xx<tileBlock.width;xx++)
    {
      for(var yy=0;yy<tileBlock.height;yy++)
      {
        this.emptyTiles[(y+yy) * this.width + x + xx] = false;
      }
    }
  },
  createTileNode: function(x, y, width, height) {
    var node = document.createElement('div');
    node.classList.add('tileContainer');
    node.style.width = "calc(100% * "+width+" / "+this.width+")";
    node.style.height = "calc(100% * "+height+" / "+this.height+")";
    node.style.top = "calc(100% * "+y+"/"+this.height+")";
    node.style.left = "calc(100% * "+x+"/"+this.width+")";
    return node;
  }
};


var Layout = {
  homescreens: [],
  homescreensNode: document.querySelector('#homescreensWrapper'),
  homescreensScroller: document.querySelector('#homescreensScroller'),
  hotbar: null,
  newApps: []
};

Layout.writeData = function() {
  localStorage.setItem('tilesX', this.tilesX);
  localStorage.setItem('tilesY', this.tilesY);
  localStorage.setItem('hotbar', this.hotbar.tilesToJSON());
  localStorage.setItem('homescreens', JSON.stringify(this.homescreens.map(function(homescreen) { return homescreen.tilesToJSON(); })));
  localStorage.setItem('inited', true);
};
Layout.initHotBar = function() {
  this.hotbar = new HotBar(this.tilesX);
  this.homescreensNode.style.flex = this.tilesY;
};
Layout.newData = function() {
  this.tilesX = TILES_X;
  this.tilesY = TILES_Y;
  this.initHotBar();
  if(Layout.homescreens.length == 0)
  {
    Layout.addNewHomeScreen();
  }
  this.writeData();
};
Layout.readData = function() {
  if(!localStorage.getItem('inited'))
  {
    this.newData();
    return;
  }
  this.tilesX = ~~localStorage.getItem('tilesX');
  this.tilesY = ~~localStorage.getItem('tilesY');
  this.initHotBar();
  var hotbar = localStorage.getItem('hotbar');
  if(hotbar)
  {
    hotbar = JSON.parse(hotbar);
    hotbar.forEach(function(tile, index) {
      if(tile)
      {
        appIcon = new AppIcon(tile[0], tile[1], tile[2], tile[3]);
        this.hotbar.placeApp(appIcon, index);
      }
    }, this);
  }
  var homescreens = localStorage.getItem('homescreens');
  if(homescreens) {
    homescreens = JSON.parse(homescreens);
    console.log(homescreens);
    homescreens.forEach(function(homescreenData) {
      homescreen = new HomeScreen(this.tilesX, this.tilesY);
      homescreen.tilesFromJSON(homescreenData);
      this.addHomeScreen(homescreen);
    }, this);
  }
  if(Layout.homescreens.length == 0)
  {
    Layout.addNewHomeScreen();
  }
};

Layout.addOrAssignApp = function(app, entryPoint) {
  var appIcon = null;
  if(appIcon = this.hotbar.findApp(app.origin, entryPoint))
  {
    appIcon.setApp(app);
    console.log("App found");
    return;
  }
  for(var i = 0; i < this.homescreens.length; i++)
  {
    if(appIcon = this.homescreens[i].findAppTile(app.origin, entryPoint)) {
      appIcon.setApp(app);
      console.log("App found");
      return;
    }
  }
  console.log("Adding app", app.origin, entryPoint);
  this.newApps.push([app, entryPoint]);
}
Layout.addApp = function(app, entryPoint, try_hotbar) {
  var appIcon = new AppIcon(app.origin, entryPoint);
  appIcon.setApp(app);
  if(try_hotbar)
  {
    if(this.hotbar.hasSpace())
    {
      this.hotbar.addApp(appIcon);
      return;
    }
  }
  var emptySpace;
  for(var i = 0; i < this.homescreens.length; i++)
  {
    if((emptySpace = this.homescreens[i].findSpace(1, 1)) !== null) {
      console.log("Found space on homescreen");
      this.homescreens[i].placeTile(appIcon, emptySpace[0], emptySpace[1]);
      return;
    }
  }
  var homescreen = this.addNewHomeScreen();
  emptySpace = homescreen.findSpace(1,1);
  homescreen.placeTile(appIcon, emptySpace[0], emptySpace[1]);

}
Layout.addNewApps = function() {
  HOTBAR_APPS.forEach(function(desc) {
    var index = -1;
    for(var i = 0; i < this.newApps.length; i++) {
      if(this.newApps[i][0].origin == desc[0] && this.newApps[i][1] == desc[1]) {
        index = i;
        break;
      }
    }
    if(index >= 0)
    {
      var appDesc = this.newApps.splice(i,1)[0];
      this.addApp(appDesc[0], appDesc[1], true);
    }
  }, this);
  this.newApps.forEach(function(appDesc) {
    this.addApp(appDesc[0], appDesc[1], false);
  }, this);
}

Layout.addHomeScreen = function(homescreen) {
  var containerNode = document.createElement('div');
  containerNode.appendChild(homescreen.node);
  containerNode.classList.add('homescreenContainer');
  containerNode.style.left = (100 * this.homescreens.length) + "%";
  this.homescreens.push(homescreen);
  this.homescreensNode.appendChild(containerNode);
  return homescreen;
}

Layout.addNewHomeScreen = function() {
  var homescreen = new HomeScreen(this.tilesX, this.tilesY);
  return this.addHomeScreen(homescreen);
}

Layout.readData();

var movingHomeScreen = false;
var currentTouch = null;
var currentScreen = 0;

Layout.gotoHomeScreen = function(index) {
  if(index < 0) index = 0;
  if(index >= this.homescreens.length) index = this.homescreens.length - 1;
  var translateX = -Layout.homescreensScroller.clientWidth * index;
  Layout.homescreensScroller.style.transform = "translateX("+translateX+"px)";
  currentScreen = index;
}

Layout.homescreensNode.ontouchstart = function(e) {
  currentTouch = e.touches[0];
}
Layout.homescreensNode.ontouchmove = function(e) {
  var newTouch = e.touches[0];
  if(movingHomeScreen) {
    console.log("WTF");
    Layout.homescreensScroller.style.transform = "translateX(" + (newTouch.pageX - currentTouch.pageX) + "px)";
  } else {
    var xDiff = Math.abs(newTouch.pageX - currentTouch.pageX);
    var yDiff = Math.abs(newTouch.pageY - currentTouch.pageY);
    if(xDiff > 2 || yDiff > 2) {
      Layout.homescreensScroller.style.transitionDuration = "0s";
      movingHomeScreen = true;
    }
  }
}

Layout.homescreensNode.ontouchend = function(e) {
  if(movingHomeScreen) {
    e.preventDefault();
    Layout.homescreensScroller.style.transitionDuration = "";
    var newTouch = e.touches[0];
    if((newTouch.pageX - currentTouch.pageX)*2 >= Layout.homescreensScroller.clientWidth) {
      Layout.gotoHomeScreen(currentScreen - 1);
    } else if((currentTouch.pageX - newTouch.pageX)*2 >= Layout.homescreensScroller.clientWidth) {
      Layout.gotoHomeScreen(currentScreen + 1);
    } else {
      Layout.gotoHomeScreen(currentScreen);
    }
    movingHomeScreen = false;
  }
}
