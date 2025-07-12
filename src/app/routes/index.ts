import { Router } from "express"
import { UserRoutes } from "../modules/user/user.route"
import { AuthRoutes } from "../modules/auth/auth.route"

export const router = Router()

const moduleRoutes = [
  {
    path: "/user",
    route: UserRoutes
  },
  {
    path: '/auth',
    route: AuthRoutes
  }
]

// Registering all module routes
// Second version of API
moduleRoutes.forEach((route) => { 
  router.use(route.path, route.route)
})

