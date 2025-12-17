<template>
  <nav id="nav" class="navbar navbar-expand shadow-sm fixed-top">
    <loading :active.sync="isLoading"></loading>
    <router-link to="/" class="navbar-brand py-0">
      <img class="logoImg" src="@/assets/img/logoTop.png" alt="logoTop" />
      <div class="logoTxt">HomeTown</div>
    </router-link>
    <div class="collapse navbar-collapse">
      <ul class="navbar-nav objs mr-sm-auto ml-auto ml-sm-0">
        <li class="nav-item">
          <router-link to="/products" class="nav-link text-center">
            <i class="fas fa-couch mr-1"></i>
            <span class="d-block d-sm-inline">Product List</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/coupon" class="nav-link text-center">
            <i class="fas fa-money-bill-wave mr-1"></i>
            <span class="d-block d-sm-inline">Promotions</span>
          </router-link>
        </li>
      </ul>
      <ul class="navbar-nav">
        <li class="nav-item dropdown">
          <a
            class="nav-link dropdown-toggle text-center"
            href="#"
            id="navbarDropdown"
            :data-toggle="$route.path !== '/cart' ? 'dropdown' : ''"
          >
            <i class="fa fa-shopping-cart" :class="{ ml2: cart.length >= '1' }"></i>
            <span class="badge badge-pill badge-danger" v-if="cart.length">{{cart.length}}</span>
            <span class="d-block d-sm-none">Cart</span>
          </a>
          <div
            class="dropdown-menu dropdown-menu-right text-center"
            v-show="$route.path !== '/cart'"
          >
            <!-- 未購物 -->
            <div v-if="!cart.length ">
              <h5 class="itemTitle my-2">No items selected</h5>
              <router-link to="/products" class>
                <button class="btn btn-info mt-1">
                  <i class="fas fa-couch"></i> Browse Products
                </button>
              </router-link>
            </div>
            <!-- 有商品 -->
            <div v-if="cart.length">
              <h5 class="itemTitle text-center my-2">Selected Items</h5>
              <div class="cart-scroll">
                <table class="itemContent">
                  <tbody class="d-flex justify-content-start align-items-center flex-column">
                    <tr v-for="item in cart" :key="item.id">
                      <td class="itemPicture">
                        <img :src="item.product.imageUrl[0]" alt />
                      </td>
                      <td class="itemName">{{ item.product.title }}</td>
                      <td>x{{ item.quantity }}</td>
                      <td class="text-info">{{ item.product.price | currency }}</td>
                      <td class="trashIcon" @click="removeCartItem(item.product.id)">
                        <i class="far fa-trash-alt"></i>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="totalInfo">
                <p>
                  Subtotal
                  <span class="text-info h4 ml-5">{{ cartTotal | currency }}</span>
                </p>
                <router-link to="/cart" class="payBtn">
                  <button class="btn btn-info">
                    <i class="fa fa-shopping-cart"></i> Checkout
                  </button>
                </router-link>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'AppNav',
  data () {
    return {
      isLoading: false,
      cart: {},
      cartTotal: 0
    }
  },
  created () {
    this.getCart()
    const vm = this
    vm.$bus.$on('add-cart', (item, quantity) => {
      vm.addToCart(item, quantity)
    })
    vm.$bus.$on('nav-getCart', () => {
      vm.getCart()
    })
  },
  methods: {
    async getCart () {
      try {
        this.isLoading = true

        const user = this.$supabase.auth.user()

        if (!user) {
          // 未登入：從 localStorage 讀取購物車
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
    updateTotal () {
      this.cartTotal = 0
      this.cart.forEach((item) => {
        this.cartTotal += item.product.price * item.quantity
      })
    },
    async addToCart (item, quantity = 1) {
      try {
        const user = this.$supabase.auth.user()

        if (!user) {
          // 未登入：使用 localStorage
          const localCart = localStorage.getItem('cart')
          const cart = localCart ? JSON.parse(localCart) : []

          const existingIndex = cart.findIndex(cartItem => cartItem.product.id === item.id)

          if (existingIndex !== -1) {
            // 更新數量
            cart[existingIndex].quantity += quantity
          } else {
            // 新增項目
            cart.push({
              id: Date.now().toString(), // 臨時 ID
              product: {
                id: item.id,
                title: item.title,
                price: item.price,
                imageUrl: item.imageUrl
              },
              quantity
            })
          }

          localStorage.setItem('cart', JSON.stringify(cart))
          this.getCart()
          this.$bus.$emit('message:push', `"${item.title}" has been added to the cart successfully!`, 'success')
          return
        }

        // 已登入：存到 Supabase
        const { data: existing, error: selectError } = await this.$supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('user_id', user.id)
          .eq('product_id', item.id)
          .single()

        if (selectError && selectError.code !== 'PGRST116') {
          throw selectError
        }

        if (existing) {
          // 更新數量
          const { error: updateError } = await this.$supabase
            .from('cart_items')
            .update({ quantity: existing.quantity + quantity })
            .eq('id', existing.id)

          if (updateError) throw updateError
        } else {
          // 新增項目
          const { error: insertError } = await this.$supabase
            .from('cart_items')
            .insert({
              user_id: user.id,
              product_id: item.id,
              quantity
            })

          if (insertError) throw insertError
        }

        this.getCart()
        this.$bus.$emit('message:push', `"${item.title}" has been added to the cart successfully!`, 'success')
      } catch (error) {
        console.error('Error adding to cart:', error)
        this.$bus.$emit('message:push', `Failed to add item: ${error.message}`, 'danger')
      }
    },
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

          this.$bus.$emit('message:push', 'Item removed from cart', 'success')
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

        this.$bus.$emit('message:push', 'Item removed from cart', 'success')
        this.isLoading = false
        this.getCart()
      } catch (error) {
        console.error('Error removing cart item:', error)
        this.isLoading = false
      }
    }
  },
  beforeUnmount: function () {
    // 元件銷毀前要註銷監聽事件
    this.$bus.$off('add-cart')
    this.$bus.$off('nav-getCart')
  }
}
</script>
