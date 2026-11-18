'use strict';

// Regression test for GHSA-86w9-cpqp-85rv / CVE-2026-85393: RSA PKCS#1 v1.5
// verification must reject a DigestInfo whose nested DigestAlgorithm SEQUENCE
// carries more than the digest OID plus an optional NULL parameters element.
//
// The forgery is built directly as an RSASSA-PKCS1-v1_5 encoded message, then
// turned into a "signature" with the private key, so the test needs no actual
// RSA key recovery — it only asks whether `verify` accepts the structure.

const test = require('node:test');
const assert = require('node:assert');

const forge = require('node-forge');
const { asn1, pki, md } = forge;

// Test fixture only: a 1024-bit e=3 key, generated once and pinned so the test
// is deterministic and fast. Never used outside this file.
const N =
  'b7d5b1afaaab5f9cd39e3d57d77319139e0c60f2ead826dbbd42726ed2987b84781c3d86fe8750537caabb7c6eeb343542ad49eda1ad7ac8d1248e2f9124e423134691ca10a75af6ad907819ee319e93e9a2acdc7a2d6c527d76c865aef31517572ffe401ce64af5a504fe1f723fa78775b8bd192fe8d203fa6c7cf5341e829d';
const E = '3';
const D =
  '7a8e76751c723fbde2697e3a8fa210b7beb2eb4c9c9019e7d381a19f371052585012d3af545a358cfdc727a849f222ce2c73869e6bc8fc85e0c309750b6ded6b954ca2410c89a209913a2bcc824c3fed37ff13a5f469858ce9d4376194c9423798e0c03be87b140fdd0947a1e3a502c29c156ee4694b3c6bc224dad76b37dc93';

const BigInt = forge.jsbn.BigInteger;
const privateKey = pki.rsa.setPrivateKey(new BigInt(N, 16), new BigInt(E, 16), new BigInt(D, 16));
const publicKey = pki.setRsaPublicKey(new BigInt(N, 16), new BigInt(E, 16));

const MESSAGE = 'transfer 1 credit';
const DIGEST = md.sha256.create().update(MESSAGE).digest().bytes();
const MODULUS_BYTES = Math.ceil(publicKey.n.bitLength() / 8);

/** Turn a hand-built RSASSA-PKCS1-v1_5 encoded message into a "signature". */
function signatureFor(encodedMessage) {
  return pki.rsa.decrypt(encodedMessage, privateKey, false, false);
}

/** EM = 0x00 || 0x01 || 0xFF.. || 0x00 || DigestInfo, exactly k bytes long. */
function encodedMessage(digestInfo) {
  const der = asn1.toDer(digestInfo).getBytes();
  const padding = MODULUS_BYTES - der.length - 3;
  assert.ok(padding > 8, `DigestInfo too large for a ${MODULUS_BYTES}-byte modulus`);
  return '\x00\x01' + '\xff'.repeat(padding) + '\x00' + der;
}

function digestInfo(children) {
  return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, children),
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, DIGEST),
  ]);
}

const oid = () =>
  asn1.create(
    asn1.Class.UNIVERSAL,
    asn1.Type.OID,
    false,
    asn1.oidToDer(forge.oids.sha256).getBytes()
  );
const nullParameters = () => asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, '');
const garbage = () =>
  asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, 'attacker padding');

test('a legitimate signature still verifies', () => {
  const signature = privateKey.sign(md.sha256.create().update(MESSAGE));
  assert.equal(publicKey.verify(DIGEST, signature), true);
});

test('DigestAlgorithm with only the OID verifies (NULL stays optional)', () => {
  const signature = signatureFor(encodedMessage(digestInfo([oid()])));
  assert.equal(publicKey.verify(DIGEST, signature), true);
});

test('DigestAlgorithm with OID and NULL verifies', () => {
  const signature = signatureFor(encodedMessage(digestInfo([oid(), nullParameters()])));
  assert.equal(publicKey.verify(DIGEST, signature), true);
});

test('garbage inside the nested DigestAlgorithm is rejected', () => {
  const signature = signatureFor(encodedMessage(digestInfo([oid(), nullParameters(), garbage()])));

  assert.throws(
    () => publicKey.verify(DIGEST, signature),
    (error) => {
      assert.match(error.message, /valid RSASSA-PKCS1-v1_5 DigestInfo value/);
      return true;
    },
    'a DigestAlgorithm with interior padding must not verify'
  );
});

test('a third element in the outer DigestInfo is still rejected', () => {
  const signature = signatureFor(
    encodedMessage(
      asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
        asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [oid(), nullParameters()]),
        asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, DIGEST),
        garbage(),
      ])
    )
  );

  assert.throws(
    () => publicKey.verify(DIGEST, signature),
    /valid RSASSA-PKCS1-v1_5 DigestInfo value/
  );
});
