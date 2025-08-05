import multer from "multer";
import fs from "fs/promises";
import path from "path";

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = "./uploads";
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}_${timestamp}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".txt", ".pdf", ".docx", ".md", ".csv", ".json"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `File type ${ext} not supported. Allowed types: ${allowedTypes.join(
            ", "
          )}`
        )
      );
    }
  },
});
