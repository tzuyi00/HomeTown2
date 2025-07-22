<template>
  <div>
    <div class="couponTitle">
      <h2 class="title text-center">anniversary sale</h2>
      <div class="line mx-auto"></div>
    </div>

    <div class="eggBox container mx-auto mt-5"
    :style="{backgroundImage: `url(${img.disBgL}), url(${img.disBgR})` }">
      <div class="primLine">
        <div class="couponTxt text-center mx-auto">
          <div class="h3 font-weight-bold">
            <i class="fas fa-glass-cheers mr-2"></i>
            <span>Anniversary Scratch-off Game</span>
          </div>
          <div class="h5 mt-3">Come play the scratch-off game! Scratch to reveal your exclusive discount prize.
            Various discounts are waiting for you — enjoy up to "50% off" per order, no minimum spending required!
            Limited quantity, first come, first served!</div>
        </div>
        <!-- 刮刮樂區塊 -->
        <div class="main mx-auto mt-4 mt-sm-5 text-center">
          <img class="award" :src="award_pic" alt="">
          <div class="mt-2">Apply the code at checkout!</div>
          <div class="coupon mt-3 d-flex justify-content-center align-items-center">
            <input id="input_code" type="text" readonly v-model="discount_code"/>
            <div class="btn btn-outline-info"
              @click="clipboard()"
              ref="copy"
              data-clipboard-target="#input_code"
              >
              <i class="fas fa-copy"></i>
            </div>
          </div>
          <div class="mt-3">
            Not satisfied with the result?<i class="fas fa-hand-point-right mx-2"></i>
            <div class="btn btn-outline-info btn-sm" @click="reload">Play Again</div>
          </div>
          <canvas id="myCanvas" style="position: absolute;top:0; left: 0; z-index: 1000;"></canvas>
        </div>
      </div>

    </div>

  </div>
</template>

<script>
/* global $ */

export default {
  name: 'payment',
  data () {
    return {
      award_pic: '',
      discount_code: '12345',
      copyBtn: null, // 儲存初始化複製按鈕事件
      img: {
        disBgL:
          require('@/assets/img/disBgL.png'),
        disBgR:
          require('@/assets/img/disBgR.png')
      }
    }
  },
  created () {},
  mounted () {
    this.scratchInit()
    this.copyBtn = new this.Clipboard(this.$refs.copy)
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    handleResize () {
      this.scratchInit()
    },
    reload () {
      // location.reload()
      this.scratchInit()
      $('#myCanvas').show() // 重新顯示 canvas
    },
    clipboard () {
      this.$bus.$emit('message:push', 'Code copied! Go shopping now!', 'success')
    },
    scratchInit () {
      const myCanvas = document.getElementById('myCanvas')
      const parentDOM = document.getElementById('myCanvas').parentNode
      const can = myCanvas.getContext('2d')
      const rect = myCanvas.getBoundingClientRect()

      myCanvas.width = parentDOM.clientWidth
      myCanvas.height = parentDOM.clientHeight

      // 获取当前画布的宽高
      const X = myCanvas.width
      const Y = myCanvas.height

      // 用填充顏色當圖片
      const myGradient = can.createLinearGradient(0, 0, X, Y)
      myGradient.addColorStop(0, '#E6E4E0')
      myGradient.addColorStop(1, '#CFCBC4')
      can.fillStyle = myGradient
      can.fillRect(0, 0, X, Y)

      const device = /android|iphone|ipad|ipod|webos|iemobile|opear mini|linux/i.test(navigator.userAgent.toLowerCase())
      const startEvtName = device ? 'touchstart' : 'mousedown'
      const moveEvtName = device ? 'touchmove' : 'mousemove'
      const endEvtName = device ? 'touchend' : 'mouseup'

      /* 增加触摸监听 */
      myCanvas.addEventListener(startEvtName, function () {
        myCanvas.addEventListener(moveEvtName, draw, false)
      }, false)

      myCanvas.addEventListener(endEvtName, function () {
        myCanvas.removeEventListener(moveEvtName, draw, false)
      }, false)

      /* 根据手指移动画线，使之变透明 */
      function draw (event) {
        event.preventDefault()
        const x = device ? event.touches[0].pageX - rect.x : event.offsetX
        const y = device ? event.touches[0].pageY - rect.y : event.offsetY

        can.beginPath()
        can.globalCompositeOperation = 'destination-out' // 畫過的地方變透明
        can.arc(x, y, 20, 0, Math.PI * 2, false) // 在 (x, y) 畫一個半徑 20 的圓
        can.fill()
        can.closePath()
      }

      // 扣除到一定程度,自己打开
      document.addEventListener(endEvtName, function () {
        /* 獲取imageData对象 */
        const imageData = can.getImageData(0, 0, myCanvas.width, myCanvas.height)

        // 所有像素點數
        const allPX = imageData.width * imageData.height

        // 刮开的像素点个数
        let iNum = 0

        for (let i = 0; i < allPX; i++) {
          if (imageData.data[i * 4 + 3] === 0) {
            iNum++
          }
        }
        // 刮開多少比例，canvas消失
        if (iNum >= allPX * 3 / 10) {
          $('#myCanvas').fadeOut(500)
        }
      }, true)

      // 建立折扣
      const arr = ['9', '8', '5']

      function shuffle (arr) {
        for (let j, x, i = arr.length; i;) {
          j = Math.floor(Math.random() * i)
          x = arr[--i]
          arr[i] = arr[j]
          arr[j] = x
        }
        return arr
      };

      // 打亂陣列重新排列
      shuffle(arr)

      // 放入獎項文字 & 折價金額所顯示的序號
      switch (arr[2]) {
        case '9':
          this.award_pic = require('../../assets/img/dis9.png')
          this.discount_code = 'home10'
          break
        case '8':
          this.award_pic = require('../../assets/img/dis8.png')
          this.discount_code = 'home20'
          break
        case '5':
          this.award_pic = require('../../assets/img/dis5.png')
          this.discount_code = 'home50'
          break
      };
    }
  }
}
</script>
