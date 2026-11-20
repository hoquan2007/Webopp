#include "store.hpp"
#include <iostream>
#ifdef _WIN32
#include <fcntl.h>
#include <io.h>
#endif

namespace {
using namespace forma;

// Điểm vào của C++. Tiến trình nhận đúng một yêu cầu JSON qua stdin.
Json dispatch(const Json& request) {
    const auto action = textField(request, "action", 30);
    if (action == "login") return Account::signIn(request).describe();

    const Catalog catalog;
    if (action == "catalog") {
        return {{"products", catalog.list(textField(request, "brand", 30), textField(request, "q", 100),
                                          textField(request, "sort", 12))}};
    }
    if (action == "product") return catalog.find(textField(request, "id", 50)).describe();
    if (action == "quote" || action == "checkout") {
        const Cart cart{catalog, request.at("items")};
        const auto promo = textField(request, "promo", 30);
        if (action == "quote") return cart.quote(promo);

        const Account buyer{textField(request, "buyerEmail", 254), "Khách Forma"};
        if (buyer.email.empty()) throw StoreError{401, "Hãy đăng nhập để đặt hàng."};
        const Order order{cart, Delivery{request.at("delivery")}, textField(request, "orderId", 32)};
        const auto payment = PaymentMethod::choose(textField(request, "payment", 16));
        if (!request.at("expectedTotal").is_number_integer()) throw StoreError{400, "Tổng tiền không hợp lệ."};
        return order.confirm(*payment, buyer, promo, Money{request.at("expectedTotal").get<std::int64_t>()});
    }
    throw StoreError{404, "Yêu cầu không tồn tại."};
}
} // namespace

int main() {
#ifdef _WIN32
    // Giữ nguyên byte UTF-8 và ký tự xuống dòng khi truyền qua pipe trên Windows.
    _setmode(_fileno(stdin), _O_BINARY);
    _setmode(_fileno(stdout), _O_BINARY);
#endif
    try {
        Json request;
        std::cin >> request;
        std::cout << Json{{"status", 200}, {"body", dispatch(request)}}.dump();
    } catch (const StoreError& error) {
        std::cout << Json{{"status", error.status}, {"body", {{"error", error.what()}}}}.dump();
    } catch (const Json::exception&) {
        std::cout << Json{{"status", 400}, {"body", {{"error", "Dữ liệu gửi lên không hợp lệ."}}}}.dump();
    }
}
