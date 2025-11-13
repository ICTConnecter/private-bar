import { use } from "react"
import { UserAuthContext } from "./context/user"

export const DisplayUserInfo = () => {
  const { userInfo } = use(UserAuthContext)
  return <>
    {JSON.stringify(userInfo)}
  </>
}
