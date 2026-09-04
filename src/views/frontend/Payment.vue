<template>
  <div>
    <loading :active.sync="isLoading"></loading>
    <div class="banner" :style="{backgroundImage: `url(${img.banner})` }">
      <div class="bannerTitle">
        <h1>Order Completed</h1>
      </div>
    </div>
    <div class="container section960 mt-5">
      <div class="stepGroup d-flex justify-content-between mx-auto my-5 text-center">
        <div class="stepBox">
          <div class="num mx-auto h5">1</div>
          Cart
        </div>
        <div class="stepBox">
          <div class="num mx-auto h5">2</div>
          Fill Information
        </div>
        <div class="stepBox current">
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
          <tr v-for="item in order.products" :key="item.id">
            <td class="itemPicture">
              <img :src="item.product.imageUrl[0]" class="img-fluid" />
            </td>
            <td>{{item.product.title}}</td>
            <td class="text-center">x{{ item.quantity }}</td>
            <td class="text-right">{{item.product.price | currency}}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr v-if="order.coupon">
            <td colspan="3" class="text-right py-3">Discount</td>
            <td class="text-right">- NT {{ (order.amount*(100/order.coupon.percent)) - (order.amount*(100/order.coupon.percent)) * (order.coupon.percent / 100)  | currency}}</td>
          </tr>
          <tr>
            <td colspan="3" class="text-right" :class="{ isCoupon: order.coupon }">Total</td>
            <td class="text-right text-danger" :class="{ isCoupon: order.coupon }">{{ order.amount  | currency}}</td>
          </tr>
        </tfoot>
      </table>

      <table class="table orderOkTable mt-5">
        <thead>
          <tr>
            <th colspan="2">Order Information</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td width="150px">Recipient Name:</td>
            <td>{{ order.user.name }}</td>
          </tr>
          <tr>
            <td>Phone:</td>
            <td>{{ order.user.tel }}</td>
          </tr>
          <tr>
            <td>Email:</td>
            <td>{{ order.user.email }}</td>
          </tr>
          <tr>
            <td>Payment Method:</td>
            <td>{{ order.payment }}</td>
          </tr>
          <tr>
            <td>Address:</td>
            <td>{{ order.user.address }}</td>
          </tr>
          <tr>
            <td>Notes:</td>
            <td>{{ order.message }}</td>
          </tr>
          <tr>
            <td>Payment Status:</td>
            <td v-if="!order.paid" class="h5 text-danger">Unpaid</td>
            <td v-if="order.paid" class="h5 text-info">Paid</td>
          </tr>
        </tbody>
      </table>
      <button v-if="!order.paid" @click="payOrder()" type="button" class="btn btn-info d-block mx-auto mt-5">
        <i class="fas fa-clipboard-check"></i> Confirm Payment
      </button>
      <router-link to="/products">
        <button v-if="order.paid" type="button" class="btn btn-primary d-block mx-auto mt-5">
          <i class="fas fa-couch"></i> Continue Shopping
        </button>
      </router-link>
    </div>

    <div id="paymentModal" class="modal fade" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-sm modal-dialog-centered" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body text-center">
            <div class="h5 text-info font-weight-bold">Congratulations</div>
            <div class="h5 text-info font-weight-bold">Payment Successful</div>
          </div>
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
      isLoading: false,
      order: {
        user: {}
      },
      orderId: '',
      img: {
        banner:
          'https://kslpccltrlcujjongied.supabase.co/storage/v1/object/public/site-assets/1767018202981.jpg'
      }
    }
  },
  created () {
    this.isLoading = true

    this.orderId = this.$route.params.orderId

    if (this.orderId) {
      this.getDetailed(this.orderId)
    }
  },
  methods: {
    async getDetailed (id) {
      try {
        this.isLoading = true

        // 從 Supabase 讀取訂單資料
        const { data: orderData, error: orderError } = await this.$supabase
          .from('orders')
          .select(`
            id,
            name,
            email,
            tel,
            address,
            message,
            total,
            payment_method,
            paid,
            coupon_id,
            coupons:coupon_id (id, code, percent, title)
          `)
          .eq('id', id)
          .single()

        if (orderError) throw orderError

        // 讀取訂單明細
        const { data: itemsData, error: itemsError } = await this.$supabase
          .from('order_items')
          .select(`
            id,
            quantity,
            price,
            products:product_id (id, title, imageUrl)
          `)
          .eq('order_id', id)

        if (itemsError) throw itemsError

        // 轉換為前端需要的格式
        this.order = {
          id: orderData.id,
          user: {
            name: orderData.name,
            email: orderData.email,
            tel: orderData.tel,
            address: orderData.address
          },
          message: orderData.message,
          amount: orderData.total,
          payment: orderData.payment_method,
          paid: orderData.paid,
          coupon: orderData.coupons,
          products: itemsData.map(item => ({
            id: item.id,
            quantity: item.quantity,
            product: {
              id: item.products.id,
              title: item.products.title,
              price: item.price,
              imageUrl: item.products.imageUrl || []
            }
          }))
        }

        this.isLoading = false
      } catch (error) {
        console.error('Error fetching order:', error)
        this.$bus.$emit('message:push', 'Failed to load order details', 'danger')
        this.isLoading = false
      }
    },
    // 使用者對某筆訂單付款結帳
    async payOrder () {
      try {
        this.isLoading = true

        // 更新訂單的 paid 狀態為 true
        const { error } = await this.$supabase
          .from('orders')
          .update({ paid: true })
          .eq('id', this.orderId)

        if (error) throw error

        $('#paymentModal').modal('show')
        setTimeout(() => {
          $('#paymentModal').modal('hide')
        }, 5000)

        // 重新載入訂單資料
        await this.getDetailed(this.orderId)
        this.isLoading = false
      } catch (error) {
        console.error('Error processing payment:', error)
        this.$bus.$emit('message:push', 'Payment processing failed', 'danger')
        this.isLoading = false
      }
    }
  }
}
</script>
