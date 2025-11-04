import type { DropshippingSupplier, Product } from "@shared/schema";

// CJ Dropshipping API client
export class CJDropshippingAPI {
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor(
    private apiKey: string,
    private email: string,
    baseUrl: string = "https://developers.cjdropshipping.com/api2.0/v1"
  ) {
    this.baseUrl = baseUrl;
  }

  private async ensureAuthenticated(): Promise<void> {
    // Check if token is valid
    if (this.accessToken && this.tokenExpiresAt && this.tokenExpiresAt > new Date()) {
      return;
    }

    // Get new access token
    const response = await fetch(`${this.baseUrl}/authentication/getAccessToken`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: this.email,
        apiKey: this.apiKey,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.code !== 200) {
      throw new Error(`CJ Authentication failed: ${data.message || response.statusText}`);
    }

    this.accessToken = data.data.accessToken;
    this.tokenExpiresAt = new Date(data.data.accessTokenExpiryDate);
  }

  async searchProducts(params: {
    keyword?: string;
    categoryId?: string;
    pageNum?: number;
    pageSize?: number;
  }): Promise<any> {
    await this.ensureAuthenticated();

    const queryParams = new URLSearchParams();
    if (params.pageNum) queryParams.set("pageNum", params.pageNum.toString());
    if (params.pageSize) queryParams.set("pageSize", params.pageSize.toString());
    if (params.categoryId) queryParams.set("categoryId", params.categoryId);
    if (params.keyword) queryParams.set("keyword", params.keyword);

    const response = await fetch(`${this.baseUrl}/product/list?${queryParams}`, {
      method: "GET",
      headers: {
        "CJ-Access-Token": this.accessToken!,
      },
    });

    const data = await response.json();

    if (!response.ok || data.code !== 200) {
      throw new Error(`CJ Product search failed: ${data.message || response.statusText}`);
    }

    return data.data;
  }

  async getProductDetails(productId: string): Promise<any> {
    await this.ensureAuthenticated();

    const response = await fetch(`${this.baseUrl}/product/query?pid=${productId}`, {
      method: "GET",
      headers: {
        "CJ-Access-Token": this.accessToken!,
      },
    });

    const data = await response.json();

    if (!response.ok || data.code !== 200) {
      throw new Error(`CJ Product details failed: ${data.message || response.statusText}`);
    }

    return data.data;
  }

  async addProductToAccount(productId: string): Promise<boolean> {
    await this.ensureAuthenticated();

    const response = await fetch(`${this.baseUrl}/product/addToMyProduct`, {
      method: "POST",
      headers: {
        "CJ-Access-Token": this.accessToken!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.code !== 200) {
      throw new Error(`CJ Add product failed: ${data.message || response.statusText}`);
    }

    return data.data;
  }

  async getCategories(): Promise<any> {
    await this.ensureAuthenticated();

    const response = await fetch(`${this.baseUrl}/product/getCategory`, {
      method: "GET",
      headers: {
        "CJ-Access-Token": this.accessToken!,
      },
    });

    const data = await response.json();

    if (!response.ok || data.code !== 200) {
      throw new Error(`CJ Get categories failed: ${data.message || response.statusText}`);
    }

    return data.data;
  }

  // Transform CJ product to our product schema
  transformProduct(cjProduct: any): Partial<Product> {
    return {
      name: cjProduct.productNameEn || cjProduct.productName || "Imported Product",
      description: cjProduct.description || cjProduct.productNameEn || "",
      price: cjProduct.sellPrice || 0,
      image: cjProduct.productImage || cjProduct.productImages?.[0] || "",
      category: cjProduct.categoryName || "General",
      inStock: cjProduct.sellPrice > 0,
      source: "cj",
      externalId: cjProduct.pid,
      sku: cjProduct.productSku,
      supplierPrice: cjProduct.sellPrice || 0,
      shippingCost: cjProduct.packWeight ? cjProduct.packWeight * 0.5 : 5, // Estimate based on weight
      processingTime: cjProduct.processingTime || 3,
      stockQuantity: cjProduct.variants?.[0]?.inventory || 100,
      lastSyncedAt: new Date(),
    };
  }
}

// AutoDS stub (placeholder for future integration)
export class AutoDSAPI {
  constructor(private apiKey: string) {}

  async searchProducts(query: string): Promise<any[]> {
    console.log("[AutoDS Stub] Search products:", query);
    return [];
  }

  async importProduct(productId: string): Promise<any> {
    console.log("[AutoDS Stub] Import product:", productId);
    throw new Error("AutoDS API requires approval - contact AutoDS for API access");
  }
}

// Zendrop stub (placeholder for future integration)
export class ZendropAPI {
  constructor(private apiKey: string) {}

  async searchProducts(query: string): Promise<any[]> {
    console.log("[Zendrop Stub] Search products:", query);
    return [];
  }

  async importProduct(productId: string): Promise<any> {
    console.log("[Zendrop Stub] Import product:", productId);
    throw new Error("Zendrop does not provide public API - use Shopify/WooCommerce integration");
  }
}
