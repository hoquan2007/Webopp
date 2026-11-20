#pragma once

// Các lớp miền nghiệp vụ được dùng chung cho mọi yêu cầu từ website.
#include "vendor/json.hpp"
#include <cstdint>
#include <initializer_list>
#include <memory>
#include <string>
#include <vector>

namespace forma {
using Json = nlohmann::json;

class Money {
    std::int64_t vnd_;

public:
    Money() : vnd_(0) {}
    explicit Money(std::int64_t vnd) : vnd_(vnd) {}
    std::int64_t value() const { return vnd_; }
    Money percent(int rate) const { return Money{vnd_ * rate / 100}; }
    Money& operator+=(Money other);
    Money operator-(Money other) const { return Money{vnd_ - other.vnd_}; }
    Money operator*(int quantity) const { return Money{vnd_ * quantity}; }
    bool operator<(Money other) const { return vnd_ < other.vnd_; }
    friend Money operator+(Money left, Money right);
};

struct Color {
    std::string id, name, hex, image;
};

struct Storage {
    int gb;
    Money price;
};

struct PhoneSpec {
    std::string id, brand, name, tagline, description, display, chip, camera, body;
    std::vector<Color> colors;
    std::vector<Storage> capacities;
    bool featured;
};

// Phone sở hữu thông số. Các lớp con cung cấp hệ điều hành qua hàm ảo.
class Phone {
    PhoneSpec spec_;

public:
    explicit Phone(PhoneSpec spec);
    virtual ~Phone() = default;
    virtual std::string system() const = 0;
    const PhoneSpec& spec() const { return spec_; }
    const Color& option(const std::string& id) const;
    const Storage& option(int gb) const;
    Json describe() const;
};

class IPhone final : public Phone {
public:
    using Phone::Phone;
    std::string system() const override { return "iOS"; }
};

class AndroidPhone final : public Phone {
public:
    using Phone::Phone;
    std::string system() const override { return "Android"; }
};

class Catalog {
    std::vector<std::unique_ptr<Phone>> phones_;

public:
    Catalog();
    const Phone& find(const std::string& id) const;
    Json list(std::string brand = {}, std::string query = {}, std::string sort = {}) const;
};

struct CartLine {
    const Phone& phone;
    const Color& color;
    const Storage& storage;
    int quantity;
};

class Cart {
    std::vector<CartLine> lines_;

public:
    // Các tham chiếu của dòng giỏ trỏ vào danh mục còn sống đến cuối yêu cầu.
    Cart(const Catalog& catalog, const Json& items);
    Cart(const Cart&) = default;
    bool empty() const { return lines_.empty(); }
    Json quote(const std::string& promo = {}) const;
};

struct Delivery {
    std::string name, phone, address, city;
    explicit Delivery(const Json& data);
};

struct Account {
    std::string email, name;
    static Account signIn(const Json& request);
    Json describe() const { return {{"email", email}, {"name", name}}; }
};

class PaymentMethod {
public:
    virtual ~PaymentMethod() = default;
    virtual Json confirm(Money total) const = 0;
    static std::unique_ptr<PaymentMethod> choose(const std::string& id);
};

class Order {
    Cart cart_;
    Delivery delivery_;
    std::string id_;

public:
    Order(const Cart& cart, Delivery delivery, std::string id);
    Json confirm(const PaymentMethod& payment, const Account& buyer, const std::string& promo, Money expected) const;
};

// Lỗi nghiệp vụ chứa mã HTTP để lớp vận chuyển trả đúng phản hồi.
class StoreError : public std::runtime_error {
public:
    const int status;
    StoreError(int code, const std::string& message) : std::runtime_error(message), status(code) {}
};

std::string textField(const Json& data, const char* key, std::size_t limit);
} // namespace forma
