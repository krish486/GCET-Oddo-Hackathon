const catalog = require('../services/catalogService');
module.exports = {
  categories: () => ({ data: catalog.categoryList() }),
  createCategory: ({ body }) => ({ data: catalog.createCategory(body), message: 'Category created.', status: 201 }),
  products: ({ query }) => ({ data: catalog.listProducts(query) }),
  product: ({ params }) => ({ data: catalog.getProduct(params.id) }),
  createProduct: ({ body, user }) => ({ data: catalog.createProduct(body, user.id), message: 'Product created.', status: 201 }),
  updateProduct: ({ params, body }) => ({ data: catalog.updateProduct(params.id, body), message: 'Product updated.' }),
};
