import { storage } from "../../storage";
import { CJDropshippingAPI, AutoDSAPI, ZendropAPI } from "./cj-api";
import type { Product } from "@shared/schema";

export class DropshippingService {
  private cjClient: CJDropshippingAPI | null = null;
  private autoDSClient: AutoDSAPI | null = null;
  private zendropClient: ZendropAPI | null = null;

  async initializeSuppliers() {
    const suppliers = await storage.getActiveSuppliers();

    for (const supplier of suppliers) {
      try {
        if (supplier.code === "cj" && supplier.apiKey && supplier.apiEmail) {
          this.cjClient = new CJDropshippingAPI(supplier.apiKey, supplier.apiEmail, supplier.baseUrl);
          console.log("✅ CJ Dropshipping client initialized");
        } else if (supplier.code === "autods" && supplier.apiKey) {
          this.autoDSClient = new AutoDSAPI(supplier.apiKey);
          console.log("⚠️ AutoDS client initialized (stub mode - requires API approval)");
        } else if (supplier.code === "zendrop" && supplier.apiKey) {
          this.zendropClient = new ZendropAPI(supplier.apiKey);
          console.log("⚠️ Zendrop client initialized (stub mode - no public API)");
        }
      } catch (error) {
        console.error(`Failed to initialize ${supplier.name}:`, error);
      }
    }
  }

  async searchProducts(params: {
    source: "cj" | "autods" | "zendrop";
    keyword?: string;
    category?: string;
    pageNum?: number;
    pageSize?: number;
  }) {
    const { source, keyword, category, pageNum = 1, pageSize = 20 } = params;

    const supplier = await storage.getDropshippingSupplierByCode(source);
    if (!supplier || !supplier.active) {
      throw new Error(`Supplier ${source} not configured or inactive`);
    }

    // Ensure client is initialized (handles server restart case)
    if (source === "cj" && !this.cjClient) {
      await this.initializeSuppliers();
    }
    if (source === "autods" && !this.autoDSClient) {
      await this.initializeSuppliers();
    }
    if (source === "zendrop" && !this.zendropClient) {
      await this.initializeSuppliers();
    }

    await storage.updateDropshippingSupplier(supplier.id, { syncStatus: "syncing" });

    try {
      let results: any = null;

      if (source === "cj" && this.cjClient) {
        results = await this.cjClient.searchProducts({
          keyword,
          categoryId: category,
          pageNum,
          pageSize,
        });
      } else if (source === "autods" && this.autoDSClient) {
        results = await this.autoDSClient.searchProducts(keyword || "");
      } else if (source === "zendrop" && this.zendropClient) {
        results = await this.zendropClient.searchProducts(keyword || "");
      } else {
        throw new Error(`${source} client not initialized`);
      }

      await storage.updateDropshippingSupplier(supplier.id, {
        syncStatus: "idle",
        lastSyncAt: new Date(),
        errorMessage: null,
      });

      // Log successful search
      await storage.createProductSyncLog({
        supplierId: supplier.id,
        action: "sync",
        status: "success",
        itemsProcessed: results?.list?.length || results?.length || 0,
        itemsFailed: 0,
      });

      return results;
    } catch (error: any) {
      await storage.updateDropshippingSupplier(supplier.id, {
        syncStatus: "error",
        errorMessage: error.message,
      });

      await storage.createProductSyncLog({
        supplierId: supplier.id,
        action: "sync",
        status: "failed",
        errorMessage: error.message,
        itemsProcessed: 0,
        itemsFailed: 0,
      });

      throw error;
    }
  }

  async importProduct(params: {
    source: "cj" | "autods" | "zendrop";
    externalId: string;
  }): Promise<Product> {
    const { source, externalId } = params;

    const supplier = await storage.getDropshippingSupplierByCode(source);
    if (!supplier || !supplier.active) {
      throw new Error(`Supplier ${source} not configured or inactive`);
    }

    // Ensure client is initialized (handles server restart case)
    if (source === "cj" && !this.cjClient) {
      await this.initializeSuppliers();
    }
    if (source === "autods" && !this.autoDSClient) {
      await this.initializeSuppliers();
    }
    if (source === "zendrop" && !this.zendropClient) {
      await this.initializeSuppliers();
    }

    // Check if product already imported
    const existingProduct = await storage.getProductByExternalId(externalId, source);
    if (existingProduct) {
      return existingProduct;
    }

    try {
      let productData: any = null;

      if (source === "cj" && this.cjClient) {
        // Get full product details
        productData = await this.cjClient.getProductDetails(externalId);
        
        // Add to CJ account (required before we can sell it)
        await this.cjClient.addProductToAccount(externalId);
        
        // Transform to our schema
        const transformedProduct = this.cjClient.transformProduct(productData);

        // Create product in our database
        const createdProduct = await storage.createProduct(transformedProduct as any);

        // Log successful import
        await storage.createProductSyncLog({
          supplierId: supplier.id,
          action: "import",
          productId: createdProduct.id,
          externalId,
          status: "success",
          itemsProcessed: 1,
          itemsFailed: 0,
        });

        return createdProduct;
      } else if (source === "autods") {
        throw new Error("AutoDS import requires API approval - contact support@autods.com");
      } else if (source === "zendrop") {
        throw new Error("Zendrop does not provide public API - use Shopify/WooCommerce integration");
      } else {
        throw new Error(`${source} client not initialized`);
      }
    } catch (error: any) {
      await storage.createProductSyncLog({
        supplierId: supplier.id,
        action: "import",
        externalId,
        status: "failed",
        errorMessage: error.message,
        itemsProcessed: 0,
        itemsFailed: 1,
      });

      throw error;
    }
  }

  async syncProductStock(productId: string): Promise<void> {
    const product = await storage.getProduct(productId);
    if (!product || !product.externalId || product.source === "local") {
      throw new Error("Product not found or not a dropshipping product");
    }

    const supplier = await storage.getDropshippingSupplierByCode(product.source);
    if (!supplier || !supplier.active) {
      throw new Error(`Supplier ${product.source} not configured or inactive`);
    }

    // Ensure client is initialized (handles server restart case)
    if (product.source === "cj" && !this.cjClient) {
      await this.initializeSuppliers();
    }

    try {
      if (product.source === "cj" && this.cjClient) {
        const details = await this.cjClient.getProductDetails(product.externalId);
        
        // Update stock and pricing
        await storage.updateProduct(productId, {
          stockQuantity: details.variants?.[0]?.inventory || product.stockQuantity,
          supplierPrice: details.sellPrice || product.supplierPrice,
          inStock: (details.sellPrice || 0) > 0,
          lastSyncedAt: new Date(),
        });

        await storage.createProductSyncLog({
          supplierId: supplier.id,
          action: "update",
          productId,
          externalId: product.externalId,
          status: "success",
          itemsProcessed: 1,
          itemsFailed: 0,
        });
      }
    } catch (error: any) {
      await storage.createProductSyncLog({
        supplierId: supplier.id,
        action: "update",
        productId,
        externalId: product.externalId,
        status: "failed",
        errorMessage: error.message,
        itemsProcessed: 0,
        itemsFailed: 1,
      });

      throw error;
    }
  }

  async bulkSyncAllProducts(): Promise<{ synced: number; failed: number }> {
    const dropshippingProducts = await storage.getProductsBySource("cj");
    let synced = 0;
    let failed = 0;

    for (const product of dropshippingProducts) {
      try {
        await this.syncProductStock(product.id);
        synced++;
      } catch (error) {
        failed++;
        console.error(`Failed to sync product ${product.id}:`, error);
      }
    }

    return { synced, failed };
  }
}

export const dropshippingService = new DropshippingService();
