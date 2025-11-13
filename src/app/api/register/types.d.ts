import { User } from "@/types/firestore/User";

export type PostReqType = Omit<User, "lineId" | "createAt" | "updateAt">