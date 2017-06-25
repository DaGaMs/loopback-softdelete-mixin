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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNvZnQtZGVsZXRlLmpzIl0sIm5hbWVzIjpbImRlYnVnIiwiXyIsInJlcXVpcmUiLCJNb2RlbCIsImRlbGV0ZWRBdCIsIl9pc0RlbGV0ZWQiLCJzY3J1YiIsIm1vZGVsTmFtZSIsInByb3BlcnRpZXMiLCJkZWZpbml0aW9uIiwic2NydWJiZWQiLCJwcm9wZXJ0aWVzVG9TY3J1YiIsIkFycmF5IiwiaXNBcnJheSIsImZpbHRlciIsInByb3AiLCJpZCIsInJlZHVjZSIsIm9iaiIsImRlZmluZVByb3BlcnR5IiwidHlwZSIsIkRhdGUiLCJyZXF1aXJlZCIsIkJvb2xlYW4iLCJkZWZhdWx0IiwiZGVzdHJveUFsbCIsInNvZnREZXN0cm95QWxsIiwid2hlcmUiLCJvcHRpb25zIiwiY2IiLCJ1bmRlZmluZWQiLCJ1cGRhdGVBbGwiLCJ0aGVuIiwicmVzdWx0IiwiY2F0Y2giLCJlcnJvciIsInJlamVjdCIsInJlbW92ZSIsImRlbGV0ZUFsbCIsImRlc3Ryb3lCeUlkIiwic29mdERlc3Ryb3lCeUlkIiwicmVtb3ZlQnlJZCIsImRlbGV0ZUJ5SWQiLCJwcm90b3R5cGUiLCJkZXN0cm95Iiwic29mdERlc3Ryb3kiLCJjYWxsYmFjayIsInVwZGF0ZUF0dHJpYnV0ZXMiLCJkZWxldGUiLCJxdWVyeU5vbkRlbGV0ZWQiLCJfZmluZE9yQ3JlYXRlIiwiZmluZE9yQ3JlYXRlIiwiZmluZE9yQ3JlYXRlRGVsZXRlZCIsInF1ZXJ5IiwiZGVsZXRlZCIsImlzRW1wdHkiLCJhbmQiLCJyZXN0IiwiY2FsbCIsIl9maW5kIiwiZmluZCIsImZpbmREZWxldGVkIiwiX2NvdW50IiwiY291bnQiLCJjb3VudERlbGV0ZWQiLCJ3aGVyZU5vdERlbGV0ZWQiLCJfdXBkYXRlIiwidXBkYXRlIiwidXBkYXRlRGVsZXRlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7QUFDQSxJQUFNQSxRQUFRLHNCQUFkO0FBQ0EsSUFBTUMsSUFBSUMsUUFBUSxRQUFSLENB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QixlQUF0QjtBQUNBLFFBQUksQ0FBRWhELEVBQUVzRCxPQUFGLENBQVU1QixLQUFWLENBQU4sRUFBd0I7QUFDdEJzQyx3QkFBa0IsRUFBRVQsS0FBSyxDQUFFN0IsS0FBRixFQUFTc0IsZUFBVCxDQUFQLEVBQWxCO0FBQ0Q7O0FBTDBFLHVDQUFOUSxJQUFNO0FBQU5BLFVBQU07QUFBQTs7QUFNM0UsV0FBT1MsUUFBUVIsSUFBUixpQkFBYXZELEtBQWIsRUFBb0I4RCxlQUFwQixTQUF3Q1IsSUFBeEMsRUFBUDtBQUNELEdBUEQ7QUFRRCxDIiwiZmlsZSI6InNvZnQtZGVsZXRlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF9kZWJ1ZyBmcm9tICcuL2RlYnVnJztcbmNvbnN0IGRlYnVnID0gX2RlYnVnKCk7XG5jb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cbmV4cG9ydCBkZWZhdWx0IChNb2RlbCwgeyBkZWxldGVkQXQgPSAnZGVsZXRlZEF0JywgX2lzRGVsZXRlZCA9ICdfaXNEZWxldGVkJywgc2NydWIgPSBmYWxzZSB9KSA9PiB7XG4gIGRlYnVnKCdTb2Z0RGVsZXRlIG1peGluIGZvciBNb2RlbCAlcycsIE1vZGVsLm1vZGVsTmFtZSk7XG5cbiAgZGVidWcoJ29wdGlvbnMnLCB7IGRlbGV0ZWRBdCwgX2lzRGVsZXRlZCwgc2NydWIgfSk7XG5cbiAgY29uc3QgcHJvcGVydGllcyA9IE1vZGVsLmRlZmluaXRpb24ucHJvcGVydGllcztcblxuICBsZXQgc2NydWJiZWQgPSB7fTtcbiAgaWYgKHNjcnViICE9PSBmYWxzZSkge1xuICAgIGxldCBwcm9wZXJ0aWVzVG9TY3J1YiA9IHNjcnViO1xuICAgIGlmICghQXJyYXkuaXNBcnJheShwcm9wZXJ0aWVzVG9TY3J1YikpIHtcbiAgICAgIHByb3BlcnRpZXNUb1NjcnViID0gT2JqZWN0LmtleXMocHJvcGVydGllcylcbiAgICAgICAgLmZpbHRlcihwcm9wID0+ICFwcm9wZXJ0aWVzW3Byb3BdLmlkICYmIHByb3AgIT09IF9pc0RlbGV0ZWQpO1xuICAgIH1cbiAgICBzY3J1YmJlZCA9IHByb3BlcnRpZXNUb1NjcnViLnJlZHVjZSgob2JqLCBwcm9wKSA9PiAoeyAuLi5vYmosIFtwcm9wXTogbnVsbCB9KSwge30pO1xuICB9XG5cbiAgTW9kZWwuZGVmaW5lUHJvcGVydHkoZGVsZXRlZEF0LCB7dHlwZTogRGF0ZSwgcmVxdWlyZWQ6IGZhbHNlfSk7XG4gIE1vZGVsLmRlZmluZVByb3BlcnR5KF9pc0RlbGV0ZWQsIHt0eXBlOiBCb29sZWFuLCByZXF1aXJlZDogdHJ1ZSwgZGVmYXVsdDogZmFsc2V9KTtcblxuICBNb2RlbC5kZXN0cm95QWxsID0gZnVuY3Rpb24gc29mdERlc3Ryb3lBbGwod2hlcmUsIG9wdGlvbnMsIGNiKSB7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnZnVuY3Rpb24nICYmICFjYikge1xuICAgICAgY2IgPSBvcHRpb25zO1xuICAgICAgb3B0aW9ucyA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgTW9kZWwudXBkYXRlQWxsKHdoZXJlLCB7IC4uLnNjcnViYmVkLCBbZGVsZXRlZEF0XTogbmV3IERhdGUoKSwgW19pc0RlbGV0ZWRdOiB0cnVlIH0sIG9wdGlvbnMpXG4gICAgICAudGhlbihyZXN1bHQgPT4gKHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgPyBjYihudWxsLCByZXN1bHQpIDogcmVzdWx0KVxuICAgICAgLmNhdGNoKGVycm9yID0+ICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpID8gY2IoZXJyb3IpIDogUHJvbWlzZS5yZWplY3QoZXJyb3IpKTtcbiAgfTtcblxuICBNb2RlbC5yZW1vdmUgPSBNb2RlbC5kZXN0cm95QWxsO1xuICBNb2RlbC5kZWxldGVBbGwgPSBNb2RlbC5kZXN0cm95QWxsO1xuXG4gIE1vZGVsLmRlc3Ryb3lCeUlkID0gZnVuY3Rpb24gc29mdERlc3Ryb3lCeUlkKGlkLCBvcHRpb25zLCBjYikge1xuICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJyAmJiAhY2IpIHtcbiAgICAgIGNiID0gb3B0aW9ucztcbiAgICAgIG9wdGlvbnMgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIE1vZGVsLnVwZGF0ZUFsbCh7IGlkOiBpZCB9LCB7IC4uLnNjcnViYmVkLCBbZGVsZXRlZEF0XTogbmV3IERhdGUoKSwgW19pc0RlbGV0ZWRdOiB0cnVlIH0sIG9wdGlvbnMpXG4gICAgICAudGhlbihyZXN1bHQgPT4gKHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgPyBjYihudWxsLCByZXN1bHQpIDogcmVzdWx0KVxuICAgICAgLmNhdGNoKGVycm9yID0+ICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpID8gY2IoZXJyb3IpIDogUHJvbWlzZS5yZWplY3QoZXJyb3IpKTtcbiAgfTtcblxuICBNb2RlbC5yZW1vdmVCeUlkID0gTW9kZWwuZGVzdHJveUJ5SWQ7XG4gIE1vZGVsLmRlbGV0ZUJ5SWQgPSBNb2RlbC5kZXN0cm95QnlJZDtcblxuICBNb2RlbC5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uIHNvZnREZXN0cm95KG9wdGlvbnMsIGNiKSB7XG4gICAgY29uc3QgY2FsbGJhY2sgPSAoY2IgPT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygb3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJykgPyBvcHRpb25zIDogY2I7XG5cbiAgICB0aGlzLnVwZGF0ZUF0dHJpYnV0ZXMoeyAuLi5zY3J1YmJlZCwgW2RlbGV0ZWRBdF06IG5ldyBEYXRlKCksIFtfaXNEZWxldGVkXTogdHJ1ZSB9KVxuICAgICAgLnRoZW4ocmVzdWx0ID0+ICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpID8gY2FsbGJhY2sobnVsbCwgcmVzdWx0KSA6IHJlc3VsdClcbiAgICAgIC5jYXRjaChlcnJvciA9PiAodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSA/IGNhbGxiYWNrKGVycm9yKSA6IFByb21pc2UucmVqZWN0KGVycm9yKSk7XG4gIH07XG5cbiAgTW9kZWwucHJvdG90eXBlLnJlbW92ZSA9IE1vZGVsLnByb3RvdHlwZS5kZXN0cm95O1xuICBNb2RlbC5wcm90b3R5cGUuZGVsZXRlID0gTW9kZWwucHJvdG90eXBlLmRlc3Ryb3k7XG5cbiAgLy8gRW11bGF0ZSBkZWZhdWx0IHNjb3BlIGJ1dCB3aXRoIG1vcmUgZmxleGliaWxpdHkuXG4gIGNvbnN0IHF1ZXJ5Tm9uRGVsZXRlZCA9IHtbX2lzRGVsZXRlZF06IGZhbHNlfTtcblxuICBjb25zdCBfZmluZE9yQ3JlYXRlID0gTW9kZWwuZmluZE9yQ3JlYXRlO1xuICBNb2RlbC5maW5kT3JDcmVhdGUgPSBmdW5jdGlvbiBmaW5kT3JDcmVhdGVEZWxldGVkKHF1ZXJ5ID0ge30sIC4uLnJlc3QpIHtcbiAgICBpZiAoIXF1ZXJ5LmRlbGV0ZWQpIHtcbiAgICAgIGlmICghcXVlcnkud2hlcmUgfHwgXy5pc0VtcHR5KHF1ZXJ5LndoZXJlKSkge1xuICAgICAgICBxdWVyeS53aGVyZSA9IHF1ZXJ5Tm9uRGVsZXRlZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChfLmlzRW1wdHkocXVlcnkud2hlcmUpKSB7XG4gICAgICAgICAgcXVlcnkud2hlcmUgPSBxdWVyeU5vbkRlbGV0ZWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcXVlcnkud2hlcmUgPSB7IGFuZDogWyBxdWVyeS53aGVyZSwgcXVlcnlOb25EZWxldGVkIF0gfTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBfZmluZE9yQ3JlYXRlLmNhbGwoTW9kZWwsIHF1ZXJ5LCAuLi5yZXN0KTtcbiAgfTtcblxuICBjb25zdCBfZmluZCA9IE1vZGVsLmZpbmQ7XG4gIE1vZGVsLmZpbmQgPSBmdW5jdGlvbiBmaW5kRGVsZXRlZChxdWVyeSA9IHt9LCAuLi5yZXN0KSB7XG4gICAgaWYgKCFxdWVyeS5kZWxldGVkKSB7XG4gICAgICBpZiAoIXF1ZXJ5LndoZXJlIHx8IF8uaXNFbXB0eShxdWVyeS53aGVyZSkpIHtcbiAgICAgICAgcXVlcnkud2hlcmUgPSBxdWVyeU5vbkRlbGV0ZWQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoXy5pc0VtcHR5KHF1ZXJ5LndoZXJlKSkge1xuICAgICAgICAgIHF1ZXJ5LndoZXJlID0gcXVlcnlOb25EZWxldGVkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHF1ZXJ5LndoZXJlID0geyBhbmQ6IFsgcXVlcnkud2hlcmUsIHF1ZXJ5Tm9uRGVsZXRlZCBdIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gX2ZpbmQuY2FsbChNb2RlbCwgcXVlcnksIC4uLnJlc3QpO1xuICB9O1xuXG4gIGNvbnN0IF9jb3VudCA9IE1vZGVsLmNvdW50O1xuICBNb2RlbC5jb3VudCA9IGZ1bmN0aW9uIGNvdW50RGVsZXRlZCh3aGVyZSA9IHt9LCAuLi5yZXN0KSB7XG4gICAgLy8gQmVjYXVzZSBjb3VudCBvbmx5IHJlY2VpdmVzIGEgJ3doZXJlJywgdGhlcmUncyBub3doZXJlIHRvIGFzayBmb3IgdGhlIGRlbGV0ZWQgZW50aXRpZXMuXG4gICAgbGV0IHdoZXJlTm90RGVsZXRlZCA9IHF1ZXJ5Tm9uRGVsZXRlZDtcbiAgICBpZiAoISBfLmlzRW1wdHkod2hlcmUpKSB7XG4gICAgICB3aGVyZU5vdERlbGV0ZWQgPSB7IGFuZDogWyB3aGVyZSwgcXVlcnlOb25EZWxldGVkIF0gfTtcbiAgICB9XG4gICAgcmV0dXJuIF9jb3VudC5jYWxsKE1vZGVsLCB3aGVyZU5vdERlbGV0ZWQsIC4uLnJlc3QpO1xuICB9O1xuXG4gIGNvbnN0IF91cGRhdGUgPSBNb2RlbC51cGRhdGU7XG4gIE1vZGVsLnVwZGF0ZSA9IE1vZGVsLnVwZGF0ZUFsbCA9IGZ1bmN0aW9uIHVwZGF0ZURlbGV0ZWQod2hlcmUgPSB7fSwgLi4ucmVzdCkge1xuICAgIC8vIEJlY2F1c2UgdXBkYXRlL3VwZGF0ZUFsbCBvbmx5IHJlY2VpdmVzIGEgJ3doZXJlJywgdGhlcmUncyBub3doZXJlIHRvIGFzayBmb3IgdGhlIGRlbGV0ZWQgZW50aXRpZXMuXG4gICAgbGV0IHdoZXJlTm90RGVsZXRlZCA9IHF1ZXJ5Tm9uRGVsZXRlZDtcbiAgICBpZiAoISBfLmlzRW1wdHkod2hlcmUpKSB7XG4gICAgICB3aGVyZU5vdERlbGV0ZWQgPSB7IGFuZDogWyB3aGVyZSwgcXVlcnlOb25EZWxldGVkIF0gfTtcbiAgICB9XG4gICAgcmV0dXJuIF91cGRhdGUuY2FsbChNb2RlbCwgd2hlcmVOb3REZWxldGVkLCAuLi5yZXN0KTtcbiAgfTtcbn07XG4iXX0=
