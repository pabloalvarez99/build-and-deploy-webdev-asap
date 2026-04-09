const { validateAdminArgs } = require('firebase-admin/data-connect');

const connectorConfig = {
  connector: 'example',
  serviceId: 'build-and-deploy-webdev-asap',
  location: 'southamerica-east1'
};
exports.connectorConfig = connectorConfig;

function listPharmacies(dcOrOptions, options) {
  const { dc: dcInstance, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrOptions, options, undefined);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListPharmacies', undefined, inputOpts);
}
exports.listPharmacies = listPharmacies;

function getUserPrescriptions(dcOrOptions, options) {
  const { dc: dcInstance, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrOptions, options, undefined);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('GetUserPrescriptions', undefined, inputOpts);
}
exports.getUserPrescriptions = getUserPrescriptions;

function createRefillOrder(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('CreateRefillOrder', inputVars, inputOpts);
}
exports.createRefillOrder = createRefillOrder;

function updateUserProfile(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('UpdateUserProfile', inputVars, inputOpts);
}
exports.updateUserProfile = updateUserProfile;

