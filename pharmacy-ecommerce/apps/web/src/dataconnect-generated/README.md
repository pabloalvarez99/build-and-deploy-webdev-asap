# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListPharmacies*](#listpharmacies)
  - [*GetUserPrescriptions*](#getuserprescriptions)
- [**Mutations**](#mutations)
  - [*CreateRefillOrder*](#createrefillorder)
  - [*UpdateUserProfile*](#updateuserprofile)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListPharmacies
You can execute the `ListPharmacies` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listPharmacies(): QueryPromise<ListPharmaciesData, undefined>;

interface ListPharmaciesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPharmaciesData, undefined>;
}
export const listPharmaciesRef: ListPharmaciesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listPharmacies(dc: DataConnect): QueryPromise<ListPharmaciesData, undefined>;

interface ListPharmaciesRef {
  ...
  (dc: DataConnect): QueryRef<ListPharmaciesData, undefined>;
}
export const listPharmaciesRef: ListPharmaciesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listPharmaciesRef:
```typescript
const name = listPharmaciesRef.operationName;
console.log(name);
```

### Variables
The `ListPharmacies` query has no variables.
### Return Type
Recall that executing the `ListPharmacies` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListPharmaciesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListPharmacies`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listPharmacies } from '@dataconnect/generated';


// Call the `listPharmacies()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listPharmacies();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listPharmacies(dataConnect);

console.log(data.pharmacies);

// Or, you can use the `Promise` API.
listPharmacies().then((response) => {
  const data = response.data;
  console.log(data.pharmacies);
});
```

### Using `ListPharmacies`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listPharmaciesRef } from '@dataconnect/generated';


// Call the `listPharmaciesRef()` function to get a reference to the query.
const ref = listPharmaciesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listPharmaciesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.pharmacies);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.pharmacies);
});
```

## GetUserPrescriptions
You can execute the `GetUserPrescriptions` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getUserPrescriptions(): QueryPromise<GetUserPrescriptionsData, undefined>;

interface GetUserPrescriptionsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserPrescriptionsData, undefined>;
}
export const getUserPrescriptionsRef: GetUserPrescriptionsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getUserPrescriptions(dc: DataConnect): QueryPromise<GetUserPrescriptionsData, undefined>;

interface GetUserPrescriptionsRef {
  ...
  (dc: DataConnect): QueryRef<GetUserPrescriptionsData, undefined>;
}
export const getUserPrescriptionsRef: GetUserPrescriptionsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getUserPrescriptionsRef:
```typescript
const name = getUserPrescriptionsRef.operationName;
console.log(name);
```

### Variables
The `GetUserPrescriptions` query has no variables.
### Return Type
Recall that executing the `GetUserPrescriptions` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetUserPrescriptionsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetUserPrescriptions`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getUserPrescriptions } from '@dataconnect/generated';


// Call the `getUserPrescriptions()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getUserPrescriptions();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getUserPrescriptions(dataConnect);

console.log(data.prescriptions);

// Or, you can use the `Promise` API.
getUserPrescriptions().then((response) => {
  const data = response.data;
  console.log(data.prescriptions);
});
```

### Using `GetUserPrescriptions`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getUserPrescriptionsRef } from '@dataconnect/generated';


// Call the `getUserPrescriptionsRef()` function to get a reference to the query.
const ref = getUserPrescriptionsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getUserPrescriptionsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.prescriptions);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.prescriptions);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateRefillOrder
You can execute the `CreateRefillOrder` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createRefillOrder(vars: CreateRefillOrderVariables): MutationPromise<CreateRefillOrderData, CreateRefillOrderVariables>;

interface CreateRefillOrderRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateRefillOrderVariables): MutationRef<CreateRefillOrderData, CreateRefillOrderVariables>;
}
export const createRefillOrderRef: CreateRefillOrderRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createRefillOrder(dc: DataConnect, vars: CreateRefillOrderVariables): MutationPromise<CreateRefillOrderData, CreateRefillOrderVariables>;

interface CreateRefillOrderRef {
  ...
  (dc: DataConnect, vars: CreateRefillOrderVariables): MutationRef<CreateRefillOrderData, CreateRefillOrderVariables>;
}
export const createRefillOrderRef: CreateRefillOrderRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createRefillOrderRef:
```typescript
const name = createRefillOrderRef.operationName;
console.log(name);
```

### Variables
The `CreateRefillOrder` mutation requires an argument of type `CreateRefillOrderVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateRefillOrderVariables {
  pharmacyId: UUIDString;
  prescriptionId: UUIDString;
  deliveryOption: string;
  deliveryAddress?: string | null;
  pickupTime?: TimestampString | null;
  notes?: string | null;
}
```
### Return Type
Recall that executing the `CreateRefillOrder` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateRefillOrderData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateRefillOrderData {
  refillOrder_insert: RefillOrder_Key;
}
```
### Using `CreateRefillOrder`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createRefillOrder, CreateRefillOrderVariables } from '@dataconnect/generated';

// The `CreateRefillOrder` mutation requires an argument of type `CreateRefillOrderVariables`:
const createRefillOrderVars: CreateRefillOrderVariables = {
  pharmacyId: ..., 
  prescriptionId: ..., 
  deliveryOption: ..., 
  deliveryAddress: ..., // optional
  pickupTime: ..., // optional
  notes: ..., // optional
};

// Call the `createRefillOrder()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createRefillOrder(createRefillOrderVars);
// Variables can be defined inline as well.
const { data } = await createRefillOrder({ pharmacyId: ..., prescriptionId: ..., deliveryOption: ..., deliveryAddress: ..., pickupTime: ..., notes: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createRefillOrder(dataConnect, createRefillOrderVars);

console.log(data.refillOrder_insert);

// Or, you can use the `Promise` API.
createRefillOrder(createRefillOrderVars).then((response) => {
  const data = response.data;
  console.log(data.refillOrder_insert);
});
```

### Using `CreateRefillOrder`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createRefillOrderRef, CreateRefillOrderVariables } from '@dataconnect/generated';

// The `CreateRefillOrder` mutation requires an argument of type `CreateRefillOrderVariables`:
const createRefillOrderVars: CreateRefillOrderVariables = {
  pharmacyId: ..., 
  prescriptionId: ..., 
  deliveryOption: ..., 
  deliveryAddress: ..., // optional
  pickupTime: ..., // optional
  notes: ..., // optional
};

// Call the `createRefillOrderRef()` function to get a reference to the mutation.
const ref = createRefillOrderRef(createRefillOrderVars);
// Variables can be defined inline as well.
const ref = createRefillOrderRef({ pharmacyId: ..., prescriptionId: ..., deliveryOption: ..., deliveryAddress: ..., pickupTime: ..., notes: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createRefillOrderRef(dataConnect, createRefillOrderVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.refillOrder_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.refillOrder_insert);
});
```

## UpdateUserProfile
You can execute the `UpdateUserProfile` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateUserProfile(vars: UpdateUserProfileVariables): MutationPromise<UpdateUserProfileData, UpdateUserProfileVariables>;

interface UpdateUserProfileRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateUserProfileVariables): MutationRef<UpdateUserProfileData, UpdateUserProfileVariables>;
}
export const updateUserProfileRef: UpdateUserProfileRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateUserProfile(dc: DataConnect, vars: UpdateUserProfileVariables): MutationPromise<UpdateUserProfileData, UpdateUserProfileVariables>;

interface UpdateUserProfileRef {
  ...
  (dc: DataConnect, vars: UpdateUserProfileVariables): MutationRef<UpdateUserProfileData, UpdateUserProfileVariables>;
}
export const updateUserProfileRef: UpdateUserProfileRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateUserProfileRef:
```typescript
const name = updateUserProfileRef.operationName;
console.log(name);
```

### Variables
The `UpdateUserProfile` mutation requires an argument of type `UpdateUserProfileVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateUserProfileVariables {
  displayName: string;
  address?: string | null;
  phoneNumber?: string | null;
  photoUrl?: string | null;
}
```
### Return Type
Recall that executing the `UpdateUserProfile` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateUserProfileData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateUserProfileData {
  user_update?: User_Key | null;
}
```
### Using `UpdateUserProfile`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateUserProfile, UpdateUserProfileVariables } from '@dataconnect/generated';

// The `UpdateUserProfile` mutation requires an argument of type `UpdateUserProfileVariables`:
const updateUserProfileVars: UpdateUserProfileVariables = {
  displayName: ..., 
  address: ..., // optional
  phoneNumber: ..., // optional
  photoUrl: ..., // optional
};

// Call the `updateUserProfile()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateUserProfile(updateUserProfileVars);
// Variables can be defined inline as well.
const { data } = await updateUserProfile({ displayName: ..., address: ..., phoneNumber: ..., photoUrl: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateUserProfile(dataConnect, updateUserProfileVars);

console.log(data.user_update);

// Or, you can use the `Promise` API.
updateUserProfile(updateUserProfileVars).then((response) => {
  const data = response.data;
  console.log(data.user_update);
});
```

### Using `UpdateUserProfile`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateUserProfileRef, UpdateUserProfileVariables } from '@dataconnect/generated';

// The `UpdateUserProfile` mutation requires an argument of type `UpdateUserProfileVariables`:
const updateUserProfileVars: UpdateUserProfileVariables = {
  displayName: ..., 
  address: ..., // optional
  phoneNumber: ..., // optional
  photoUrl: ..., // optional
};

// Call the `updateUserProfileRef()` function to get a reference to the mutation.
const ref = updateUserProfileRef(updateUserProfileVars);
// Variables can be defined inline as well.
const ref = updateUserProfileRef({ displayName: ..., address: ..., phoneNumber: ..., photoUrl: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateUserProfileRef(dataConnect, updateUserProfileVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_update);
});
```

