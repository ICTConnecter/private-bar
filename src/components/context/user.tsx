"use client"
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
// import { z } from "zod";
import { LiffContext, LiffContextType } from "./liff";
import { GetResType } from "@/app/api/auth/types";

type Props = {
  children: ReactNode | null;
};
type UserInfo = GetResType

/**
 * 【Component】LiffComponentーーLIFF関連のComponent。
 */
export const UserAuthContext =
  createContext<UserContextType>({} as UserContextType);

/**
 * 【Component】LiffComponentーーLIFF関連のComponent。
 */
export const UserAuthComponent = ({ children }: Props) => {

  const { idToken } = useContext<LiffContextType>(LiffContext);
  // const [isUser, setIsUser] = useState<boolean | null>(null);
  const [isError, setIsError] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // LINE認証処理(ユーザー登録済みかどうか確認)
  const auth = async (token: string) => {
    fetch(
      "/api/auth",
      {
        method: "GET",
        headers: {
          'Authorization': `Bearer:${token}`,
          'Content-Type': 'application/json',
        },
      }
    )
      .then(async (r) => {
        if (r.status === 200) {
          try {
            // const resBody: AuthResType = await r.json();
            r.json().then((body: UserInfo) => {
              setUserInfo(body);
            })

          } catch {
            setIsError(true);
          }
        } else {
          window.location.href = '/register'
        }
      });
  };
  useEffect(() => {
    if (!idToken) {
      return;
    }
    auth(idToken);
  }, [idToken]);

  return (
    <>
      <UserAuthContext.Provider
        value={{ userInfo }}
      >
        {userInfo ? children : null}
        {isError ? <>エラー</> : null}
        {!userInfo && !isError ? <>ローディング</> : null}
      </UserAuthContext.Provider>
    </>
  );
};

/**
 * 【Type】LiffContextTypeーーLIFF関連のliffContextのType。
 */
// export const userContextType = z.object({
//   id: z.string().nullable(),
//   userInfo: user.nullable(),
// });
/**
 * 【Type】LiffContextTypeーーLIFF関連のliffContextのType。
 */
// export type UserContextType = z.infer<
//   typeof userContextType
// >;
export type UserContextType = {
  userInfo: UserInfo | null
}
