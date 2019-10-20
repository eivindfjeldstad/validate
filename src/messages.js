/**
 * Default error messages.
 *
 * @private
 */

const Messages = {
  // Type message
  type(prop, ctx, type) {
    if (typeof type == 'function') {
      type = type.name;
    }

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
      return `${prop} must have a length of ${len}.`;
    }

    const { min, max } = len;

    if (min && max) {
      return `${prop} must have a length between ${min} and ${max}.`;
    }
    if (max) {
      return `${prop} must have a maximum length of ${max}.`;
    }
    if (min) {
      return `${prop} must have a minimum length of ${min}.`;
    }
  },

  // Size message
  size(prop, ctx, size) {
    if (typeof size == 'number') {
      return `${prop} must have a size of ${size}.`;
    }

    const { min, max } = size;

    if (min !== undefined && max !== undefined) {
      return `${prop} must be between ${min} and ${max}.`;
    }
    if (max !== undefined) {
      return `${prop} must be less than ${max}.`;
    }
    if (min !== undefined) {
      return `${prop} must be greater than ${min}.`;
    }
  },

  // Enum message
  enum(prop, ctx, enums) {
    const copy = enums.slice();
    const last = copy.pop();
    return `${prop} must be either ${copy.join(', ')} or ${last}.`;
  },

  // Illegal property
  illegal(prop) {
    return `${prop} is not allowed.`;
  },

  // Default message
  default(prop) {
    return `Validation failed for ${prop}.`;
  }
};

export default Messages;
