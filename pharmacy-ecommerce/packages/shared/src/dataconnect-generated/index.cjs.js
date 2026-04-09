const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'build-and-deploy-webdev-asap',
  location: 'southamerica-east1'
};
exports.connectorConfig = connectorConfig;

const listPharmaciesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListPharmacies');
}
listPharmaciesRef.operationName = 'ListPharmacies';
exports.listPharmaciesRef = listPharmaciesRef;

exports.listPharmacies = function listPharmacies(dc) {
  return executeQuery(listPharmaciesRef(dc));
};

const getUserPrescriptionsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetUserPrescriptions');
}
getUserPrescriptionsRef.operationName = 'GetUserPrescriptions';
exports.getUserPrescriptionsRef = getUserPrescriptionsRef;

exports.getUserPrescriptions = function getUserPrescriptions(dc) {
  return executeQuery(getUserPrescriptionsRef(dc));
};

const createRefillOrderRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateRefillOrder', inputVars);
}
createRefillOrderRef.operationName = 'CreateRefillOrder';
exports.createRefillOrderRef = createRefillOrderRef;

exports.createRefillOrder = function createRefillOrder(dcOrVars, vars) {
  return executeMutation(createRefillOrderRef(dcOrVars, vars));
};

const updateUserProfileRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateUserProfile', inputVars);
}
updateUserProfileRef.operationName = 'UpdateUserProfile';
exports.updateUserProfileRef = updateUserProfileRef;

exports.updateUserProfile = function updateUserProfile(dcOrVars, vars) {
  return executeMutation(updateUserProfileRef(dcOrVars, vars));
};
