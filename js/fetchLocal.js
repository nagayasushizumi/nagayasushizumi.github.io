// F5初始化載入後的流程-----------------------------------------
let currentPage = "/pages/page_1.html";  // 用來檢查目前頁面是那一頁
let resumeContent = null; // 用來放履歷的 element
let albumPath = null;  // 用來存放相簿的文字檔、圖片檔路徑

function initialResumeContent() {
  fetch("/pages/page_1.html")
    .then((response) => response.text())
    .then((html) => {
      resumeContent = html;
      document.getElementById("resumeContent").innerHTML = resumeContent;
      console.log("1.全域變數 resumeContent 的內容是：",resumeContent);
    });
};

function fetchAlbumPath() {
  const albumPathData = localStorage.getItem("albumPath");
  const timestamp = localStorage.getItem("albumPathTimestamp");
  const now = Date.now();
  const timeElapsed = now - timestamp;

  if (albumPathData && timeElapsed < 86400000) {
    // 本地儲存中的資料仍然有效
    const remainingTime = 86400000 - timeElapsed;
    const remainingHours = Math.floor(remainingTime / 3600000);
    const remainingMinutes = Math.floor((remainingTime % 3600000) / 60000);
    const remainingSeconds = Math.floor((remainingTime % 60000) / 1000);
    albumPath = JSON.parse(albumPathData);
    console.log("2a.從 localstorage 取用 albumPath 存到全域變數 albumPath：", albumPath);
    console.log("2a. localStorage 的 albumPath 資料，距離過期還有：", remainingHours, "小時", remainingMinutes, "分鐘", remainingSeconds, "秒");
    initialAlbumContent();
    updateAlbumList();
  } else {
    // 本地儲存中的資料過期或不存在，從本地 JSON 檔案載入資料
    fetch("/images/directory_structure.json")
      .then((response) => response.json())
      .then((data) => {
        albumPath = data;
        console.log("2a.從本地 json 檔讀取的 albumPath 內容是：", albumPath);
        // 更新 localStorage
        localStorage.setItem("albumPath", JSON.stringify(albumPath));
        localStorage.setItem("albumPathTimestamp", Date.now());
        initialAlbumContent();
        updateAlbumList();
      })
      .catch(error => {
        console.error('Failed to load local JSON data:', error);
      });
  }
}


// 從 albumPath 生成相簿的 element
function initialAlbumContent(){
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
        image.onclick = function() {
          const modalImage = document.getElementById('modalImage');
          modalImage.src = this.src; // 設置模態窗口中的圖像URL
          
          // 處理文件名，去掉副檔名
          const fileName = file.name.split('.'); // 分割文件名和副檔名
          fileName.pop(); // 移除數組中的最後一個元素（副檔名）
          const cleanName = fileName.join('.'); // 重新組合為處理過的文件名

          const modalTitle = document.getElementById('imageModalLabel');
          modalTitle.textContent = cleanName; // 設置模態窗口標題為處理後的文件名

          const modal = new bootstrap.Modal(document.getElementById('imageModal'),{
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
function updateAlbumList(){
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

  // 根據 URL 切換顯示內容
  if (url === "/pages/albums.html") {
    $("#resumeContent").removeClass("d-block").addClass("d-none"); // 隱藏履歷
    $("#albumContent").addClass("d-block").removeClass("d-none"); // 顯示相簿
    currentPage = url;
    //點擊相簿的子相本a標籤時，用 Bootstrap 5 的方式來關閉下拉清單以及導航列，如果 上一層漢堡選單 現在有開啟，才會執行關閉它
    console.log("7b.漢堡選單狀態",($(".navbar-toggler").attr("aria-expanded") === "true"));
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