'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _extends6 = require('babel-runtime/helpers/extends');

var _extends7 = _interopRequireDefault(_extends6);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _debug2 = require('./debug');

var _debug3 = _interopRequireDefault(_debug2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug3.default)();
var _ = require('lodash');

exports.default = function (Model, _ref) {
  var _ref$deletedAt = _ref.deletedAt,
      deletedAt = _ref$deletedAt === undefined ? 'deletedAt' : _ref$deletedAt,
      _ref$_isDeleted = _ref._isDeleted,
      _isDeleted = _ref$_isDeleted === undefined ? '_isDeleted' : _ref$_isDeleted,
      _ref$scrub = _ref.scrub,
      scrub = _ref$scrub === undefined ? false : _ref$scrub;

  debug('SoftDelete mixin for Model %s', Model.modelName);

  debug('options', { deletedAt: deletedAt, _isDeleted: _isDeleted, scrub: scrub });

  var properties = Model.definition.properties;

  var scrubbed = {};
  if (scrub !== false) {
    var propertiesToScrub = scrub;
    if (!Array.isArray(propertiesToScrub)) {
      propertiesToScrub = (0, _keys2.default)(properties).filter(function (prop) {
        return !properties[prop].id && prop !== _isDeleted;
      });
    }
    scrubbed = propertiesToScrub.reduce(function (obj, prop) {
      return (0, _extends7.default)({}, obj, (0, _defineProperty3.default)({}, prop, null));
    }, {});
  }

  Model.defineProperty(deletedAt, { type: Date, required: false });
  Model.defineProperty(_isDeleted, { type: Boolean, required: true, default: false });

  Model.destroyAll = function softDestroyAll(where, options, cb) {
    var _extends3;

    if (typeof options === 'function' && !cb) {
      cb = options;
      options = undefined;
    }
    Model.updateAll(where, (0, _extends7.default)({}, scrubbed, (_extends3 = {}, (0, _defineProperty3.default)(_extends3, deletedAt, new Date()), (0, _defineProperty3.default)(_extends3, _isDeleted, true), _extends3)), options).then(function (result) {
      return typeof cb === 'function' ? cb(null, result) : result;
    }).catch(function (error) {
      return typeof cb === 'function' ? cb(error) : _promise2.default.reject(error);
    });
  };

  Model.remove = Model.destroyAll;
  Model.deleteAll = Model.destroyAll;

  Model.destroyById = function softDestroyById(id, options, cb) {
    var _extends4;

    if (typeof options === 'function' && !cb) {
      cb = options;
      options = undefined;
    }
    Model.updateAll({ id: id }, (0, _extends7.default)({}, scrubbed, (_extends4 = {}, (0, _defineProperty3.default)(_extends4, deletedAt, new Date()), (0, _defineProperty3.default)(_extends4, _isDeleted, true), _extends4)), options).then(function (result) {
      return typeof cb === 'function' ? cb(null, result) : result;
    }).catch(function (error) {
      return typeof cb === 'function' ? cb(error) : _promise2.default.reject(error);
    });
  };

  Model.removeById = Model.destroyById;
  Model.deleteById = Model.destroyById;

  Model.prototype.destroy = function softDestroy(options, cb) {
    var _extends5;

    var callback = cb === undefined && typeof options === 'function' ? options : cb;

    this.updateAttributes((0, _extends7.default)({}, scrubbed, (_extends5 = {}, (0, _defineProperty3.default)(_extends5, deletedAt, new Date()), (0, _defineProperty3.default)(_extends5, _isDeleted, true), _extends5))).then(function (result) {
      return typeof cb === 'function' ? callback(null, result) : result;
    }).catch(function (error) {
      return typeof cb === 'function' ? callback(error) : _promise2.default.reject(error);
    });
  };

  Model.prototype.remove = Model.prototype.destroy;
  Model.prototype.delete = Model.prototype.destroy;

  // Emulate default scope but with more flexibility.
  var queryNonDeleted = { _isDeleted: false };

  var _findOrCreate = Model.findOrCreate;
  Model.findOrCreate = function findOrCreateDeleted() {
    var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (!query.deleted) {
      if (!query.where || _.isEmpty(query.where)) {
        query.where = queryNonDeleted;
      } else {
        if (_.isEmpty(query.where)) {
          query.where = queryNonDeleted;
        } else {
          query.where = { and: [query.where, queryNonDeleted] };
        }
      }
    }

    for (var _len = arguments.length, rest = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      rest[_key - 1] = arguments[_key];
    }

    return _findOrCreate.call.apply(_findOrCreate, [Model, query].concat(rest));
  };

  var _find = Model.find;
  Model.find = function findDeleted() {
    var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (!query.deleted) {
      if (!query.where || _.isEmpty(query.where)) {
        query.where = queryNonDeleted;
      } else {
        if (_.isEmpty(query.where)) {
          query.where = queryNonDeleted;
        } else {
          query.where = { and: [query.where, queryNonDeleted] };
        }
      }
    }

    for (var _len2 = arguments.length, rest = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      rest[_key2 - 1] = arguments[_key2];
    }

    return _find.call.apply(_find, [Model, query].concat(rest));
  };

  var _count = Model.count;
  Model.count = function countDeleted() {
    var where = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    // Because count only receives a 'where', there's nowhere to ask for the deleted entities.
    var whereNotDeleted = queryNonDeleted;
    if (!_.isEmpty(where)) {
      whereNotDeleted = { and: [where, queryNonDeleted] };
    }

    for (var _len3 = arguments.length, rest = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      rest[_key3 - 1] = arguments[_key3];
    }

    return _count.call.apply(_count, [Model, whereNotDeleted].concat(rest));
  };

  var _update = Model.update;
  Model.update = Model.updateAll = function updateDeleted() {
    var where = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    // Because update/updateAll only receives a 'where', there's nowhere to ask for the deleted entities.
    var whereNotDeleted = queryNonDeleted;
    if (!_.isEmpty(where)) {
      whereNotDeleted = { and: [where, queryNonDeleted] };
    }

    for (var _len4 = arguments.length, rest = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
      rest[_key4 - 1] = arguments[_key4];
    }

    return _update.call.apply(_update, [Model, whereNotDeleted].concat(rest));
  };
};

module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNvZnQtZGVsZXRlLmpzIl0sIm5hbWVzIjpbImRlYnVnIiwiXyIsInJlcXVpcmUiLCJNb2RlbCIsImRlbGV0ZWRBdCIsIl9pc0RlbGV0ZWQiLCJzY3J1YiIsIm1vZGVsTmFtZSIsInByb3BlcnRpZXMiLCJkZWZpbml0aW9uIiwic2NydWJiZWQiLCJwcm9wZXJ0aWVzVG9TY3J1YiIsIkFycmF5IiwiaXNBcnJheSIsImZpbHRlciIsInByb3AiLCJpZCIsInJlZHVjZSIsIm9iaiIsImRlZmluZVByb3BlcnR5IiwidHlwZSIsIkRhdGUiLCJyZXF1aXJlZCIsIkJvb2xlYW4iLCJkZWZhdWx0IiwiZGVzdHJveUFsbCIsInNvZnREZXN0cm95QWxsIiwid2hlcmUiLCJvcHRpb25zIiwiY2IiLCJ1bmRlZmluZWQiLCJ1cGRhdGVBbGwiLCJ0aGVuIiwicmVzdWx0IiwiY2F0Y2giLCJlcnJvciIsInJlamVjdCIsInJlbW92ZSIsImRlbGV0ZUFsbCIsImRlc3Ryb3lCeUlkIiwic29mdERlc3Ryb3lCeUlkIiwicmVtb3ZlQnlJZCIsImRlbGV0ZUJ5SWQiLCJwcm90b3R5cGUiLCJkZXN0cm95Iiwic29mdERlc3Ryb3kiLCJjYWxsYmFjayIsInVwZGF0ZUF0dHJpYnV0ZXMiLCJkZWxldGUiLCJxdWVyeU5vbkRlbGV0ZWQiLCJfZmluZE9yQ3JlYXRlIiwiZmluZE9yQ3JlYXRlIiwiZmluZE9yQ3JlYXRlRGVsZXRlZCIsInF1ZXJ5IiwiZGVsZXRlZCIsImlzRW1wdHkiLCJhbmQiLCJyZXN0IiwiY2FsbCIsIl9maW5kIiwiZmluZCIsImZpbmREZWxldGVkIiwiX2NvdW50IiwiY291bnQiLCJjb3VudERlbGV0ZWQiLCJ3aGVyZU5vdERlbGV0ZWQiLCJfdXBkYXRlIiwidXBkYXRlIiwidXBkYXRlRGVsZXRlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7QUFDQSxJQUFNQSxRQUFRLHNCQUFkO0FBQ0EsSUFBTUMsSUFBSUMsUUFBUSxRQUFSLENB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ZUFBdEI7QUFDQSxRQUFJLENBQUVoRCxFQUFFc0QsT0FBRixDQUFVNUIsS0FBVixDQUFOLEVBQXdCO0FBQ3RCc0Msd0JBQWtCLEVBQUVULEtBQUssQ0FBRTdCLEtBQUYsRUFBU3NCLGVBQVQsQ0FBUCxFQUFsQjtBQUNEOztBQUwwRSx1Q0FBTlEsSUFBTTtBQUFOQSxVQUFNO0FBQUE7O0FBTTNFLFdBQU9TLFFBQVFSLElBQVIsaUJBQWF2RCxLQUFiLEVBQW9COEQsZUFBcEIsU0FBd0NSLElBQXhDLEVBQVA7QUFDRCxHQVBEO0FBUUQsQyIsImZpbGUiOiJzb2Z0LWRlbGV0ZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfZGVidWcgZnJvbSAnLi9kZWJ1Zyc7XG5jb25zdCBkZWJ1ZyA9IF9kZWJ1ZygpO1xuY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG5leHBvcnQgZGVmYXVsdCAoTW9kZWwsIHsgZGVsZXRlZEF0ID0gJ2RlbGV0ZWRBdCcsIF9pc0RlbGV0ZWQgPSAnX2lzRGVsZXRlZCcsIHNjcnViID0gZmFsc2UgfSkgPT4ge1xuICBkZWJ1ZygnU29mdERlbGV0ZSBtaXhpbiBmb3IgTW9kZWwgJXMnLCBNb2RlbC5tb2RlbE5hbWUpO1xuXG4gIGRlYnVnKCdvcHRpb25zJywgeyBkZWxldGVkQXQsIF9pc0RlbGV0ZWQsIHNjcnViIH0pO1xuXG4gIGNvbnN0IHByb3BlcnRpZXMgPSBNb2RlbC5kZWZpbml0aW9uLnByb3BlcnRpZXM7XG5cbiAgbGV0IHNjcnViYmVkID0ge307XG4gIGlmIChzY3J1YiAhPT0gZmFsc2UpIHtcbiAgICBsZXQgcHJvcGVydGllc1RvU2NydWIgPSBzY3J1YjtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkocHJvcGVydGllc1RvU2NydWIpKSB7XG4gICAgICBwcm9wZXJ0aWVzVG9TY3J1YiA9IE9iamVjdC5rZXlzKHByb3BlcnRpZXMpXG4gICAgICAgIC5maWx0ZXIocHJvcCA9PiAhcHJvcGVydGllc1twcm9wXS5pZCAmJiBwcm9wICE9PSBfaXNEZWxldGVkKTtcbiAgICB9XG4gICAgc2NydWJiZWQgPSBwcm9wZXJ0aWVzVG9TY3J1Yi5yZWR1Y2UoKG9iaiwgcHJvcCkgPT4gKHsgLi4ub2JqLCBbcHJvcF06IG51bGwgfSksIHt9KTtcbiAgfVxuXG4gIE1vZGVsLmRlZmluZVByb3BlcnR5KGRlbGV0ZWRBdCwge3R5cGU6IERhdGUsIHJlcXVpcmVkOiBmYWxzZX0pO1xuICBNb2RlbC5kZWZpbmVQcm9wZXJ0eShfaXNEZWxldGVkLCB7dHlwZTogQm9vbGVhbiwgcmVxdWlyZWQ6IHRydWUsIGRlZmF1bHQ6IGZhbHNlfSk7XG5cbiAgTW9kZWwuZGVzdHJveUFsbCA9IGZ1bmN0aW9uIHNvZnREZXN0cm95QWxsKHdoZXJlLCBvcHRpb25zLCBjYikge1xuICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJyAmJiAhY2IpIHtcbiAgICAgIGNiID0gb3B0aW9ucztcbiAgICAgIG9wdGlvbnMgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIE1vZGVsLnVwZGF0ZUFsbCh3aGVyZSwgeyAuLi5zY3J1YmJlZCwgW2RlbGV0ZWRBdF06IG5ldyBEYXRlKCksIFtfaXNEZWxldGVkXTogdHJ1ZSB9LCBvcHRpb25zKVxuICAgICAgLnRoZW4ocmVzdWx0ID0+ICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpID8gY2IobnVsbCwgcmVzdWx0KSA6IHJlc3VsdClcbiAgICAgIC5jYXRjaChlcnJvciA9PiAodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSA/IGNiKGVycm9yKSA6IFByb21pc2UucmVqZWN0KGVycm9yKSk7XG4gIH07XG5cbiAgTW9kZWwucmVtb3ZlID0gTW9kZWwuZGVzdHJveUFsbDtcbiAgTW9kZWwuZGVsZXRlQWxsID0gTW9kZWwuZGVzdHJveUFsbDtcblxuICBNb2RlbC5kZXN0cm95QnlJZCA9IGZ1bmN0aW9uIHNvZnREZXN0cm95QnlJZChpZCwgb3B0aW9ucywgY2IpIHtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicgJiYgIWNiKSB7XG4gICAgICBjYiA9IG9wdGlvbnM7XG4gICAgICBvcHRpb25zID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBNb2RlbC51cGRhdGVBbGwoeyBpZDogaWQgfSwgeyAuLi5zY3J1YmJlZCwgW2RlbGV0ZWRBdF06IG5ldyBEYXRlKCksIFtfaXNEZWxldGVkXTogdHJ1ZSB9LCBvcHRpb25zKVxuICAgICAgLnRoZW4ocmVzdWx0ID0+ICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpID8gY2IobnVsbCwgcmVzdWx0KSA6IHJlc3VsdClcbiAgICAgIC5jYXRjaChlcnJvciA9PiAodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSA/IGNiKGVycm9yKSA6IFByb21pc2UucmVqZWN0KGVycm9yKSk7XG4gIH07XG5cbiAgTW9kZWwucmVtb3ZlQnlJZCA9IE1vZGVsLmRlc3Ryb3lCeUlkO1xuICBNb2RlbC5kZWxldGVCeUlkID0gTW9kZWwuZGVzdHJveUJ5SWQ7XG5cbiAgTW9kZWwucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiBzb2Z0RGVzdHJveShvcHRpb25zLCBjYikge1xuICAgIGNvbnN0IGNhbGxiYWNrID0gKGNiID09PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpID8gb3B0aW9ucyA6IGNiO1xuXG4gICAgdGhpcy51cGRhdGVBdHRyaWJ1dGVzKHsgLi4uc2NydWJiZWQsIFtkZWxldGVkQXRdOiBuZXcgRGF0ZSgpLCBbX2lzRGVsZXRlZF06IHRydWUgfSlcbiAgICAgIC50aGVuKHJlc3VsdCA9PiAodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSA/IGNhbGxiYWNrKG51bGwsIHJlc3VsdCkgOiByZXN1bHQpXG4gICAgICAuY2F0Y2goZXJyb3IgPT4gKHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgPyBjYWxsYmFjayhlcnJvcikgOiBQcm9taXNlLnJlamVjdChlcnJvcikpO1xuICB9O1xuXG4gIE1vZGVsLnByb3RvdHlwZS5yZW1vdmUgPSBNb2RlbC5wcm90b3R5cGUuZGVzdHJveTtcbiAgTW9kZWwucHJvdG90eXBlLmRlbGV0ZSA9IE1vZGVsLnByb3RvdHlwZS5kZXN0cm95O1xuXG4gIC8vIEVtdWxhdGUgZGVmYXVsdCBzY29wZSBidXQgd2l0aCBtb3JlIGZsZXhpYmlsaXR5LlxuICBjb25zdCBxdWVyeU5vbkRlbGV0ZWQgPSB7X2lzRGVsZXRlZDogZmFsc2V9O1xuXG4gIGNvbnN0IF9maW5kT3JDcmVhdGUgPSBNb2RlbC5maW5kT3JDcmVhdGU7XG4gIE1vZGVsLmZpbmRPckNyZWF0ZSA9IGZ1bmN0aW9uIGZpbmRPckNyZWF0ZURlbGV0ZWQocXVlcnkgPSB7fSwgLi4ucmVzdCkge1xuICAgIGlmICghcXVlcnkuZGVsZXRlZCkge1xuICAgICAgaWYgKCFxdWVyeS53aGVyZSB8fCBfLmlzRW1wdHkocXVlcnkud2hlcmUpKSB7XG4gICAgICAgIHF1ZXJ5LndoZXJlID0gcXVlcnlOb25EZWxldGVkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKF8uaXNFbXB0eShxdWVyeS53aGVyZSkpIHtcbiAgICAgICAgICBxdWVyeS53aGVyZSA9IHF1ZXJ5Tm9uRGVsZXRlZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBxdWVyeS53aGVyZSA9IHsgYW5kOiBbIHF1ZXJ5LndoZXJlLCBxdWVyeU5vbkRlbGV0ZWQgXSB9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIF9maW5kT3JDcmVhdGUuY2FsbChNb2RlbCwgcXVlcnksIC4uLnJlc3QpO1xuICB9O1xuXG4gIGNvbnN0IF9maW5kID0gTW9kZWwuZmluZDtcbiAgTW9kZWwuZmluZCA9IGZ1bmN0aW9uIGZpbmREZWxldGVkKHF1ZXJ5ID0ge30sIC4uLnJlc3QpIHtcbiAgICBpZiAoIXF1ZXJ5LmRlbGV0ZWQpIHtcbiAgICAgIGlmICghcXVlcnkud2hlcmUgfHwgXy5pc0VtcHR5KHF1ZXJ5LndoZXJlKSkge1xuICAgICAgICBxdWVyeS53aGVyZSA9IHF1ZXJ5Tm9uRGVsZXRlZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChfLmlzRW1wdHkocXVlcnkud2hlcmUpKSB7XG4gICAgICAgICAgcXVlcnkud2hlcmUgPSBxdWVyeU5vbkRlbGV0ZWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcXVlcnkud2hlcmUgPSB7IGFuZDogWyBxdWVyeS53aGVyZSwgcXVlcnlOb25EZWxldGVkIF0gfTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBfZmluZC5jYWxsKE1vZGVsLCBxdWVyeSwgLi4ucmVzdCk7XG4gIH07XG5cbiAgY29uc3QgX2NvdW50ID0gTW9kZWwuY291bnQ7XG4gIE1vZGVsLmNvdW50ID0gZnVuY3Rpb24gY291bnREZWxldGVkKHdoZXJlID0ge30sIC4uLnJlc3QpIHtcbiAgICAvLyBCZWNhdXNlIGNvdW50IG9ubHkgcmVjZWl2ZXMgYSAnd2hlcmUnLCB0aGVyZSdzIG5vd2hlcmUgdG8gYXNrIGZvciB0aGUgZGVsZXRlZCBlbnRpdGllcy5cbiAgICBsZXQgd2hlcmVOb3REZWxldGVkID0gcXVlcnlOb25EZWxldGVkO1xuICAgIGlmICghIF8uaXNFbXB0eSh3aGVyZSkpIHtcbiAgICAgIHdoZXJlTm90RGVsZXRlZCA9IHsgYW5kOiBbIHdoZXJlLCBxdWVyeU5vbkRlbGV0ZWQgXSB9O1xuICAgIH1cbiAgICByZXR1cm4gX2NvdW50LmNhbGwoTW9kZWwsIHdoZXJlTm90RGVsZXRlZCwgLi4ucmVzdCk7XG4gIH07XG5cbiAgY29uc3QgX3VwZGF0ZSA9IE1vZGVsLnVwZGF0ZTtcbiAgTW9kZWwudXBkYXRlID0gTW9kZWwudXBkYXRlQWxsID0gZnVuY3Rpb24gdXBkYXRlRGVsZXRlZCh3aGVyZSA9IHt9LCAuLi5yZXN0KSB7XG4gICAgLy8gQmVjYXVzZSB1cGRhdGUvdXBkYXRlQWxsIG9ubHkgcmVjZWl2ZXMgYSAnd2hlcmUnLCB0aGVyZSdzIG5vd2hlcmUgdG8gYXNrIGZvciB0aGUgZGVsZXRlZCBlbnRpdGllcy5cbiAgICBsZXQgd2hlcmVOb3REZWxldGVkID0gcXVlcnlOb25EZWxldGVkO1xuICAgIGlmICghIF8uaXNFbXB0eSh3aGVyZSkpIHtcbiAgICAgIHdoZXJlTm90RGVsZXRlZCA9IHsgYW5kOiBbIHdoZXJlLCBxdWVyeU5vbkRlbGV0ZWQgXSB9O1xuICAgIH1cbiAgICByZXR1cm4gX3VwZGF0ZS5jYWxsKE1vZGVsLCB3aGVyZU5vdERlbGV0ZWQsIC4uLnJlc3QpO1xuICB9O1xufTtcbiJdfQ==
