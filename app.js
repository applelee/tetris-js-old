const Tetris = (function(){
  const tetris = function(obj){
    this.offsetX = Math.floor(obj.mapW/2) - 1
    this.offsetY = 0
    this.shapDir = 0
    this.baseSize = obj
    this.timer = obj.level*100
    this.fireArr = []
    this.currentShap = null
    this.currentColor = null
    this.intervalRX = null
    this.map = new Map()
    this.shapArr = ['I','L','J','Z','S','T','O']
    // this.colorArr = ['red','orange','yellow','green','cyan','blue','violet']
    
    //方块
    this.shapData = {
      'I':[
        [[0,0],[1,0],[2,0],[3,0]],
        [[0,-1],[0,0],[0,1],[0,2]],
      ],
      'L':[
        [[0,0],[1,0],[2,0],[0,1]],
        [[0,0],[1,0],[1,1],[1,2]],
        [[2,0],[0,1],[1,1],[2,1]],
        [[0,0],[0,1],[0,2],[1,2]],
      ],
      'J':[
        [[0,0],[1,0],[2,0],[2,1]],
        [[1,0],[1,1],[1,2],[0,2]],
        [[0,0],[0,1],[1,1],[2,1]],
        [[0,0],[1,0],[0,1],[0,2]],
      ],
      'Z':[
        [[0,0],[1,0],[1,1],[2,1]],
        [[1,0],[0,1],[1,1],[0,2]],
        [[0,0],[1,0],[1,1],[2,1]],
        [[1,0],[0,1],[1,1],[0,2]],
      ],
      'S':[
        [[1,0],[2,0],[0,1],[1,1]],
        [[0,0],[0,1],[1,1],[1,2]],
      ],
      'T':[
        [[0,0],[1,0],[2,0],[1,1]],
        [[1,0],[0,1],[1,1],[1,2]],
        [[1,0],[0,1],[1,1],[2,1]],
        [[0,0],[0,1],[1,1],[0,2]],
      ],
      'O':[
        [[0,0],[1,0],[0,1],[1,1]],
      ],
    }
  }

  //初始化
  tetris.prototype.init = function(){
    const o = this.baseSize
    this.currentShap = this.randomShap()
    // this.currentColor = this.randomColor()
    this.map = this.generateMap(o)
    const mapContainer = this.generateMapContainer(o)
    const shapContainer = this.generateShapContainer(o)

    document.body.innerHTML = mapContainer
    document.getElementById('tetris_container').innerHTML = shapContainer
  }

  //开始游戏
  tetris.prototype.startGame = function(){
    this.init()
    this.resetShap('new')
    this.gameUpdate()
    this.keyUpWithShap()
  }

  //新方块
  tetris.prototype.resetShap = function(str){
    // const shap = this.shapData[this.currentShap][this.shapDir]

    if(str === 'new'){
      this.shapDir = 0
      this.offsetY = -this.shapData[this.currentShap][this.shapDir][3][1]
      this.offsetX = Math.floor(this.baseSize.mapW/2) - 1
    }

    const shapDom = this.generateShap(this.shapData[this.currentShap][this.shapDir])
    document.getElementById('shap_container').innerHTML = shapDom
  }

  //游戏定时器
  tetris.prototype.gameUpdate = function(){
    const _self = this
    const source = Rx.Observable.timer(this.timer,this.timer)

    this.intervalRX = source.subscribe(
      function (x) {
        _self.coreLogic(this)
      },
      function (err) {
        console.log('Error: ' + err)
      },
      function () {
        console.log('德玛西亚')
      }
    )
  }

  //核心逻辑
  tetris.prototype.coreLogic = function(interval){
    const o = this.baseSize

    //方块是否静止
    if(this.isShapOver()){
      //游戏是否结束
      if(this.isGameOver()){
        interval.onCompleted()
        this.gameOver()
      }
      else{
        this.shapToMap()
        this.currentShap = this.randomShap()
        // this.currentColor = this.randomColor()
        this.resetShap('new')
        this.resetSetShapContainer()
        this.fireLayer()
      }
      return
    }

    this.offsetY ++
    this.resetSetShapContainer()
  }

  tetris.prototype.gameOver = function(){
    document.onkeyup = null
    document.onkeydown = null
    alert('游戏结束')
  }

  //消层逻辑
  tetris.prototype.fireLayer = function(interval){
    const _self = this
    const o = this.baseSize
    let crashArr = []
    let gridArr = []
    let count = 0
    let isFire = true
    let dom = ''

    const rxMap = Rx.Observable.from(this.map)

    //标记需要消掉的层
    rxMap.subscribe(
      function(x){
        const key = x[0]
        const val = x[1]

        if(parseInt(key.split('|')[0]) === 0){
          count = 0
          isFire = true
        }

        if(val === false){
          isFire = false
        }

        //当前行结束
        if(count >= o.mapW - 1){
          //当前行全被标记占用
          if(isFire === true){
            crashArr.push(parseInt(key.split('|')[1]))
          }
        }

        count ++
      }
    )

    //层数
    if(crashArr.length > 0){
      for(let i=0;i<crashArr.length;i++){
        rxMap.subscribe(
          function(x){
            const key = x[0]

            if(JSON.parse(key.split('|')[1]) === crashArr[i]){
              _self.map.set(key,false)
            }
          }
        )

        rxMap.subscribe(
          function(y){
            const key = y[0]
            const val = y[1]
            let pX = JSON.parse(key.split('|')[0])
            let pY = JSON.parse(key.split('|')[1])

            if(val === true){
              if(pY < crashArr[i]){
                pY += o.rectSize
                _self.map.set(key,false)
                gridArr.push(pX+'|'+pY)
              }

              if(i === crashArr.length - 1){
                dom += `<div style='left:${pX}px;top:${pY}px;' class='rect red-bg'></div>`
              }
            }
          }
        )

        Rx.Observable.from(gridArr)
        .subscribe(
          function(y){
            _self.map.set(y,true)
          }
        )

        gridArr = []
      }

      dom += document.getElementById('shap_container').outerHTML
      document.getElementById('tetris_container').innerHTML = dom
    }
  }

  //上下左右操作俄罗斯方块
  tetris.prototype.keyUpWithShap = function(){
    const _self = this

    document.onkeydown = function(e){
      //左
      if(e.keyCode === 37){
        if(_self.offsetX - 1 >= 0 && !_self.isHitShap(0,-1)){
          _self.offsetX --
          _self.resetSetShapContainer()
        }
      }
      //上
      else if(e.keyCode === 38){
        _self.shapDir ++

        if(_self.shapDir >= _self.shapData[_self.currentShap].length){
          _self.shapDir = 0
        }
        if(_self.isShapOver(0,0)){
          _self.shapDir --
          if(_self.shapDir < 0){
            _self.shapDir = _self.shapData[_self.currentShap].length - 1
          }
          return
        }
        if(_self.isShapOver(0,0) || _self.isHitRightWall()){
          _self.shapDir --
          if(_self.shapDir < 0){
            _self.shapDir = _self.shapData[_self.currentShap].length - 1
          }
          return
        }

        //棍子单独计算偏移
        if(_self.currentShap === 'I' && _self.shapDir === 1){
          _self.offsetX ++
          _self.resetSetShapContainer()
        }
        else if(_self.currentShap === 'I' && _self.shapDir === 0){
          if(_self.offsetX > 0){
            _self.offsetX --
            _self.resetSetShapContainer()
          }
        }

        _self.resetShap()
      }
      //右
      else if(e.keyCode === 39){
        let shapMaxX = 0
        Rx.Observable.from(_self.shapData[_self.currentShap][_self.shapDir])
        .subscribe(function(x){
          if(shapMaxX < x[0]){
            shapMaxX = x[0]
          }
        })

        if(_self.offsetX + shapMaxX + 1 < _self.baseSize.mapW && !_self.isHitShap(0,1)){
          _self.offsetX ++
          _self.resetSetShapContainer()
        }
      }
      //下
      else if(e.keyCode === 40){
        _self.intervalRX.isStopped = true
        _self.coreLogic(_self.intervalRX)
      }
    }

    document.onkeyup = function(e){
      if(e.keyCode === 40){
        _self.intervalRX.isStopped = false
      }
    }
  }

  //是否静止
  tetris.prototype.isShapOver = function(next1=1,next2=1){
    const o = this.baseSize
    const lastY = this.shapData[this.currentShap][this.shapDir][3][1]

    //到地板
    if((lastY + this.offsetY + next1) * o.rectSize >= o.mapH*o.rectSize){
      return true
    }
    //将要碰到其它方块
    else if(this.isHitShap(next2)){
      return true
    }

    return false
  }

  //是否碰撞
  tetris.prototype.isHitShap = function(next=0,lr=0){
    const shap = this.shapData[this.currentShap][this.shapDir]

    for(let i=0;i<shap.length;i++){
      if(this.map.get(this.generateKey(shap,i,next,lr)) === true){
        return true
      }
    }

    return false
  }

  //游戏是否结束
  tetris.prototype.isGameOver = function(){
    if(this.offsetY < 0 && this.isHitShap()){
      return true
    }
  }

  //更新方块容器的状态
  tetris.prototype.resetSetShapContainer = function(){
    const o = this.baseSize
    const shapContainer = document.getElementById('shap_container')
    shapContainer.style.top = `${this.offsetY*o.rectSize}px`
    shapContainer.style.left = `${this.offsetX*o.rectSize}px`
  }

  //获取地图位置key
  tetris.prototype.generateKey = function(shap,i,next=0,lr=0){
    const o = this.baseSize
    return (shap[i][0]+this.offsetX+lr)*o.rectSize + '|' + (shap[i][1]+this.offsetY+next)*o.rectSize
  }

  //生成地图容器
  tetris.prototype.generateMapContainer = function(o){
    return `<div style='width:${o.mapW*o.rectSize}px;height:${o.mapH*o.rectSize}px;' id='tetris_container'></div>`
  }

  //生成形状器
  tetris.prototype.generateShapContainer = function(o){
    return `<div style='left:${this.offsetX*o.rectSize}px;' id='shap_container'></div>`
  }

  //生成方块
  tetris.prototype.generateShap = function(shap,ofs){
    const offset = ofs || {x:0,y:0}
    const o = this.baseSize
    let shapDom = ''

    for(let i=0;i<shap.length;i++){
      shapDom += `<div style='left:${(shap[i][0]+offset.x)*o.rectSize}px;top:${(shap[i][1]+offset.y)*o.rectSize}px;' class='rect ${ofs && 'red-bg'}'></div>`
    }

    return shapDom
  }

  //已经解决的方块加入到map
  tetris.prototype.shapToMap = function(){
    const shap = this.shapData[this.currentShap][this.shapDir]
    const o = this.baseSize

    document.getElementById('tetris_container').innerHTML += this.generateShap(shap,{x:this.offsetX,y:this.offsetY})

    for(let i=0;i<shap.length;i++){
      this.map.set(this.generateKey(shap,i),true)
    }
  }

  //生成地图
  tetris.prototype.generateMap = function(o){
    const map = new Map()

    for(let i=0;i<o.mapH;i++){
      for(let j=0;j<o.mapW;j++){
        const key = j*o.rectSize + '|' + i*o.rectSize
        map.set(key,false)
      }
    }

    return map
  }

  //右墙碰撞
  tetris.prototype.isHitRightWall = function(){
    const o = this.baseSize
    const shap = this.shapData[this.currentShap][this.shapDir]
    let isHit = false

    Rx.Observable.from(shap)
    .subscribe((x) => {
      if(this.offsetX + x[0] >= o.mapW){
        isHit = true
      }
    })

    return isHit
  }

  //随机方块索引
  tetris.prototype.randomShap = function(){
    const randomNum = Math.floor(Math.random() * this.shapArr.length)
    return this.shapArr[randomNum]
  }

  return tetris
})()

//执行
const tetris = new Tetris({
  mapW:11,          //游戏地图宽
  mapH:15,          //游戏地图高
  rectSize:30,
  level:5,         //游戏地难度（毫秒）
})

tetris.startGame()
