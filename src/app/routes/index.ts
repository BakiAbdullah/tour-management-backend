import { Router } from "express"
import { UserRoutes } from "../modules/user/user.route"

export const router = Router()

const moduleRoutes = [
  {
    path: "/user",
    route: UserRoutes
  },
  // {
  //   path: '/tour',
  //   route: TourRoutes
  // }
]

// Registering all module routes
// Second version of API
moduleRoutes.forEach((route) => { 
  router.use(route.path, route.route)
})

