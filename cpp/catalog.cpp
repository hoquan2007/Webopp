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
