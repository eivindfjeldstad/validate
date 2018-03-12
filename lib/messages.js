/**
 * Default error messages.
 *
 * @private
 */

const Messages = {
  // Type message
  type(prop, type) {
    return `${prop} must be of type ${type}.`;
  },

  // Required message
  required(prop) {
    return `${prop} is required.`;
  },

  // Match message
  match(prop, regexp) {
    return `${prop} must match ${regexp}.`;
  },

  // Length message
  length(prop, {min, max}) {
    if (min && max) {
      return `${prop} must be between ${min} ${max} characters.`
    }
    if (max) {
      return `${prop} must be less than ${max} characters.`
    }
    if (min) {
      return `${prop} must be more than ${min} characters.`
    }
  },

  // Enum message
  enum(prop, enums) {
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
