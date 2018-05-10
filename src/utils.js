import dot from 'eivindfjeldstad-dot';

/**
 * Walk path
 *
 * @private
 */

export function walk(path, obj, callback) {
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
    walk(next, obj, callback);
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
