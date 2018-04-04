/**
 * Default error messages.
 *
 * @private
 */

const Messages = {
  // Type message
  type(prop, ctx, type) {
    return `${prop} must be of type ${type}.`;
  },

  // Required message
  required(prop) {
    return `${prop} is required.`;
  },

  // Match message
  match(prop, ctx, regexp) {
    return `${prop} must match ${regexp}.`;
  },

  // Length message
  length(prop, ctx, len) {
    if (typeof len == 'number') {
      return `${prop} must have a length of ${len}.`
    }

    const {min, max} = len;

    if (min && max) {
      return `${prop} must have a length between ${min} and ${max}.`
    }
    if (max) {
      return `${prop} must have a maximum length of ${max}.`
    }
    if (min) {
      return `${prop} must have a minimum length of ${min}.`
    }
  },

  // Enum message
  enum(prop, ctx, enums) {
    const copy = enums.slice();
    const last = copy.pop();
    return `${prop} must be either ${copy.join(', ')} or ${last}.`;
  },

  // Default message
  default(prop) {
    return `Validation failed for ${prop}.`;
  }
};

module.exports = Messages;
