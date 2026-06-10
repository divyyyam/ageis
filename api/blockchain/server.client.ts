import { Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import fs from "fs";
import path from "path";
import { AgeisClient } from "./client";

let cachedClient: AgeisClient | null = null;

function parseSecretKey(raw: string): Uint8Array {
  const trimmed = raw.trim();

  if (trimmed.startsWith("[")) {
    const arr = JSON.parse(trimmed) as number[];
    return Uint8Array.from(arr);
  }

  if (trimmed.includes(",")) {
    const arr = trimmed
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((n) => Number(n));
    return Uint8Array.from(arr);
  }

  return bs58.decode(trimmed);
}

function loadIdl(): unknown {
  const candidates = [
    path.resolve(process.cwd(), "blockchain/target/idl/ageis.json"),
    path.resolve(process.cwd(), "api/blockchain/target/idl/ageis.json"),
    path.resolve(__dirname, "../blockchain/target/idl/ageis.json"),
    path.resolve(__dirname, "../../blockchain/target/idl/ageis.json"),
  ];

  let lastErr: unknown = null;
  for (const p of candidates) {
    try {
      return JSON.parse(fs.readFileSync(p, "utf8"));
    } catch (err) {
      lastErr = err;
    }
  }

  throw new Error(
    `Unable to load ageis IDL. Tried: ${candidates.join(", ")}. Last error: ${
      (lastErr as Error | null)?.message ?? String(lastErr)
    }`
  );
}

export function getServerAuthorityKeypair(): Keypair {
  const secret = process.env.SOLANA_SERVER_SECRET_KEY;
  if (!secret) {
    throw new Error("Missing env SOLANA_SERVER_SECRET_KEY");
  }
  const bytes = parseSecretKey(secret);
  return Keypair.fromSecretKey(bytes);
}

export function getAgeisClient(): AgeisClient {
  if (cachedClient) return cachedClient;

  const rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
  const connection = new Connection(rpcUrl, "confirmed");
  const serverAuthority = getServerAuthorityKeypair();
  const idl = loadIdl();

  cachedClient = new AgeisClient(connection, serverAuthority, idl as any);
  return cachedClient;
}

