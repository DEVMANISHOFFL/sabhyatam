"use client" // This directive is essential

import { usePathname } from "next/navigation"
import Header from "@/components/header"

export default function HeaderWrapper() {
  // const pathname = usePathname()
  
  // // List of paths where the header should be hidden
  // const noHeaderRoutes = ["/login", "/register"]

  // // If the current path is in the list, return nothing
  // if (noHeaderRoutes.includes(pathname)) {
  //   return null
  // }

  // Otherwise, return the Header
  return <Header />
}