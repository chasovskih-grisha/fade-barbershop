var ip = exports;
var { Buffer } = require('buffer');
var os = require('os');
var net = require('net');

ip.toBuffer = function (ip, buff, offset) {
  offset = ~~offset;

  var result;

  if (this.isV4Format(ip)) {
    result = buff || new Buffer(offset + 4);
    ip.split(/\./g).map((byte) => {
      result[offset++] = parseInt(byte, 10) & 0xff;
    });
  } else if (this.isV6Format(ip)) {
    var sections = ip.split(':', 8);

    var i;
    for (i = 0; i < sections.length; i++) {
      var isv4 = this.isV4Format(sections[i]);
      var v4Buffer;

      if (isv4) {
        v4Buffer = this.toBuffer(sections[i]);
        sections[i] = v4Buffer.slice(0, 2).toString('hex');
      }

      if (v4Buffer && ++i < 8) {
        sections.splice(i, 0, v4Buffer.slice(2, 4).toString('hex'));
      }
    }

    if (sections[0] === '') {
      while (sections.length < 8) sections.unshift('0');
    } else if (sections[sections.length - 1] === '') {
      while (sections.length < 8) sections.push('0');
    } else if (sections.length < 8) {
      for (i = 0; i < sections.length && sections[i] !== ''; i++);
      var argv = [i, 1];
      for (i = 9 - sections.length; i > 0; i--) {
        argv.push('0');
      }
      sections.splice.apply(sections, argv);
    }

    result = buff || new Buffer(offset + 16);
    for (i = 0; i < sections.length; i++) {
      var word = parseInt(sections[i], 16);
      result[offset++] = (word >> 8) & 0xff;
      result[offset++] = word & 0xff;
    }
  }

  if (!result) {
    throw Error(`Invalid ip address: ${ip}`);
  }

  return result;
};

ip.toString = function (buff, offset, length) {
  offset = ~~offset;
  length = length || (buff.length - offset);

  var result = [];
  var i;
  if (length === 4) {
    // IPv4
    for (i = 0; i < length; i++) {
      result.push(buff[offset + i]);
    }
    result = result.join('.');
  } else if (length === 16) {
    // IPv6
    for (i = 0; i < length; i += 2) {
      result.push(buff.readUInt16BE(offset + i).toString(16));
    }
    result = result.join(':');
    result = result.replace(/(^|:)0(:0)*:0(:|$)/, '$1::$3');
    result = result.replace(/:{3,4}/, '::');
  }

  return result;
};

var ipv4Regex = /^(\d{1,3}\.){3,3}\d{1,3}$/;
var ipv6Regex = /^(::)?(((\d{1,3}\.){3}(\d{1,3}){1})?([0-9a-f]){0,4}:{0,2}){1,8}(::)?$/i;

ip.isV4Format = function (ip) {
  return ipv4Regex.test(ip);
};

ip.isV6Format = function (ip) {
  return ipv6Regex.test(ip);
};

function _normalizeFamily(family) {
  if (family === 4) {
    return 'ipv4';
  }
  if (family === 6) {
    return 'ipv6';
  }
  return family ? family.toLowerCase() : 'ipv4';
}

ip.fromPrefixLen = function (prefixlen, family) {
  if (prefixlen > 32) {
    family = 'ipv6';
  } else {
    family = _normalizeFamily(family);
  }

  var len = 4;
  if (family === 'ipv6') {
    len = 16;
  }
  var buff = new Buffer(len);

  for (var i = 0, n = buff.length; i < n; ++i) {
    var bits = 8;
    if (prefixlen < 8) {
      bits = prefixlen;
    }
    prefixlen -= bits;

    buff[i] = ~(0xff >> bits) & 0xff;
  }

  return ip.toString(buff);
};

ip.mask = function (addr, mask) {
  addr = ip.toBuffer(addr);
  mask = ip.toBuffer(mask);

  var result = new Buffer(Math.max(addr.length, mask.length));

  // Same protocol - do bitwise and
  var i;
  if (addr.length === mask.length) {
    for (i = 0; i < addr.length; i++) {
      result[i] = addr[i] & mask[i];
    }
  } else if (mask.length === 4) {
    // IPv6 address and IPv4 mask
    // (Mask low bits)
    for (i = 0; i < mask.length; i++) {
      result[i] = addr[addr.length - 4 + i] & mask[i];
    }
  } else {
    // IPv6 mask and IPv4 addr
    for (i = 0; i < result.length - 6; i++) {
      result[i] = 0;
    }

    // ::ffff:ipv4
    result[10] = 0xff;
    result[11] = 0xff;
    for (i = 0; i < addr.length; i++) {
      result[i + 12] = addr[i] & mask[i + 12];
    }
    i += 12;
  }
  for (; i < result.length; i++) {
    result[i] = 0;
  }

  return ip.toString(result);
};

ip.cidr = function (cidrString) {
  var cidrParts = cidrString.split('/');

  var addr = cidrParts[0];
  if (cidrParts.length !== 2) {
    throw new Error(`invalid CIDR subnet: ${addr}`);
  }

  var mask = ip.fromPrefixLen(parseInt(cidrParts[1], 10));

  return ip.mask(addr, mask);
};

ip.subnet = function (addr, mask) {
  var networkAddress = ip.toLong(ip.mask(addr, mask));

  // Calculate the mask's length.
  var maskBuffer = ip.toBuffer(mask);
  var maskLength = 0;

  for (var i = 0; i < maskBuffer.length; i++) {
    if (maskBuffer[i] === 0xff) {
      maskLength += 8;
    } else {
      var octet = maskBuffer[i] & 0xff;
      while (octet) {
        octet = (octet << 1) & 0xff;
        maskLength++;
      }
    }
  }

  var numberOfAddresses = Math.pow(2, 32 - maskLength);

  return {
    networkAddress: ip.fromLong(networkAddress),
    firstAddress: numberOfAddresses <= 2
      ? ip.fromLong(networkAddress)
      : ip.fromLong(networkAddress + 1),
    lastAddress: numberOfAddresses <= 2
      ? ip.fromLong(networkAddress + numberOfAddresses - 1)
      : ip.fromLong(networkAddress + numberOfAddresses - 2),
    broadcastAddress: ip.fromLong(networkAddress + numberOfAddresses - 1),
    subnetMask: mask,
    subnetMaskLength: maskLength,
    numHosts: numberOfAddresses <= 2
      ? numberOfAddresses : numberOfAddresses - 2,
    length: numberOfAddresses,
    contains(other) {
      return networkAddress === ip.toLong(ip.mask(other, mask));
    },
  };
};

ip.cidrSubnet = function (cidrString) {
  var cidrParts = cidrString.split('/');

  var addr = cidrParts[0];
  if (cidrParts.length !== 2) {
    throw new Error(`invalid CIDR subnet: ${addr}`);
  }

  var mask = ip.fromPrefixLen(parseInt(cidrParts[1], 10));

  return ip.subnet(addr, mask);
};

ip.not = function (addr) {
  var buff = ip.toBuffer(addr);
  for (var i = 0; i < buff.length; i++) {
    buff[i] = 0xff ^ buff[i];
  }
  return ip.toString(buff);
};

ip.or = function (a, b) {
  var i;

  a = ip.toBuffer(a);
  b = ip.toBuffer(b);

  // same protocol
  if (a.length === b.length) {
    for (i = 0; i < a.length; ++i) {
      a[i] |= b[i];
    }
    return ip.toString(a);

  // mixed protocols
  }
  var buff = a;
  var other = b;
  if (b.length > a.length) {
    buff = b;
    other = a;
  }

  var offset = buff.length - other.length;
  for (i = offset; i < buff.length; ++i) {
    buff[i] |= other[i - offset];
  }

  return ip.toString(buff);
};

ip.isEqual = function (a, b) {
  var i;

  a = ip.toBuffer(a);
  b = ip.toBuffer(b);

  // Same protocol
  if (a.length === b.length) {
    for (i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  // Swap
  if (b.length === 4) {
    var t = b;
    b = a;
    a = t;
  }

  // a - IPv4, b - IPv6
  for (i = 0; i < 10; i++) {
    if (b[i] !== 0) return false;
  }

  var word = b.readUInt16BE(10);
  if (word !== 0 && word !== 0xffff) return false;

  for (i = 0; i < 4; i++) {
    if (a[i] !== b[i + 12]) return false;
  }

  return true;
};

//
// Private/loopback classification (CVE-2023-42282, CVE-2024-29415).
//
// `isPrivate`/`isPublic` are used as SSRF guards, so reporting a non-routable
// address as globally routable is a security bug, not a cosmetic one. Upstream
// 1.1.9/2.0.1 matched the *raw* literal with regexes, which let inet_aton
// alternates (`127.1`, `127.00.0x1`), big-integer/octal forms (`01200034567`,
// `012.1.2.3`) and non-canonical IPv6 (`000:0:0000::01`, `::fFFf:127.0.0.1`)
// through as public. Every accepted literal is canonicalized to a 4-byte IPv4
// address or eight IPv6 groups first, and only then classified. Unparseable
// input throws instead of being assumed public.
//

/** Split a colon-separated IPv6 fragment into groups; null if malformed. */
function v6GroupsOf(text) {
  if (text === '') return [];

  var out = [];
  var parts = text.split(':');

  for (var i = 0; i < parts.length; i++) {
    var part = parts[i];

    // Embedded IPv4 tail, e.g. '::ffff:127.0.0.1' -> two more groups.
    if (part.indexOf('.') !== -1) {
      var long = ip.normalizeToLong(part);
      if (long < 0) return null;
      out.push((long >>> 16) & 0xffff);
      out.push(long & 0xffff);
      continue;
    }

    if (!/^[0-9a-f]{1,4}$/i.test(part)) return null;
    out.push(parseInt(part, 16));
  }

  return out;
}

/** Eight IPv6 groups for a (valid) literal, or null. '::' is expanded. */
function parseV6Groups(addr) {
  var body = addr.split('%')[0];
  var compressed = body.indexOf('::');

  if (compressed !== -1 && body.indexOf('::', compressed + 1) !== -1) return null;

  var head = v6GroupsOf(compressed === -1 ? body : body.slice(0, compressed));
  var tail = v6GroupsOf(compressed === -1 ? '' : body.slice(compressed + 2));

  if (head === null || tail === null) return null;

  if (compressed === -1) {
    return head.length === 8 ? head : null;
  }

  var missing = 8 - head.length - tail.length;
  if (missing < 1) return null;

  var groups = head;
  for (var i = 0; i < missing; i++) groups.push(0);
  return groups.concat(tail);
}

/**
 * Canonicalize an accepted IP literal to `{ v4: [b0, b1, b2, b3] }` or
 * `{ v6: [g0, ..., g7] }`. Throws when the literal is not an address.
 */
function normalizeLiteral(addr) {
  if (typeof addr !== 'string') {
    throw new Error(`Invalid ip address: ${addr}`);
  }

  if (net.isIP(addr) === 6) {
    var groups = parseV6Groups(addr);
    if (!groups) throw new Error(`Invalid ip address: ${addr}`);

    // An IPv4-mapped address (::ffff:a.b.c.d) inherits the IPv4 verdict of the
    // address it carries.
    var mapped = groups.slice(0, 5).every((group) => group === 0)
      && groups[5] === 0xffff;
    if (mapped) {
      return {
        v4: [groups[6] >> 8, groups[6] & 0xff, groups[7] >> 8, groups[7] & 0xff],
      };
    }

    return { v6: groups };
  }

  var long = ip.normalizeToLong(addr);
  if (long < 0) {
    throw new Error(`Invalid ip address: ${addr}`);
  }

  return {
    v4: [(long >>> 24) & 0xff, (long >>> 16) & 0xff, (long >>> 8) & 0xff, long & 0xff],
  };
}

/** Blocks that are reachable on a local network or not globally routable. */
function isNonRoutableV4(b) {
  return b[0] === 0 // 0.0.0.0/8     this network
    || b[0] === 10 // 10.0.0.0/8    private
    || b[0] === 127 // 127.0.0.0/8   loopback
    || (b[0] === 100 && b[1] >= 64 && b[1] <= 127) // 100.64.0.0/10  CGNAT
    || (b[0] === 169 && b[1] === 254) // 169.254.0.0/16 link-local
    || (b[0] === 172 && b[1] >= 16 && b[1] <= 31) // 172.16.0.0/12  private
    || (b[0] === 192 && b[1] === 168) // 192.168.0.0/16 private
    || b[0] >= 224; // 224.0.0.0/4     multicast, 240.0.0.0/4 reserved
}

/** fc00::/7 unique-local, fe80::/10 link-local, ff00::/8 multicast. */
function isNonRoutableV6(groups) {
  var first = groups[0];
  return (first & 0xfe00) === 0xfc00
    || (first & 0xffc0) === 0xfe80
    || (first & 0xff00) === 0xff00;
}

function isUnspecifiedOrLoopbackV6(groups) {
  for (var i = 0; i < 7; i++) {
    if (groups[i] !== 0) return false;
  }
  return groups[7] === 0 || groups[7] === 1;
}

ip.isPrivate = function (addr) {
  var literal = normalizeLiteral(addr);

  return literal.v4
    ? isNonRoutableV4(literal.v4)
    : isUnspecifiedOrLoopbackV6(literal.v6) || isNonRoutableV6(literal.v6);
};

ip.isPublic = function (addr) {
  return !ip.isPrivate(addr);
};

// Total by design: `ip.address()` probes every interface address through this
// function, so an unrecognized literal must answer `false`, never throw.
ip.isLoopback = function (addr) {
  var literal;
  try {
    literal = normalizeLiteral(addr);
  } catch (error) {
    return false;
  }

  if (literal.v4) return literal.v4[0] === 127;

  // `fe80::1` is kept as loopback for upstream parity: `ip.address()` filters
  // interface addresses through this function.
  var groups = literal.v6;
  var isFe80One = groups[0] === 0xfe80
    && groups.slice(1, 7).every((group) => group === 0)
    && groups[7] === 1;

  return isUnspecifiedOrLoopbackV6(groups) || isFe80One;
};

ip.loopback = function (family) {
  //
  // Default to `ipv4`
  //
  family = _normalizeFamily(family);

  if (family !== 'ipv4' && family !== 'ipv6') {
    throw new Error('family must be ipv4 or ipv6');
  }

  return family === 'ipv4' ? '127.0.0.1' : 'fe80::1';
};

//
// ### function address (name, family)
// #### @name {string|'public'|'private'} **Optional** Name or security
//      of the network interface.
// #### @family {ipv4|ipv6} **Optional** IP family of the address (defaults
//      to ipv4).
//
// Returns the address for the network interface on the current system with
// the specified `name`:
//   * String: First `family` address of the interface.
//             If not found see `undefined`.
//   * 'public': the first public ip address of family.
//   * 'private': the first private ip address of family.
//   * undefined: First address with `ipv4` or loopback address `127.0.0.1`.
//
ip.address = function (name, family) {
  var interfaces = os.networkInterfaces();

  //
  // Default to `ipv4`
  //
  family = _normalizeFamily(family);

  //
  // If a specific network interface has been named,
  // return the address.
  //
  if (name && name !== 'private' && name !== 'public') {
    var res = interfaces[name].filter((details) => {
      var itemFamily = _normalizeFamily(details.family);
      return itemFamily === family;
    });
    if (res.length === 0) {
      return undefined;
    }
    return res[0].address;
  }

  var all = Object.keys(interfaces).map((nic) => {
    //
    // Note: name will only be `public` or `private`
    // when this is called.
    //
    var addresses = interfaces[nic].filter((details) => {
      details.family = _normalizeFamily(details.family);
      if (details.family !== family || ip.isLoopback(details.address)) {
        return false;
      } if (!name) {
        return true;
      }

      return name === 'public' ? ip.isPrivate(details.address)
        : ip.isPublic(details.address);
    });

    return addresses.length ? addresses[0].address : undefined;
  }).filter(Boolean);

  return !all.length ? ip.loopback(family) : all[0];
};

ip.toLong = function (ip) {
  var ipl = 0;
  ip.split('.').forEach((octet) => {
    ipl <<= 8;
    ipl += parseInt(octet);
  });
  return (ipl >>> 0);
};

ip.fromLong = function (ipl) {
  return (`${ipl >>> 24}.${
    ipl >> 16 & 255}.${
    ipl >> 8 & 255}.${
    ipl & 255}`);
};

ip.normalizeToLong = function (addr) {
  if (typeof addr !== 'string') return -1;

  const parts = addr.split('.').map(part => {
    // Handle hexadecimal format
    if (part.startsWith('0x') || part.startsWith('0X')) {
      return parseInt(part, 16);
    }
    // Handle octal format (strictly digits 0-7 after a leading zero)
    else if (part.startsWith('0') && part !== '0' && /^[0-7]+$/.test(part)) {
      return parseInt(part, 8);
    }
    // Handle decimal format, reject invalid leading zeros
    else if (/^[1-9]\d*$/.test(part) || part === '0') {
      return parseInt(part, 10);
    }
    // Return NaN for invalid formats to indicate parsing failure
    else {
      return NaN;
    }
  });

  if (parts.some(isNaN)) return -1; // Indicate error with -1

  let val = 0;
  const n = parts.length;

  switch (n) {
  case 1:
    if (parts[0] > 0xffffffff) return -1;
    val = parts[0];
    break;
  case 2:
    if (parts[0] > 0xff || parts[1] > 0xffffff) return -1;
    val = (parts[0] << 24) | (parts[1] & 0xffffff);
    break;
  case 3:
    if (parts[0] > 0xff || parts[1] > 0xff || parts[2] > 0xffff) return -1;
    val = (parts[0] << 24) | (parts[1] << 16) | (parts[2] & 0xffff);
    break;
  case 4:
    if (parts.some(part => part > 0xff)) return -1;
    val = (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
    break;
  default:
    return -1; // Error case
  }

  return val >>> 0;
};
