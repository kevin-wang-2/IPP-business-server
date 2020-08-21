const register = require("./registration");

module.exports = (app) => {
    // 在这里写所有注册函数
    let order = require("../src/order");
    register(app, "post", "/business/order", order.post);
    register(app, "get", "/business/order/:id", order.get);
    register(app, "get", "/business/order/", order.list);
    register(app, "delete", "/business/order/:id", order.delete);
};