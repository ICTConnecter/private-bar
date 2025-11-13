import { use } from "react"
import { LiffContext } from "./context/liff"

export const DisplayLiffInfo = () => {
  const liffInfo = use(LiffContext)
  return <>
    {JSON.stringify(liffInfo)}
  </>
}
