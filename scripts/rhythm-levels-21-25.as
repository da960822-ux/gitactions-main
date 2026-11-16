var patchTimer = setInterval(function() {
  var data = _global.framework.GameData.prototype;
  var logic = _global.framework.GameLogic.prototype;
  var sound = _global.SoundData.prototype;
  var arrows = _global.ArrowKeyCon.prototype;
  if (data.LevelData == undefined || data.KeyMap20 == undefined || logic.levelClear == undefined || sound.dataList == undefined || arrows.makeRightList == undefined) return;
  clearInterval(patchTimer);
  if (data.KeyMap25 != undefined) return;
  var seconds = [35000,33000,32000,31000,30000];
  var endCounts = [15,16,17,18,20];
  for (var n = 0; n < 5; n++) {
    data.LevelData.push({star:5,time:seconds[n],endCount:endCounts[n],item:[5,6]});
    var map = [];
    for (var i = 0; i < data.KeyMap20.length; i++) {
      var k = data.KeyMap20[i];
      var x = k._x;
      var y = k._y;
      if (n == 1 || n == 3) x = 550 - x;
      if (n == 2 || n == 3) y = 400 - y;
      if (i >= data.KeyMap20.length - 2) { x = k._x; y = k._y; }
      map.push({num:k.num,_kind:k._kind,_x:x,_y:y});
    }
    data["KeyMap" + (21+n)] = map;
  }
  logic.lastLevel = 25;
  var originalDataList = sound.dataList;
  sound.dataList = function() {
    originalDataList.call(this);
    for (var n = 21; n <= 25; n++) this["level" + n] = this.level20;
  };
  var originalMakeRightList = arrows.makeRightList;
  arrows.makeRightList = function() {
    originalMakeRightList.call(this);
    var level = this.logic.status.level;
    if (level < 22 || level > 25) return;
    var patterns = [[0,1,0,1,2,3,2,3,0,2,1,3,1,0,2,3,1,0,1,0,3,2,3,2],[0,2,1,3,0,2,3,1,0,1,2,3,2,1,0,3,0,2,1,3,1,3,2,0],[0,4,1,4,2,3,4,0,4,2,4,1,3,4,2,0,4,3,4,1,0,2,4,3],[0,1,4,2,3,4,0,2,1,3,4,1,0,4,3,2,0,4,1,3,2,4,0,1,2,4,3,0,4,2,1,3]];
    var pattern = patterns[level-22];
    for (var i = 0; i < this.rightList.length; i++) {
      if (this.rightList[i] < 5) this.rightList[i] = pattern[i % pattern.length];
    }
  };
  var originalLevelClear = logic.levelClear;
  logic.levelClear = function() {
    if (this.status.level < 20 || this.status.level >= 25) { originalLevelClear.call(this); return; }
    Framework.sound.stop("tok2_bg");
    if (this.isPerfect) this.root.comboAni_mc.gotoAndPlay("perfect");
    Framework.sound.play("tok2_levelClear");
    var view = this.ui.showLevelClear();
    view.onEvent = nhn.glib.core.Delegate.create(this,this.nextLevel);
    this.dispatchEvent({target:this,type:"levelClear"});
    this.pause();
  };
}, 100);


