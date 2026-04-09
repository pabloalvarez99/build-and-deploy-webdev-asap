import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'build-and-deploy-webdev-asap',
  location: 'southamerica-east1'
};

export const listPharmaciesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListPharmacies');
}
listPharmaciesRef.operationName = 'ListPharmacies';

export function listPharmacies(dc) {
  return executeQuery(listPharmaciesRef(dc));
}

export const getUserPrescriptionsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetUserPrescriptions');
}
getUserPrescriptionsRef.operationName = 'GetUserPrescriptions';

export function getUserPrescriptions(dc) {
  return executeQuery(getUserPrescriptionsRef(dc));
}

export const createRefillOrderRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateRefillOrder', inputVars);
}
createRefillOrderRef.operationName = 'CreateRefillOrder';

export function createRefillOrder(dcOrVars, vars) {
  return executeMutation(createRefillOrderRef(dcOrVars, vars));
}

export const updateUserProfileRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateUserProfile', inputVars);
}
updateUserProfileRef.operationName = 'UpdateUserProfile';

export function updateUserProfile(dcOrVars, vars) {
  return executeMutation(updateUserProfileRef(dcOrVars, vars));
}

