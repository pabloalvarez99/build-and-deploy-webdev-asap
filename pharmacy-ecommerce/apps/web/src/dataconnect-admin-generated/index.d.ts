import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

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

/** Generated Node Admin SDK operation action function for the 'ListPharmacies' Query. Allow users to execute without passing in DataConnect. */
export function listPharmacies(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<ListPharmaciesData>>;
/** Generated Node Admin SDK operation action function for the 'ListPharmacies' Query. Allow users to pass in custom DataConnect instances. */
export function listPharmacies(options?: OperationOptions): Promise<ExecuteOperationResponse<ListPharmaciesData>>;

/** Generated Node Admin SDK operation action function for the 'GetUserPrescriptions' Query. Allow users to execute without passing in DataConnect. */
export function getUserPrescriptions(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<GetUserPrescriptionsData>>;
/** Generated Node Admin SDK operation action function for the 'GetUserPrescriptions' Query. Allow users to pass in custom DataConnect instances. */
export function getUserPrescriptions(options?: OperationOptions): Promise<ExecuteOperationResponse<GetUserPrescriptionsData>>;

/** Generated Node Admin SDK operation action function for the 'CreateRefillOrder' Mutation. Allow users to execute without passing in DataConnect. */
export function createRefillOrder(dc: DataConnect, vars: CreateRefillOrderVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateRefillOrderData>>;
/** Generated Node Admin SDK operation action function for the 'CreateRefillOrder' Mutation. Allow users to pass in custom DataConnect instances. */
export function createRefillOrder(vars: CreateRefillOrderVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateRefillOrderData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateUserProfile' Mutation. Allow users to execute without passing in DataConnect. */
export function updateUserProfile(dc: DataConnect, vars: UpdateUserProfileVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateUserProfileData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateUserProfile' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateUserProfile(vars: UpdateUserProfileVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateUserProfileData>>;

