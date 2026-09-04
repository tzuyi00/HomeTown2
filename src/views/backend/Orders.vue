<template>
  <div>
    <loading :active.sync="isLoading"></loading>
    <div class="d-flex mb-2">
      <h1 class="h5 mr-auto font-weight-bold">訂單列表</h1>
    </div>
    <div class="card">
      <div class="card-body">
        <table class="table table-hover">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">下單時間</th>
              <th scope="col">購買款項</th>
              <th scope="col">付款方式</th>
              <th scope="col">應付金額</th>
              <th scope="col" class="text-center">是否付款</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in orders" :key="item.id">
              <th scope="row">{{index + 1}}</th>
              <td>{{ item.created_at | timestamp }}</td>
              <td>
                <ul class="list-unstyled">
                  <li
                    v-for="(orderItem, i) in item.order_items"
                    :key="i"
                  >
                    {{ orderItem.products.title }} 數量：{{ orderItem.quantity }}
                  </li>
                </ul>
              </td>
              <td>
                {{ item.payment_method }}
              </td>
              <td class="text-right">
                {{ item.total | currency }}
              </td>
              <td>
                <div class="custom-control custom-switch">
                  <input
                    :id="item.id"
                    v-model="item.paid"
                    type="checkbox"
                    class="custom-control-input"
                    @change="setOrderPaid(item)"
                  >
                  <label
                    class="custom-control-label"
                    :for="item.id"
                  >
                    <strong
                      v-if="item.paid"
                      class="text-success"
                    >已付款</strong>
                    <span
                      v-else
                      class="text-muted"
                    >尚未付款</span>
                  </label>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- 元件中 emitPages() 透過 emit 向外傳遞我們點的分頁並觸發外層的 getProducts -->
        <Pagination :pages="pagination" @emit-pages="getOrders"></Pagination>
      </div>
    </div>
  </div>
</template>

<script>
import Pagination from '@/components/Pagination.vue'

export default {
  name: 'Orders',
  components: {
    Pagination
  },
  data () {
    return {
      isLoading: false,
      orders: {},
      pagination: {}
    }
  },
  created () {
    this.isLoading = true
    this.getOrders()
  },
  methods: {
    async getOrders (page = 1) {
      try {
        this.isLoading = true

        // 從 Supabase 讀取訂單資料
        const { data, error, count } = await this.$supabase
          .from('orders')
          .select(`
            *,
            order_items (
              quantity,
              price,
              products:product_id (title)
            )
          `, { count: 'exact' })
          .order('created_at', { ascending: false })
          .range((page - 1) * 10, page * 10 - 1)

        if (error) throw error

        // 直接使用資料，不需要額外轉換
        this.orders = data

        // 計算分頁資訊
        const totalPages = Math.ceil(count / 10)
        this.pagination = {
          current_page: page,
          total_pages: totalPages,
          has_pre: page > 1,
          has_next: page < totalPages
        }

        this.isLoading = false
      } catch (error) {
        console.error('Error fetching orders:', error)
        this.$bus.$emit('message:push', '讀取訂單失敗', 'danger')
        this.isLoading = false
      }
    },
    async setOrderPaid (item) {
      try {
        this.isLoading = true

        // 更新訂單的付款狀態
        const { error } = await this.$supabase
          .from('orders')
          .update({ paid: !item.paid })
          .eq('id', item.id)

        if (error) throw error

        const status = !item.paid ? '已修改為 "已付款" ヽ(＾Д＾)ﾉ ' : '已修改為 "尚未付款" ヽ(＾Д＾)ﾉ '

        this.isLoading = false
        this.$bus.$emit('message:push', status, 'success')
        this.getOrders()
      } catch (error) {
        console.error('Error updating order paid status:', error)
        this.$bus.$emit('message:push', '更新付款狀態失敗', 'danger')
        this.isLoading = false
      }
    }
  }
}
</script>
