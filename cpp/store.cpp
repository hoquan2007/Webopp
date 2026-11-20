#include "store.hpp"
#include <algorithm>
#include <cctype>
#include <regex>
#include <utility>

namespace forma {
Money& Money::operator+=(Money other) {
    this->vnd_ += other.vnd_;
    return *this;
}

Money operator+(Money left, Money right) {
    return Money{left.vnd_ + right.vnd_};
}

std::string textField(const Json& data, const char* key, std::size_t limit) {
    std::string value = data.value(key, std::string{});
    if (value.size() > limit) throw StoreError{400, "Một trường nhập vượt quá độ dài cho phép."};
    const auto first = value.find_first_not_of(" \t\r\n");
    if (first == std::string::npos) return {};
    return value.substr(first, value.find_last_not_of(" \t\r\n") - first + 1);
}

Cart::Cart(const Catalog& catalog, const Json& items) {
    if (!items.is_array() || items.size() > 24) throw StoreError{400, "Giỏ hàng không hợp lệ."};
    for (const auto& item : items) {
        const auto& phone = catalog.find(textField(item, "id", 50));
        const auto& color = phone.option(textField(item, "color", 30));
        if (!item.at("storage").is_number_integer() || !item.at("quantity").is_number_integer()) {
            throw StoreError{400, "Dung lượng và số lượng phải là số nguyên."};
        }
        const auto gb = item.at("storage").get<std::int64_t>();
        const auto quantity = item.at("quantity").get<std::int64_t>();
        if (gb < 1 || gb > 4096 || quantity < 1 || quantity > 5) {
            throw StoreError{400, "Mỗi cấu hình được chọn tối đa 5 máy."};
        }
        const auto& storage = phone.option(static_cast<int>(gb));
        const auto existing = std::find_if(lines_.begin(), lines_.end(), [&](const CartLine& line) {
            return &line.phone == &phone && &line.color == &color && &line.storage == &storage;
        });
        // Gộp biến thể trùng trước khi kiểm tra giới hạn.
        if (existing == lines_.end()) lines_.push_back({phone, color, storage, static_cast<int>(quantity)});
        else {
            existing->quantity += static_cast<int>(quantity);
            if (existing->quantity > 5) throw StoreError{400, "Mỗi cấu hình được chọn tối đa 5 máy."};
        }
    }
}

Json Cart::quote(const std::string& promo) const {
    Money subtotal;
    Json items = Json::array();
    int count = 0;
    for (const auto& line : lines_) {
        const Money lineTotal = line.storage.price * line.quantity;
        subtotal += lineTotal;
        count += line.quantity;
        items.push_back({
            {"id", line.phone.spec().id}, {"name", line.phone.spec().name},
            {"color", line.color.id}, {"colorName", line.color.name}, {"image", line.color.image},
            {"storage", line.storage.gb}, {"quantity", line.quantity},
            {"price", line.storage.price.value()}, {"total", lineTotal.value()}
        });
    }
    if (!promo.empty() && promo != "FORMA5") throw StoreError{400, "Mã ưu đãi không hợp lệ."};
    const Money discount = promo.empty() ? Money{} : subtotal.percent(5);
    const Money shipping = !empty() && subtotal < Money{20000000} ? Money{50000} : Money{};
    const Money total = subtotal - discount + shipping;
    return {
        {"items", items}, {"count", count}, {"subtotal", subtotal.value()},
        {"discount", discount.value()}, {"shipping", shipping.value()}, {"total", total.value()}
    };
}

Delivery::Delivery(const Json& data)
    : name(textField(data, "name", 120)), phone(textField(data, "phone", 25)),
      address(textField(data, "address", 300)), city(textField(data, "city", 100)) {
    const std::regex vietnamesePhone{R"((0|\+84)[0-9]{9})"};
    if (name.size() < 2 || address.size() < 5 || city.size() < 2) {
        throw StoreError{400, "Hãy điền đầy đủ tên và địa chỉ nhận hàng."};
    }
    if (!std::regex_match(phone, vietnamesePhone)) {
        throw StoreError{400, "Số điện thoại cần có dạng 0xxxxxxxxx hoặc +84xxxxxxxxx."};
    }
}

Account Account::signIn(const Json& request) {
    // Lớp HTTP kiểm tra mật khẩu bằng scrypt và chỉ gửi kết quả vào lõi.
    const auto email = textField(request, "email", 254);
    if (!request.value("passwordVerified", false) || email.empty() ||
        email != textField(request, "allowedEmail", 254)) {
        throw StoreError{401, "Email hoặc mật khẩu chưa đúng."};
    }
    return {email, "Khách Forma"};
}

namespace {
class CashOnDelivery final : public PaymentMethod {
    Json confirm(Money total) const override {
        return {{"method", "cod"}, {"status", "Chờ thanh toán khi nhận hàng"}, {"due", total.value()}};
    }
};

class DemoPayment final : public PaymentMethod {
    Json confirm(Money total) const override {
        return {{"method", "demo"}, {"status", "Đã thanh toán mô phỏng"}, {"due", 0}, {"simulated", total.value()}};
    }
};
} // namespace

std::unique_ptr<PaymentMethod> PaymentMethod::choose(const std::string& id) {
    if (id == "cod") return std::make_unique<CashOnDelivery>();
    if (id == "demo") return std::make_unique<DemoPayment>();
    throw StoreError{400, "Hãy chọn một phương thức thanh toán."};
}

Order::Order(const Cart& cart, Delivery delivery, std::string id)
    : cart_(cart), delivery_(std::move(delivery)), id_(std::move(id)) {}

Json Order::confirm(const PaymentMethod& payment, const Account& buyer, const std::string& promo, Money expected) const {
    if (cart_.empty()) throw StoreError{400, "Hãy thêm điện thoại trước khi đặt hàng."};
    const Json totals = cart_.quote(promo);
    const Money total{totals.at("total").get<std::int64_t>()};
    if (total.value() != expected.value()) {
        throw StoreError{409, "Giá đơn hàng đã thay đổi. Hãy tải lại trang để kiểm tra."};
    }
    return {
        {"id", id_}, {"quote", totals}, {"email", buyer.email},
        {"delivery", {{"name", delivery_.name}, {"city", delivery_.city}}},
        {"payment", payment.confirm(total)}
    };
}
} // namespace forma
