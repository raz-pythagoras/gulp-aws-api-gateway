var _ = require('lodash');
var forEachCallback = require('./for-each-callback.js');

module.exports = function(awsApiGateway) {
  function generateResourceTree(apiId, paths, callback) {
    awsApiGateway.getResources(
      apiId,
      function(error, resources) {
        forEachCallback(
          paths,
          function(path, nextStep) {
            ensureResource(apiId, path, resources, nextStep);
          },
          callback
        );

      }
    );
  }



  function ensureResource(apiId, path, resources, callback) {
    var subPath;
    var pathNodes = path.split('/');

    if (path === '') {
      process.nextTick(function() {
        callback(null);
      });
      return;
    }

    var existingResource = _.find(resources, {'path': path});
    if (existingResource) {
      process.nextTick(function() {
        callback(null);
      });
      return;
    }

    console.log(path + ' missing');
    ensureResource(
      apiId,
      pathNodes.slice(0, -1).join('/'),
      resources,
      function(error) {
        if (error) {
          callback(error);
          return;
        }

        createResource(path, function(error, resource) {
          if (error) {
            callback(error);
            return;
          }

          resources.push(resource);
          callback(null);
        })
      }
    );


    function createResource(path, callback) {
      var parentPath = path.split('/').slice(0, -1).join('/');
      var parentId = _.result(
        _.find(
          resources,
          {'path': parentPath.length ? parentPath : '/'}
        ),
        'id'
      );

      awsApiGateway.createResource(
        apiId,
        parentId,
        path.split('/').pop(),
        callback
      );
    }

    _.find(resources, {'path': path})
  }

  return generateResourceTree;
};

