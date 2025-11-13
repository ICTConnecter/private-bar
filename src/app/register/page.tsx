"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

const Register = () => {
    const router = useRouter()

    useEffect(() => {
        // 新しい招待ページにリダイレクト
        router.replace("/invite")
    }, [router])

    return <>
        <div className="flex flex-col items-center h-screen mt-10 mx-10">
            <h1 className="text-2xl font-bold mb-5">リダイレクト中...</h1>
            <p>招待ページに移動しています</p>
        </div>
    </>
}

export default Register