import dot from '@eivifj/dot';
import typeOf from 'component-type';

/**
 * Assign given key and value (or object) to given object
 *
 * @private
 */

export function assign(key, val, obj) {
  if (typeof key == 'string') {
    obj[key] = val;
    return;
  }

  Object.keys(key).forEach(k => obj[k] = key[k]);
}

/**
 * Enumerate all permutations of `path`, replacing $ with array indices
 *
 * @private
 */

export function enumerate(path, obj, callback) {
  const parts = path.split(/\.\$(?=\.|$)/);
  const first = parts.shift();
  const arr = dot.get(obj, first);

  if (!parts.length) {
    return callback(first, arr);
  }

  if (!Array.isArray(arr)) {
    return;
  }

  for (let i = 0; i < arr.length; i++) {
    const current = join(i, first);
    const next = current + parts.join('.$');
    enumerate(next, obj, callback);
  }
}

/**
 * Walk object and call `callback` with path and prop name
 *
 * @private
 */

export function walk(obj, callback, path, prop) {
  const type = typeOf(obj);

  if (type === 'array') {
    obj.forEach((v, i) =>
      walk(v, callback, join(i, path), join('$', prop))
    );
    return;
  }

  if (type !== 'object') {
    return;
  }

  for (const [key, val] of Object.entries(obj)) {
    const newPath = join(key, path);
    const newProp = join(key, prop);
    if (callback(newPath, newProp)) {
      walk(val, callback, newPath, newProp);
    }
  }
}

/**
 * Join `path` with `prefix`
 *
 * @private
 */

export function join(path, prefix) {
  return prefix
    ? `${prefix}.${path}`
    : path;
}
