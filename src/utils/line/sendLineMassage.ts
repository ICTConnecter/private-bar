import { SendMessagesParams } from "@liff/send-messages";

/** 【sendLineMassage】LINEのトークルームへのメッセージ送信
 * * 関連事項
 * * * 【Component】LiffーーLIFF関連のComponent。
 * * * 【Function】decodeIDTokenーーLIFF関連のidをdecodeするFunction。
 * * * 【ZodObject】decodeIdTokenResultーーLIFF関連のデコード後のZodObject。
 * * * 【Type】DecodeIdTokenResultーーLIFF関連のデコード後のType。
 * * * 【ZodObject】liffContextTypeーーLIFF関連のliffContextのZodObject。
 * * * 【Type】LiffContextTypeーーLIFF関連のliffContextのType。
 */
export const sendLineMassage = async (
  lineId: string,
  message: SendMessagesParams
): Promise<void> => {
  const url = "https://api.line.me/v2/bot/message/push";
  const channelAccessToken = process.env.LINE_TALKROOM_SUPPORTER

  const data = {
    to: lineId,
    messages: message,
  };
  fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + channelAccessToken,
    },
    method: `POST`,
    body: JSON.stringify(data),
  });
};

