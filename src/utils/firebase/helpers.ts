import { getAdminDb } from './admin';
import { User } from '@/types/firestore/User';
import { Reservation } from '@/types/firestore/Reservation';
import { ReservationSlot } from '@/types/firestore/ReservationSlot';

/**
 * ユーザー情報を取得
 */
export async function getUserByUid(uid: string): Promise<User | null> {
  const db = getAdminDb();
  const userDoc = await db.collection('users').doc(uid).get();

  if (!userDoc.exists) {
    return null;
  }

  return { ...userDoc.data(), uid: userDoc.id } as User;
}

/**
 * ユーザーがオーナーかどうかを確認
 */
export async function isOwner(uid: string): Promise<boolean> {
  const user = await getUserByUid(uid);
  return user?.role === 'owner';
}

/**
 * ユーザーが承認済みかどうかを確認
 */
export async function isApprovedUser(uid: string): Promise<boolean> {
  const user = await getUserByUid(uid);
  return user?.status === 'approved';
}

/**
 * 特定の日付の予約枠を取得
 */
export async function getReservationSlotByDate(date: string): Promise<ReservationSlot | null> {
  const db = getAdminDb();
  const slotsSnapshot = await db.collection('reservationSlots')
    .where('date', '==', date)
    .limit(1)
    .get();

  if (slotsSnapshot.empty) {
    return null;
  }

  const doc = slotsSnapshot.docs[0];
  return { ...doc.data(), id: doc.id } as ReservationSlot;
}

/**
 * 特定の日付が予約可能かどうかを確認
 */
export async function isDateAvailable(date: string): Promise<boolean> {
  const slot = await getReservationSlotByDate(date);
  return slot?.available === true && slot?.reservedBy === null;
}

/**
 * 予約を取得
 */
export async function getReservationById(id: string): Promise<Reservation | null> {
  const db = getAdminDb();
  const reservationDoc = await db.collection('reservations').doc(id).get();

  if (!reservationDoc.exists) {
    return null;
  }

  return { ...reservationDoc.data(), id: reservationDoc.id } as Reservation;
}

/**
 * ユーザーの予約を取得
 */
export async function getReservationsByUserId(
  userId: string,
  status?: 'confirmed' | 'cancelled'
): Promise<Reservation[]> {
  const db = getAdminDb();
  let query = db.collection('reservations')
    .where('userId', '==', userId)
    .orderBy('date', 'desc');

  if (status) {
    query = query.where('status', '==', status) as any;
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Reservation));
}

/**
 * 日付が過去かどうかを確認
 */
export function isPastDate(date: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  return checkDate < today;
}

/**
 * 招待コードを生成
 */
export function generateInvitationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
