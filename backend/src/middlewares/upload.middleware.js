import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { isR2Configured } from "../config/r2.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const localProfileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads/profiles"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "profile-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const localItemStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads/items"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "item-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"));
  }
};

const memoryStorage = multer.memoryStorage();

export const profileUpload = multer({
  storage: isR2Configured ? memoryStorage : localProfileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter,
});

const upload = multer({
  storage: isR2Configured ? memoryStorage : localItemStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter,
});

export default upload;
