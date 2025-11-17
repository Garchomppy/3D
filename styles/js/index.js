let panoramaViewer; // Biến global cho Pannellum
let map; // Biến global cho bản đồ
let currentMarkers = []; // Array để lưu markers, dễ xóa khi search mới
let currentPOI = null; // Biến global để lưu POI hiện tại (khi click marker)

// POI mapping: tên => {tọa độ, ảnh, mô tả}
const poiMap = {
  "Thành cổ Quảng Trị": {
    position: { lat: 16.7520416, lng: 107.1889161 },
    image: "images/thanhco.jpg",
    title: "Thành cổ Quảng Trị",
  },
  "Di tích Nhà tù": {
    position: { lat: 16.754597, lng: 107.1897359 },
    image: "images/thanhco1.jpg",
    title: "Di tích Nhà tù",
  },
  "Quảng Trường": {
    position: { lat: 16.753228, lng: 107.1886229 },
    image: "images/thanhco2.jpg",
    title: "Thành cổ Quảng Trị",
  },
  "Nhà thờ": {
    position: { lat: 16.753148, lng: 107.1892433 },
    image: "images/thanhco3.jpg",
    title: "Thành cổ Quảng Trị",
  },
  "Gần Cầu": {
    position: { lat: 16.752657, lng: 107.1884383 },
    image: "images/thanhco4.jpg",
    title: "Thành cổ Quảng Trị",
  },
  "Di tích Lịch Sử": {
    position: { lat: 16.753541, lng: 107.1887253 },
    image: "images/thanhco5.jpg",
    title: "Thành cổ Quảng Trị",
  },
  "Cầu Hiền Lương": {
    position: { lat: 17.0021623, lng: 107.0525759 },
    image: "images/hienluong.jpg",
    title: "Cầu Hiền Lương",
  },
  "Cầu Hiền Lương Lịch Sử": {
    position: { lat: 17.0053222, lng: 107.0509741 },
    image: "images/hienluong1.jpg",
    title: "Cầu Hiền Lương",
  },
};

// Hàm tạo infowindow content dựa trên POI info
function createInfoWindowContent(poiName, imageUrl) {
  return `
    <div>
      <img src="${imageUrl}" alt="${poiName}" onerror="this.src='https://via.placeholder.com/300x200?text=Ảnh+lỗi';" style="max-width:100%; height:auto; border-radius:8px;">
      <p>Click <button onclick="setCurrentPOI('${poiName}'); open3DModal();" style="background:#007cba; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Xem 3D Panorama</button> để khám phá!</p>
    </div>
  `;
}

function createInfoWindowContent(poiName, imageUrl) {
  return `
    <div>
      <img src="${imageUrl}" alt="${poiName}" onerror="this.src='https://via.placeholder.com/300x200?text=Ảnh+lỗi';" style="max-width:100%; height:auto; border-radius:8px;">
      <p>Click <button onclick="setCurrentPOI('${poiName}'); open3DModal();" style="background:#007cba; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Xem 3D Panorama</button> để khám phá!</p>
    </div>
  `;
}

async function initMap() {
  try {
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    const allPositions = Object.values(poiMap).map((poi) => poi.position);
    const avgLat = allPositions.reduce((sum, pos) => sum + pos.lat, 0) / allPositions.length;
    const avgLng = allPositions.reduce((sum, pos) => sum + pos.lng, 0) / allPositions.length;
    const centerMap = { lat: avgLat, lng: avgLng };

    map = new google.maps.Map(document.getElementById("map"), {
      zoom: 11, // Zoom nhỏ hơn để thấy được tất cả marker
      center: centerMap, // Tâm ở giữa tất cả POI
      mapTypeId: "satellite",
      tilt: 0, // Bỏ tilt để nhìn thẳng
      heading: 0,
      mapId: "f2a0ab41ee50fdee39133f1a", // Thay bằng Map ID thực từ Google Cloud Console
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
    });

    // FIX: Loop tạo marker cho TẤT CẢ POI từ poiMap
    Object.entries(poiMap).forEach(([poiName, poiData]) => {
      const marker = new AdvancedMarkerElement({
        map: map,
        position: poiData.position,
        title: poiData.title,
      });
      currentMarkers.push(marker);

      // Tạo infowindow riêng cho từng POI
      const contentString = createInfoWindowContent(poiName, poiData.image);
      const infowindow = new google.maps.InfoWindow({ content: contentString });

      // Event click: Mở infowindow cho POI đó
      marker.addListener("click", function () {
        infowindow.open({
          anchor: marker,
          map: map,
          shouldFocus: false,
        });
      });

      // Mở infowindow mặc định cho POI đầu tiên (ví dụ "Thành cổ Quảng Trị")
      if (poiName === "Thành cổ Quảng Trị") {
        setCurrentPOI(poiName); // Set POI mặc định cho panorama
        infowindow.open({
          anchor: marker,
          map: map,
          shouldFocus: false,
        });
      }
    });

    console.log(`Đã tạo ${Object.keys(poiMap).length} markers từ poiMap!`);

    // FIX: Pass centerMap vào initNewAutocomplete (thay vì citadel cụ thể)
    await initNewAutocomplete(centerMap, AdvancedMarkerElement);
  } catch (error) {
    showError("Lỗi khởi tạo map: " + error.message + ". Kiểm tra API key và mapId.");
    console.error(error);
  }
}

// Mở modal 3D
function open3DModal() {
  document.getElementById("modal").style.display = "block";
  document.getElementById("panorama").innerHTML = "";
  initPanorama();
}

// Đặt POI hiện tại
function setCurrentPOI(poiName) {
  if (poiMap[poiName]) {
    currentPOI = poiMap[poiName];
    console.log("Current POI set to:", poiName, currentPOI);
  } else {
    console.warn("POI not found:", poiName);
  }
}

// Đóng modal
function closeModal() {
  document.getElementById("modal").style.display = "none";
  if (panoramaViewer) {
    panoramaViewer.destroy();
    panoramaViewer = null;
  }
}

// Khởi tạo Pannellum
function initPanorama() {
  if (typeof pannellum === "undefined") {
    console.error("Lỗi: Pannellum chưa load.");
    showError("Lỗi tải Pannellum. Reload trang.");
    return;
  }
  // Lấy ảnh từ currentPOI, nếu không có thì dùng ảnh mặc định
  const poiImage = currentPOI ? currentPOI.image : "images/thanhco.jpg";
  const poiTitle = currentPOI ? currentPOI.title : "Thành cổ Quảng Trị";
  console.log("Initializing Pannellum with image:", poiImage);
  panoramaViewer = pannellum.viewer("panorama", {
    type: "equirectangular",
    panorama: poiImage,
    autoLoad: true,
    showControls: true,
    showZoomCtrl: true,
    showFullscreenCtrl: true,
    default: {
      firstScene: "main",
      author: "Bạn",
      sceneFadeDuration: 1000,
    },
    scenes: {
      main: {
        title: poiTitle + " - Xem 3D",
        hfov: 110,
        pitch: 0,
        yaw: 0,
        haov: 360,
        minHfov: 50,
        maxHfov: 150,
      },
    },
    autoRotate: -2,
  });
  console.log("Pannellum 3D ready for:", poiTitle);
}

function showError(msg) {
  const errorDiv = document.getElementById("error-msg");
  errorDiv.innerHTML = `<h3>${msg}</h3><p>Console (F12) có chi tiết.</p>`;
  errorDiv.style.display = "block";
  setTimeout(() => {
    errorDiv.style.display = "none";
  }, 5000);
}

// Đóng modal khi click ngoài
window.onclick = function (event) {
  var modal = document.getElementById("modal");
  if (event.target == modal) {
    closeModal();
  }
};

// Khởi tạo Autocomplete đơn giản
async function initNewAutocomplete(centerMap, AdvancedMarkerElement) {
  try {
    console.log("Bắt đầu khởi tạo Autocomplete...");
    // Tạo input element
    const input = document.createElement("input");
    input.id = "searchInput";
    input.type = "text";
    input.placeholder = "Tìm kiếm thành phố...";
    input.style.width = "100%";
    input.style.padding = "10px";
    input.style.fontSize = "16px";
    input.style.border = "1px solid #ddd";
    input.style.borderRadius = "4px";
    input.style.boxSizing = "border-box";
    // Append vào container
    const container = document.getElementById("autocomplete");
    if (!container) {
      console.error("ERROR: #autocomplete container not found!");
      showError("Lỗi: Không tìm thấy search container!");
      return;
    }
    container.appendChild(input);
    console.log("Input element created and appended");
    // Khởi tạo Places Autocomplete API (cũ nhưng ổn định)
    // NOTE: '(cities)' cannot be mixed with other types — use '(regions)' to include
    // both administrative areas (tỉnh/thành) and localities (thành phố).
    const autocomplete = new google.maps.places.Autocomplete(input, {
      types: ["(regions)"],
      componentRestrictions: { country: "vn" },
    });
    console.log("Autocomplete initialized");
    // Lắng nghe sự kiện place_changed
    autocomplete.addListener("place_changed", function () {
      const place = autocomplete.getPlace();
      console.log("Place selected:", place);
      if (!place.geometry) {
        console.warn("No geometry found for place:", place.name);
        // Thay vì hiện alert tức thì, thử các bước phục hồi:
        // 1) Geocode tên (nếu có) để lấy tọa độ
        // 2) Nếu geocode không trả về, fallback sang textSearch POI
        if (place.name) {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ address: place.name }, function (results, status) {
            if (status === google.maps.GeocoderStatus.OK && results && results[0] && results[0].geometry) {
              const g = results[0].geometry;
              if (g.viewport) {
                map.fitBounds(g.viewport);
              } else if (g.location) {
                map.setCenter(g.location);
                map.setZoom(13);
              }
              console.log("Moved to geocoded place:", place.name);
            } else {
              console.log("Geocode failed or no result, falling back to textSearch for:", place.name);
              // fallback to POI text search (will update UI/results)
              performTextSearch(place.name);
            }
          });
        } else {
          showError("Không tìm thấy vị trí cho lựa chọn này.");
        }
        return;
      }
      // Xóa markers cũ trước khi di chuyển (giữ POI markers nếu muốn)
      currentMarkers.forEach((m) => (m.map = null));
      currentMarkers = [];
      // Di chuyển map tới vị trí được chọn
      if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
        console.log("Map di chuyển bằng viewport đến:", place.name);
      } else {
        map.setCenter(place.geometry.location);
        map.setZoom(13);
        console.log("Map di chuyển bằng center đến:", place.name);
      }
      // Thêm marker mới cho place tìm kiếm
      const newMarker = new AdvancedMarkerElement({
        map: map,
        position: place.geometry.location,
        title: place.name,
      });
      currentMarkers.push(newMarker);
      console.log("Map đã di chuyển đến:", place.name);
    });
    // Enter key => perform text search for POI (e.g., "thành cổ")
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        const q = input.value && input.value.trim();
        if (q) {
          performTextSearch(q);
        }
      }
    });
    console.log("Autocomplete ready!");
  } catch (error) {
    console.error("Error in initNewAutocomplete:", error);
    showError("Lỗi khởi tạo tìm kiếm: " + error.message);
  }
}

// Perform Places Text Search for POI keywords and move map to first result (no marker)
function performTextSearch(query) {
  try {
    console.log("Performing text search for:", query);
    const service = new google.maps.places.PlacesService(map);
    const request = {
      query: query,
      location: map.getCenter(),
      radius: 50000, // 50 km bias
    };
    service.textSearch(request, function (results, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
        const place = results[0];
        console.log("TextSearch result:", place.name, place);
        if (place.geometry && place.geometry.viewport) {
          map.fitBounds(place.geometry.viewport);
        } else if (place.geometry && place.geometry.location) {
          map.setCenter(place.geometry.location);
          map.setZoom(15);
        }
        // Optionally show brief info
        // showError(`Di chuyển tới: ${place.name}`);
      } else {
        console.warn("TextSearch no results or error, status:", status);
        showError("Không tìm thấy POI cho: " + query);
      }
    });
  } catch (err) {
    console.error("performTextSearch error:", err);
    showError("Lỗi tìm kiếm POI: " + err.message);
  }
}
