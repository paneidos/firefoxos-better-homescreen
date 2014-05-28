function Block(width, height) {
  this.width = width;
  this.height = height;
  return this;
}
function AppIcon(appOrigin, entryPoint, appName, appIcon) {
  this.type = "AppIcon";
  this.appOrigin = appOrigin;
  this.entryPoint = entryPoint;
  this.appName = appName;
  this.appIcon = appIcon;
  this.width = 1;
  this.height = 1;
  this.node = document.createElement("div");
  this.node.classList.add("tile");
  this.node.classList.add("app-tile");
  var imageContainerNode = document.createElement("div");
  imageContainerNode.classList.add('app-image');
  var nameContainerNode = document.createElement("div");
  nameContainerNode.classList.add('app-name');
  this.imageNode = new Image(); //document.createElement("img");
  this.nameNode = document.createElement("span");
  imageContainerNode.appendChild(this.imageNode);
  nameContainerNode.appendChild(this.nameNode);
  this.node.appendChild(nameContainerNode);
  this.node.appendChild(imageContainerNode);
  if(this.appIcon) { this.imageNode.src = this.appIcon; }
  if(this.appName) { this.nameNode.textContent = this.appName; }
  return this;
}

function valueOfLargestKey(object) {
  return object[Math.max.apply(Math, Object.keys(object).map(function(x) { return ~~x; }))]
}
AppIcon.deserialize = function(appOrigin, entryPoint, appName, appIcon) {
  return new AppIcon(appOrigin, entryPoint, appName, appIcon);
}
AppIcon.prototype = {

  serialize: function() {
    return [this.appOrigin, this.entryPoint, this.appName, this.appIcon];
  },
  rebindEvents: function() {
    var self = this;
    this.node.onclick = function() { self.launch(); };
  },
  launch: function() {
    if(this.app)
    {
      if(this.entryPoint !== null)
      {
        this.app.launch(this.entryPoint);
      }
      else
      {
        this.app.launch();
      }
    }
    else
    {
      alert("This App is no longer available.");
    }
  },
  setApp: function(app) {
    this.app = app;
    if(this.entryPoint) {
      var appEntryPoint = app.manifest.entry_points[this.entryPoint];
      this.appName = appEntryPoint.name;
      this.appIcon = app.origin + valueOfLargestKey(appEntryPoint.icons);
    }
    else
    {
      this.appName = app.manifest.name;
      this.appIcon = app.origin + valueOfLargestKey(app.manifest.icons);
    }
    this.nameNode.textContent = this.appName;
    this.imageNode.src = this.appIcon;
  }
};

function DemoWidget() {
  this.node = document.createElement("div");
  this.node.classList.add('animation');
  this.width = 3;
  this.height = 1;
  this.type = "DemoWidget";
}
DemoWidget.prototype = {
  rebindEvents: function() {
    this.node.onclick = function() {
      alert("You clicked the widget");
    }
  },
  serialize: function() {
    return {};
  },
  deserialize: function() {
    return DemoWidget;
  }
}
DemoWidget.deserialize = function() {
  return new DemoWidget();
}
