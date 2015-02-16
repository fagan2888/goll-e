// Highly modeled after the interface for YUI's Attribute.
// Though much simpler internally. 

var ObjectUtils = require('./../utilities/objects');
var Lang = require('./../utilities/lang');

var OPTS = {
  GETTER: 'getter',
  SETTER: 'setter',
  READ_ONLY: 'readOnly',
  WRITE_ONCE: 'writeOnce',
  INIT_ONLY: 'initOnly',
  VALIDATOR: 'validator',
  VALUE: 'value',
  VALUE_FN: 'valueFn'
};

/* 
private properties related to an attr are written to _attrState:
_setValue - takes precedence over value and valueFn, which shant be changed.
_writtenOnce - whether it's been set at least once
 */

var VALID_OPTIONS = ObjectUtils.values(OPTS);

var validateConfig = function(cfg) {
  for (var key in cfg) {
    if (cfg.hasOwnProperty(key) &&
      VALID_OPTIONS.indexOf(key) === -1) {
      console.error('Invalid config parameter: ' + key);
      return false;
    }
  }

  if (cfg[OPTS.READ_ONLY] && !(OPTS.VALUE in cfg)) {
    console.error('readOnly attribute ' + name + ' must have an initial value.');
    return false;
  }

  return true;
};

var stringToInstanceMethod = function(functionName) {
  if (!Lang.isFunction(this[functionName])) {
    console.error('Instance method function ' + functionName + ' does not exist.');
  }
  return this[functionName];
};

/**
 * 
 * A mixin
 * @class Attribute
 * @constructor
 */
var Attribute = function() {
  this._attrConfigs = {};
  this._attrStates = {};
};

Attribute.prototype = {

  addAttrs: function(configs) {
    ObjectUtils.each(configs, function(config, name) {
      this.addAttr(name, config);
    }, this);
  },

  addAttr: function(name, config) {
    // protect the config
    config = Object.freeze(config);

    if (ObjectUtils.hasKey(this._attrConfigs, name)) {
      console.error('There is already an attribute with name "' + name + '"');
      return;
    }

    if (!validateConfig(config)) {
      return;
    }

    // save the config
    this._attrConfigs[name] = config;
    // create a state object
    this._attrStates[name] = {};
  },

  _validateHasAttr: function(name) {
    var config = this._attrConfigs[name];

    if (!config) {
      throw('Attribute ' + name + ' does not exist.');
    }
  },

  get: function(name) {
    var config = this._attrConfigs[name];
    var state = this._attrStates[name];

    if (!config) {
      return undefined;
    }

    var value;

    var valueFn = config[OPTS.VALUE_FN];

    if (!Lang.isUndefined(state._setValue)) {
      value = state._setValue;
    } else if (Lang.isValue(valueFn)) {
    // valueFn takes precedence. Try calling it.

      if (Lang.isString(valueFn)) {
        value = stringToInstanceMethod.bind(this)(valueFn)(name);
      } else {
        value = valueFn(name);
      }

      // valueFn is only used once. We store the result.
      state._setValue = value;

    } else {
      value = config[OPTS.VALUE];
    }

    // now let the getter massage the value if it wants
    var getter = config[OPTS.GETTER];
    if (Lang.isFunction(getter)) {
      value = getter(value, name);
    }

    return value;
  },

  /**
   * Sets the value of an attribute.
   *
   * @method set
   * @chainable
   *
   * @param {String} name The name of the attribute. 
   * @param {Any} value The value to set the attribute to.
   * @param {Object} [opts] Optional data providing the circumstances for the change.
   */
  set: function(name, val, opts) {
    return this._setAttr(name, val, opts);
  },

  /**
   * Allows setting of readOnly/writeOnce attributes.
   *
   * @method _set
   * @protected
   * @chainable
   *
   * @param {String} name The name of the attribute.
   * @param {Any} val The value to set the attribute to.
   * @param {Object} [opts] Optional data providing the circumstances for the change.
   */
  _set: function(name, val, opts) {
    return this._setAttr(name, val, opts, true);
  },

  /**
   * Common method to set the value of an attribute
   * @method  _set
   * @param   {String} name
   * @param   value
   * @param   [opts] can be anything. Passed to validator, setter.
   * @param   {Boolean} [force] bypass readOnly and writeOnce checks
   * @private
   */
  _setAttr: function(name, value, opts, force) {
    this._validateHasAttr(name);
    var config = this._attrConfigs[name];
    var state = this._attrStates[name];

    if (!force && config[OPTS.READ_ONLY]) {
      console.warn('Attribute ' + name + ' cannot be set because it is readonly');
      return false;
    }

    if (!force && config[OPTS.WRITE_ONCE] && state._writtenOnce) {
      console.warn('Attribute ' + name + ' cannot be set because it is writeOnce');
      return false;
    }

    state._writtenOnce = true;

    if (this._validate(name, value, opts, config) === false) {
      // Fixing a big YUI annoyance
      console.warn(Lang.sub(
        'Attribute {name} was not set to {value} because it failed validation',
        {
          name: name,
          value: value
        }
      ));
      return false;
    }

    // let the setter massage it
    var setter = config[OPTS.SETTER];
    if (Lang.isFunction(setter)) {
      value = setter(value, name, opts);
    }

    state._setValue = value;
    return this;
  },

  _validate: function(name, value, opts, config) {
    // support string references to instance methods as validators
    var validator = config[OPTS.VALIDATOR];
    if (Lang.isString(validator)) {
      validator = stringToInstanceMethod.bind(this)(validator);
    }

    // validate the validator
    if (Lang.isValue(validator) && !Lang.isFunction(validator)) {
      console.warn('Validator is not a function. Wat.');
    }

    // run through validation
    if (Lang.isFunction(validator)) {
      var validationResult = validator(value, name, opts);
      if (!Lang.isBoolean(validationResult)) {
        console.warn('Validator did not return a boolean. It should.');
      }

      if (validationResult === false) {
        return false;
      }
    }

    return true;
  },

  /**
   * Get a mapping of all attributes and their value
   * @method getAttrs
   * @return {Object}
   */
  getAttrs: function() {
    var result = {};
    Object.keys(this._attrConfigs).forEach(function(attrName) {
      result[attrName] = this.get(attrName);
    }.bind(this));
    return result;
  }

};

module.exports = Attribute;