import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface CreateRefillOrderData {
  refillOrder_insert: RefillOrder_Key;
}

export interface CreateRefillOrderVariables {
  pharmacyId: UUIDString;
  prescriptionId: UUIDString;
  deliveryOption: string;
  deliveryAddress?: string | null;
  pickupTime?: TimestampString | null;
  notes?: string | null;
}

export interface GetUserPrescriptionsData {
  prescriptions: ({
    id: UUIDString;
    medicationName: string;
    dosage: string;
    instructions: string;
    issueDate: DateString;
    expirationDate: DateString;
    imageUrl: string;
    prescriberName?: string | null;
    notes?: string | null;
  } & Prescription_Key)[];
}

export interface ListPharmaciesData {
  pharmacies: ({
    id: UUIDString;
    name: string;
    address: string;
    phoneNumber: string;
    operatingHours: string;
    website?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } & Pharmacy_Key)[];
}

export interface MedicationPrice_Key {
  id: UUIDString;
  __typename?: 'MedicationPrice_Key';
}

export interface Pharmacy_Key {
  id: UUIDString;
  __typename?: 'Pharmacy_Key';
}

export interface Prescription_Key {
  id: UUIDString;
  __typename?: 'Prescription_Key';
}

export interface RefillOrder_Key {
  id: UUIDString;
  __typename?: 'RefillOrder_Key';
}

export interface UpdateUserProfileData {
  user_update?: User_Key | null;
}

export interface UpdateUserProfileVariables {
  displayName: string;
  address?: string | null;
  phoneNumber?: string | null;
  photoUrl?: string | null;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface ListPharmaciesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPharmaciesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListPharmaciesData, undefined>;
  operationName: string;
}
export const listPharmaciesRef: ListPharmaciesRef;

export function listPharmacies(): QueryPromise<ListPharmaciesData, undefined>;
export function listPharmacies(dc: DataConnect): QueryPromise<ListPharmaciesData, undefined>;

interface GetUserPrescriptionsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserPrescriptionsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetUserPrescriptionsData, undefined>;
  operationName: string;
}
export const getUserPrescriptionsRef: GetUserPrescriptionsRef;

export function getUserPrescriptions(): QueryPromise<GetUserPrescriptionsData, undefined>;
export function getUserPrescriptions(dc: DataConnect): QueryPromise<GetUserPrescriptionsData, undefined>;

interface CreateRefillOrderRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateRefillOrderVariables): MutationRef<CreateRefillOrderData, CreateRefillOrderVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateRefillOrderVariables): MutationRef<CreateRefillOrderData, CreateRefillOrderVariables>;
  operationName: string;
}
export const createRefillOrderRef: CreateRefillOrderRef;

export function createRefillOrder(vars: CreateRefillOrderVariables): MutationPromise<CreateRefillOrderData, CreateRefillOrderVariables>;
export function createRefillOrder(dc: DataConnect, vars: CreateRefillOrderVariables): MutationPromise<CreateRefillOrderData, CreateRefillOrderVariables>;

interface UpdateUserProfileRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateUserProfileVariables): MutationRef<UpdateUserProfileData, UpdateUserProfileVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateUserProfileVariables): MutationRef<UpdateUserProfileData, UpdateUserProfileVariables>;
  operationName: string;
}
export const updateUserProfileRef: UpdateUserProfileRef;

export function updateUserProfile(vars: UpdateUserProfileVariables): MutationPromise<UpdateUserProfileData, UpdateUserProfileVariables>;
export function updateUserProfile(dc: DataConnect, vars: UpdateUserProfileVariables): MutationPromise<UpdateUserProfileData, UpdateUserProfileVariables>;

