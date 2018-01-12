import Vue from 'vue'
import Router from 'vue-router'
import IndexPage from '@/components/page/IndexPage/IndexPage'
import AuthPage from '@/components/page/AuthPage/AuthPage'
import Issue from '@/components/page/ViewIssue/App'
import AdminPage from '@/components/page/AdminPage/AdminPage'
import AdminUsersPage from '@/components/subpage/AdminUsersPage/AdminUsersPage'
import AdminIssuesPage from '@/components/subpage/AdminIssuesPage/AdminIssuesPage'

Vue.use(Router)

const router = new Router({
  routes: [
    {
      path: '/',
      name: 'IndexPage',
      component: IndexPage
    },
    {
      path: '/auth**',
      name: 'AuthPage',
      component: AuthPage
    },
    {
      path: '/issue/:id',
      component: Issue
    },
    {
      path: '/admin',
      name: 'AdminPage',
      component: AdminPage,
      children: [
        {
          path: 'users',
          component: AdminUsersPage
        },
        {
          path: 'issues',
          component: AdminIssuesPage
        }
      ]
    }
  ]
})

export default router

router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    Vue.http.get('auth/getCurrentSession').then(response => {
      let json = response.body

      if (!json.errors && json.data[0].login) {
        localStorage.setItem('user', JSON.stringify(json.data[0]))
        next({
          path: '/auth/login',
          query: {
            redirect: to.fullPath
          }
        })
      } else {
        next()
      }
    })
  } else {
    next()
  }
})
// eslint-disable-next-line
export function getLocalUser() {
  return JSON.parse(localStorage.getItem('user'))
}

// eslint-disable-next-line
export function resetLocalUser() {
  localStorage.setItem('user', null)
}
