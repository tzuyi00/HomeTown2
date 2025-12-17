<template>
  <div
    id="delModal"
    class="modal fade"
    tabindex="-1"
    role="dialog"
    aria-labelledby="exampleModalLabel"
    aria-hidden="true"
  >
  <loading :active.sync="isLoading"></loading>
    <div class="modal-dialog" role="document">
      <div class="modal-content border-0">
        <div class="modal-header bg-danger text-white">
          <h5 id="exampleModalLabel" class="modal-title">
            <span>刪除{{delName}}</span>
          </h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          是否刪除
          <strong class="text-danger">{{ tempProduct.title }}</strong> {{delName}}(刪除後將無法恢復)。
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-dismiss="modal">取消</button>
          <button type="button" class="btn btn-danger" @click="delProduct">確認刪除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/* global $ */

export default {
  name: 'DeleteModal',
  data () {
    return {
      isLoading: false
    }
  },
  props: {
    tempProduct: {
      imageUrl: []
    },
    delName: String
  },
  methods: {
    async delProduct () {
      try {
        this.isLoading = true
        let tableName = ''

        // 根據 delName 決定要刪除的表
        switch (this.delName) {
          case '商品': {
            tableName = 'products'
            break
          }
          case '優惠券': {
            tableName = 'coupons'
            break
          }
          case '圖片': {
            // 圖片刪除邏輯 - 從 storage 刪除
            tableName = 'storage'
            break
          }
          default:
            throw new Error('Unknown item type')
        }

        // 執行 Supabase 刪除
        const { error } = await this.$supabase
          .from(tableName)
          .delete()
          .eq('id', this.tempProduct.id)

        if (error) throw error

        this.isLoading = false
        this.$bus.$emit('message:push', `${this.delName}刪除成功囉，好棒ヽ(＾Д＾)ﾉ `, 'success')
        $('#delModal').modal('hide') // 刪除成功後關閉 Modal
        this.$emit('update') // 重新取得全部資料(更新畫面)
      } catch (error) {
        console.error('Delete error:', error)
        this.isLoading = false
        this.$bus.$emit('message:push', `刪除失敗: ${error.message}`, 'info')
      }
    }
  }
}
</script>
