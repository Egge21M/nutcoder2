import { bytesToHex } from "@noble/hashes/utils";
import { decodeCBOR } from "./cbor";
import { Token, TokenEntry, V4InnerToken, V4ProofTemplate } from "./types";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

function utf8ToBase64url(str) {
  const utf8Bytes = new TextEncoder().encode(str); // Convert to Uint8Array
  const base64String = btoa(String.fromCharCode(...utf8Bytes)); // Convert to base64
  return base64String
    .replace(/\+/g, "-") // Replace + with -
    .replace(/\//g, "_") // Replace / with _
    .replace(/=+$/, ""); // Remove padding
}

function utf8ToBase64(str: string) {
  const utf8Bytes = encoder.encode(str);
  const base64String = btoa(String.fromCharCode(...utf8Bytes));
  return base64String;
}

function base64ToUint8Array(base64) {
  const binaryString = atob(base64); // Decode base64 to binary string
  const bytes = new Uint8Array(
    [...binaryString].map((char) => char.charCodeAt(0)),
  ); // Convert to Uint8Array
  return bytes;
}

function uint8ArrayToBase64(uint8Array) {
  const binaryString = String.fromCharCode(...uint8Array); // Convert Uint8Array to binary string
  const base64String = btoa(binaryString); // Convert binary string to base64
  return base64String;
}

function base64ToUtf8(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(
    [...binaryString].map((char) => char.charCodeAt(0)),
  );
  const utf8String = decoder.decode(bytes);
  return utf8String;
}

function base64urlToUtf8(base64url) {
  const base64 = base64url
    .replace(/-/g, "+") // Replace - with +
    .replace(/_/g, "/"); // Replace _ with /

  const binaryString = atob(base64); // Decode base64 to binary string
  const bytes = new Uint8Array(
    [...binaryString].map((char) => char.charCodeAt(0)),
  ); // Convert to Uint8Array
  const utf8String = new TextDecoder().decode(bytes); // Decode to UTF-8 string
  return utf8String;
}

function uint8ArrayToBase64url(uint8Array) {
  const binaryString = String.fromCharCode(...uint8Array); // Convert Uint8Array to binary string
  const base64String = btoa(binaryString); // Convert to base64
  return base64String
    .replace(/\+/g, "-") // Replace + with -
    .replace(/\//g, "_") // Replace / with _
    .replace(/=+$/, ""); // Remove padding
}

function base64urlToUint8Array(base64url) {
  const base64 = base64url
    .replace(/-/g, "+") // Replace - with +
    .replace(/_/g, "/"); // Replace _ with /

  const binaryString = atob(base64); // Decode base64 to binary string
  const bytes = new Uint8Array(
    [...binaryString].map((char) => char.charCodeAt(0)),
  ); // Convert to Uint8Array
  return bytes;
}

export function getDecodedToken(token: string) {
  const uriPrefixes = ["web+cashu://", "cashu://", "cashu:", "cashu"];
  uriPrefixes.forEach((prefix: string) => {
    if (!token.startsWith(prefix)) {
      return;
    }
    token = token.slice(prefix.length);
  });
  return handleTokens(token);
}

export function getEncodedTokenV3(token: Token): string {
  return "cashu" + "A" + utf8ToBase64url(JSON.stringify(token));
}

function getEncodedTokenV4(token: Token): string {
  const idMap: { [id: string]: Array<Proof> } = {};
  let mint: string | undefined = undefined;
  for (let i = 0; i < token.token.length; i++) {
    if (!mint) {
      mint = token.token[i].mint;
    } else {
      if (mint !== token.token[i].mint) {
        throw new Error("Multimint token can not be encoded as V4 token");
      }
    }
    for (let j = 0; j < token.token[i].proofs.length; j++) {
      const proof = token.token[i].proofs[j];
      if (idMap[proof.id]) {
        idMap[proof.id].push(proof);
      } else {
        idMap[proof.id] = [proof];
      }
    }
  }
  const tokenTemplate: TokenV4Template = {
    m: mint,
    u: token.unit || "sat",
    t: Object.keys(idMap).map(
      (id: string): V4InnerToken => ({
        i: hexToBytes(id),
        p: idMap[id].map(
          (p: Proof): V4ProofTemplate => ({
            a: p.amount,
            s: p.secret,
            c: hexToBytes(p.C),
          }),
        ),
      }),
    ),
  } as TokenV4Template;

  if (token.memo) {
    tokenTemplate.d = token.memo;
  }

  const encodedData = encodeCBOR(tokenTemplate);
  const prefix = "cashu";
  const version = "B";
  const base64Data = encodeUint8toBase64Url(encodedData);
  return prefix + version + base64Data;
}

function handleTokens(token: string): Token {
  const version = token.slice(0, 1);
  const encodedToken = token.slice(1);
  if (version === "A") {
    return JSON.parse(base64urlToUtf8(encodedToken));
  } else if (version === "B") {
    const uInt8Token = base64urlToUint8Array(encodedToken);
    console.log(uInt8Token);
    const tokenData = decodeCBOR(uInt8Token) as {
      t: Array<{
        p: Array<{ a: number; s: string; c: Uint8Array }>;
        i: Uint8Array;
      }>;
      m: string;
      d: string;
      u: string;
    };
    const mergedTokenEntry: TokenEntry = { mint: tokenData.m, proofs: [] };
    tokenData.t.forEach((tokenEntry: V4InnerToken) =>
      tokenEntry.p.forEach((p: V4ProofTemplate) => {
        mergedTokenEntry.proofs.push({
          secret: p.s,
          C: bytesToHex(p.c),
          amount: p.a,
          id: bytesToHex(tokenEntry.i),
        });
      }),
    );
    return {
      token: [mergedTokenEntry],
      memo: tokenData.d || "",
      unit: tokenData.u || "sat",
    };
  }
  throw new Error("Token version is not supported");
}
