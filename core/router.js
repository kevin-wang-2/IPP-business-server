const register = require("./registration");

module.exports = (app) => {
    // 在这里写所有注册函数

    let order = require("../src/order");
    register(app, "post", "/business/order", order.post);
    register(app, "get", "/business/order/:id", order.get);
    register(app, "get", "/business/order/", order.list);
    register(app, "delete", "/business/order/:id", order.delete);

    let garage = require("../src/garage");
    register(app, "get", "/business/garage", garage.list);

    let product = require("../src/product");
    register(app, "post", "/business/product", product.post);
    register(app, "get", "/business/product/:id", product.get);
    register(app, "delete", "/business/product/:id", product.delete);

    let drone = require("../src/drone");
    register(app, "get", "/business/drone", drone.list);
    register(app, "get", "/business/status/:id", drone.status);
};