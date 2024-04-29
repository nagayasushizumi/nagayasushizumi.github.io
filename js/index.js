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
  const owner = "nagayasushizumi";
  const repo = "nagayasushizumi.github.io";
  const basePath = "images/01";
  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/`;

  function fetchPath(path){ 
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
      console.log("2.全域變數 albumPath 的內容是：", albumPath);
    }).then(() => {
      initialAlbumContent();
      updateAlbumList();
    })
    .catch(error => {
      console.error('Failed to fetch directory contents:', error);
    });
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
    subDiv.className = "my-5 p-2 round shadow bg-light rounded ";
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
              imageCard.className = "image-card"; // 添加CSS类

              const image = document.createElement("img");
              image.className = "object-fit-fill border ";
              image.src = file.download_url;
              image.alt = file.name;

              //  const caption = document.createElement('p');
              //  caption.textContent = file.name;

              imageCard.appendChild(image);
              //imageCard.appendChild(caption);
              imageContainer.appendChild(imageCard);
            }
          }
        );
        console.log(`4 - ${index + 1}.subDiv 生成的相簿內容是：`, subDiv);
        subDiv.appendChild(imageContainer);
      albumContainer.appendChild(subDiv);
    }
  );
  console.log("5.albumContainer生成的相簿內容是：", albumContainer);
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
    albumList.appendChild(albumItem);
  });
}

initialResumeContent();
fetchAlbumPath();

function switchPageContent(link) {
  var url = $(link).attr("data-url");
  var href = $(link).attr("href").substring(1); // 获取ID并移除前面的#

  console.log("6.點擊的連結是：", link, url, href);

  // 检查是否已经在当前页面
  if (currentPage === url) {
    $('#' + href).get(0).scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
    console.log("7.已經在當前頁面，不需要切換");
  }

  
  // 根据 URL 切换显示内容
  if (url === "/pages/albums.html") {
    $("#resumeContent").removeClass("d-block").addClass("d-none"); // 隐藏履历
    $("#albumContent").addClass("d-block").removeClass("d-none"); // 显示相簿
    currentPage = url;
    //點擊相簿的子相本a標籤時，用 Bootstrap 5 的方式來關閉下拉清單以及導航列，如果 上一層漢堡選單 現在有開啟，才會執行關閉它
    console.log("8.關閉漢堡選單",($(".navbar-toggler").attr("aria-expanded") === "true"));
    if ($(".navbar-toggler").attr("aria-expanded") === "true") {
      $(".navbar-toggler").click();
    }

  } else {
    $("#resumeContent").addClass("d-block").removeClass("d-none"); // 显示履历
    $("#albumContent").removeClass("d-block").addClass("d-none"); // 隐藏相簿
    currentPage = url;
  }

  // 尝试滚动到指定的ID
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