#include "store.hpp"
#include <utility>

namespace forma {
namespace {
// Mỗi mức giá là dữ liệu demo, lưu bằng số nguyên đồng Việt Nam.
std::vector<Storage> prices(std::initializer_list<std::pair<int, std::int64_t>> list) {
    std::vector<Storage> result;
    for (const auto& [gb, price] : list) result.push_back({gb, Money{price}});
    return result;
}
} // namespace

Catalog::Catalog() {
    const auto add = [this](PhoneSpec spec) {
        if (spec.brand == "Apple") phones_.push_back(std::make_unique<IPhone>(std::move(spec)));
        else phones_.push_back(std::make_unique<AndroidPhone>(std::move(spec)));
    };

    // Danh mục demo. Mỗi dung lượng mang giá niêm yết riêng, tính theo đồng.
    const std::vector<Color> proColors{
        {"orange", "Cam Vũ Trụ", "#e67836", "pro-orange"},
        {"blue", "Xanh Đậm", "#26384c", "pro-blue"},
        {"silver", "Bạc", "#dededd", "pro-silver"}
    };
    add({
        "iphone-17-pro", "Apple", "iPhone 17 Pro", "Thiết kế mới. Chất Pro.",
        "Thân nhôm liền khối, chip A19 Pro và hệ thống ba camera Fusion 48 MP dành cho những khung hình có chủ đích.",
        "6,3″ Super Retina XDR", "A19 Pro", "Ba camera Fusion 48 MP", "Nhôm liền khối",
        proColors, prices({{256, 34990000}, {512, 40990000}, {1024, 46990000}}), true
    });
    add({
        "iphone-air", "Apple", "iPhone Air", "Mỏng nhẹ trong tay.",
        "Thiết kế titan dày 5,6 mm, màn hình 6,5 inch và chip A19 Pro trong một thân máy nhẹ.",
        "6,5″ Super Retina XDR", "A19 Pro", "Fusion 48 MP", "Titan",
        {{"sky", "Xanh Da Trời", "#c9dbe5", "air-sky"}, {"black", "Đen Không Gian", "#333439", "air-black"}},
        prices({{256, 31990000}, {512, 37990000}}), true
    });
    add({
        "galaxy-s25-ultra", "Samsung", "Galaxy S25 Ultra", "Titan và S Pen.",
        "Khung titan, bút S Pen tích hợp và camera góc rộng 200 MP cho những người luôn mang theo ý tưởng.",
        "6,9″ Dynamic AMOLED 2X", "Snapdragon 8 Elite for Galaxy", "Camera chính 200 MP", "Khung titan",
        {{"blue", "Titan Xanh Bạc", "#a4adb9", "galaxy-blue"}, {"black", "Titan Đen", "#43464b", "galaxy-black"}},
        prices({{256, 29990000}, {512, 33990000}, {1024, 38990000}}), true
    });
    add({
        "pixel-9-pro", "Google", "Pixel 9 Pro", "Góc nhìn từ Google.",
        "Màn hình Super Actua 6,3 inch, Tensor G4 và cụm camera ba ống kính trong thân máy gọn gàng.",
        "6,3″ Super Actua", "Google Tensor G4", "50 MP chính và tele 5×", "Khung nhôm",
        {{"porcelain", "Trắng Sứ", "#e9e4dc", "pixel-porcelain"}},
        prices({{128, 20990000}, {256, 23990000}}), true
    });
    add({
        "iphone-17", "Apple", "iPhone 17", "Sắc màu cho mỗi ngày.",
        "Màn hình ProMotion 120 Hz, chip A19 và camera trước Center Stage 18 MP.",
        "6,3″ Super Retina XDR", "A19", "Hai camera Fusion 48 MP", "Khung nhôm",
        {{"sage", "Xanh Lá Xô Thơm", "#bfc8b7", "iphone-17-sage"}, {"lavender", "Tím Oải Hương", "#cbc4dc", "iphone-17-lavender"}},
        prices({{256, 24990000}, {512, 30990000}}), false
    });
    add({
        "iphone-16", "Apple", "iPhone 16", "Dễ dùng, đủ mạnh.",
        "Chip A18, nút Tác Vụ và Điều Khiển Camera trong thiết kế 6,1 inch vừa tay.",
        "6,1″ Super Retina XDR", "A18", "Fusion 48 MP và góc siêu rộng", "Khung nhôm",
        {{"ultramarine", "Xanh Lưu Ly", "#5066a9", "iphone-16-blue"}, {"teal", "Xanh Mòng Két", "#75aaa5", "iphone-16-teal"}},
        prices({{128, 18490000}, {256, 21490000}}), false
    });

    // Apple
    add({
        "iphone-17-pro-max", "Apple", "iPhone 17 Pro Max", "Màn hình Pro 6,9 inch.",
        "Màn hình ProMotion cỡ lớn, A19 Pro và bộ ba camera Fusion 48 MP.",
        "6,9″ Super Retina XDR", "A19 Pro", "Ba camera Fusion 48 MP", "Nhôm liền khối",
        {{"silver", "Bạc", "#dededd", "iphone-17-pro-max"}},
        prices({{256, 38990000}, {512, 44990000}, {1024, 51990000}, {2048, 64990000}}), false
    });
    add({
        "iphone-17e", "Apple", "iPhone 17e", "A19 và MagSafe.",
        "Màn hình OLED 6,1 inch, chip A19 và camera Fusion với chế độ chụp 2×.",
        "6,1″ Super Retina XDR", "A19", "Fusion 48 MP", "Khung nhôm",
        {{"pink", "Hồng Nhạt", "#f1d8d9", "iphone-17e"}},
        prices({{256, 16990000}, {512, 22990000}}), false
    });
    add({
        "iphone-16-pro", "Apple", "iPhone 16 Pro", "A18 Pro trong khung titan.",
        "Màn hình ProMotion 6,3 inch và hệ camera Pro với ống kính tele 5×.",
        "6,3″ Super Retina XDR", "A18 Pro", "Fusion 48 MP và tele 5×", "Khung titan",
        {{"black", "Titan Đen", "#353638", "iphone-16-pro"}},
        prices({{128, 23990000}, {256, 26990000}, {512, 31990000}}), false
    });
    add({
        "iphone-16-pro-max", "Apple", "iPhone 16 Pro Max", "Màn hình lớn, camera tele 5×.",
        "Thân titan, màn hình 6,9 inch và chip A18 Pro cho phiên bản cỡ lớn.",
        "6,9″ Super Retina XDR", "A18 Pro", "Fusion 48 MP và tele 5×", "Khung titan",
        {{"desert", "Titan Sa Mạc", "#c0a18d", "iphone-16-pro-max"}},
        prices({{256, 28990000}, {512, 33990000}, {1024, 39990000}}), false
    });
    add({
        "iphone-16-plus", "Apple", "iPhone 16 Plus", "Màn hình lớn 6,7 inch.",
        "Chip A18, Điều Khiển Camera và màn hình OLED 6,7 inch.",
        "6,7″ Super Retina XDR", "A18", "Fusion 48 MP và góc siêu rộng", "Khung nhôm",
        {{"teal", "Xanh Mòng Két", "#75aaa5", "iphone-16-plus"}},
        prices({{128, 20990000}, {256, 23990000}}), false
    });
    add({
        "iphone-16e", "Apple", "iPhone 16e", "Camera Fusion 48 MP.",
        "Chip A18, nút Tác Vụ và camera chính 48 MP trong thân máy 6,1 inch.",
        "6,1″ Super Retina XDR", "A18", "Fusion 48 MP", "Khung nhôm",
        {{"white", "Trắng", "#eeeeeb", "iphone-16e"}},
        prices({{128, 13990000}, {256, 16490000}}), false
    });
    add({
        "iphone-15-pro", "Apple", "iPhone 15 Pro", "Titan và chip A17 Pro.",
        "Màn hình ProMotion, nút Tác Vụ và hệ thống ba camera sau.",
        "6,1″ Super Retina XDR", "A17 Pro", "48 MP chính và tele 3×", "Khung titan",
        {{"blue", "Titan Xanh", "#454e5b", "iphone-15-pro"}},
        prices({{128, 21990000}, {256, 24990000}}), false
    });
    add({
        "iphone-15-pro-max", "Apple", "iPhone 15 Pro Max", "Ống kính tele 5×.",
        "Phiên bản Pro 6,7 inch có chip A17 Pro, cổng USB-C và camera tele 5×.",
        "6,7″ Super Retina XDR", "A17 Pro", "48 MP chính và tele 5×", "Khung titan",
        {{"natural", "Titan Tự Nhiên", "#aaa69a", "iphone-15-pro-max"}},
        prices({{256, 24990000}, {512, 29990000}}), false
    });
    add({
        "iphone-15", "Apple", "iPhone 15", "Dynamic Island và USB-C.",
        "Camera chính 48 MP, Dynamic Island và cổng sạc USB-C.",
        "6,1″ Super Retina XDR", "A16 Bionic", "48 MP chính và góc siêu rộng", "Khung nhôm",
        {{"blue", "Xanh Dương", "#d5e0e4", "iphone-15"}},
        prices({{128, 14990000}, {256, 17490000}}), false
    });
    add({
        "iphone-15-plus", "Apple", "iPhone 15 Plus", "Màn hình OLED 6,7 inch.",
        "Phiên bản lớn của iPhone 15 với Dynamic Island, camera 48 MP và USB-C.",
        "6,7″ Super Retina XDR", "A16 Bionic", "48 MP chính và góc siêu rộng", "Khung nhôm",
        {{"pink", "Hồng", "#f2d7da", "iphone-15-plus"}},
        prices({{128, 16990000}, {256, 19990000}}), false
    });
    add({
        "iphone-14", "Apple", "iPhone 14", "Gọn với màn hình 6,1 inch.",
        "Màn hình OLED, chip A15 Bionic và hai camera sau 12 MP.",
        "6,1″ Super Retina XDR", "A15 Bionic", "Hai camera sau 12 MP", "Khung nhôm",
        {{"midnight", "Đen Nửa Đêm", "#282c33", "iphone-14"}},
        prices({{128, 11990000}, {256, 13990000}}), false
    });

    // Samsung
    add({
        "galaxy-s25", "Samsung", "Galaxy S25", "Flagship 6,2 inch.",
        "Màn hình 120 Hz, Snapdragon 8 Elite for Galaxy và camera chính 50 MP.",
        "6,2″ Dynamic AMOLED 2X", "Snapdragon 8 Elite for Galaxy", "50 MP chính và tele 3×", "Khung nhôm",
        {{"icy", "Xanh Icy", "#c6d3e8", "galaxy-s25"}},
        prices({{128, 17990000}, {256, 19990000}}), false
    });
    add({
        "galaxy-s25-plus", "Samsung", "Galaxy S25+", "Galaxy S với màn hình lớn.",
        "Phiên bản Galaxy S25 màn hình 6,7 inch, có camera tele và sạc dây 45 W.",
        "6,7″ Dynamic AMOLED 2X", "Snapdragon 8 Elite for Galaxy", "50 MP chính và tele 3×", "Khung nhôm",
        {{"navy", "Xanh Navy", "#293c66", "galaxy-s25-plus"}},
        prices({{256, 21990000}, {512, 24990000}}), false
    });
    add({
        "galaxy-s25-edge", "Samsung", "Galaxy S25 Edge", "Thân titan dày 5,8 mm.",
        "Thiết kế mỏng với màn hình 6,7 inch và camera chính 200 MP.",
        "6,7″ Dynamic AMOLED 2X", "Snapdragon 8 Elite for Galaxy", "200 MP chính và góc siêu rộng", "Khung titan",
        {{"silver", "Titan Bạc", "#d9dadc", "galaxy-s25-edge"}},
        prices({{256, 24990000}, {512, 28990000}}), false
    });
    add({
        "galaxy-s25-fe", "Samsung", "Galaxy S25 FE", "Camera tele trong dòng FE.",
        "Màn hình 120 Hz, camera chính 50 MP và tele 3×.",
        "6,7″ Dynamic AMOLED 2X", "Exynos 2400", "50 MP chính và tele 3×", "Khung nhôm",
        {{"icy", "Xanh Icy", "#cfd6eb", "galaxy-s25-fe"}},
        prices({{128, 14490000}, {256, 16490000}}), false
    });
    add({
        "galaxy-z-fold7", "Samsung", "Galaxy Z Fold7", "Mở ra màn hình 8 inch.",
        "Thiết kế gập ngang với màn hình trong 8 inch và camera chính 200 MP.",
        "8″ trong / 6,5″ ngoài", "Snapdragon 8 Elite for Galaxy", "200 MP chính và tele 3×", "Khung nhôm",
        {{"navy", "Xanh Navy", "#2c3a58", "galaxy-z-fold7"}},
        prices({{256, 41990000}, {512, 46990000}, {1024, 52990000}}), false
    });
    add({
        "galaxy-z-flip7", "Samsung", "Galaxy Z Flip7", "Màn hình ngoài 4,1 inch.",
        "Thiết kế gập dọc, chụp selfie bằng camera chính và xem khung hình ở màn hình ngoài.",
        "6,9″ trong / 4,1″ ngoài", "Exynos 2500", "50 MP chính và góc siêu rộng", "Khung nhôm",
        {{"coral", "Đỏ Coral", "#dc776a", "galaxy-z-flip7"}},
        prices({{256, 23990000}, {512, 26990000}}), false
    });
    add({
        "galaxy-a56-5g", "Samsung", "Galaxy A56 5G", "Màn hình 120 Hz và camera 50 MP.",
        "Màn hình AMOLED 6,7 inch, camera chính có chống rung quang học và khung kim loại.",
        "6,7″ Super AMOLED", "Exynos 1580", "50 MP chính, góc siêu rộng và macro", "Khung nhôm",
        {{"graphite", "Đen Marble", "#3b3c40", "galaxy-a56-5g"}},
        prices({{128, 8990000}, {256, 9990000}}), false
    });
    add({
        "galaxy-a36-5g", "Samsung", "Galaxy A36 5G", "Màn hình AMOLED 6,7 inch.",
        "Màn hình 120 Hz, chip Snapdragon 6 Gen 3 và camera chính 50 MP.",
        "6,7″ Super AMOLED", "Snapdragon 6 Gen 3", "50 MP chính, góc siêu rộng và macro", "Mặt lưng kính",
        {{"lavender", "Tím Hologram", "#c8bedb", "galaxy-a36-5g"}},
        prices({{128, 7290000}, {256, 8490000}}), false
    });

    // Google
    add({
        "pixel-11", "Google", "Pixel 11", "Tensor G6 và camera tele.",
        "Màn hình Actua 6,3 inch và hệ thống ba camera sau với ống kính tele.",
        "6,3″ Actua", "Google Tensor G6", "48 MP chính, góc siêu rộng và tele", "Khung nhôm, mặt lưng kính",
        {{"frost", "Frost", "#babbd0", "pixel-11"}},
        prices({{256, 25990000}, {512, 29990000}}), false
    });
    add({
        "pixel-10", "Google", "Pixel 10", "Camera tele 5× với Tensor G5.",
        "Màn hình Actua 6,3 inch và cụm ba camera sau có ống kính tele 5×.",
        "6,3″ Actua", "Google Tensor G5", "48 MP chính và tele 5×", "Khung nhôm, mặt lưng kính",
        {{"indigo", "Xanh Indigo", "#364db7", "pixel-10"}},
        prices({{128, 19990000}, {256, 22990000}}), false
    });
    add({
        "pixel-10-pro-fold", "Google", "Pixel 10 Pro Fold", "Màn hình gập Super Actua Flex.",
        "Mở rộng không gian làm việc lên 8 inch với màn hình trong và chip Tensor G5.",
        "8″ trong / 6,4″ ngoài", "Google Tensor G5", "48 MP chính và tele 5×", "Khung nhôm",
        {{"moonstone", "Moonstone", "#8b94a5", "pixel-10-pro-fold"}},
        prices({{256, 42990000}, {512, 47990000}, {1024, 53990000}}), false
    });
    add({
        "pixel-10a", "Google", "Pixel 10a", "Màn hình Actua 120 Hz.",
        "Máy 6,3 inch với Tensor G4 và hệ thống camera kép 48 MP và 13 MP.",
        "6,3″ Actua", "Google Tensor G4", "48 MP chính và 13 MP góc siêu rộng", "Khung nhôm, mặt lưng composite",
        {{"lavender", "Tím Lavender", "#8496e9", "pixel-10a"}},
        prices({{128, 13490000}, {256, 15990000}}), false
    });
    add({
        "pixel-9a", "Google", "Pixel 9a", "Camera kép và Tensor G4.",
        "Màn hình Actua 6,3 inch, camera chính 48 MP và thân máy với mặt lưng composite.",
        "6,3″ Actua", "Google Tensor G4", "48 MP chính và 13 MP góc siêu rộng", "Khung nhôm, mặt lưng composite",
        {{"iris", "Tím Iris", "#abaed7", "pixel-9a"}},
        prices({{128, 10990000}, {256, 13490000}}), false
    });
}
} // namespace forma
