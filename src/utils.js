import dot from 'eivindfjeldstad-dot';

/**
 * Enumerate paths
 *
 * @private
 */

export function enumerate(path, obj, prefix = '', map = {}) {
  const original = map[prefix] || '';
  const parts = path.split(/\.\$(?=\.|$)/);
  const first = parts.shift();

  if (!parts.length) {
    map[prefix + path] = original + path;
    return map;
  }

  const arr = dot.get(obj, prefix + first);

  if (!Array.isArray(arr)) {
    return map;
  }

  for (let i = 0; i < arr.length; i++) {
    const current = join(i, prefix + first);
    map[current] = join('$', original + first);
    enumerate(parts.join('.$'), obj, current, map);
  }

  return map;
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
