const fs = require('fs').promises;
const path = require('path');

// 根據執行環境自動調整路徑
// GitHub Actions 中工作目錄是 repository 根目錄
// 本地執行時工作目錄是 js/ 資料夾
const rootDirectory = process.env.GITHUB_ACTIONS ? "images/01" : "../images/01";
const outputPath = process.env.GITHUB_ACTIONS ? "images/directory_structure.json" : "../images/directory_structure.json";
const baseDirectory = path.resolve(__dirname, rootDirectory); // 為相對路徑提供一個基準點

async function fetchLocalPath(localPath) {
  console.log("2b.執行fetchLocalPath函式，path是：", localPath);
  try {
    const dirEntries = await fs.readdir(localPath, { withFileTypes: true });
    const fetchPromises = dirEntries.map(dirEntry => {
      const fullPath = path.join(localPath, dirEntry.name);
      let relativePath = path.relative(baseDirectory, fullPath); // 計算相對於根目錄的相對路徑
      relativePath = relativePath.split(path.sep).join('/'); // 將路徑分隔符由系統預設改為Web標準的斜線

      if (dirEntry.isFile()) {
        return Promise.resolve({
          name: dirEntry.name,
          type: "file",
          download_url: `images/01/${relativePath}`
        });
      } else if (dirEntry.isDirectory()) {
        return fetchLocalPath(fullPath).then(contents => {
          return { name: dirEntry.name, type: "dir", contents };
        });
      }
    });

    return Promise.all(fetchPromises);
  } catch (err) {
    throw new Error(`Error accessing local path: ${localPath}, Error: ${err}`);
  }
}

// 使用 path.resolve 確保得到正確的完整路徑
console.log("Full path to target directory:", baseDirectory);

fetchLocalPath(baseDirectory)
  .then(contents => {
    const jsonOutputPath = path.resolve(__dirname, outputPath);
    fs.writeFile(jsonOutputPath, JSON.stringify(contents, null, 2), 'utf8')
      .then(() => console.log(`Directory and images list saved to ${jsonOutputPath}`))
      .catch(error => console.error(`Error writing JSON to file: ${error}`));
  })
  .catch(error => console.error(error));
