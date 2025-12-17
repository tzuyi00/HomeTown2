<template>
  <div>
    <loading :active.sync="isLoading"></loading>
    <div class="banner" :style="{backgroundImage: `url(${img.banner})` }">
      <div class="bannerTitle">
        <h1>Checkout Process</h1>
      </div>
    </div>
    <div class="container section960">
      <div class="cartPage mt-5">
        <div class="stepGroup d-flex justify-content-between mx-auto my-5 text-center">
          <div class="stepBox current">
            <div class="num mx-auto h5">1</div>
            Cart
          </div>
          <div class="stepBox">
            <div class="num mx-auto h5">2</div>
            Fill Information
          </div>
          <div class="stepBox">
            <div class="num mx-auto h5">3</div>
            Order Confirmation
          </div>
        </div>
        <table class="table cartTable">
          <thead>
            <tr>
                <th scope="col" class="thPicture pl-4">Image</th>
              <th scope="col" class="thName">Product Name</th>
              <th scope="col">Quantity</th>
              <th scope="col">Price</th>
              <th scope="col" class="thTrash"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in cart" :key="item.id">
              <td class="itemPicture">
                <img :src="item.product.imageUrl[0]" class="img-fluid" />
              </td>
              <td>{{item.product.title}}</td>
              <td class="countNumber d-flex align-items-center">
                <button
                class="btn minus"
                type="button"
                @click="quantityUpdata(item.product.id, item.quantity - 1)"
                >
                  <i class="fas fa-minus"></i>
                </button>
                <input type="number"
                max="10" min="1"
                class="productNumber"
                :value="item.quantity"
                @keyup.enter="quantityUpdata(item.product.id, $event.target.value)"
                @change="quantityUpdata(item.product.id, $event.target.value)"
                />
                <button
                class="btn add"
                type="button"
                @click="quantityUpdata(item.product.id, item.quantity + 1)"
                >
                  <i class="fas fa-plus"></i>
                </button>
              </td>
              <td>{{item.product.price | currency}}</td>
              <td class="trashIcon" @click="removeCartItem(item.product.id)">
                <i class="far fa-trash-alt"></i>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="input-group d-flex align-items-center justify-content-end">
          <span class="mr-3">Use Coupon</span>
          <input v-model="coupon_code"  @keyup.enter="addCoupon" type="text" class="couponInput form-control" placeholder="Enter coupon code" />
          <div class="input-group-append">
            <button class="btn btn-outline-primary couponBtn" type="button" @click="addCoupon" :disabled="!coupon_code">Apply</button>
          </div>
        </div>

        <table class="table totalInfo ml-auto mt-3">
          <tbody>
            <tr>
              <td>Total Amount</td>
              <td class="text-right text-info">NT {{ cartTotal  | currency}}</td>
            </tr>
            <tr v-if="coupon.enabled">
              <td>Discount</td>
              <td class="text-right">- NT {{ cartTotal - cartTotal * (coupon.percent / 100)  | currency}}</td>
            </tr>
            <tr v-if="coupon.enabled">
              <td>Amount Due</td>
              <td class="text-right text-danger">NT {{ cartTotal * (coupon.percent / 100)  | currency}}</td>
            </tr>
          </tbody>
        </table>
        <button class="btn btn-info d-block ml-auto" @click="changePage()">
          <i class="fas fa-shopping-bag"></i> Confirm Purchase
        </button>
      </div>

      <div class="orderPage mt-5" style="display: none;">
        <div class="stepGroup d-flex justify-content-between mx-auto my-5 text-center">
          <div class="stepBox">
            <div class="num mx-auto h5">1</div>
            Cart
          </div>
          <div class="stepBox current">
            <div class="num mx-auto h5">2</div>
            Fill Information
          </div>
          <div class="stepBox">
            <div class="num mx-auto h5">3</div>
            Order Confirmation
          </div>
        </div>
        <table class="table paymentTable mt-5">
          <thead>
            <tr>
              <th colspan="4">Purchase List</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in cart" :key="item.id">
              <td class="itemPicture">
                <img :src="item.product.imageUrl[0]" class="img-fluid" />
              </td>
              <td>{{item.product.title}}</td>
              <td class="text-center">x{{ item.quantity }}</td>
              <td class="text-right">{{item.product.price | currency}}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr v-if="coupon.enabled">
              <td colspan="3" class="text-right py-3">Discount</td>
              <td class="text-right">- NT {{ cartTotal - cartTotal * (coupon.percent / 100)  | currency}}</td>
            </tr>
            <tr>
              <td colspan="3" class="text-right" :class="{ isCoupon: coupon.enabled }">Total</td>
              <td v-if="!coupon.enabled" class="text-right text-danger"  :class="{ isCoupon: coupon.enabled }">NT {{ cartTotal  | currency}}</td>
              <td v-if="coupon.enabled" class="text-right text-danger"  :class="{ isCoupon: coupon.enabled }">NT {{ cartTotal * (coupon.percent / 100)  | currency}}</td>
            </tr>
          </tfoot>
        </table>

        <validation-observer v-slot="{ invalid }">
            <div class="orderTitle mt-5 font-weight-bold">Order Information</div>
          <form class="infoArea" @submit.prevent="createOrder">
            <div class="form-row userInfo">
              <div class="form-group col-sm-6">
                <validation-provider v-slot="{ errors, classes }" rules="required">
                  <label for="userName">
                    Recipient Name
                    <span class="text-danger">*</span>
                  </label>
                  <input
                    id="userName"
                    name="姓名"
                    v-model="form.name"
                    type="text"
                    placeholder="Please enter your name"
                    class="form-control"
                    :class="classes"
                  />
                  <span v-if="errors[0]" class="text-danger">{{ errors[0] }}</span>
                </validation-provider>
              </div>
              <div class="form-group col-sm-6">
                <validation-provider v-slot="{ errors, classes }" rules="required|min:8">
                  <label for="usertel">
                    Phone
                    <span class="text-danger">*</span>
                  </label>
                  <input
                    id="userTel"
                    name="手機"
                    v-model="form.tel"
                    type="tel"
                    placeholder="0912345678"
                    maxlength="10"
                    class="form-control"
                    :class="classes"
                  />
                  <span v-if="errors[0]" class="text-danger">{{ errors[0] }}</span>
                </validation-provider>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group col-sm-6">
                <validation-provider v-slot="{ errors, classes }" rules="required|email">
                  <label for="userEmail">
                    Email
                    <span class="text-danger">*</span>
                  </label>
                  <input
                    id="userEmail"
                    name="Email"
                    v-model="form.email"
                    type="email"
                    placeholder="Please enter your Email"
                    class="form-control"
                    :class="classes"
                  />
                  <span v-if="errors[0]" class="text-danger">{{ errors[0] }}</span>
                </validation-provider>
              </div>
              <div class="form-group col-sm-6">
                <validation-provider v-slot="{ errors, classes }" rules="required">
                  <label for="payment">
                    Payment Method
                    <span class="text-danger">*</span>
                  </label>
                  <select
                    id="payment"
                    name="付款方式"
                    v-model="form.payment"
                    class="form-control"
                    :class="classes"
                  >
                    <option value="WebATM">WebATM</option>
                    <option value="ATM">ATM</option>
                    <option value="CVS">CVS</option>
                    <option value="Credit">Credit</option>
                    <option value="ApplePay">ApplePay</option>
                    <option value="GooglePay">GooglePay</option>
                  </select>
                  <span v-if="errors[0]" class="text-danger">{{ errors[0] }}</span>
                </validation-provider>
              </div>
            </div>
            <div class="form-group">
              <validation-provider v-slot="{ errors, classes }" rules="required">
                <label for="userAddress">
                  Address
                  <span class="text-danger">*</span>
                </label>
                <input
                  id="userAddress"
                  name="地址"
                  v-model="form.address"
                  type="text"
                  placeholder="Please enter your address"
                  class="form-control"
                  :class="classes"
                />
                <span v-if="errors[0]" class="text-danger">{{ errors[0] }}</span>
              </validation-provider>
            </div>
            <div class="form-group mb-5">
              <label for="message">Note</label>
              <textarea
                id="message"
                name="message"
                v-model="form.message"
                cols="10"
                rows="3"
                class="form-control"
              ></textarea>
            </div>
            <button type="submit" :disabled="invalid" class="btn btn-info d-block ml-auto">
                <i class="fas fa-clipboard-check"></i> Place Order
            </button>
          </form>
        </validation-observer>
        <button type="button" class="btn btn-primary mt-3" @click="goBack()">
          <i class="fas fa-angle-left"></i> Back to Previous Step
        </button>
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
      isLoading: false,
      cart: {},
      cartTotal: 0,
      coupon: {},
      coupon_code: '',
      form: {
        name: '',
        email: '',
        tel: '',
        address: '',
        payment: '',
        message: ''
      },
      img: {
        banner:
          'https://hexschool-api.s3.us-west-2.amazonaws.com/custom/HYMjBNd1w2pIbmbPkhzBETIPArFvCdK1hbyk8ug7kQOcTNQQ6Htwffj3G7alDUPIW7ZnJloorvHNYWIBrv1y27DwbZtUCbaQ7ozv3QeG8TEU2HRpbbxx6ZS68xNiU5VO.jpg'
      }
    }
  },
  created () {
    this.isLoading = true
    this.getCart()
  },
  methods: {
    changePage () {
      $('.cartPage').hide()
      $('.orderPage').fadeIn(800)
    },
    goBack () {
      $('.orderPage').hide()
      $('.cartPage').fadeIn(800)
    },
    async getCart () {
      try {
        this.isLoading = true
        const user = this.$supabase.auth.user()

        if (!user) {
          // 未登入：從 localStorage 讀取
          const localCart = localStorage.getItem('cart')
          this.cart = localCart ? JSON.parse(localCart) : []
          this.updateTotal()
          this.isLoading = false
          return
        }

        const { data, error } = await this.$supabase
          .from('cart_items')
          .select(`
            id,
            product_id,
            quantity,
            products:product_id (id, title, price, imageUrl)
          `)
          .eq('user_id', user.id)

        if (error) throw error

        // 轉換格式以相容原本的前端代碼
        this.cart = data.map(item => ({
          id: item.id,
          product: {
            id: item.products.id,
            title: item.products.title,
            price: item.products.price,
            imageUrl: item.products.imageUrl
          },
          quantity: item.quantity
        }))

        this.updateTotal()
        this.isLoading = false
      } catch (error) {
        console.error('Error fetching cart:', error)
        this.cart = []
        this.isLoading = false
      }
    },
    /**
     * 總金額計算
    */
    updateTotal () {
      this.cartTotal = 0
      this.cart.forEach((item) => {
        this.cartTotal += item.product.price * item.quantity
      })
    },
    /**
     * 編輯商品數量
    */
    async quantityUpdata (id, num) {
      try {
        if (num > 10) {
          this.$bus.$emit('message:push', 'Maximum quantity is 10!', 'info')
          num = 10
          const item = Array.isArray(this.cart) ? this.cart.find(item => item.product.id === id) : null
          if (item) {
            item.quantity = 10
          }
        }
        if (num < 1) {
          this.$bus.$emit('message:push', 'Minimum quantity is 1!', 'info')
          num = 1
          const item = Array.isArray(this.cart) ? this.cart.find(item => item.product.id === id) : null
          if (item) {
            item.quantity = 1
          }
        }

        this.isLoading = true
        const user = this.$supabase.auth.user()

        if (!user) {
          // 未登入：更新 localStorage
          const localCart = localStorage.getItem('cart')
          const cart = localCart ? JSON.parse(localCart) : []
          const item = cart.find(item => item.product.id === id)
          if (item) {
            item.quantity = parseInt(num)
            localStorage.setItem('cart', JSON.stringify(cart))
          }
          this.isLoading = false
          this.$bus.$emit('nav-getCart')
          this.getCart()
          return
        }

        // 已登入：更新 Supabase
        const { error } = await this.$supabase
          .from('cart_items')
          .update({ quantity: parseInt(num) })
          .eq('user_id', user.id)
          .eq('product_id', id)

        if (error) throw error

        this.isLoading = false
        this.$bus.$emit('nav-getCart')
        this.getCart()
      } catch (error) {
        console.error('Error updating quantity:', error)
        this.isLoading = false
      }
    },
    /**
     * 刪除某一筆購物車資料
    */
    async removeCartItem (id) {
      try {
        this.isLoading = true
        const user = this.$supabase.auth.user()

        if (!user) {
          // 未登入：從 localStorage 刪除
          const localCart = localStorage.getItem('cart')
          const cart = localCart ? JSON.parse(localCart) : []
          const newCart = cart.filter(item => item.product.id !== id)
          localStorage.setItem('cart', JSON.stringify(newCart))

          this.$bus.$emit('nav-getCart')
          this.isLoading = false
          this.getCart()
          return
        }

        // 已登入：從 Supabase 刪除
        const { error } = await this.$supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id)

        if (error) throw error

        this.$bus.$emit('nav-getCart')
        this.isLoading = false
        this.getCart()
      } catch (error) {
        console.error('Error removing cart item:', error)
        this.isLoading = false
      }
    },
    /**
     * 搜尋此序號是否有coupon
    */
    async addCoupon () {
      try {
        this.isLoading = true

        const { data, error } = await this.$supabase
          .from('coupons')
          .select('*')
          .eq('code', this.coupon_code)
          .eq('enabled', true)
          .single()

        if (error) throw error

        this.coupon = data
        this.isLoading = false
      } catch (error) {
        console.error('Error fetching coupon:', error)
        this.isLoading = false
        this.$bus.$emit('message:push', 'Coupon not found or expired', 'info')
      }
    },
    async createOrder () {
      try {
        this.isLoading = true
        const user = this.$supabase.auth.user()

        if (!user) {
          // 結帳時需要登入
          this.$bus.$emit('message:push', 'Please login to complete your order', 'info')
          this.$router.push('/login')
          this.isLoading = false
          return
        }

        // 計算訂單總額
        let total = this.cartTotal
        let couponId = null

        if (this.coupon.enabled) {
          couponId = this.coupon.id
          total = this.cartTotal * (this.coupon.percent / 100)
        }

        // 建立訂單
        const { data: order, error: orderError } = await this.$supabase
          .from('orders')
          .insert({
            user_id: user.id,
            name: this.form.name,
            email: this.form.email,
            tel: this.form.tel,
            address: this.form.address,
            message: this.form.message,
            total,
            payment_method: this.form.payment,
            coupon_id: couponId,
            status: 'pending'
          })
          .select()
          .single()

        if (orderError) throw orderError

        // 新增訂單明細
        const orderItems = this.cart.map(item => ({
          order_id: order.id,
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price
        }))

        const { error: itemsError } = await this.$supabase
          .from('order_items')
          .insert(orderItems)

        if (itemsError) throw itemsError

        // 清空購物車
        const { error: deleteError } = await this.$supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id)

        if (deleteError) throw deleteError

        this.$router.push(`/payment/${order.id}`)
        this.$bus.$emit('nav-getCart')
        this.isLoading = false
      } catch (error) {
        console.error('Error creating order:', error)
        this.$bus.$emit('message:push', `Failed to create order: ${error.message}`, 'info')
        this.isLoading = false
      }
    }
  }
}
</script>
