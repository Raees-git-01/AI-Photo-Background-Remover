import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use("/uploads", express.static(uploadDir));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const pythonPath = "python";

const pythonScript = path.join(
  __dirname,
  "remove_bg.py"
);

app.get("/", (req, res) => {
  res.json({
    message: "Erasely AI backend is running",
  });
});

app.post(
  "/api/remove-background",
  upload.single("image"),
  async (req, res) => {
    req.setTimeout(10 * 60 * 1000);
    res.setTimeout(10 * 60 * 1000);
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "No image uploaded.",
        });
      }

      console.log(
        "Image received:",
        req.file.originalname
      );

      const inputFilename =
        `input-${Date.now()}-${req.file.originalname}`;

      const outputFilename =
        `removed-${Date.now()}.png`;

      const inputPath = path.join(
        uploadDir,
        inputFilename
      );

      const outputPath = path.join(
        uploadDir,
        outputFilename
      );

      await fs.promises.writeFile(
        inputPath,
        req.file.buffer
      );

      console.log(
        "Starting local rembg..."
      );

      const pythonProcess = spawn(
        pythonPath,
        [
          pythonScript,
          inputPath,
          outputPath,
        ]
      );

      console.log("Python process started:", pythonProcess.pid);

      let pythonOutput = "";
      let pythonError = "";

      pythonProcess.stdout.on(
        "data",
        (data) => {
          pythonOutput += data.toString();
          console.log(
            "Python:",
            data.toString().trim()
          );
        }
      );

      pythonProcess.stderr.on(
        "data",
        (data) => {
          pythonError += data.toString();
          console.error(
            "Python error:",
            data.toString().trim()
          );
        }
      );

      pythonProcess.on(
        "close",
        async (code) => {
          console.log("Python process closed with code:", code);

          console.log(
            "Python process closed with code:",
            code
          );

          try {
            if (code !== 0) {
              console.error(
                "rembg process failed:",
                pythonError
              );

              return res.status(500).json({
                success: false,
                message:
                  "Background removal failed.",
              });
            }

            if (
              !fs.existsSync(outputPath)
            ) {
              return res.status(500).json({
                success: false,
                message:
                  "Processed image was not created.",
              });
            }

            await fs.promises.unlink(
              inputPath
            ).catch(() => {});

            console.log(
              "Background removed successfully."
            );

            console.log(
              "Saved:",
              outputFilename
            );

            res.json({
              success: true,
              message:
                "Background removed successfully.",
              outputUrl:
                `${req.protocol}://${req.get("host")}/uploads/${outputFilename}`,
            });
          } catch (error) {
            console.error(error);

            res.status(500).json({
              success: false,
              message:
                "Failed to finish image processing.",
            });
          }
        }
      );
    } catch (error) {
      console.error(
        "Background removal error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          error?.message ||
          "Background removal failed.",
      });
    }
  }
);

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Erasely backend running on http://localhost:${PORT}`
  );
});