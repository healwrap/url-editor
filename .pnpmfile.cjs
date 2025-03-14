function readPackage(packageJson, context) {
  if (['lightningcss'].includes(packageJson.name) && packageJson.optionalDependencies) {
    packageJson.optionalDependencies = {}; // 清空 optionalDependencies
  }
  return packageJson;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
