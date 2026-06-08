import prisma from "../../db/prisma";
import { Request, Response } from "express";
import { HTTPStatus } from "../../services/http/status";
import { KeyService } from "../services/key.service";

const keyService = new KeyService();

export class KeyController {

  createKeyPair = async (req: Request, res: Response) => {
    try {
      const { farmerId, publicKey, encryptedPrivateKey, meta } = req.body;

      // --- Input validation ---
      if (!farmerId || !publicKey || !encryptedPrivateKey || !meta) {
        return res.status(HTTPStatus.BAD_REQUEST).json({
          message: "farmerId, publicKey, encryptedPrivateKey and meta are required",
        });
      }

      if (!meta.iv || !meta.scheme) {
        return res.status(HTTPStatus.BAD_REQUEST).json({
          message: "meta must contain at least { iv, scheme }",
        });
      }

      const isValid = await keyService.isValidSolanaPublicKey(publicKey);
      if (!isValid) {
        return res.status(HTTPStatus.BAD_REQUEST).json({
          message: "Invalid Solana public key",
        });
      }

      const existing = await prisma.farmerKeys.findUnique({
        where: { publicKey },
      });
      if (existing) {
        return res.status(HTTPStatus.CONFLICT).json({
          message: "A key with this public key already exists",
        });
      }

      const record = await prisma.farmerKeys.create({
        data: {
          farmerId: farmerId,
          publicKey,
          encryptedPrivateKey,
          meta,
        },
      });

      return res.status(HTTPStatus.CREATED).json({
        message: "Key stored successfully",
        data: {
          id: record.id,
          publicKey: record.publicKey,
          farmerId: record.farmerId,
          createdAt: record.createdAt,
        },
      });
    } catch (error) {
      return res.status(HTTPStatus.INTERNAL_SERVER_ERROR).json({
        message: "Failed to create key pair",
        error: (error as Error).message,
      });
    }
  };


  rotateKeys = async (req: Request, res: Response) => {
    try {
      const { publicKey } = req.params;
      const { encryptedPrivateKey, meta } = req.body;

      if (!encryptedPrivateKey || !meta) {
        return res.status(HTTPStatus.BAD_REQUEST).json({
          message: "encryptedPrivateKey and meta are required",
        });
      }

      if (!meta.iv || !meta.scheme) {
        return res.status(HTTPStatus.BAD_REQUEST).json({
          message: "meta must contain at least { iv, scheme }",
        });
      }

      const isValid = await keyService.isValidSolanaPublicKey(publicKey as string);
      if (!isValid) {
        return res.status(HTTPStatus.BAD_REQUEST).json({
          message: "Invalid Solana public key",
        });
      }

      const record = await prisma.farmerKeys.findUnique({
        where: { publicKey: publicKey as string },
      });

      if (!record) {
        return res.status(HTTPStatus.NOT_FOUND).json({
          message: "Key not found",
        });
      }

      const updated = await prisma.farmerKeys.update({
        where: { publicKey: publicKey as string },
        data: {
          encryptedPrivateKey,
          meta,
        },
      });

      return res.status(HTTPStatus.OK).json({
        message: "Key rotated successfully",
        data: {
          id: updated.id,
          publicKey: updated.publicKey,
          updatedAt: updated.updatedAt,
        },
      });
    } catch (error) {
      return res.status(HTTPStatus.INTERNAL_SERVER_ERROR).json({
        message: "Failed to rotate keys",
        error: (error as Error).message,
      });
    }
  };

  /**
   * GET /keys/:publicKey
   *
   * Returns the full encrypted record so the client can decrypt locally.
   * Used after app reinstall to recover the wallet.
   */
  getKeys = async (req: Request, res: Response) => {
    try {
      const publicKey = req.params.publicKey as string;

      // Check if it's a UUID (likely farmerId) or a Solana address
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(publicKey);

      let record: any;
      if (isUUID) {
        record = await prisma.farmerKeys.findUnique({
          where: { farmerId: publicKey },
        });
      } else {
        const isValid = await keyService.isValidSolanaPublicKey(publicKey);
        if (!isValid) {
          return res.status(HTTPStatus.BAD_REQUEST).json({
            message: "Invalid Solana public key or farmer ID",
          });
        }
        record = await prisma.farmerKeys.findUnique({
          where: { publicKey },
        });
      }

      if (!record) {
        return res.status(HTTPStatus.NOT_FOUND).json({
          message: "Key not found",
        });
      }

      return res.status(HTTPStatus.OK).json({
        message: "Key fetched successfully",
        data: {
          id: record.id,
          publicKey: record.publicKey,
          encryptedPrivateKey: record.encryptedPrivateKey,
          meta: record.meta,           // { iv, salt, scheme } — client needs this to decrypt
          farmerId: record.farmerId,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        },
      });
    } catch (error) {
      return res.status(HTTPStatus.INTERNAL_SERVER_ERROR).json({
        message: "Failed to get keys",
        error: (error as Error).message,
      });
    }
  };

  /**
   * GET /keys/:publicKey/public
   *
   * Returns only the public key — useful for balance lookups,
   * address sharing, or third-party verification.
   */
  getPublicKey = async (req: Request, res: Response) => {
    try {
      const { publicKey } = req.params;

      const isValid = await keyService.isValidSolanaPublicKey(publicKey as string);
      if (!isValid) {
        return res.status(HTTPStatus.BAD_REQUEST).json({
          message: "Invalid Solana public key",
        });
      }

      const record = await prisma.farmerKeys.findUnique({
        where: { publicKey: publicKey as string },
        select: { publicKey: true, farmerId: true, createdAt: true },
      });

      if (!record) {
        return res.status(HTTPStatus.NOT_FOUND).json({
          message: "Key not found",
        });
      }

      return res.status(HTTPStatus.OK).json({
        message: "Public key fetched successfully",
        data: record,
      });
    } catch (error) {
      return res.status(HTTPStatus.INTERNAL_SERVER_ERROR).json({
        message: "Failed to get public key",
        error: (error as Error).message,
      });
    }
  };

  /**
   * DELETE /keys/:publicKey
   *
   * Permanently removes the encrypted key from the server.
   * Client should also wipe SecureStore.
   */
  deleteKeys = async (req: Request, res: Response) => {
    try {
      const { publicKey } = req.params;

      const isValid = await keyService.isValidSolanaPublicKey(publicKey as string);
      if (!isValid) {
        return res.status(HTTPStatus.BAD_REQUEST).json({
          message: "Invalid Solana public key",
        });
      }

      const record = await prisma.farmerKeys.findUnique({
        where: { publicKey: publicKey as string },
      });

      if (!record) {
        return res.status(HTTPStatus.NOT_FOUND).json({
          message: "Key not found",
        });
      }

      await prisma.farmerKeys.delete({ where: { publicKey: publicKey as string } });

      return res.status(HTTPStatus.OK).json({
        message: "Key deleted successfully",
        data: { publicKey },
      });
    } catch (error) {
      return res.status(HTTPStatus.INTERNAL_SERVER_ERROR).json({
        message: "Failed to delete keys",
        error: (error as Error).message,
      });
    }
  };
}