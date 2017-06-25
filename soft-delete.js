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
  var queryNonDeleted = (0, _defineProperty3.default)({}, _isDeleted, false);

  var _findOrCreate = Model.findOrCreate;
  Model.findOrCreate = function findOrCreateDeleted() {
    var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (!query.deleted) {
      if (!query.where || _.isEmpty(query.where)) {
        query.where = queryNonDeleted;
      } else {
        if (!query.where[_isDeleted]) // this should be a deep check!
          query.where = { and: [query.where, queryNonDeleted] };
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
        if (!query.where[_isDeleted]) // this should be a deep check!
          query.where = { and: [query.where, queryNonDeleted] };
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
      if (where[_isDeleted]) {
        whereNotDeleted = where;
      } else {
        whereNotDeleted = { and: [where, queryNonDeleted] };
      }
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
      if (where[_isDeleted]) {
        whereNotDeleted = where;
      } else {
        whereNotDeleted = { and: [where, queryNonDeleted] };
      }
    }

    for (var _len4 = arguments.length, rest = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
      rest[_key4 - 1] = arguments[_key4];
    }

    return _update.call.apply(_update, [Model, whereNotDeleted].concat(rest));
  };
};

module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNvZnQtZGVsZXRlLmpzIl0sIm5hbWVzIjpbImRlYnVnIiwiXyIsInJlcXVpcmUiLCJNb2RlbCIsImRlbGV0ZWRBdCIsIl9pc0RlbGV0ZWQiLCJzY3J1YiIsIm1vZGVsTmFtZSIsInByb3BlcnRpZXMiLCJkZWZpbml0aW9uIiwic2NydWJiZWQiLCJwcm9wZXJ0aWVzVG9TY3J1YiIsIkFycmF5IiwiaXNBcnJheSIsImZpbHRlciIsInByb3AiLCJpZCIsInJlZHVjZSIsIm9iaiIsImRlZmluZVByb3BlcnR5IiwidHlwZSIsIkRhdGUiLCJyZXF1aXJlZCIsIkJvb2xlYW4iLCJkZWZhdWx0IiwiZGVzdHJveUFsbCIsInNvZnREZXN0cm95QWxsIiwid2hlcmUiLCJvcHRpb25zIiwiY2IiLCJ1bmRlZmluZWQiLCJ1cGRhdGVBbGwiLCJ0aGVuIiwicmVzdWx0IiwiY2F0Y2giLCJlcnJvciIsInJlamVjdCIsInJlbW92ZSIsImRlbGV0ZUFsbCIsImRlc3Ryb3lCeUlkIiwic29mdERlc3Ryb3lCeUlkIiwicmVtb3ZlQnlJZCIsImRlbGV0ZUJ5SWQiLCJwcm90b3R5cGUiLCJkZXN0cm95Iiwic29mdERlc3Ryb3kiLCJjYWxsYmFjayIsInVwZGF0ZUF0dHJpYnV0ZXMiLCJkZWxldGUiLCJxdWVyeU5vbkRlbGV0ZWQiLCJfZmluZE9yQ3JlYXRlIiwiZmluZE9yQ3JlYXRlIiwiZmluZE9yQ3JlYXRlRGVsZXRlZCIsInF1ZXJ5IiwiZGVsZXRlZCIsImlzRW1wdHkiLCJhbmQiLCJyZXN0IiwiY2FsbCIsIl9maW5kIiwiZmluZCIsImZpbmREZWxldGVkIiwiX2NvdW50IiwiY291bnQiLCJjb3VudERlbGV0ZWQiLCJ3aGVyZU5vdERlbGV0ZWQiLCJfdXBkYXRlIiwidXBkYXRlIiwidXBkYXRlRGVsZXRlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7QUFDQSxJQUFNQSxRQUFRLHNCQUFkO0FBQ0EsSUFBTUMsSUFBSUMsUUFBUSxRQUFSLENB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QUFGLENBQVU1QixLQUFWLENBQU4sRUFBd0I7QUFDdEIsVUFBSUEsTUFBTXRCLFVBQU4sQ0FBSixFQUF1QjtBQUNyQjRELDBCQUFrQnRDLEtBQWxCO0FBQ0QsT0FGRCxNQUVPO0FBQ0xzQywwQkFBa0IsRUFBRVQsS0FBSyxDQUFFN0IsS0FBRixFQUFTc0IsZUFBVCxDQUFQLEVBQWxCO0FBQ0Q7QUFDRjs7QUFUMEUsdUNBQU5RLElBQU07QUFBTkEsVUFBTTtBQUFBOztBQVUzRSxXQUFPUyxRQUFRUixJQUFSLGlCQUFhdkQsS0FBYixFQUFvQjhELGVBQXBCLFNBQXdDUixJQUF4QyxFQUFQO0FBQ0QsR0FYRDtBQVlELEMiLCJmaWxlIjoic29mdC1kZWxldGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgX2RlYnVnIGZyb20gJy4vZGVidWcnO1xuY29uc3QgZGVidWcgPSBfZGVidWcoKTtcbmNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxuZXhwb3J0IGRlZmF1bHQgKE1vZGVsLCB7IGRlbGV0ZWRBdCA9ICdkZWxldGVkQXQnLCBfaXNEZWxldGVkID0gJ19pc0RlbGV0ZWQnLCBzY3J1YiA9IGZhbHNlIH0pID0+IHtcbiAgZGVidWcoJ1NvZnREZWxldGUgbWl4aW4gZm9yIE1vZGVsICVzJywgTW9kZWwubW9kZWxOYW1lKTtcblxuICBkZWJ1Zygnb3B0aW9ucycsIHsgZGVsZXRlZEF0LCBfaXNEZWxldGVkLCBzY3J1YiB9KTtcblxuICBjb25zdCBwcm9wZXJ0aWVzID0gTW9kZWwuZGVmaW5pdGlvbi5wcm9wZXJ0aWVzO1xuXG4gIGxldCBzY3J1YmJlZCA9IHt9O1xuICBpZiAoc2NydWIgIT09IGZhbHNlKSB7XG4gICAgbGV0IHByb3BlcnRpZXNUb1NjcnViID0gc2NydWI7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHByb3BlcnRpZXNUb1NjcnViKSkge1xuICAgICAgcHJvcGVydGllc1RvU2NydWIgPSBPYmplY3Qua2V5cyhwcm9wZXJ0aWVzKVxuICAgICAgICAuZmlsdGVyKHByb3AgPT4gIXByb3BlcnRpZXNbcHJvcF0uaWQgJiYgcHJvcCAhPT0gX2lzRGVsZXRlZCk7XG4gICAgfVxuICAgIHNjcnViYmVkID0gcHJvcGVydGllc1RvU2NydWIucmVkdWNlKChvYmosIHByb3ApID0+ICh7IC4uLm9iaiwgW3Byb3BdOiBudWxsIH0pLCB7fSk7XG4gIH1cblxuICBNb2RlbC5kZWZpbmVQcm9wZXJ0eShkZWxldGVkQXQsIHt0eXBlOiBEYXRlLCByZXF1aXJlZDogZmFsc2V9KTtcbiAgTW9kZWwuZGVmaW5lUHJvcGVydHkoX2lzRGVsZXRlZCwge3R5cGU6IEJvb2xlYW4sIHJlcXVpcmVkOiB0cnVlLCBkZWZhdWx0OiBmYWxzZX0pO1xuXG4gIE1vZGVsLmRlc3Ryb3lBbGwgPSBmdW5jdGlvbiBzb2Z0RGVzdHJveUFsbCh3aGVyZSwgb3B0aW9ucywgY2IpIHtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicgJiYgIWNiKSB7XG4gICAgICBjYiA9IG9wdGlvbnM7XG4gICAgICBvcHRpb25zID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBNb2RlbC51cGRhdGVBbGwod2hlcmUsIHsgLi4uc2NydWJiZWQsIFtkZWxldGVkQXRdOiBuZXcgRGF0ZSgpLCBbX2lzRGVsZXRlZF06IHRydWUgfSwgb3B0aW9ucylcbiAgICAgIC50aGVuKHJlc3VsdCA9PiAodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSA/IGNiKG51bGwsIHJlc3VsdCkgOiByZXN1bHQpXG4gICAgICAuY2F0Y2goZXJyb3IgPT4gKHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgPyBjYihlcnJvcikgOiBQcm9taXNlLnJlamVjdChlcnJvcikpO1xuICB9O1xuXG4gIE1vZGVsLnJlbW92ZSA9IE1vZGVsLmRlc3Ryb3lBbGw7XG4gIE1vZGVsLmRlbGV0ZUFsbCA9IE1vZGVsLmRlc3Ryb3lBbGw7XG5cbiAgTW9kZWwuZGVzdHJveUJ5SWQgPSBmdW5jdGlvbiBzb2Z0RGVzdHJveUJ5SWQoaWQsIG9wdGlvbnMsIGNiKSB7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnZnVuY3Rpb24nICYmICFjYikge1xuICAgICAgY2IgPSBvcHRpb25zO1xuICAgICAgb3B0aW9ucyA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgTW9kZWwudXBkYXRlQWxsKHsgaWQ6IGlkIH0sIHsgLi4uc2NydWJiZWQsIFtkZWxldGVkQXRdOiBuZXcgRGF0ZSgpLCBbX2lzRGVsZXRlZF06IHRydWUgfSwgb3B0aW9ucylcbiAgICAgIC50aGVuKHJlc3VsdCA9PiAodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSA/IGNiKG51bGwsIHJlc3VsdCkgOiByZXN1bHQpXG4gICAgICAuY2F0Y2goZXJyb3IgPT4gKHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgPyBjYihlcnJvcikgOiBQcm9taXNlLnJlamVjdChlcnJvcikpO1xuICB9O1xuXG4gIE1vZGVsLnJlbW92ZUJ5SWQgPSBNb2RlbC5kZXN0cm95QnlJZDtcbiAgTW9kZWwuZGVsZXRlQnlJZCA9IE1vZGVsLmRlc3Ryb3lCeUlkO1xuXG4gIE1vZGVsLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gc29mdERlc3Ryb3kob3B0aW9ucywgY2IpIHtcbiAgICBjb25zdCBjYWxsYmFjayA9IChjYiA9PT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvcHRpb25zID09PSAnZnVuY3Rpb24nKSA/IG9wdGlvbnMgOiBjYjtcblxuICAgIHRoaXMudXBkYXRlQXR0cmlidXRlcyh7IC4uLnNjcnViYmVkLCBbZGVsZXRlZEF0XTogbmV3IERhdGUoKSwgW19pc0RlbGV0ZWRdOiB0cnVlIH0pXG4gICAgICAudGhlbihyZXN1bHQgPT4gKHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgPyBjYWxsYmFjayhudWxsLCByZXN1bHQpIDogcmVzdWx0KVxuICAgICAgLmNhdGNoKGVycm9yID0+ICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpID8gY2FsbGJhY2soZXJyb3IpIDogUHJvbWlzZS5yZWplY3QoZXJyb3IpKTtcbiAgfTtcblxuICBNb2RlbC5wcm90b3R5cGUucmVtb3ZlID0gTW9kZWwucHJvdG90eXBlLmRlc3Ryb3k7XG4gIE1vZGVsLnByb3RvdHlwZS5kZWxldGUgPSBNb2RlbC5wcm90b3R5cGUuZGVzdHJveTtcblxuICAvLyBFbXVsYXRlIGRlZmF1bHQgc2NvcGUgYnV0IHdpdGggbW9yZSBmbGV4aWJpbGl0eS5cbiAgY29uc3QgcXVlcnlOb25EZWxldGVkID0ge1tfaXNEZWxldGVkXTogZmFsc2V9O1xuXG4gIGNvbnN0IF9maW5kT3JDcmVhdGUgPSBNb2RlbC5maW5kT3JDcmVhdGU7XG4gIE1vZGVsLmZpbmRPckNyZWF0ZSA9IGZ1bmN0aW9uIGZpbmRPckNyZWF0ZURlbGV0ZWQocXVlcnkgPSB7fSwgLi4ucmVzdCkge1xuICAgIGlmICghcXVlcnkuZGVsZXRlZCkge1xuICAgICAgaWYgKCFxdWVyeS53aGVyZSB8fCBfLmlzRW1wdHkocXVlcnkud2hlcmUpKSB7XG4gICAgICAgIHF1ZXJ5LndoZXJlID0gcXVlcnlOb25EZWxldGVkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCFxdWVyeS53aGVyZVtfaXNEZWxldGVkXSkgLy8gdGhpcyBzaG91bGQgYmUgYSBkZWVwIGNoZWNrIVxuICAgICAgICAgIHF1ZXJ5LndoZXJlID0geyBhbmQ6IFsgcXVlcnkud2hlcmUsIHF1ZXJ5Tm9uRGVsZXRlZCBdIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIF9maW5kT3JDcmVhdGUuY2FsbChNb2RlbCwgcXVlcnksIC4uLnJlc3QpO1xuICB9O1xuXG4gIGNvbnN0IF9maW5kID0gTW9kZWwuZmluZDtcbiAgTW9kZWwuZmluZCA9IGZ1bmN0aW9uIGZpbmREZWxldGVkKHF1ZXJ5ID0ge30sIC4uLnJlc3QpIHtcbiAgICBpZiAoIXF1ZXJ5LmRlbGV0ZWQpIHtcbiAgICAgIGlmICghcXVlcnkud2hlcmUgfHwgXy5pc0VtcHR5KHF1ZXJ5LndoZXJlKSkge1xuICAgICAgICBxdWVyeS53aGVyZSA9IHF1ZXJ5Tm9uRGVsZXRlZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICghcXVlcnkud2hlcmVbX2lzRGVsZXRlZF0pIC8vIHRoaXMgc2hvdWxkIGJlIGEgZGVlcCBjaGVjayFcbiAgICAgICAgICBxdWVyeS53aGVyZSA9IHsgYW5kOiBbIHF1ZXJ5LndoZXJlLCBxdWVyeU5vbkRlbGV0ZWQgXSB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBfZmluZC5jYWxsKE1vZGVsLCBxdWVyeSwgLi4ucmVzdCk7XG4gIH07XG5cbiAgY29uc3QgX2NvdW50ID0gTW9kZWwuY291bnQ7XG4gIE1vZGVsLmNvdW50ID0gZnVuY3Rpb24gY291bnREZWxldGVkKHdoZXJlID0ge30sIC4uLnJlc3QpIHtcbiAgICAvLyBCZWNhdXNlIGNvdW50IG9ubHkgcmVjZWl2ZXMgYSAnd2hlcmUnLCB0aGVyZSdzIG5vd2hlcmUgdG8gYXNrIGZvciB0aGUgZGVsZXRlZCBlbnRpdGllcy5cbiAgICBsZXQgd2hlcmVOb3REZWxldGVkID0gcXVlcnlOb25EZWxldGVkO1xuICAgIGlmICghIF8uaXNFbXB0eSh3aGVyZSkpIHtcbiAgICAgIGlmICh3aGVyZVtfaXNEZWxldGVkXSkge1xuICAgICAgICB3aGVyZU5vdERlbGV0ZWQgPSB3aGVyZTsgIFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd2hlcmVOb3REZWxldGVkID0geyBhbmQ6IFsgd2hlcmUsIHF1ZXJ5Tm9uRGVsZXRlZCBdIH07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBfY291bnQuY2FsbChNb2RlbCwgd2hlcmVOb3REZWxldGVkLCAuLi5yZXN0KTtcbiAgfTtcblxuICBjb25zdCBfdXBkYXRlID0gTW9kZWwudXBkYXRlO1xuICBNb2RlbC51cGRhdGUgPSBNb2RlbC51cGRhdGVBbGwgPSBmdW5jdGlvbiB1cGRhdGVEZWxldGVkKHdoZXJlID0ge30sIC4uLnJlc3QpIHtcbiAgICAvLyBCZWNhdXNlIHVwZGF0ZS91cGRhdGVBbGwgb25seSByZWNlaXZlcyBhICd3aGVyZScsIHRoZXJlJ3Mgbm93aGVyZSB0byBhc2sgZm9yIHRoZSBkZWxldGVkIGVudGl0aWVzLlxuICAgIGxldCB3aGVyZU5vdERlbGV0ZWQgPSBxdWVyeU5vbkRlbGV0ZWQ7XG4gICAgaWYgKCEgXy5pc0VtcHR5KHdoZXJlKSkge1xuICAgICAgaWYgKHdoZXJlW19pc0RlbGV0ZWRdKSB7XG4gICAgICAgIHdoZXJlTm90RGVsZXRlZCA9IHdoZXJlOyAgXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB3aGVyZU5vdERlbGV0ZWQgPSB7IGFuZDogWyB3aGVyZSwgcXVlcnlOb25EZWxldGVkIF0gfTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIF91cGRhdGUuY2FsbChNb2RlbCwgd2hlcmVOb3REZWxldGVkLCAuLi5yZXN0KTtcbiAgfTtcbn07XG4iXX0=
