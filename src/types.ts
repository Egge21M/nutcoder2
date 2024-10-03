export type Proof = {
  id: string;
  amount: number;
  secret: string;
  C: string;
};

export type Token = {
  token: Array<TokenEntry>;
  memo?: string;
  unit?: string;
};

export type TokenEntry = {
  proofs: Array<Proof>;
  mint: string;
};

export type V4ProofTemplate = {
  a: number;
  s: string;
  c: Uint8Array;
};

export type V4InnerToken = {
  i: Uint8Array;
  p: Array<V4ProofTemplate>;
};

export type TokenV4Template = {
  t: Array<V4InnerToken>;
  d: string;
  m: string;
  u: string;
};
