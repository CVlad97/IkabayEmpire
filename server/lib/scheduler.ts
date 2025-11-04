import { dropshippingService } from "./dropshipping/dropshipping-service";
import { storage } from "../storage";

let syncInterval: NodeJS.Timeout | null = null;

export function startScheduledTasks() {
  const TWELVE_HOURS = 12 * 60 * 60 * 1000;

  if (syncInterval) {
    clearInterval(syncInterval);
  }

  console.log("📅 Starting scheduled tasks...");

  syncInterval = setInterval(async () => {
    console.log("🔄 [Scheduler] Running 12-hour sync tasks...");

    try {
      const results = await dropshippingService.bulkSyncAllProducts();
      console.log(`✅ [Scheduler] Synced ${results.synced} products, ${results.failed} failed`);
      
      await storage.createProductSyncLog({
        supplierId: "scheduled",
        action: "scheduled_sync",
        status: "success",
        itemsProcessed: results.synced,
        itemsFailed: results.failed,
        errorMessage: results.failed > 0 ? `${results.failed} products failed to sync` : null,
      });
    } catch (error: any) {
      console.error("❌ [Scheduler] Bulk sync failed:", error.message);
      
      await storage.createProductSyncLog({
        supplierId: "scheduled",
        action: "scheduled_sync",
        status: "failed",
        errorMessage: error.message,
        itemsProcessed: 0,
        itemsFailed: 0,
      });
    }
  }, TWELVE_HOURS);

  console.log("✅ Scheduled tasks started (sync every 12h)");
}

export function stopScheduledTasks() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log("🛑 Scheduled tasks stopped");
  }
}
