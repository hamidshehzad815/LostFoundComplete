import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET,
  R2_PUBLIC_URL,
  R2_ENDPOINT,
  R2_PRIVATE,
  R2_SIGNED_URL_TTL,
} = process.env;

export const isR2Configured =
  !!R2_ACCOUNT_ID &&
  !!R2_ACCESS_KEY_ID &&
  !!R2_SECRET_ACCESS_KEY &&
  !!R2_BUCKET &&
  !!R2_PUBLIC_URL;

export const isR2Private = R2_PRIVATE === "true";

const endpoint =
  R2_ENDPOINT || (R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined);

const client =
  isR2Configured && endpoint
    ? new S3Client({
        region: "auto",
        endpoint,
        credentials: {
          accessKeyId: R2_ACCESS_KEY_ID,
          secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
      })
    : null;

const sanitizePath = (segment) => segment.replace(/[^a-zA-Z0-9/_-]/g, "_");
const uploadsRoot = path.resolve(process.cwd(), "uploads");

const buildLocalKey = (folder, file) => {
  const ext = file.originalname?.includes(".")
    ? file.originalname.split(".").pop()
    : "";
  return `${sanitizePath(folder)}/${randomUUID()}${ext ? `.${ext}` : ""}`;
};

export const uploadToR2 = async ({ folder, file }) => {
  if (!client || !isR2Configured) {
    throw new Error("R2 is not configured");
  }

  const key = buildLocalKey(folder, file);

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await client.send(command);

  if (isR2Private) {
    return `r2:${key}`;
  }

  return `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
};

export const saveToLocal = async ({ folder, file }) => {
  const key = buildLocalKey(folder, file);
  const targetPath = path.join(uploadsRoot, key);

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, file.buffer);

  return `/${path.join("uploads", key).replace(/\\/g, "/")}`;
};

const extractR2Key = (value) => {
  if (!value || typeof value !== "string") return null;
  if (value.startsWith("r2:")) return value.slice(3);
  if (value.startsWith("r2://")) return value.slice(5);
  if (R2_PUBLIC_URL && value.startsWith(R2_PUBLIC_URL)) {
    const stripped = value.slice(R2_PUBLIC_URL.length);
    return stripped.replace(/^\//, "");
  }
  return null;
};

export const resolveMediaUrl = async (value) => {
  if (!value || typeof value !== "string") return value;
  if (value.startsWith("/uploads/")) return value;

  const key = extractR2Key(value);
  if (!key) return value;

  if (!client || !isR2Configured) return value;

  if (!isR2Private) {
    return value.startsWith("http") ? value : `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
  }

  const expiresIn = parseInt(R2_SIGNED_URL_TTL || "900", 10);
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
};

export const resolveMediaArray = async (values) => {
  if (!Array.isArray(values)) return values;
  const resolved = await Promise.all(values.map((value) => resolveMediaUrl(value)));
  return resolved;
};
