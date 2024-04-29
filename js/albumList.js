const fs = require("fs");
const path = require("path");

console.log("Current working directory:", __dirname);

const targetDirectory = "../images/01"; // 指定要列出目錄的路徑

function listDirectories(dirPath) {
  fs.readdir(dirPath, { withFileTypes: true }, (err, items) => {
    if (err) {
      console.error("Error reading directory:", err);
      return;
    }

    const directories = items
      .filter((item) => item.isDirectory())
      .map((dir) => dir.name);
    console.log(directories);

    // 指定要保存目錄列表的 JSON 文件的路徑
    const targetFilePath = path.join(__dirname, "../images/directories.json");

    // 將目錄列表寫入 JSON 文件
    fs.writeFile(
      targetFilePath,
      JSON.stringify({ folders: directories }, null, 2),
      (err) => {
        if (err) {
          console.error("Error writing to file:", err);
        } else {
          console.log("Directory list saved to", targetFilePath);
        }
      }
    );
  });
}

// 使用 path.resolve 確保您獲得正確的完整路徑
const fullPath = path.resolve(__dirname, targetDirectory);
console.log("Full path to target directory:", fullPath);

listDirectories(fullPath);
