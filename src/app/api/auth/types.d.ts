import { User } from "@/types/firestore/User";

export type GetResType = Omit<User, "lineId">;