# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { listPharmacies, getUserPrescriptions, createRefillOrder, updateUserProfile } from '@dataconnect/generated';


// Operation ListPharmacies: 
const { data } = await ListPharmacies(dataConnect);

// Operation GetUserPrescriptions: 
const { data } = await GetUserPrescriptions(dataConnect);

// Operation CreateRefillOrder:  For variables, look at type CreateRefillOrderVars in ../index.d.ts
const { data } = await CreateRefillOrder(dataConnect, createRefillOrderVars);

// Operation UpdateUserProfile:  For variables, look at type UpdateUserProfileVars in ../index.d.ts
const { data } = await UpdateUserProfile(dataConnect, updateUserProfileVars);


```