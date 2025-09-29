
import { jest, describe, it, expect, beforeEach, beforeAll } from "@jest/globals";

const mockProductModel = jest.fn();
const mockCategoryModel = {
    findOne: jest.fn()
};
const mockOrderModel = jest.fn();
const mockGateway = {
    clientToken: {
        generate: jest.fn()
    },
    transaction: {
        sale: jest.fn()
    }
};
const mockBraintreeGateway = jest.fn(() => mockGateway);


//AI Declaration: Tool Cursur, Prompt: "How can I mock the constructor of the ProductModel", Output: It helped me setup the mock using the unstable_mockModule and the part in the before each section, as other approaches did not work for me.
jest.unstable_mockModule("../models/productModel.js", () => ({
    default: mockProductModel
}));
jest.unstable_mockModule("../models/categoryModel.js", () => ({
    default: mockCategoryModel
}));
jest.unstable_mockModule("../models/orderModel.js", () => ({
    default: mockOrderModel
}));
jest.unstable_mockModule("braintree", () => ({
    default: {
        BraintreeGateway: mockBraintreeGateway,
        Environment: {
            Sandbox: "Sandbox"
        }
    }
}));

// Mock fs functions 
const mockFs = {
    readFileSync: jest.fn()
};
jest.unstable_mockModule("fs", () => ({
    default: mockFs
}));

// Mock slugify function
const mockSlugify = jest.fn();
jest.unstable_mockModule("slugify", () => ({
    default: mockSlugify
}));

let createProductController;
let getProductController;
let getSingleProductController;
let productPhotoController;
let deleteProductController;
let updateProductController;
let productFiltersController;
let productCountController;
let productListController;
let productCategoryCountController;
let searchProductController;
let realtedProductController;
let productCategoryController;
let braintreeTokenController;
let brainTreePaymentController;

const VALID_PHOTO = { size: 1000 };
const OVERSIZED_PHOTO = { size: 2000000 };

beforeAll(async () => {
    ({
        createProductController,
        getProductController,
        getSingleProductController,
        productPhotoController,
        deleteProductController,
        updateProductController,
        productFiltersController,
        productCountController,
        productListController,
        searchProductController,
        realtedProductController,
        productCategoryCountController,
        productCategoryController,
        braintreeTokenController,
        brainTreePaymentController
    } = await import("./productController.js"));
});

describe('Product Controller', () => {
    let consoleSpy;
    let mockRes;
    let mockProduct;

    beforeEach(() => {
        jest.clearAllMocks();
        
        consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
        
        mockRes = { 
            status: jest.fn().mockReturnThis(), 
            send: jest.fn(),
            json: jest.fn(),
            set: jest.fn()
        };
        
        mockProduct = {
            save: jest.fn().mockResolvedValue(true),
            photo: {
                data: null,
                contentType: null
            }
        };
        
        mockProductModel.mockImplementation(() => mockProduct);
    });

    describe('createProduct', () => {
        //Testing Strategy: Decision tables (more details in written text)
        const validationTestMatrix = [
            // [name, description, price, category, quantity, photo, expectedError]
            [null, 'desc', 100, 'cat', 10, VALID_PHOTO, 'Name is required'],
            ['name', null, 100, 'cat', 10, VALID_PHOTO, 'Description is required'],
            ['name', 'desc', null, 'cat', 10, VALID_PHOTO, 'Price is required'],
            ['name', 'desc', 100, null, 10, VALID_PHOTO, 'Category is required'],
            ['name', 'desc', 100, 'cat', null, VALID_PHOTO, 'Quantity is required'],
            ['name', 'desc', 100, 'cat', 10, null, 'Photo is required and must be less than 1MB'],
            ['name', 'desc', 100, 'cat', 10, OVERSIZED_PHOTO, 'Photo is required and must be less than 1MB']
        ];

        it.each(validationTestMatrix)(
            'validate test case %#',
            async (name, description, price, category, quantity, photo, expectedError) => {
                //arrange
                const req = {
                    fields: { name, description, price, category, quantity },
                    files: { photo }
                };

                //act
                await createProductController(req, mockRes);

                //assert
                expect(mockRes.status).toHaveBeenCalledWith(500);
                expect(mockRes.send).toHaveBeenCalledWith({ error: expectedError});
            }
        );


        it('should save a product and return a correct response', async () => {
            //arrange
            const req = {
                fields: { 
                    name: 'Test Product With Photo', 
                    description: 'Test Description', 
                    price: 150, 
                    category: 'test-category', 
                    quantity: 5 
                },
                files: { 
                    photo: { 
                        size: 500000,
                        path: '/tmp/test-photo.jpg',
                        type: 'jpeg'
                    } 
                }
            };

            const mockPhotoData = Buffer.from('fake-image-data');
            mockSlugify.mockReturnValue('test-product-with-photo');
            mockFs.readFileSync.mockReturnValue(mockPhotoData);

            //act
            await createProductController(req, mockRes);

            //assert
            expect(mockProductModel).toHaveBeenCalledWith({
                name: 'Test Product With Photo',
                description: 'Test Description', 
                price: 150,
                category: 'test-category',
                quantity: 5,
                slug: 'test-product-with-photo'
            });
            expect(mockFs.readFileSync).toHaveBeenCalledWith('/tmp/test-photo.jpg');
            expect(mockProduct.photo.data).toBe(mockPhotoData);
            expect(mockProduct.photo.contentType).toBe('jpeg');
            expect(mockProduct.save).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.send).toHaveBeenCalledWith({
                success: true,
                message: "Product created successfully",
                products: mockProduct,
            });
        })

        it('should send 500 response code and log error if error occurs while creating/saving new product', async () => {
            //arrange
            const req = {
                fields: { 
                    name: 'Test Product', 
                    description: 'Test Description', 
                    price: 100, 
                    category: 'test-category', 
                    quantity: 10 
                },
                files: { 
                    photo: { 
                        size: 500000,
                        path: '/tmp/test-photo.jpg',
                        type: 'jpeg'
                    } 
                }
            };

            const mockError = new Error('Database connection failed');
            // Override the default mock for this test
            mockProduct.save.mockRejectedValue(mockError);
            const mockPhotoData = Buffer.from('fake-image-data');
            mockSlugify.mockReturnValue('test-product-with-photo');
            mockFs.readFileSync.mockReturnValue(mockPhotoData);

            //act
            await createProductController(req, mockRes);

            //assert
            expect(mockProduct.save).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(mockError);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith({
                success: false,
                error: mockError,
                message: "Error creating product",
            });
        })
    });

    describe('getProduct', () => {
        // Testing Strategy: control flow testing
        let chainableQuery;

        beforeEach(() => {
            chainableQuery = {
                populate: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                sort: jest.fn()
            };

            mockProductModel.find = jest.fn().mockReturnValue(chainableQuery);
        });

        it('should return all products with expected response shape', async () => {
            //arrange
            const mockProducts = [
                { _id: '123', name: 'Product 1' },
                { _id: '456', name: 'Product 2' }
            ];

            chainableQuery.sort.mockResolvedValue(mockProducts);

            //act
            await getProductController({}, mockRes);

            //assert
            expect(mockProductModel.find).toHaveBeenCalledWith({});
            expect(chainableQuery.populate).toHaveBeenCalledWith('category');
            expect(chainableQuery.select).toHaveBeenCalledWith('-photo');
            expect(chainableQuery.limit).toHaveBeenCalledWith(12);
            expect(chainableQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({
                success: true,
                countTotal: mockProducts.length,
                message: "All Products ",
                products: mockProducts
            });
        });

        it('should send 500 response code and log error when retrieval fails', async () => {
            //arrange
            const mockError = new Error('Database error');
            chainableQuery.sort.mockRejectedValue(mockError);

            //act
            await getProductController({}, mockRes);

            //assert
            expect(mockProductModel.find).toHaveBeenCalledWith({});
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith({
                success: false,
                message: "Error while getting products",
                error: mockError.message
            });
            expect(consoleSpy).toHaveBeenCalledWith(mockError);
        });
    })

    describe('getSingleProduct', () => {
        // Testing Strategy: branch coverage
        let chainableQuery;

        beforeEach(() => {
            chainableQuery = {
                select: jest.fn().mockReturnThis(),
                populate: jest.fn()
            };

            mockProductModel.findOne = jest.fn().mockReturnValue(chainableQuery);
        });

        it('should return the single product for the requested slug', async () => {
            //arrange
            const req = { params: { slug: 'test-product' } };
            const mockProduct = { _id: '1', slug: 'test-product', name: 'Test Product' };
            chainableQuery.populate.mockResolvedValue(mockProduct);

            //act
            await getSingleProductController(req, mockRes);


            //assert
            expect(mockProductModel.findOne).toHaveBeenCalledWith({ slug: 'test-product' });
            expect(chainableQuery.select).toHaveBeenCalledWith('-photo');
            expect(chainableQuery.populate).toHaveBeenCalledWith('category');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({
                success: true,
                message: "Single product fetched",
                product: mockProduct
            });
        });

        it('should send 500 response code and log error when lookup fails', async () => {
            //arrange
            const req = { params: { slug: 'error-product' } };
            const mockError = new Error('Database failure');
            chainableQuery.populate.mockRejectedValue(mockError);

            //act
            await getSingleProductController(req, mockRes);

            //assert
            expect(mockProductModel.findOne).toHaveBeenCalledWith({ slug: 'error-product' });
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith({
                success: false,
                message: "Error fetching single product",
                error: mockError.message
            });
            expect(consoleSpy).toHaveBeenCalledWith(mockError);
        });
    });

    describe('productPhoto', () => {
        // Testing Strategy: branch coverage
        let chainableQuery;

        beforeEach(() => {
            chainableQuery = {
                select: jest.fn()
            };

            mockProductModel.findById = jest.fn().mockReturnValue(chainableQuery);
        });

        it('should stream photo binary with correct headers when photo exists', async () => {
            //arrange
            const req = { params: { pid: 'photo-id' } };
            const mockPhoto = { data: Buffer.from('image'), contentType: 'image/png' };
            const mockProduct = { photo: mockPhoto };
            chainableQuery.select.mockResolvedValue(mockProduct);
            
            //act
            await productPhotoController(req, mockRes);

            //assert
            expect(mockProductModel.findById).toHaveBeenCalledWith('photo-id');
            expect(chainableQuery.select).toHaveBeenCalledWith('photo');
            expect(mockRes.set).toHaveBeenCalledWith('Content-Type', 'image/png');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith(mockPhoto.data);
        });

        it('should return 404 when product or photo data is missing', async () => {
            //arrange
            const req = { params: { pid: 'missing-photo-id' } };
            chainableQuery.select.mockResolvedValue(null);

            //act
            await productPhotoController(req, mockRes);

            //assert
            expect(mockProductModel.findById).toHaveBeenCalledWith('missing-photo-id');
            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.send).toHaveBeenCalledWith({
                success: false,
                message: 'Photo not found'
            });
        });

        it('should send 500 response code and log error when retrieval fails', async () => {
            //arrange
            const req = { params: { pid: 'error-photo-id' } };
            const mockError = new Error('Database photo error');
            chainableQuery.select.mockRejectedValue(mockError);

            //act
            await productPhotoController(req, mockRes);

            //assert
            expect(mockProductModel.findById).toHaveBeenCalledWith('error-photo-id');
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith({
                success: false,
                message: 'Error while getting photo',
                error: mockError.message
            });
            expect(consoleSpy).toHaveBeenCalledWith(mockError);
        });
    });

    describe('deleteProduct', () => {
        // Testing Strategy: branch coverage
        let chainableQuery;

        beforeEach(() => {
            chainableQuery = {
                select: jest.fn()
            };

            mockProductModel.findByIdAndDelete = jest.fn().mockReturnValue(chainableQuery);
        });

        it('should delete product and respond with success when product exists', async () => {
            //arrange
            const req = { params: { pid: 'existing-id' }, fields: {} };
            const deletedProduct = { _id: 'existing-id' };
            chainableQuery.select.mockResolvedValue(deletedProduct);

            //act
            await deleteProductController(req, mockRes);

            //assert
            expect(mockProductModel.findByIdAndDelete).toHaveBeenCalledWith('existing-id');
            expect(chainableQuery.select).toHaveBeenCalledWith('-photo');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({
                success: true,
                message: 'Product deleted successfully'
            });
        });

        it('should respond with 404 when product is not found', async () => {
            //arrange
            const req = { params: { pid: 'missing-id' } };
            chainableQuery.select.mockResolvedValue(null);

            //act
            await deleteProductController(req, mockRes);

            //assert
            expect(mockProductModel.findByIdAndDelete).toHaveBeenCalledWith('missing-id');
            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.send).toHaveBeenCalledWith({
                success: false,
                message: 'Product not found'
            });
        });

        it('should send 500 response code and log error when deletion fails', async () => {
            //arrange
            const req = { params: { pid: 'error-id' } };
            const mockError = new Error('Deletion failure');
            chainableQuery.select.mockRejectedValue(mockError);

            //act
            await deleteProductController(req, mockRes);

            //assert
            expect(mockProductModel.findByIdAndDelete).toHaveBeenCalledWith('error-id');
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith({
                success: false,
                message: 'Error deleting product',
                error: mockError.message
            });
            expect(consoleSpy).toHaveBeenCalledWith(mockError);
        });
    });

    describe('updateProduct', () => {
        // Testing Strategy: mixed matrix + branch coverage
        const baseFields = {
            name: 'Updated Product',
            description: 'Updated Description',
            price: 200,
            category: 'updated-category',
            quantity: 20,
            shipping: true
        };

        let mockUpdatedProduct;

        beforeEach(() => {
            mockUpdatedProduct = {
                ...baseFields,
                photo: {
                    data: null,
                    contentType: null
                },
                save: jest.fn().mockResolvedValue(true)
            };

            mockProductModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedProduct);
        });

        it.each([
            [ { ...baseFields, name: null }, 'Name is required' ],
            [ { ...baseFields, description: null }, 'Description is required' ],
            [ { ...baseFields, price: null }, 'Price is required' ],
            [ { ...baseFields, category: null }, 'Category is required' ],
            [ { ...baseFields, quantity: null }, 'Quantity is required' ],
        ])('should enforce field validation case %#', async (fields, expectedError) => {
            //arrange
            const req = { fields, files: { photo: VALID_PHOTO }, params: { pid: 'pid' } };

            //act
            await updateProductController(req, mockRes);

            //assert
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith({ error: expectedError });
            expect(mockProductModel.findByIdAndUpdate).not.toHaveBeenCalled();
        });

        it('should reject oversized photo if provided', async () => {
            //arrange
            const req = { fields: baseFields, files: { photo: OVERSIZED_PHOTO }, params: { pid: 'pid' } };

            //act
            await updateProductController(req, mockRes);

            //assert
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith({ error: 'Photo is required and must be less than 1MB' });
            expect(mockProductModel.findByIdAndUpdate).not.toHaveBeenCalled();
        });

        it('should update product without touching photo when no photo uploaded', async () => {
            //arrange
            const req = { fields: baseFields, files: { }, params: { pid: 'pid-123' } };
            mockSlugify.mockReturnValue('updated-product');

            //act
            await updateProductController(req, mockRes);

            //assert
            expect(mockProductModel.findByIdAndUpdate).toHaveBeenCalledWith(
                'pid-123',
                expect.objectContaining({ ...baseFields, slug: 'updated-product' }),
                { new: true }
            );
            expect(mockUpdatedProduct.save).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.send).toHaveBeenCalledWith({
                success: true,
                message: 'Product updated successfully',
                products: mockUpdatedProduct
            });
        });

        it('should update product and persist photo when provided', async () => {
            //arrange
            const photoFile = { size: 500, path: '/tmp/photo.png', type: 'image/png' };
            const req = { fields: baseFields, files: { photo: photoFile }, params: { pid: 'pid-abc' } };
            const photoBuffer = Buffer.from('image-bytes');
            mockSlugify.mockReturnValue('updated-product');
            mockFs.readFileSync.mockReturnValue(photoBuffer);

            //act
            await updateProductController(req, mockRes);

            //assert
            expect(mockProductModel.findByIdAndUpdate).toHaveBeenCalledWith(
                'pid-abc',
                expect.objectContaining({ ...baseFields, slug: expect.any(String) }),
                { new: true }
            );
            expect(mockFs.readFileSync).toHaveBeenCalledWith('/tmp/photo.png');
            expect(mockUpdatedProduct.photo.data).toBe(photoBuffer);
            expect(mockUpdatedProduct.photo.contentType).toBe('image/png');
            expect(mockUpdatedProduct.save).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.send).toHaveBeenCalledWith({
                success: true,
                message: 'Product updated successfully',
                products: mockUpdatedProduct
            });
        });

        it('should throw error if one occurs', async () => {
            //arrange
            const req = { fields: baseFields, files: { }, params: { pid: 'pid' } };
            const mockError = new Error('Update failure');
            mockProductModel.findByIdAndUpdate.mockRejectedValue(mockError);

            //act
            await updateProductController(req, mockRes);

            //assert
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith({
                success: false,
                error: mockError,
                message: 'Error updating product'
            });
            expect(consoleSpy).toHaveBeenCalledWith(mockError);
        });
    });

    describe('productFilters', () => {
        // Testing Strategy: branch coverage
        it('should build filter args for checked categories and radio price', async () => {
            //arrange
            const req = { body: { checked: ['cat1'], radio: [10, 50] } };
            const filteredProducts = [{ name: 'Filtered' }];
            mockProductModel.find = jest.fn().mockResolvedValue(filteredProducts);

            //act
            await productFiltersController(req, mockRes);

            //assert
            expect(mockProductModel.find).toHaveBeenCalledWith({ category: ['cat1'], price: { $gte: 10, $lte: 50 } });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({ success: true, products: filteredProducts });
        });

        it('should handle empty filters and return all products', async () => {
            //arrange
            const req = { body: { checked: [], radio: [] } };
            const allProducts = [{ name: 'A' }];
            mockProductModel.find = jest.fn().mockResolvedValue(allProducts);

            //act
            await productFiltersController(req, mockRes);

            //assert
            expect(mockProductModel.find).toHaveBeenCalledWith({});
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({ success: true, products: allProducts });
        });

        it('should return 500 on errors', async () => {
            //arrange
            const req = { body: { checked: [], radio: [] } };
            const mockError = new Error('Filter failure');
            mockProductModel.find = jest.fn().mockRejectedValue(mockError);

            //act
            await productFiltersController(req, mockRes);

            //assert
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith({
                success: false,
                message: 'Error filtering products',
                error: mockError.message
            });
            expect(consoleSpy).toHaveBeenCalledWith(mockError);
        });
    });

    describe('productCount', () => {
        // Testing Strategy: branch coverage
        it('should return product count', async () => {
            //arrange
            const req = {};
            mockProductModel.find = jest.fn().mockReturnValue({ estimatedDocumentCount: jest.fn().mockResolvedValue(42) });

            //act
            await productCountController(req, mockRes);

            //assert
            expect(mockProductModel.find).toHaveBeenCalledWith({});
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({ success: true, total: 42 });
        });

        it('should send 500 when counting fails', async () => {
            //arrange
            const req = {};
            const mockError = new Error('Count failure');
            mockProductModel.find = jest.fn().mockReturnValue({ estimatedDocumentCount: jest.fn().mockRejectedValue(mockError) });

            //act
            await productCountController(req, mockRes);

            //assert
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith({
                message: 'Error counting products',
                error: mockError.message,
                success: false
            });
            expect(consoleSpy).toHaveBeenCalledWith(mockError);
        });
    });

    describe('productList', () => {
        // Testing Strategy: branch coverage
        it('should list products for given page', async () => {
            //arrange
            const req = { params: { page: 2 } };
            const chainableQuery = {
                select: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue(['p1'])
            };
            mockProductModel.find = jest.fn().mockReturnValue(chainableQuery);

            //act
            await productListController(req, mockRes);

            //assert
            expect(mockProductModel.find).toHaveBeenCalledWith({});
            expect(chainableQuery.select).toHaveBeenCalledWith('-photo');
            expect(chainableQuery.skip).toHaveBeenCalledWith(6);
            expect(chainableQuery.limit).toHaveBeenCalledWith(6);
            expect(chainableQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({ success: true, products: ['p1'] });
        });

        it('should handle default page when none provided', async () => {
            //arrange
            const req = { params: {} };
            const chainableQuery = {
                select: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue(['p1'])
            };
            mockProductModel.find = jest.fn().mockReturnValue(chainableQuery);

            //act
            await productListController(req, mockRes);

            //assert
            expect(chainableQuery.skip).toHaveBeenCalledWith(0);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should return 500 on errors', async () => {
            //arrange
            const req = { params: { page: 1 } };
            const chainableQuery = {
                select: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                sort: jest.fn().mockRejectedValue(new Error('List failure'))
            };
            mockProductModel.find = jest.fn().mockReturnValue(chainableQuery);

            //act
            await productListController(req, mockRes);

            //assert
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith({
                success: false,
                message: 'Error listing products',
                error: 'List failure'
            });
        });
    });

    describe('searchProduct', () => {
        // Testing Strategy: branch coverage
        it('should return search results matching keyword', async () => {
            //arrange
            const req = { params: { keyword: 'test' } };
            const chainableQuery = {
                select: jest.fn().mockResolvedValue(['product'])
            };
            mockProductModel.find = jest.fn().mockReturnValue(chainableQuery);

            //act
            await searchProductController(req, mockRes);

            //assert
            expect(mockProductModel.find).toHaveBeenCalledWith({
                $or: [
                    { name: { $regex: 'test', $options: 'i' } },
                    { description: { $regex: 'test', $options: 'i' } }
                ]
            });
            expect(chainableQuery.select).toHaveBeenCalledWith('-photo');
            expect(mockRes.json).toHaveBeenCalledWith(['product']);
        });

        it('should return 500 on search errors', async () => {
            //arrange
            const req = { params: { keyword: 'err' } };
            const chainableQuery = {
                select: jest.fn().mockRejectedValue(new Error('Search failure'))
            };
            mockProductModel.find = jest.fn().mockReturnValue(chainableQuery);

            //act
            await searchProductController(req, mockRes);

            //assert
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith({
                success: false,
                message: 'Error searching products',
                error: 'Search failure'
            });
        });
    });

    describe('realtedProduct', () => {
        // Testing Strategy: branch coverage
        it('should fetch related products excluding current product', async () => {
            //arrange
            const req = { params: { pid: '123', cid: '456' } };
            const chainableQuery = {
                select: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                populate: jest.fn().mockResolvedValue(['related'])
            };
            mockProductModel.find = jest.fn().mockReturnValue(chainableQuery);

            //act
            await realtedProductController(req, mockRes);

            //assert
            expect(mockProductModel.find).toHaveBeenCalledWith({ category: '456', _id: { $ne: '123' } });
            expect(chainableQuery.select).toHaveBeenCalledWith('-photo');
            expect(chainableQuery.limit).toHaveBeenCalledWith(3);
            expect(chainableQuery.populate).toHaveBeenCalledWith('category');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({ success: true, products: ['related'] });
        });

        it('should return 500 on related fetch errors', async () => {
            //arrange
            const req = { params: { pid: '123', cid: '456' } };
            const chainableQuery = {
                select: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                populate: jest.fn().mockRejectedValue(new Error('Related failure'))
            };
            mockProductModel.find = jest.fn().mockReturnValue(chainableQuery);

            //act
            await realtedProductController(req, mockRes);

            //assert
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith({
                success: false,
                message: 'Error fetching related products',
                error: 'Related failure'
            });
        });
    });

    describe('productCategory', () => {
        // Testing Strategy: branch coverage
        it('should return paginated products for a category', async () => {
            // arrange
            const req = { params: { slug: 'cat-slug', page: 2 } };
            const mockCategory = { _id: 'cat-id' };
            const products = ['p1'];
            const mockSelect = jest.fn().mockReturnThis();
            const mockSkip = jest.fn().mockReturnThis();
            const mockLimit = jest.fn().mockReturnThis();
            const mockSort = jest.fn().mockResolvedValue(products);

            mockCategoryModel.findOne.mockResolvedValue(mockCategory);
            mockProductModel.find = jest.fn().mockReturnValue({
                select: mockSelect,
                skip: mockSkip,
                limit: mockLimit,
                sort: mockSort,
            });

            // act
            await productCategoryController(req, mockRes);

            // assert
            expect(mockCategoryModel.findOne).toHaveBeenCalledWith({ slug: 'cat-slug' });
            expect(mockProductModel.find).toHaveBeenCalledWith({ category: mockCategory._id });
            expect(mockSelect).toHaveBeenCalledWith('-photo');
            expect(mockSkip).toHaveBeenCalledWith(6);
            expect(mockLimit).toHaveBeenCalledWith(6);
            expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({
                success: true,
                category: mockCategory,
                products,
            });
        });

        it('should send 500 when category fetch fails', async () => {
            //arrange
            const req = { params: { slug: 'cat-slug' } };
            const mockError = new Error('Category failure');
            mockCategoryModel.findOne.mockRejectedValue(mockError);

            //act
            await productCategoryController(req, mockRes);

            //assert
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith({
                success: false,
                error: mockError.message,
                message: 'Error fetching category products'
            });
        });
    });

    describe('productCategoryCount', () => {
        // Testing Strategy: branch coverage
        it('should return total count for category', async () => {
            // arrange
            const req = { params: { slug: 'cat-slug' } };
            const mockCategory = { _id: 'cat-id' };
            const mockCount = 10;
            const mockCountDocuments = jest.fn().mockResolvedValue(mockCount);

            mockCategoryModel.findOne.mockResolvedValue(mockCategory);
            mockProductModel.find = jest.fn().mockReturnValue({
                countDocuments: mockCountDocuments
            });

            // act
            await productCategoryCountController(req, mockRes);

            // assert
            expect(mockCategoryModel.findOne).toHaveBeenCalledWith({ slug: 'cat-slug' });
            expect(mockProductModel.find).toHaveBeenCalledWith({ category: 'cat-id' });
            expect(mockCountDocuments).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({
                success: true,
                total: mockCount
            });
        });

        it('should send 500 when count fails', async () => {
            // arrange
            const req = { params: { slug: 'cat-slug' } };
            const mockCategory = { _id: 'cat-id' };
            const mockError = new Error('Count failure');
            const mockCountDocuments = jest.fn().mockRejectedValue(mockError);

            mockCategoryModel.findOne.mockResolvedValue(mockCategory);
            mockProductModel.find = jest.fn().mockReturnValue({
                countDocuments: mockCountDocuments
            });

            // act
            await productCategoryCountController(req, mockRes);

            // assert
            expect(mockCategoryModel.findOne).toHaveBeenCalledWith({ slug: 'cat-slug' });
            expect(mockProductModel.find).toHaveBeenCalledWith({ category: 'cat-id' });
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith({
                success: false,
                message: 'Error counting category products',
                error: mockError.message
            });
        });
    });

    describe('braintreeToken', () => {
        // Testing Strategy: branch coverage
        it('should return client token on success', async () => {
            //arrange
            const req = {};
            mockGateway.clientToken.generate.mockImplementation((args, cb) => cb(null, { token: 'abc' }));

            //act
            await braintreeTokenController(req, mockRes);

            //assert
            expect(mockGateway.clientToken.generate).toHaveBeenCalledWith({}, expect.any(Function));
            expect(mockRes.send).toHaveBeenCalledWith({ token: 'abc' });
        });

        it('should send 500 when gateway returns error', async () => {
            //arrange
            const req = {};
            mockGateway.clientToken.generate.mockImplementation((args, cb) => cb('token error'));

            //act
            await braintreeTokenController(req, mockRes);

            //assert
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith({
                success: false,
                message: 'Error generating payment token',
                error: ''
            });
        });
    });

    describe('brainTreePayment', () => {
        // Testing Strategy: branch coverage
        it('should create order on successful transaction', async () => {
            //arrange
            const req = { body: { nonce: 'nonce', cart: [{ price: 10 }] }, user: { _id: 'user123' } };
            const saleCallback = jest.fn();
            mockGateway.transaction.sale.mockImplementation((config, cb) => {
                cb(null, { id: 'txn' });
            });
            mockOrderModel.mockImplementation(() => ({ save: jest.fn().mockResolvedValue(true) }));

            //act
            await brainTreePaymentController(req, mockRes);

            //assert
            expect(mockGateway.transaction.sale).toHaveBeenCalledWith(
                expect.objectContaining({
                    amount: 10,
                    paymentMethodNonce: 'nonce',
                    options: { submitForSettlement: true }
                }),
                expect.any(Function)
            );
            expect(mockRes.json).toHaveBeenCalledWith({ ok: true });
        });

        it('should send 500 when gateway sale fails', async () => {
            //arrange
            const req = { body: { nonce: 'nonce', cart: [{ price: 5 }] }, user: { _id: 'user123' } };
            mockGateway.transaction.sale.mockImplementation((config, cb) => {
                cb('sale error', null);
            });

            //act
            await brainTreePaymentController(req, mockRes);

            //assert
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith({
                success: false,
                message: 'Error processing payment',
                error: 'sale error'
            });
        });

        it('should handle synchronous errors in payment controller', async () => {
            //arrange
            const req = { body: { nonce: 'nonce', cart: [] }, user: { _id: 'user123' } };
            const mockError = new Error('Payment failure');
            mockGateway.transaction.sale.mockImplementation(() => {
                throw mockError;
            });

            //act
            await brainTreePaymentController(req, mockRes);

            //assert
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith({
                success: false,
                message: 'Error processing payment',
                error: mockError.message
            });
        });
    });

})