import { resolveMediaArray, resolveMediaUrl } from "../config/r2.js";

const normalize = (doc) => (doc && typeof doc.toObject === "function" ? doc.toObject() : doc);

export const resolveUserMedia = async (user) => {
  const normalized = normalize(user);
  if (!normalized) return normalized;
  if (normalized.profilePicture) {
    normalized.profilePicture = await resolveMediaUrl(normalized.profilePicture);
  }
  return normalized;
};

export const resolveItemMedia = async (item) => {
  const normalized = normalize(item);
  if (!normalized) return normalized;

  if (Array.isArray(normalized.images)) {
    normalized.images = await resolveMediaArray(normalized.images);
  }

  if (normalized.postedBy?.profilePicture) {
    normalized.postedBy.profilePicture = await resolveMediaUrl(
      normalized.postedBy.profilePicture,
    );
  }

  if (Array.isArray(normalized.claims)) {
    await Promise.all(
      normalized.claims.map(async (claim) => {
        if (claim?.user?.profilePicture) {
          claim.user.profilePicture = await resolveMediaUrl(
            claim.user.profilePicture,
          );
        }
      }),
    );
  }

  if (normalized.itemReference?.images) {
    normalized.itemReference.images = await resolveMediaArray(
      normalized.itemReference.images,
    );
  }

  return normalized;
};

export const resolveItemsMedia = async (items) => {
  if (!Array.isArray(items)) return items;
  return Promise.all(items.map((item) => resolveItemMedia(item)));
};
