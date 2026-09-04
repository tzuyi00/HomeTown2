<template>
  <div class="container-fluid bg-main-bg" style="width: 100vw; height: 100vh;">

    <div class="d-flex flex-column align-items-center">
      <router-link to="/">
        <div class="back-brand text-center mb-3" style="margin-top: 8rem;">
          <img class="logoImg" src="@/assets/img/logoTop.png" alt="logoTop" />
          <div class="logoTxt">HomeTown</div>
        </div>
      </router-link>
      <div class="card" style="width: 340px;">
        <div class="card-body">
            <div class="h5 text-center"> <strong>Backend Login</strong> </div>

          <div class="p-3">
            <form @submit.prevent="signin">
              <div class="pt-1">
                <div class="input-group mb-3">
                  <div class="input-group-prepend">
                    <span class="input-group-text input-icon" style="background-color: transparent;"><i class="fas fa-envelope fa-lg"></i></span>
                  </div>
                  <input id="inputEmail" v-model="user.email" type="email" class="form-control" placeholder="Email" required autofocus>
                </div>
                <div class="input-group mb-3">
                  <div class="input-group-prepend">
                    <span class="input-group-text input-icon" style="background-color: transparent;"><i class="fas fa-lock fa-lg"></i></span>
                  </div>
                  <input id="inputPassword" v-model="user.password" type="password" class="form-control" placeholder="Password" required>
                </div>
                <button type="submit" class="btn btn-block btn-outline-info w-75 mx-auto mt-4">Login</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      user: {
        email: '',
        password: ''
      },
      isLoading: false
    }
  },
  methods: {
    // 使用 Supabase 登入 (v1 API)
    async signin () {
      try {
        this.isLoading = true
        // Supabase v1 使用 signIn() 而不是 signInWithPassword()
        const { user, error } = await this.$supabase.auth.signIn({
          email: this.user.email,
          password: this.user.password
        })

        if (error) throw error

        // 登入成功，Supabase 會自動管理 session 和 token
        console.log('Logged in user:', user)
        this.$bus.$emit('message:push', 'Login successful ヾ(●゜▽゜●)♡', 'success')
        this.$router.push('/admin/products')
      } catch (error) {
        console.error('Login error:', error)
        this.$bus.$emit('message:push',
          `Login failed: ${error.message || 'Please try again'} Σ( ° △ °|||)︴ `,
          'info')
      } finally {
        this.isLoading = false
      }
    }
  }
}
</script>
