import { ListPharmaciesData, GetUserPrescriptionsData, CreateRefillOrderData, CreateRefillOrderVariables, UpdateUserProfileData, UpdateUserProfileVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useListPharmacies(options?: useDataConnectQueryOptions<ListPharmaciesData>): UseDataConnectQueryResult<ListPharmaciesData, undefined>;
export function useListPharmacies(dc: DataConnect, options?: useDataConnectQueryOptions<ListPharmaciesData>): UseDataConnectQueryResult<ListPharmaciesData, undefined>;

export function useGetUserPrescriptions(options?: useDataConnectQueryOptions<GetUserPrescriptionsData>): UseDataConnectQueryResult<GetUserPrescriptionsData, undefined>;
export function useGetUserPrescriptions(dc: DataConnect, options?: useDataConnectQueryOptions<GetUserPrescriptionsData>): UseDataConnectQueryResult<GetUserPrescriptionsData, undefined>;

export function useCreateRefillOrder(options?: useDataConnectMutationOptions<CreateRefillOrderData, FirebaseError, CreateRefillOrderVariables>): UseDataConnectMutationResult<CreateRefillOrderData, CreateRefillOrderVariables>;
export function useCreateRefillOrder(dc: DataConnect, options?: useDataConnectMutationOptions<CreateRefillOrderData, FirebaseError, CreateRefillOrderVariables>): UseDataConnectMutationResult<CreateRefillOrderData, CreateRefillOrderVariables>;

export function useUpdateUserProfile(options?: useDataConnectMutationOptions<UpdateUserProfileData, FirebaseError, UpdateUserProfileVariables>): UseDataConnectMutationResult<UpdateUserProfileData, UpdateUserProfileVariables>;
export function useUpdateUserProfile(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateUserProfileData, FirebaseError, UpdateUserProfileVariables>): UseDataConnectMutationResult<UpdateUserProfileData, UpdateUserProfileVariables>;
