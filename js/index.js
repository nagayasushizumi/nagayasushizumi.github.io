// 使用 IIFE (立即執行函式) 避免全域變數污染
(function () {
  // F5初始化載入後的流程-----------------------------------------
  // 私有變數 - 不會污染全域作用域
  let currentPage = "/pages/page_1.html";  // 用來檢查目前頁面是那一頁
  let resumeContent = null; // 用來放履歷的 element
  let albumPath = null;  // 用來存放相簿的文字檔、圖片檔路徑

  // 論文資料管理 - 從 JSON 檔案載入,使用 localStorage 快取
  let publicationsData = [];

  function fetchPublicationsData() {
    const publicationsDataCache = localStorage.getItem("publicationsData");
    const timestamp = localStorage.getItem("publicationsDataTimestamp");
    const now = Date.now();
    const timeElapsed = now - timestamp;  // 已經過去的時間

    // 先檢查 localStorage 是否有資料,有的話就直接用
    if (publicationsDataCache && timeElapsed < 86400000) {
      // 距離過期還有幾小時、幾分鐘、幾秒
      const remainingTime = 86400000 - timeElapsed;
      const remainingHours = Math.floor(remainingTime / 3600000);
      const remainingMinutes = Math.floor((remainingTime % 3600000) / 60000);
      const remainingSeconds = Math.floor((remainingTime % 60000) / 1000);
      publicationsData = JSON.parse(publicationsDataCache);
      console.log("論文資料從 localStorage 載入:", publicationsData);
      console.log("localStorage 的論文資料,距離過期還有:", remainingHours, "小時", remainingMinutes, "分鐘", remainingSeconds, "秒");
      return;
    } else {
      // localStorage 沒有資料或已過期,重新從 JSON 檔案載入
      fetch("/publications/publications.json")
        .then(response => response.json())
        .then(data => {
          publicationsData = data;
          // 存入 localStorage 並記錄時間戳
          localStorage.setItem("publicationsData", JSON.stringify(publicationsData));
          localStorage.setItem("publicationsDataTimestamp", Date.now());
          console.log("論文資料已從 JSON 載入並快取:", publicationsData);
        })
        .catch(error => {
          console.error("載入論文資料失敗:", error);
        });
    }
  }

  function initialResumeContent() {
    fetch("/pages/page_1.html")
      .then((response) => response.text())
      .then((html) => {
        resumeContent = html;
        document.getElementById("resumeContent").innerHTML = resumeContent;
        console.log("1.全域變數 resumeContent 的內容是：", resumeContent);
      });
  }

  function fetchAlbumPath() {
    const albumPathData = localStorage.getItem("albumPath");
    const timestamp = localStorage.getItem("albumPathTimestamp");
    const now = Date.now();
    const timeElapsed = now - timestamp;  // 已經過去的時間

    //先檢查storage是否有資料，有的話就直接用
    if (albumPathData && timeElapsed < 86400000) {
      //距離過期還有幾小時、幾分鐘、幾秒
      const remainingTime = 86400000 - timeElapsed;
      const remainingHours = Math.floor(remainingTime / 3600000);
      const remainingMinutes = Math.floor((remainingTime % 3600000) / 60000);
      const remainingSeconds = Math.floor((remainingTime % 60000) / 1000);
      albumPath = JSON.parse(albumPathData);
      console.log("2a.從 localstorage 取用 albumPath 存到全域變數 albumPath：", albumPath);
      console.log("2a. localStorage 的 albumPath 資料，距離過期還有：", remainingHours, "小時", remainingMinutes, "分鐘", remainingSeconds, "秒");
      initialAlbumContent();
      updateAlbumList();
      return;
    } else {
      const owner = "nagayasushizumi";
      const repo = "nagayasushizumi.github.io";
      const basePath = "images/01";
      const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/`;

      function fetchPath(path) {
        console.log("2b.執行fetchPath函式，path是：", path);
        return fetch(`${apiBase}${path}`)
          .then(response => {
            if (!response.ok) {
              throw new Error(`GitHub API response was not ok for path: ${path}`);
            }
            return response.json();
          })
          .then(data => {
            return Promise.all(data.map(item => {
              if (item.type === "file") {
                return {
                  name: item.name,
                  type: "file",
                  download_url: item.download_url
                };
              } else if (item.type === "dir") {
                return fetchPath(`${path}/${item.name}`).then(contents => {
                  return { name: item.name, type: "dir", contents };
                });
              }
            }));
          });
      }
      fetchPath(basePath)
        .then(data => {
          albumPath = data;
          console.log("2c.localStorage的albumPath資料重新");
          //也存一份Array資料在localStorage，也存一個timestamp，之後用來檢查是否過期
          localStorage.setItem("albumPath", JSON.stringify(albumPath));
          localStorage.setItem("albumPathTimestamp", Date.now());
          console.log("2c.全域變數 albumPath 的內容是：", albumPath);
        }).then(() => {
          initialAlbumContent();
          updateAlbumList();
        })
        .catch(error => {
          console.error('Failed to fetch directory contents:', error);
        });
    }
  }

  // 從 albumPath 生成相簿的 element
  function initialAlbumContent() {
    const albumContainer = document.getElementById("albumContent");
    console.log("3.albumPath內容是：", albumPath);
    albumPath.forEach((folder, index) => {
      //創建相冊的標題
      const subDiv = document.createElement("div");
      albumContainer.appendChild(subDiv);
      subDiv.id = `album${index + 1}`;
      subDiv.className = "my-5 py-3 round shadow bg-light rounded ";
      const albumTitle = document.createElement("h3");
      albumTitle.textContent = folder.name;
      albumTitle.className = "album-title";
      subDiv.appendChild(albumTitle);
      //創建包含圖片的 div
      const imageContainer = document.createElement("div");
      imageContainer.className = "image-container";

      // 遍歷 folder，創建圖片卡
      folder.contents.forEach((file) => {
        if (file.type === "file") {
          const imageCard = document.createElement("div");
          imageCard.className = "image-card";

          const image = document.createElement("img");
          image.className = "object-fit-fill border ";
          image.src = file.download_url;
          image.alt = file.name;

          // 添加點擊事件監聽器以打開模態窗口
          image.onclick = function () {
            const modalImage = document.getElementById('modalImage');
            modalImage.src = this.src; // 設置模態窗口中的圖像URL

            // 處理文件名，去掉副檔名
            const fileName = file.name.split('.'); // 分割文件名和副檔名
            fileName.pop(); // 移除數組中的最後一個元素（副檔名）
            const cleanName = fileName.join('.'); // 重新組合為處理過的文件名

            const modalTitle = document.getElementById('imageModalLabel');
            modalTitle.textContent = cleanName; // 設置模態窗口標題為處理後的文件名

            const modal = new bootstrap.Modal(document.getElementById('imageModal'), {
              keyboard: true,
              focus: true
            });
            modal.show();
          };

          imageCard.appendChild(image);
          imageContainer.appendChild(imageCard);
        }
      });

      subDiv.appendChild(imageContainer);
      albumContainer.appendChild(subDiv);
    });
  }


  //生成下拉選單-----------------------------------------
  function updateAlbumList() {
    const albumList = document.getElementById("album-List");
    albumList.innerHTML = "";
    albumPath.forEach((folder, index) => {
      const albumItem = document.createElement("li");
      const albumLink = document.createElement("a");
      albumLink.className = "nav-link text-dark mx-2";
      albumLink.dataset.url = "/pages/albums.html";
      albumLink.href = `#album${index + 1}`;
      albumLink.textContent = folder.name;
      albumLink.onclick = function () {
        switchPageContent(this);
        return false;
      };
      albumItem.appendChild(albumLink);

      //生成hr元素，除了最後一個元素
      if (index < albumPath.length - 1) {
        const hr = document.createElement("hr");
        albumItem.appendChild(hr);
      }

      albumList.appendChild(albumItem);
    });
  }

  initialResumeContent();
  fetchAlbumPath();
  fetchPublicationsData();

  function switchPageContent(link) {
    var url = $(link).attr("data-url");
    var href = $(link).attr("href").substring(1); // 獲取ID並移除前面的#

    console.log("6.點擊的連結是：", link, url, href);
    // 檢查是否已經在當前頁面
    if (currentPage === url) {
      $('#' + href).get(0).scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
      console.log("7a.已經在當前頁面，不需要切換");
    }
    // 根据 URL 切换显示内容
    else if (url === "/pages/albums.html") {
      $("#resumeContent").removeClass("d-block").addClass("d-none"); // 隱藏履歷
      $("#albumContent").addClass("d-block").removeClass("d-none"); // 顯示相簿
      currentPage = url;
      //點擊相簿的子相本a標籤時，用 Bootstrap 5 的方式來關閉下拉清單以及導航列，如果 上一層漢堡選單 現在有開啟，才會執行關閉它
      console.log("7b.漢堡選單狀態", ($(".navbar-toggler").attr("aria-expanded") === "true"));
      console.log("7b 檢查albumPath ：", albumPath);
      console.log("7b currentPage 目前在相簿頁：", currentPage);
      if ($(".navbar-toggler").attr("aria-expanded") === "true") {
        $(".navbar-toggler").click();
      }

    } else {
      $("#resumeContent").addClass("d-block").removeClass("d-none"); // 顯示履歷
      $("#albumContent").removeClass("d-block").addClass("d-none"); // 隱藏相簿
      currentPage = url;
      console.log("7c. currentPage 已切換到履歷頁：", currentPage);
    }

    // 嘗試滾動到指定的ID
    $('#' + href).get(0).scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  // 開啟論文檢視 Modal-----------------------------------------
  function openPublicationModal(pubId) {
    const pub = publicationsData.find(p => p.id === pubId);
    if (!pub) {
      console.error('找不到論文資料:', pubId);
      return;
    }

    const modalTitle = document.getElementById('publicationModalLabel');
    const modalBody = document.getElementById('publicationModalBody');

    modalTitle.textContent = pub.title;

    if (pub.type === 'pdf') {
      modalBody.innerHTML = `
        <iframe src="${pub.path}" width="100%" height="600px" style="border: none;"></iframe>
        <div class="text-center mt-3">
          <a href="${pub.path}" download class="btn btn-primary">
            <i class="fa fa-download"></i> 下載
          </a>
        </div>
      `;
    } else if (pub.type === 'image') {
      modalBody.innerHTML = `
        <img src="${pub.path}" class="img-fluid" alt="${pub.title}">
        <div class="text-center mt-3">
          <a href="${pub.path}" download class="btn btn-primary">
            <i class="fa fa-download"></i> 下載
          </a>
        </div>
      `;
    }

    const modal = new bootstrap.Modal(document.getElementById('publicationModal'));
    modal.show();
  }

  // Navbar的List點擊事件-----------------------------------------
  $(document).ready(function () {
    $(".nav-link").click(function () {
      $(".nav-link").removeClass("active");
      $(this).addClass("active");
    });
  });

  // 當DOM載入完成後，設定事件監聽器-----------------------------------------
  document.addEventListener("DOMContentLoaded", function () {
    // 當點擊任何導航連結時
    document
      .querySelectorAll(".navbar-nav .nav-link")
      .forEach(function (link) {
        link.addEventListener("click", function (event) {
          // 檢查點擊的元素是否為下拉選單切換
          if (!this.classList.contains("dropdown-toggle")) {
            // 只有當不是下拉選單時，才關閉折疊的導航
            var navbarCollapse = document.querySelector(".navbar-collapse");
            if (navbarCollapse.classList.contains("show")) {
              navbarCollapse.classList.remove("show");
            }
          }
        });
      });

    //點擊相簿的子相本a標籤時，用 Bootstrap 5 的方式來關閉下拉清單以及導航列


    // 確保當點擊品牌名時，也應該收起導航條
    var brandLink = document.querySelector(".navbar-brand");
    brandLink.addEventListener("click", function () {
      var navbarCollapse = document.querySelector(".navbar-collapse");
      if (navbarCollapse.classList.contains("show")) {
        navbarCollapse.classList.remove("show"); //收起下拉清單
      }
    });
  });

  // 暴露必要的函式到全域作用域 (供 HTML onclick 使用)
  window.switchPageContent = switchPageContent;
  window.openPublicationModal = openPublicationModal;
})();