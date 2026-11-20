#include "store.hpp"
#include <algorithm>
#include <cctype>
#include <utility>

namespace forma {
namespace {
// Cùng một hàm mẫu tra cứu cả màu, dung lượng và con trỏ điện thoại.
template<class Collection, class Predicate>
const auto& requireOption(const Collection& values, Predicate matches, int code, const char* message) {
    const auto found = std::find_if(values.begin(), values.end(), matches);
    if (found == values.end()) throw StoreError{code, message};
    return *found;
}

std::string lowerAscii(std::string text) {
    for (char& character : text) {
        if (character >= 'A' && character <= 'Z') character = static_cast<char>(character + ('a' - 'A'));
    }
    return text;
}

std::vector<Storage> prices(std::initializer_list<std::pair<int, std::int64_t>> list) {
    std::vector<Storage> result;
    for (const auto& [gb, price] : list) result.push_back({gb, Money{price}});
    return result;
}
} // namespace

Phone::Phone(PhoneSpec spec) : spec_(std::move(spec)) {}

const Color& Phone::option(const std::string& id) const {
    return requireOption(spec_.colors, [&id](const Color& color) { return color.id == id; },
                         400, "Màu đã chọn không có trong danh mục.");
}

const Storage& Phone::option(int gb) const {
    return requireOption(spec_.capacities, [gb](const Storage& storage) { return storage.gb == gb; },
                         400, "Dung lượng đã chọn không có trong danh mục.");
}

Json Phone::describe() const {
    Json colors = Json::array();
    Json capacities = Json::array();
    for (const auto& color : spec_.colors) {
        colors.push_back({{"id", color.id}, {"name", color.name}, {"hex", color.hex}, {"image", color.image}});
    }
    for (const auto& storage : spec_.capacities) {
        capacities.push_back({{"gb", storage.gb}, {"price", storage.price.value()}});
    }
    return {
        {"id", spec_.id}, {"brand", spec_.brand}, {"name", spec_.name},
        {"tagline", spec_.tagline}, {"description", spec_.description}, {"display", spec_.display},
        {"chip", spec_.chip}, {"camera", spec_.camera}, {"body", spec_.body}, {"system", system()},
        {"colors", colors}, {"storage", capacities}, {"image", spec_.colors.front().image},
        {"price", spec_.capacities.front().price.value()}, {"featured", spec_.featured}
    };
}

Catalog::Catalog() {
    // Danh mục demo. Mỗi dung lượng mang giá niêm yết riêng, tính theo đồng.
    const std::vector<Color> proColors{
        {"orange", "Cam Vũ Trụ", "#e67836", "pro-orange"},
        {"blue", "Xanh Đậm", "#26384c", "pro-blue"},
        {"silver", "Bạc", "#dededd", "pro-silver"}
    };
    phones_.push_back(std::make_unique<IPhone>(PhoneSpec{
        "iphone-17-pro", "Apple", "iPhone 17 Pro", "Thiết kế mới. Chất Pro.",
        "Thân nhôm liền khối, chip A19 Pro và hệ thống ba camera Fusion 48 MP dành cho những khung hình có chủ đích.",
        "6,3″ Super Retina XDR", "A19 Pro", "Ba camera Fusion 48 MP", "Nhôm liền khối",
        proColors, prices({{256, 34990000}, {512, 40990000}, {1024, 46990000}}), true
    }));
    phones_.push_back(std::make_unique<IPhone>(PhoneSpec{
        "iphone-air", "Apple", "iPhone Air", "Mỏng nhẹ trong tay.",
        "Thiết kế titan dày 5,6 mm, màn hình 6,5 inch và chip A19 Pro trong một thân máy nhẹ.",
        "6,5″ Super Retina XDR", "A19 Pro", "Fusion 48 MP", "Titan",
        {{"sky", "Xanh Da Trời", "#c9dbe5", "air-sky"}, {"black", "Đen Không Gian", "#333439", "air-black"}},
        prices({{256, 31990000}, {512, 37990000}}), true
    }));
    phones_.push_back(std::make_unique<AndroidPhone>(PhoneSpec{
        "galaxy-s25-ultra", "Samsung", "Galaxy S25 Ultra", "Titan và S Pen.",
        "Khung titan, bút S Pen tích hợp và camera góc rộng 200 MP cho những người luôn mang theo ý tưởng.",
        "6,9″ Dynamic AMOLED 2X", "Snapdragon 8 Elite for Galaxy", "Camera chính 200 MP", "Khung titan",
        {{"blue", "Titan Xanh Bạc", "#a4adb9", "galaxy-blue"}, {"black", "Titan Đen", "#43464b", "galaxy-black"}},
        prices({{256, 29990000}, {512, 33990000}, {1024, 38990000}}), true
    }));
    phones_.push_back(std::make_unique<AndroidPhone>(PhoneSpec{
        "pixel-9-pro", "Google", "Pixel 9 Pro", "Góc nhìn từ Google.",
        "Màn hình Super Actua 6,3 inch, Tensor G4 và cụm camera ba ống kính trong thân máy gọn gàng.",
        "6,3″ Super Actua", "Google Tensor G4", "50 MP chính và tele 5×", "Khung nhôm",
        {{"porcelain", "Trắng Sứ", "#e9e4dc", "pixel-porcelain"}},
        prices({{128, 20990000}, {256, 23990000}}), true
    }));
    phones_.push_back(std::make_unique<IPhone>(PhoneSpec{
        "iphone-17", "Apple", "iPhone 17", "Sắc màu cho mỗi ngày.",
        "Màn hình ProMotion 120 Hz, chip A19 và camera trước Center Stage 18 MP.",
        "6,3″ Super Retina XDR", "A19", "Hai camera Fusion 48 MP", "Khung nhôm",
        {{"sage", "Xanh Lá Xô Thơm", "#bfc8b7", "iphone-17-sage"}, {"lavender", "Tím Oải Hương", "#cbc4dc", "iphone-17-lavender"}},
        prices({{256, 24990000}, {512, 30990000}}), false
    }));
    phones_.push_back(std::make_unique<IPhone>(PhoneSpec{
        "iphone-16", "Apple", "iPhone 16", "Dễ dùng, đủ mạnh.",
        "Chip A18, nút Tác Vụ và Điều Khiển Camera trong thiết kế 6,1 inch vừa tay.",
        "6,1″ Super Retina XDR", "A18", "Fusion 48 MP và góc siêu rộng", "Khung nhôm",
        {{"ultramarine", "Xanh Lưu Ly", "#5066a9", "iphone-16-blue"}, {"teal", "Xanh Mòng Két", "#75aaa5", "iphone-16-teal"}},
        prices({{128, 18490000}, {256, 21490000}}), false
    }));
}

const Phone& Catalog::find(const std::string& id) const {
    return *requireOption(phones_, [&id](const auto& phone) { return phone->spec().id == id; },
                          404, "Không tìm thấy mẫu điện thoại này.");
}

Json Catalog::list(std::string brand, std::string query, std::string sort) const {
    std::vector<const Phone*> matches;
    query = lowerAscii(std::move(query));
    for (const auto& phone : phones_) {
        const auto& spec = phone->spec();
        const auto searchable = lowerAscii(spec.brand + " " + spec.name + " " + phone->system());
        if (!brand.empty() && brand != spec.brand) continue;
        if (searchable.find(query) == std::string::npos) continue;
        matches.push_back(phone.get());
    }
    if (sort == "asc" || sort == "desc") {
        std::stable_sort(matches.begin(), matches.end(), [&sort](const Phone* a, const Phone* b) {
            const auto first = a->spec().capacities.front().price;
            const auto second = b->spec().capacities.front().price;
            return sort == "asc" ? first < second : second < first;
        });
    }
    Json result = Json::array();
    for (const auto* phone : matches) result.push_back(phone->describe());
    return result;
}
} // namespace forma
