import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Product {
    id: bigint;
    name: string;
    description: string;
    isActive: boolean;
    category: string;
    image?: ExternalBlob;
    keyBenefits: string;
}
export interface Reminder {
    id: bigint;
    linkedDoctorId?: bigint;
    title: string;
    note: string;
    dueDate: bigint;
    isDone: boolean;
}
export interface Doctor {
    id: bigint;
    areaTerritory: string;
    name: string;
    email: string;
    specialty: string;
    address: string;
    notes: string;
    phone: string;
    clinicName: string;
}
export interface Visit {
    id: bigint;
    doctorId: bigint;
    productsDiscussed: Array<bigint>;
    callNotes: string;
    date: bigint;
    nextVisitDate?: bigint;
    outcome: VisitOutcome;
}
export interface UserProfile {
    territory: string;
    name: string;
    employeeId: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum VisitOutcome {
    negative = "negative",
    positive = "positive",
    neutral = "neutral"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createReminder(reminder: Reminder): Promise<void>;
    createVisit(visit: Visit): Promise<void>;
    deleteDoctor(id: bigint): Promise<void>;
    deleteProduct(id: bigint): Promise<void>;
    deleteReminder(id: bigint): Promise<void>;
    deleteVisit(id: bigint): Promise<void>;
    getAllDoctors(): Promise<Array<Doctor>>;
    getAllProducts(): Promise<Array<Product>>;
    getAllReminders(): Promise<Array<Reminder>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDashboardSummary(): Promise<{
        totalProducts: bigint;
        totalDoctors: bigint;
        visitsThisMonth: bigint;
        pendingReminders: bigint;
    }>;
    getDoctor(id: bigint): Promise<Doctor | null>;
    getProduct(id: bigint): Promise<Product | null>;
    getReminder(id: bigint): Promise<Reminder | null>;
    getTodaysVisits(): Promise<Array<Visit>>;
    getUpcomingReminders(): Promise<Array<Reminder>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVisit(id: bigint): Promise<Visit | null>;
    getVisitsByDoctor(doctorId: bigint): Promise<Array<Visit>>;
    isCallerAdmin(): Promise<boolean>;
    markReminderDone(id: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateReminder(id: bigint, reminder: Reminder): Promise<void>;
    updateVisit(id: bigint, visit: Visit): Promise<void>;
    upsertDoctor(doctor: Doctor): Promise<bigint>;
    upsertProduct(product: Product): Promise<bigint>;
}
