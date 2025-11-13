// import { z } from "zod";

/** 【Function】decodeIDTokenーーLIFF関連のidをdecodeするFunction。
 * * 関連事項
 * * * 【Context】liffContextーーLIFF関連のContext。
 * * * 【Component】LiffーーLIFF関連のComponent。
 * * * 【ZodObject】decodeIdTokenResultーーLIFF関連のデコード後のZodObject。
 * * * 【Type】DecodeIdTokenResultーーLIFF関連のデコード後のType。
 * * * 【ZodObject】liffContextTypeーーLIFF関連のliffContextのZodObject。
 * * * 【Type】LiffContextTypeーーLIFF関連のliffContextのType。
 */
export const decodeIdToken = async (
  idToken: string
): Promise<DecodeIdTokenResult> => {
  const url = "https://api.line.me/oauth2/v2.1/verify";
  const result = await fetch(url, {
    method: `POST`,
    body: new URLSearchParams({
      'id_token': idToken,
      'client_id': process.env.NEXT_PUBLIC_LINE_CHANNEL_ID!,
    }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  }).then((r) => r.json());

  if (result.error) {
    throw new Error();
  }

  return result;
};

// const decodeIdTokenResult = z.object({
//   iss: z.string(),
//   sub: z.string(),
//   aud: z.string(),
//   exp: z.number(),
//   iat: z.number(),
//   auth_time: z.number().optional(),
//   nonce: z.string().optional(),
//   amr: z.array(z.string()).optional(),
//   name: z.string().optional(),
//   picture: z.string().optional(),
//   email: z.string().optional(),
// });
// type DecodeIdTokenResult = z.infer<typeof decodeIdTokenResult>;
export type DecodeIdTokenResult = {
  iss: string,
  sub: string,
  aud: string,
  exp: number,
  iat: number,
  auth_time?: number | undefined,
  nonce?: string | undefined,
  amr?: string[] | undefined,
  name?: string | undefined,
  picture?: string | undefined,
  email?: string | undefined,
}